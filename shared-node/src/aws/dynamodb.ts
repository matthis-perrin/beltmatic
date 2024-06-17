import {
  AttributeValue,
  BatchGetItemCommand,
  BatchWriteItemCommand,
  DeleteItemCommand,
  DescribeTableCommand,
  DynamoDBClient,
  GetItemCommand,
  PutItemCommand,
  PutItemCommandInput,
  QueryCommand,
  ScanCommand,
  ScanCommandOutput,
  TableDescription,
  TransactionInProgressException,
  TransactWriteItem,
  TransactWriteItemsCommand,
  Update,
  UpdateItemCommand,
  UpdateItemCommandInput,
  UpdateItemCommandOutput,
} from '@aws-sdk/client-dynamodb';
import {
  marshall as utilDynamodb_marshall,
  unmarshall as utilDynamodb_unmarshall,
} from '@aws-sdk/util-dynamodb';

import {REGION} from '@shared/env';
import {chunkArray} from '@shared/lib/array_utils';
import {AnyInterface, removeUndefined} from '@shared/lib/type_utils';

import {credentialsProvider} from '@shared-node/aws/credentials';
import {uidSafe} from '@shared-node/lib/rand_safe';

const MAX_BATCH_GET_ITEMS = 100;
const MAX_BATCH_WRITE_ITEMS = 25;
const PUT_ITEMS_MAX_RETRIES = 3;

const client = new DynamoDBClient({region: REGION, credentials: credentialsProvider()});

type Key = Record<string, unknown>;
type AdditionalParams = Record<string, unknown>;

export function marshall<T extends AnyInterface<T>>(input: T): Record<string, AttributeValue> {
  return utilDynamodb_marshall(input, {
    convertEmptyValues: false,
    removeUndefinedValues: true,
    convertClassInstanceToMap: false,
  });
}
export const unmarshall = utilDynamodb_unmarshall;

export async function deleteItem(params: {
  tableName: string;
  key: Record<string, unknown>;
  additionalParams?: Record<string, unknown>;
}): Promise<{itemExisted: boolean}> {
  const res = await client.send(
    new DeleteItemCommand({
      TableName: params.tableName,
      Key: marshall(params.key),
      ReturnValues: 'ALL_OLD',
      ...params.additionalParams,
    })
  );
  return {itemExisted: res.Attributes !== undefined};
}

export async function getItemRaw(params: {
  tableName: string;
  key: Key;
  additionalParams?: AdditionalParams;
}): Promise<Record<string, AttributeValue> | undefined> {
  const {Item} = await client.send(
    new GetItemCommand({
      TableName: params.tableName,
      Key: marshall(params.key),
      ...params.additionalParams,
    })
  );
  return Item;
}

export async function getItem<T>(params: {
  tableName: string;
  key: Key;
  additionalParams?: AdditionalParams;
}): Promise<T | undefined> {
  const item = await getItemRaw(params);
  if (item === undefined) {
    return undefined;
  }
  return unmarshall(item) as T;
}

export async function batchGetItems<T extends AnyInterface<T>>(params: {
  tableName: string;
  keys: Record<string, unknown>[];
  consistent?: boolean;
}): Promise<T[]> {
  const [firstKey] = params.keys;
  if (!firstKey) {
    return [];
  }
  const firstKeyKeys = Object.keys(firstKey);
  const [idKey] = firstKeyKeys;
  if (idKey === undefined || firstKeyKeys.length > 1) {
    throw new Error('getItems only supported with single keys');
  }

  const ConsistentRead = params.consistent;
  const allKeys = params.keys.map(key => marshall(key));
  const chunked = chunkArray(allKeys, MAX_BATCH_GET_ITEMS);
  const items = new Map<unknown, T>();
  while (chunked.length > 0) {
    const chunk = chunked.pop();
    if (chunk) {
      const data = await client.send(
        new BatchGetItemCommand({
          RequestItems: {[params.tableName]: {Keys: chunk, ConsistentRead}},
        })
      );

      const newItems = data.Responses?.[params.tableName];
      if (newItems) {
        for (const itemRaw of newItems) {
          const item = unmarshall(itemRaw) as T;
          items.set((item as Record<string, unknown>)[idKey], item);
        }
      }

      // Handle UnprocessedKeys by adding the missing keys back into our list of keys to fetch
      // https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_BatchGetItem.html
      const missingKeys = data.UnprocessedKeys?.[params.tableName]?.Keys;
      if (missingKeys) {
        chunked.push(missingKeys);
      }
    }
  }

  return removeUndefined(params.keys.map(k => items.get(k[idKey])));
}

