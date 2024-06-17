import {
  ChangeEventHandler,
  ComponentPropsWithoutRef,
  createRef,
  Dispatch as ReactDispatch,
  FocusEventHandler,
  forwardRef,
  JSX,
  Ref,
  SetStateAction,
  useCallback,
  useEffect,
  useState,
} from 'react';
import {styled} from 'styled-components';

import {AddPrefix, addPrefix} from '@shared/lib/type_utils';

import {Label} from '@shared-web/components/core/label';
import {cssPx, optional, optionalPx, optionalRaw} from '@shared-web/lib/styled_utils';
import {useIsMounted} from '@shared-web/lib/use_is_mounted';
import {usePrevious} from '@shared-web/lib/use_previous';
import {useTheme} from '@shared-web/theme/theme_context';
import {FrontendTheme} from '@shared-web/theme/theme_model';

type Dispatch<T> = ReactDispatch<SetStateAction<T>> | ((val: T) => void);

export type LabelPosition = 'left' | 'center';

export interface InputProps<T> {
  ref?: Ref<HTMLInputElement>;
  value: T;
  syncState?: Dispatch<T>;
  syncStateWithEvent?: (value: T, evt: React.ChangeEvent<HTMLInputElement>) => void;
  asString?: (value: T) => string;
  fromString?: (value: string) => T;
  overrides?: Partial<FrontendTheme['input']>;
  label?: string | JSX.Element;
  labelPosition?: LabelPosition;
  noLabelOffset?: boolean;
  focusOnMount?: boolean;
  noAutoFormat?: boolean;
  forceFormat?: number;
}

export type FullInputProps<T> = InputProps<T> &
  Omit<ComponentPropsWithoutRef<'input'>, 'style' | 'value' | 'children'>;
// eslint-disable-next-line react/function-component-definition
function InputInternal<T>(props: FullInputProps<T>, ref: Ref<HTMLInputElement>): JSX.Element {
  const {
    width,
    syncState,
    syncStateWithEvent,
    value,
    asString,
    fromString,
    overrides,
    label,
    labelPosition,
    noLabelOffset,
    focusOnMount,
    onChange,
    onBlur,
    noAutoFormat = asString !== undefined,
    forceFormat,
    ...inputProps
  } = props;
  const internalRef = createRef<HTMLInputElement>();
  const {input: themeDefault} = useTheme();
  const inputTheme = addPrefix({...themeDefault, ...overrides}, '$');
  const stringify = useCallback(
    (val: T) => (asString === undefined ? (val === undefined ? '' : String(val)) : asString(val)),
    [asString]
  );
  const [internalStr, setInternalStr] = useState(stringify(value));
  const isMounted = useIsMounted();
  const handleInputChange = useCallback<ChangeEventHandler<HTMLInputElement>>(
    evt => {
      onChange?.(evt);
      if (!isMounted.current) {
        return;
      }
      setInternalStr(evt.currentTarget.value);
      try {
        const val =
          fromString === undefined
            ? (evt.currentTarget.value as unknown as T)
            : fromString(evt.currentTarget.value);
        syncState?.(val);
        syncStateWithEvent?.(val, evt);
      } catch {
        // invalid input, don't call syncState
      }
    },
    [fromString, isMounted, onChange, syncState, syncStateWithEvent]
  );

  const handleBlur = useCallback<FocusEventHandler<HTMLInputElement>>(
    evt => {
      onBlur?.(evt);
      setInternalStr(stringify(value));
    },
    [onBlur, stringify, value]
  );

  const prevForceFormat = usePrevious(forceFormat);
  useEffect(() => {
    if (forceFormat !== undefined && prevForceFormat !== forceFormat) {
      setInternalStr(stringify(value));
    }
  }, [forceFormat, prevForceFormat, stringify, value]);

  useEffect(() => {
    if (!noAutoFormat) {
      setInternalStr(stringify(value));
    }
  }, [noAutoFormat, stringify, value]);

  useEffect(() => {
    const actualRef = ref ?? internalRef;
    if (focusOnMount && typeof actualRef === 'object') {
      actualRef.current?.focus();
    }
  }, [focusOnMount, internalRef, ref]);

  const input = (
    <StyledInput
      ref={ref ?? internalRef}
      width={width}
      spellCheck={false}
      autoCapitalize="off"
      autoCorrect="off"
      onChange={handleInputChange}
      onBlur={handleBlur}
      type="text"
      value={internalStr}
      {...inputTheme}
      {...inputProps}
    />
  );

  if (label !== undefined) {
    const labelBaseColor = inputTheme.$textColor;
    const labelColor = /#[\dA-Fa-f]{6}/u.test(labelBaseColor)
      ? `${labelBaseColor}99`
      : /#[\dA-Fa-f]{3}/u.test(labelBaseColor)
        ? `${labelBaseColor}${labelBaseColor.slice(1, 4)}99` // eslint-disable-line @typescript-eslint/no-magic-numbers
        : labelBaseColor;
    return (
      <StyledLabel
        value={label}
        $paddingLeft={noLabelOffset ? 0 : inputTheme.$paddingLeft}
        $labelPosition={labelPosition ?? 'left'}
        $fontSize={inputTheme.$fontSize}
        $marginBottom={inputTheme.$titleMarginBottom}
        $textColor={labelColor}
      >
        {input}
      </StyledLabel>
    );
  }

  return input;
}
InputInternal.displayName = 'Input';

