import {MouseEvent, MouseEventHandler, useState} from 'react';
import {styled} from 'styled-components';
import {Link as WooterLink, LinkProps} from 'wouter';

import {capitalize} from '@shared/lib/format_utils';
import {AddPrefix, addPrefix} from '@shared/lib/type_utils';

import {LoadingIndicator} from '@shared-web/components/core/loading_indicator';
import {Overlay} from '@shared-web/components/core/overlay';
import {notifyError} from '@shared-web/lib/notification';
import {Custom} from '@shared-web/lib/react';
import {optional, optionalPx, optionalRaw} from '@shared-web/lib/styled_utils';
import {cssTransition, TransitionDuration} from '@shared-web/lib/transitions';
import {useGlobalKeyPress} from '@shared-web/lib/use_global_key_press';
import {useTheme} from '@shared-web/theme/theme_context';
import {ButtonTheme} from '@shared-web/theme/theme_model';

const ButtonFocusVisibleZindex = 10;

type ButtonThemeType = 'button' | 'link' | 'unthemed';

const unthemedButton: Omit<ButtonTheme, 'focusBorderColor' | 'focusBorderWidth'> = {
  textColorActive: undefined,
  textColorDisabled: undefined,
  textColorHover: undefined,
  textColorLoading: undefined,
  textDecoration: undefined,
  textDecorationHover: undefined,
  textUnderlineOffset: undefined,
  backgroundActive: undefined,
  backgroundDisabled: undefined,
  backgroundHover: undefined,
  backgroundLoading: undefined,
  borderColorActive: undefined,
  borderColorDisabled: undefined,
  borderColorHover: undefined,
  borderColorLoading: undefined,
  borderWidth: undefined,
  // focusBorderColor: undefined,
  // focusBorderWidth: undefined,
  focusTextDecoration: undefined,
  loaderColor: undefined,
  loaderOpacity: undefined,
  loaderSize: undefined,
  paddingTop: undefined,
  paddingRight: undefined,
  paddingBottom: undefined,
  paddingLeft: undefined,
  borderRadius: undefined,
  fontSize: undefined,
  fontWeight: undefined,
  fontFamily: undefined,
  lineHeight: undefined,
  letterSpacing: undefined,
  enableSelect: undefined,
};

export interface ButtonProps {
  disabled?: boolean;
  loading?: boolean;
  onClickAsync?: (evt: MouseEvent<HTMLElement>) => Promise<unknown>;
  onClick?: MouseEventHandler;
  expand?: boolean;
  hidden?: boolean;
  theme?: ButtonThemeType;
  overrides?: Partial<ButtonTheme>;
  submit?: boolean;
  keyboardSubmit?: boolean;
}

interface ButtonTypes {
  button: Custom<ButtonProps, 'button'>;
  a: Custom<ButtonProps, 'a'>;
  NavLink: Custom<ButtonProps & LinkProps, 'a'>;
}

const underlyingComponent: Record<keyof ButtonTypes, string | typeof WooterLink> = {
  button: 'button',
  a: 'a',
  NavLink: WooterLink,
};