// simple transaction function to put items in multiple tables
export async function transactWriteItems(params: {
  transaction: TransactWriteItem[];
  clientRequestToken?: string;
}): Promise<void> {
  const requestToken = params.clientRequestToken ?? uidSafe();
  await client
    .send(
      new TransactWriteItemsCommand({
        ClientRequestToken: requestToken,
        TransactItems: params.transaction,
      })
    )
    .catch(async err => {
      if (err instanceof TransactionInProgressException) {
        return transactWriteItems({...params, clientRequestToken: requestToken});
      }
      throw err;
    });
}

export async function putItem<T extends AnyInterface<T>>(params: {
  tableName: string;
  item: T;
  additionalParams?: Omit<PutItemCommandInput, 'TableName' | 'Item'>;
}): Promise<void> {
  await client.send(
    new PutItemCommand({
      TableName: params.tableName,
      Item: marshall(params.item),
      ...params.additionalParams,
    })
  );
}

export async function putItems<T extends AnyInterface<T>>(params: {
  tableName: string;
  items: T[];
  retryNumber?: number;
}): Promise<void> {
  const unprocessedItems: T[] = [];
  const chunked = chunkArray(params.items, MAX_BATCH_WRITE_ITEMS);
  while (chunked.length > 0) {
    const chunk = chunked.pop();
    if (chunk) {
      const {UnprocessedItems} = await client.send(
        new BatchWriteItemCommand({
          RequestItems: {
            [params.tableName]: chunk.map(item => ({
              PutRequest: {
                Item: marshall(item),
              },
            })),
          },
        })
      );
      if (UnprocessedItems !== undefined) {
        for (const writeRequest of Object.values(UnprocessedItems[params.tableName] ?? [])) {
          if (writeRequest.PutRequest?.Item) {
            unprocessedItems.push(writeRequest.PutRequest.Item as T);
          }
        }
      }
    }
    if (unprocessedItems.length > 0) {
      const retryNumber = (params.retryNumber ?? 0) + 1;
      console.warn(
        `Failed to add the following items, tentative n°${retryNumber}:`,
        JSON.stringify(unprocessedItems)
      );
      if (retryNumber === PUT_ITEMS_MAX_RETRIES) {
        throw new Error('Failed to put items in database');
      }

      await putItems({
        tableName: params.tableName,
        items: unprocessedItems,
        retryNumber,
      });
    }
  }
}

export interface QueryParams {
  tableName: string;
  keyConditionExpression: string;
  expressionAttributeNames?: Record<string, string>;
  expressionAttributeValues?: Record<string, unknown>;
  filterExpression?: string;
  indexName?: string;
  scanIndexForward?: boolean;
  paginationToken?: string;
  limit?: number;
  additionalParams?: AdditionalParams;
}

export async function queryItems<T extends AnyInterface<T>>(
  params: QueryParams
): Promise<{
  items: T[];
  nextPaginationToken?: string;
  count?: number;
}> {
  let exclusiveStartKey: Record<string, AttributeValue> | undefined;
  if (params.paginationToken !== undefined) {
    try {
      exclusiveStartKey = JSON.parse(
        Buffer.from(params.paginationToken, 'base64').toString('utf8')
      );
    } catch {
      throw new Error('Invalid paginationToken');
    }
  }

  const items: Record<string, AttributeValue>[] = [];
  let count = 0;
  do {
    const {Items, LastEvaluatedKey, Count} = await client.send(
      new QueryCommand({
        TableName: params.tableName,
        IndexName: params.indexName,
        ExclusiveStartKey: exclusiveStartKey,
        FilterExpression: params.filterExpression,
        KeyConditionExpression: params.keyConditionExpression,
        ExpressionAttributeNames: params.expressionAttributeNames ?? undefined,
        ExpressionAttributeValues: params.expressionAttributeValues
          ? marshall(params.expressionAttributeValues)
          : undefined,
        ScanIndexForward: params.scanIndexForward ?? undefined,
        Limit: params.limit,
        ...params.additionalParams,
      })
    );
    items.push(...(Items ?? []));
    exclusiveStartKey = LastEvaluatedKey;
    count += Count ?? 0;
  } while (
    exclusiveStartKey &&
    params.limit !== undefined &&
    params.limit > 0 &&
    items.length < params.limit
  );

  return {
    items: items.map(i => unmarshall(i) as T),
    nextPaginationToken: exclusiveStartKey
      ? Buffer.from(JSON.stringify(exclusiveStartKey)).toString('base64')
      : undefined,
    count,
  };
}

