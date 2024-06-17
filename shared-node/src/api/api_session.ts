import {error} from 'node:console';

import {ForbiddenError} from '@shared/api/core/api_errors';
import {ApiContext} from '@shared/api/core/api_types';
import {NODE_ENV} from '@shared/env';
import {splitOnce} from '@shared/lib/array_utils';
import {asMapOrThrow, asNumberOrThrow, asStringOrThrow, Brand} from '@shared/lib/type_utils';

import {getItem, putItem, updateItem} from '@shared-node/aws/dynamodb';
import {uidSafe} from '@shared-node/lib/rand_safe';
import {decrypt, encrypt} from '@shared-node/lib/symmetric_encryption';

export interface UserSessionItem<UserId extends string> {
  userId: UserId;
  expiresAt: number;
  token: string;
}

export type UserSessionToken = Brand<'UserSessionToken', string>;

export class SessionManager<UserItem extends {id: string; sessionDuration: number}, FrontendUser> {
  private static readonly COOKIE_SECURE = NODE_ENV === 'development' ? '' : 'Secure; ';

  public constructor(
    private readonly opts: {
      cookieName: string;
      cookieEncryptionKey: string;
      domain: string;
      userTableName: string;
      userSessionTableName: string;
      userItemToFrontendUser: (userItem: UserItem) => FrontendUser | Promise<FrontendUser>;
    }
  ) {}

  private async getUser(context: ApiContext): Promise<UserItem | undefined> {
    const session = this.getSessionCookie(context);
    if (!session) {
      return undefined;
    }
    if (Math.floor(Date.now() / 1000) < session.expiresAt) {
      try {
        const sessionItem = await getItem<UserSessionItem<UserItem['id']>>({
          tableName: this.opts.userSessionTableName,
          key: {token: session.token},
        });
        if (!sessionItem) {
          return undefined;
        }
        const userItem = await getItem<UserItem>({
          tableName: this.opts.userTableName,
          key: {id: sessionItem.userId},
        });
        if (!userItem) {
          return undefined;
        }
        // Extend session if we've passed half the session duration
        if (sessionItem.expiresAt - Math.floor(Date.now() / 1000) < userItem.sessionDuration / 2) {
          updateItem({
            tableName: this.opts.userSessionTableName,
            key: {token: session.token},
            updateExpression: {set: [`#expiresAt = :expiresAt`]},
            expressionAttributeNames: {'#expiresAt': 'expiresAt'},
            expressionAttributeValues: {
              ':expiresAt': Math.floor(Date.now() / 1000) + userItem.sessionDuration,
            },
          }).catch(err => console.error('Failure to extent session', {session}, err));
        }
        return userItem;
        // eslint-disable-next-line no-empty
      } catch {}
    }
    this.removeSessionCookie(context);
    return undefined;
  }

  public async getFrontendUser(context: ApiContext): Promise<FrontendUser | undefined> {
    const user = await this.getUser(context);
    if (!user) {
      return undefined;
    }
    return Promise.resolve(this.opts.userItemToFrontendUser(user)).catch(err => {
      console.error('Failure to convert UserItem to FrontendUser', user, err);
      return undefined;
    });
  }

  public async enforceSession(context: ApiContext): Promise<UserItem> {
    const user = await this.getUser(context);
    if (!user) {
      throw new ForbiddenError({userMessage: 'Not connected'});
    }
    return user;
  }

  public async createSession(context: ApiContext, user: UserItem): Promise<FrontendUser> {
    // Create session
    const token = uidSafe() as UserSessionToken;
    const expiresAt = Math.floor(Date.now() / 1000) + user.sessionDuration;
    const sessionItem: UserSessionItem<UserItem['id']> = {userId: user.id, expiresAt, token};
    await putItem<UserSessionItem<UserItem['id']>>({
      tableName: this.opts.userSessionTableName,
      item: sessionItem,
    });

    // Set session cookie
    this.setSessionCookie(context, {token, expiresAt, sessionDuration: user.sessionDuration});
    return this.opts.userItemToFrontendUser(user);
  }

  // COOKIE MANIPULATION

  private setSessionCookie(
    context: ApiContext,
    session: {token: UserSessionToken; expiresAt: number; sessionDuration: number}
  ): void {
    const {token, expiresAt, sessionDuration} = session;
    context.setResponseHeader(
      'Set-Cookie',
      `${this.opts.cookieName}=${this.serializeSession(
        token,
        expiresAt
      )}; Max-Age=${sessionDuration}; ${SessionManager.COOKIE_SECURE}HttpOnly; Path=/; Domain=${
        this.opts.domain
      }; SameSite=Strict`
    );
  }

  private getSessionCookie<Context extends Pick<ApiContext, 'getRequestHeader'>>(
    context: Context
  ): {token: UserSessionToken; expiresAt: number} | undefined {
    const raw = context.getRequestHeader('Cookie');
    if (raw === undefined) {
      return undefined;
    }
    const rawCookies = (Array.isArray(raw) ? raw[0] ?? '' : raw)
      .split(/; */u)
      .filter(str => str.trim().length > 0);
    for (const rawCookie of rawCookies) {
      const [name, value] = splitOnce(rawCookie, '=');
      if (value === undefined) {
        continue;
      }
      if (name.trim() === this.opts.cookieName) {
        return this.deserializeSession(value.trim());
      }
    }
    return undefined;
  }

  private removeSessionCookie(context: ApiContext): void {
    context.setResponseHeader(
      'Set-Cookie',
      `${this.opts.cookieName}=; Max-Age=0; ${SessionManager.COOKIE_SECURE}HttpOnly; Path=/; Domain=${this.opts.domain}; SameSite=Strict`
    );
  }

  // SESSION SERIALIZATION

  private serializeSession(token: UserSessionToken, expiresAt: number): string {
    return encrypt(JSON.stringify({token, expiresAt}), this.opts.cookieEncryptionKey);
  }

  private deserializeSession(
    raw: string
  ): {token: UserSessionToken; expiresAt: number} | undefined {
    try {
      const rawMap = asMapOrThrow(JSON.parse(decrypt(raw, this.opts.cookieEncryptionKey)));
      const token = asStringOrThrow<UserSessionToken>(rawMap['token']);
      const expiresAt = asNumberOrThrow(rawMap['expiresAt']);
      return {token, expiresAt};
    } catch (err: unknown) {
      error('Cannot deserialize session', err, {raw});
      return undefined;
    }
  }
}