export const Input = forwardRef(InputInternal) as typeof InputInternal;

export function borderAndBackground(opts: {
  borderWidth: number;
  borderColor: string;
  backgroundColor: string;
}): string {
  const {borderWidth, borderColor, backgroundColor} = opts;
  if (borderColor.startsWith('linear-gradient')) {
    return `
      border: double ${borderWidth}px transparent;
      background-image: linear-gradient(${backgroundColor}, ${backgroundColor}), ${borderColor};
      background-origin: border-box;
      background-clip: padding-box, border-box;
    `;
  }
  return `
      border-style: solid;
      border-width: ${borderWidth}px;
      border-color: ${borderColor};
      background-color: ${backgroundColor};
      background-image: none;
      background-origin: inherit;
      background-clip: inherit;
    `;
}

const StyledInput = styled.input<AddPrefix<FrontendTheme['input'], '$'>>`
  display: block;
  ${p => optionalPx('width', p.width)}
  ${p => optionalPx('height', p.$height)}
  box-sizing: border-box;

  outline: none;
  ${p => optionalPx('padding-right', p.$paddingRight)}
  ${p => optionalPx('padding-left', p.$paddingLeft)}
  
  ${p => optional('font-family', p.$fontFamily)}
  ${p => optional('font-weight', p.$fontWeight)}
  ${p => optionalPx('font-size', p.$fontSize)}
  ${p => optional('color', p.$textColor)}
  
  ${p => optionalPx('border-radius', p.$borderRadius)}
  ${p =>
    borderAndBackground({
      borderColor: p.$borderColor,
      backgroundColor: p.$backgroundColor,
      borderWidth: p.$borderWidth,
    })}

  &:hover {
    ${p =>
      borderAndBackground({
        borderColor: p.$hoverBorderColor,
        backgroundColor: p.$backgroundColorHover,
        borderWidth: p.$borderWidth,
      })}
  }

  &:active:not([disabled]),
  &:focus:not([disabled]) {
    ${p =>
      borderAndBackground({
        borderColor: p.$focusBorderColor,
        backgroundColor: p.$backgroundColorFocus,
        borderWidth: p.$focusBorderWidth,
      })}
    ${p =>
      optionalRaw(
        p.$focusOutlineWidth,
        v => `box-shadow: 0 0 0 ${cssPx(v)} ${p.$focusOutlineColor};`
      )}
    ${p => optional('color', p.$focusTextColor)}
  }

  &:disabled {
    ${p => optional('color', p.$textColorDisabled)}
    box-shadow: none;
    pointer-events: none;
    ${p =>
      borderAndBackground({
        borderColor: p.$borderColor,
        backgroundColor: p.$backgroundColorDisabled,
        borderWidth: p.$borderWidth,
      })}
  }
`;

const StyledLabel = styled(Label)<{
  $paddingLeft: number | string | undefined;
  $labelPosition: LabelPosition;
  $fontSize: number | string | undefined;
  $marginBottom: number | string;
  $textColor: string;
}>`
  display: inline-block;
  line-height: 120%;
  font-weight: 700;
  color: ${p => p.$textColor};
  ${p => optionalPx('padding-left', p.$labelPosition === 'left' ? p.$paddingLeft : undefined)}
  ${p => optionalRaw(p.$fontSize, v => `font-size: calc(${cssPx(v)} * 0.8);`)}
  ${p => (p.$labelPosition === 'center' ? 'text-align: center;' : false)}
  margin-bottom: ${p => cssPx(p.$marginBottom)};
`;