export function createButton<Type extends keyof ButtonTypes>(opts: {
  type: Type;
  theme: ButtonThemeType;
  themeOverrides?: Partial<ButtonTheme>;
  fromScratch?: boolean;
}): ButtonTypes[Type] {
  const {type, theme: baseTheme, themeOverrides, fromScratch} = opts;
  type Props = Parameters<ButtonTypes[Type]>[0];
  const ButtonClass: ButtonTypes[Type] = (props: Props) => {
    const {
      disabled = false,
      loading = false,
      expand,
      hidden,
      theme = baseTheme,
      submit,
      keyboardSubmit,
      overrides: overridesFromProps = {},
      onClickAsync,
      onClick,
      ...rest
    } = props;
    const {button: buttonThemeDefault, link: linkThemeDefault} = useTheme();
    const themeDefault =
      theme === 'button'
        ? buttonThemeDefault
        : theme === 'link'
          ? linkThemeDefault
          : {...buttonThemeDefault, ...unthemedButton};
    const buttonTheme = addPrefix(
      {...(fromScratch ? {} : themeDefault), ...themeOverrides, ...overridesFromProps},
      '$'
    );

    const [isAsyncClicked, setIsAsyncClicked] = useState(false);
    const onClickCallback = (evt: MouseEvent<HTMLButtonElement>): void => {
      setIsAsyncClicked(true);
      if (onClickAsync !== undefined) {
        onClickAsync(evt)
          .then(() => setIsAsyncClicked(false))
          .catch(err => {
            notifyError(err);
            setIsAsyncClicked(false);
          });
      }
    };
    const handleClick = onClickAsync !== undefined ? onClickCallback : onClick;
    const isLoading = isAsyncClicked || loading;
    const isDisabled = disabled;

    useGlobalKeyPress(['Enter'], () => {
      if (keyboardSubmit && !isDisabled && !isLoading) {
        handleClick?.(undefined as unknown as MouseEvent<HTMLButtonElement>);
      }
    });

    if (submit) {
      rest['type'] = 'submit';
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const TypeHack = StyledButton as any;
    const button = (
      <TypeHack
        as={underlyingComponent[type]}
        disabled={isDisabled}
        $loading={isLoading}
        tabIndex={isDisabled || isLoading ? '-1' : undefined}
        $expand={expand}
        $hidden={hidden}
        onClick={handleClick}
        {...buttonTheme}
        {...rest}
      />
    );
    if (isLoading) {
      return (
        <Overlay
          opacity={0}
          overlayContent={
            <LoadingIndicator
              size={buttonTheme.$loaderSize}
              color={buttonTheme.$loaderColor}
              opacity={buttonTheme.$loaderOpacity}
            />
          }
          element={button}
        />
      );
    }
    return button;
  };
  let displayNameSuffix = themeOverrides ? `${Object.keys(themeOverrides).length}overrides` : '';
  displayNameSuffix += fromScratch ? `-FromScratch` : '';
  ButtonClass.displayName = `Button-Type${capitalize(type)}-Theme${capitalize(
    baseTheme
  )}${displayNameSuffix}`;
  return ButtonClass;
}

interface StyledButtonProps {
  disabled?: boolean;
  $loading?: boolean;
  $expand?: boolean;
  $hidden?: boolean;
}

const StyledButton = styled.button<StyledButtonProps & AddPrefix<ButtonTheme, '$'>>`
  position: relative;
  box-shadow: none;
  outline: none;
  display: ${p => (p.$hidden ? 'none' : 'inline-flex')};
  align-items: center;
  justify-content: space-evenly;
  ${p => optionalPx('border-radius', p.$borderRadius)}
  ${p => optionalPx('font-size', p.$fontSize)}
  ${p => optionalPx('letter-spacing', p.$letterSpacing)}
  width: ${p => (p.$expand ? '100%' : 'max-content')};
  ${p => optional('text-decoration', p.$textDecoration)}
  ${p => optionalPx('text-underline-offset', p.$textUnderlineOffset)}
  ${p => optional('font-family', p.$fontFamily)}

  ${p => optionalPx('padding-top', p.$paddingTop)}
  ${p => optionalPx('padding-right', p.$paddingRight)}
  ${p => optionalPx('padding-bottom', p.$paddingBottom)}
  ${p => optionalPx('padding-left', p.$paddingLeft)}
  ${p => optional('font-weight', p.$fontWeight)}
  ${cssTransition(['background', 'box-shadow', 'border', 'color'], {
    duration: TransitionDuration.Short,
  })}

  ${p =>
    optional(
      'color',
      p.$loading ? p.$textColorLoading : p.disabled ? p.$textColorDisabled : p.$textColorActive
    )}
  ${p => (p.$loading ? `& svg { fill: ${p.$textColorLoading}; }` : undefined)}
  ${p =>
    optionalRaw(
      p.$loading
        ? p.$borderColorLoading
        : p.disabled
          ? p.$borderColorDisabled
          : p.$borderColorActive,
      v => `border: solid ${p.$borderWidth}px ${v};`
    )}
  ${p =>
    optional(
      'background',
      p.$loading ? p.$backgroundLoading : p.disabled ? p.$backgroundDisabled : p.$backgroundActive
    )}
  &:hover {
    ${p =>
      optional(
        'color',
        p.$loading ? p.$textColorLoading : p.disabled ? p.$textColorDisabled : p.$textColorHover
      )}
    ${p =>
      optionalRaw(
        p.$loading
          ? p.$borderColorLoading
          : p.disabled
            ? p.$borderColorDisabled
            : p.$borderColorHover,
        v => `border: solid ${p.$borderWidth}px ${v};`
      )}
    ${p =>
      optional(
        'background',
        p.$loading ? p.$backgroundLoading : p.disabled ? p.$backgroundDisabled : p.$backgroundHover
      )}
    ${p => optional('text-decoration', p.$textDecorationHover)}
  }

  &:focus-visible {
    ${p => optional('text-decoration', p.$focusTextDecoration)}
  }

  ${p =>
    optionalRaw(
      p.$focusBorderWidth ?? p.$borderWidth,
      v => `
  &:focus-visible:before {
    content: '';
    position: absolute;
    top: -${v}px;
    right: -${v}px;
    bottom: -${v}px;
    left: -${v}px;
    border: solid ${v}px ${p.$focusBorderColor ?? 'transparent'};
    border-radius: ${v + (p.$borderRadius ?? 0)}px;
  }
  &:focus-visible {
    z-index: ${ButtonFocusVisibleZindex};
  }
  `
    )}

  user-select: ${p => (!p.$enableSelect || p.disabled || p.$loading ? 'none' : 'auto')};
  cursor: ${p => (p.disabled || p.$loading ? 'default' : 'pointer')};
  pointer-events: ${p => (p.disabled || p.$loading ? 'none' : 'all')};
  touch-action: manipulation;
`;

export const Button = createButton({type: 'button', theme: 'button'});
export const UnthemedButton = createButton({type: 'button', theme: 'unthemed'});
export const ButtonAsLink = createButton({type: 'button', theme: 'link'});
export const Link = createButton({type: 'a', theme: 'link'});
export const UnthemedLink = createButton({type: 'a', theme: 'unthemed'});
export const LinkAsButton = createButton({type: 'a', theme: 'link'});
export const NavLink = createButton({type: 'NavLink', theme: 'link'});
export const UnthemedNavLink = createButton({type: 'NavLink', theme: 'unthemed'});
export const NavButton = createButton({type: 'NavLink', theme: 'button'});