export async function queryAllItems<T extends AnyInterface<T>>(
  params: Omit<QueryParams, 'paginationToken' | 'limit'>
): Promise<T[]> {
  let paginationToken: string | undefined;
  const items: T[] = [];
  do {
    const res = await queryItems<T>({...params, paginationToken});
    paginationToken = res.nextPaginationToken;
    items.push(...res.items);
  } while (paginationToken !== undefined);
  return items;
}

export interface CountParams {
  tableName: string;
  keyConditionExpression: string;
  expressionAttributeNames?: Record<string, string>;
  expressionAttributeValues?: Record<string, unknown>;
  filterExpression?: string;
  indexName?: string;
  additionalParams?: AdditionalParams;
}

export async function countItems(params: CountParams): Promise<number> {
  let exclusiveStartKey: Record<string, AttributeValue> | undefined;

  let counter = 0;
  do {
    const {LastEvaluatedKey, Count} = await client.send(
      new QueryCommand({
        TableName: params.tableName,
        IndexName: params.indexName,
        ExclusiveStartKey: exclusiveStartKey,
        FilterExpression: params.filterExpression,
        KeyConditionExpression: params.keyConditionExpression,
        ExpressionAttributeNames: params.expressionAttributeNames ?? undefined,
        ExpressionAttributeValues: params.expressionAttributeValues
          ? marshall(params.expressionAttributeValues)
          : undefined,
        Select: 'COUNT',
        ...params.additionalParams,
      })
    );
    counter += Count ?? 0;
    exclusiveStartKey = LastEvaluatedKey;
  } while (exclusiveStartKey);

  return counter;
}

export async function scanItems<T extends AnyInterface<T>>(params: {
  tableName: string;
  expressionAttributeNames?: Record<string, string>;
  expressionAttributeValues?: Record<string, unknown>;
  filterExpression?: string;
  indexName?: string;
  paginationToken?: string;
  limit?: number;
  additionalParams?: AdditionalParams;
}): Promise<{
  items: T[];
  nextPaginationToken?: string;
}> {
  let exclusiveStartKey: Record<string, AttributeValue> | undefined;
  if (params.paginationToken !== undefined) {
    try {
      exclusiveStartKey = JSON.parse(
        Buffer.from(params.paginationToken, 'base64').toString('utf8')
      );
    } catch {
      throw new Error('Invalid paginationToken');
    }
  }

  const {Items, LastEvaluatedKey} = await client.send(
    new ScanCommand({
      TableName: params.tableName,
      IndexName: params.indexName,
      ExclusiveStartKey: exclusiveStartKey,
      FilterExpression: params.filterExpression,
      ExpressionAttributeNames: params.expressionAttributeNames ?? undefined,
      ExpressionAttributeValues: params.expressionAttributeValues
        ? marshall(params.expressionAttributeValues)
        : undefined,
      Limit: params.limit,
      ...params.additionalParams,
    })
  );

  return {
    items: (Items ?? []).map(i => unmarshall(i) as T),
    nextPaginationToken: LastEvaluatedKey
      ? Buffer.from(JSON.stringify(LastEvaluatedKey)).toString('base64')
      : undefined,
  };
}

export interface ScanAllItemsParams {
  tableName: string;
  expressionAttributeNames?: Record<string, string>;
  expressionAttributeValues?: Record<string, unknown>;
  filterExpression?: string;
  indexName?: string;
}
export async function scanAllItems<T extends AnyInterface<T>>(params: {
  tableName: string;
  expressionAttributeNames?: Record<string, string>;
  expressionAttributeValues?: Record<string, unknown>;
  filterExpression?: string;
  indexName?: string;
  projectionExpression?: string;
}): Promise<T[]> {
  const items: T[] = [];
  let lastEvaluatedKey;
  do {
    const {Items, LastEvaluatedKey}: ScanCommandOutput = await client.send(
      new ScanCommand({
        TableName: params.tableName,
        IndexName: params.indexName,
        ExclusiveStartKey: lastEvaluatedKey,
        FilterExpression: params.filterExpression,
        ExpressionAttributeNames: params.expressionAttributeNames ?? undefined,
        ExpressionAttributeValues: params.expressionAttributeValues
          ? marshall(params.expressionAttributeValues)
          : undefined,
        ProjectionExpression: params.projectionExpression,
      })
    );
    items.push(...(Items ?? []).map(i => unmarshall(i) as T));
    lastEvaluatedKey = LastEvaluatedKey;
  } while (lastEvaluatedKey !== undefined);

  return items;
}

export interface UpdateExpression {
  set?: string[];
  remove?: string[];
  add?: string[];
  delete?: string[];
}

type OmittedFromAdditionalParams =
  | 'Key'
  | 'TableName'
  | 'UpdateExpression'
  | 'ExpressionAttributeNames'
  | 'ExpressionAttributeValues';

export interface UpdateItemParams {
  expressionAttributeNames?: Record<string, string>;
  expressionAttributeValues?: Record<string, unknown>;
  key: Key;
  tableName: string;
  updateExpression: UpdateExpression;
  additionalParams?:
    | Omit<UpdateItemCommandInput, OmittedFromAdditionalParams>
    | Omit<Update, OmittedFromAdditionalParams>;
}

const joinWithPrefix = (val: string[] | undefined, prefix: string): string | undefined => {
  if (val === undefined || val.length === 0) {
    return undefined;
  }
  return `${prefix} ${val.join(', ')}`;
};
export function generateUpdateExpression(updateExpression: UpdateExpression): string {
  return removeUndefined([
    joinWithPrefix(updateExpression.set, 'SET'),
    joinWithPrefix(updateExpression.remove, 'REMOVE'),
    joinWithPrefix(updateExpression.add, 'ADD'),
    joinWithPrefix(updateExpression.delete, 'DELETE'),
  ]).join(' ');
}

export function updateItemParamsToUpdateItemCommandInput(
  params: UpdateItemParams
): UpdateItemCommandInput & {UpdateExpression: string} {
  const updateExpression = params.updateExpression;
  const expressionAttributeNames = params.expressionAttributeNames ?? {};
  const expressionAttributeValues = params.expressionAttributeValues
    ? marshall(params.expressionAttributeValues)
    : {};

  return {
    Key: marshall(params.key),
    TableName: params.tableName,
    UpdateExpression: generateUpdateExpression(updateExpression),
    ExpressionAttributeNames:
      Object.keys(expressionAttributeNames).length > 0 ? expressionAttributeNames : undefined,
    ExpressionAttributeValues:
      Object.keys(expressionAttributeValues).length > 0 ? expressionAttributeValues : undefined,
    ...params.additionalParams,
  };
}

export async function updateItem(params: UpdateItemParams): Promise<UpdateItemCommandOutput> {
  return client.send(new UpdateItemCommand(updateItemParamsToUpdateItemCommandInput(params)));
}

export function makeUpdateBatchParams(
  props: {name: string; value: unknown}[]
): Pick<
  UpdateItemParams,
  'updateExpression' | 'expressionAttributeNames' | 'expressionAttributeValues'
> {
  const updateExpressionSet: string[] = [];
  const updateExpressionRemove: string[] = [];
  const expressionAttributeNames: Record<string, string> = {};
  const expressionAttributeValues: Record<string, unknown> = {};

  for (const [i, {name, value}] of Object.entries(props)) {
    if (value === null || value === undefined) {
      updateExpressionRemove.push(`#name${i}`);
      expressionAttributeNames[`#name${i}`] = name;
    } else {
      updateExpressionSet.push(`#name${i} = :value${i}`);
      expressionAttributeNames[`#name${i}`] = name;
      expressionAttributeValues[`:value${i}`] = value;
    }
  }

  const updateExpression: UpdateItemParams['updateExpression'] = {};
  if (updateExpressionSet.length > 0) {
    updateExpression.set = updateExpressionSet;
  }
  if (updateExpressionRemove.length > 0) {
    updateExpression.remove = updateExpressionRemove;
  }

  return {
    updateExpression,
    expressionAttributeNames,
    expressionAttributeValues,
  };
}

export async function describeTable(tableName: string): Promise<TableDescription | undefined> {
  const res = await client.send(new DescribeTableCommand({TableName: tableName}));
  return res.Table;
}
