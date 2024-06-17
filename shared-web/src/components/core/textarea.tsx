import {
  ChangeEventHandler,
  ComponentPropsWithoutRef,
  createRef,
  forwardRef,
  JSX,
  KeyboardEventHandler,
  Ref,
  useCallback,
  useEffect,
  useState,
} from 'react';
import {styled} from 'styled-components';

import {AddPrefix, addPrefix} from '@shared/lib/type_utils';

import {borderAndBackground} from '@shared-web/components/core/input';
import {Label} from '@shared-web/components/core/label';
import {cssPx, optional, optionalPx, optionalRaw} from '@shared-web/lib/styled_utils';
import {useIsMounted} from '@shared-web/lib/use_is_mounted';
import {useTheme} from '@shared-web/theme/theme_context';
import {FrontendTheme} from '@shared-web/theme/theme_model';

type TextareaResize = 'vertical' | 'horizontal' | 'both' | 'none';

export interface TextareaProps<T> {
  ref?: Ref<HTMLTextAreaElement>;
  value: T;
  syncState?: (val: T) => void;
  asString?: (value: T) => string;
  fromString?: (value: string) => T;
  overrides?: Partial<FrontendTheme['textarea']>;
  label?: string | JSX.Element;
  focusOnMount?: boolean;
  width?: number | string;
  height?: number | string;
  resize?: TextareaResize; // default is 'vertical'
}
// eslint-disable-next-line react/function-component-definition
function TextareaInternal<T>(
  props: TextareaProps<T> &
    Omit<ComponentPropsWithoutRef<'textarea'>, 'style' | 'value' | 'children'>,
  ref: Ref<HTMLTextAreaElement>
): JSX.Element {
  const {
    syncState,
    value,
    asString,
    fromString,
    overrides,
    label,
    focusOnMount,
    width,
    height,
    resize = 'vertical',
    ...textareaProps
  } = props;
  const internalRef = createRef<HTMLTextAreaElement>();
  const {textarea: themeDefault} = useTheme();
  const textareaTheme = addPrefix({...themeDefault, ...overrides}, '$');
  const stringify = useCallback(
    (val: T) => (asString === undefined ? (val === undefined ? '' : String(val)) : asString(val)),
    [asString]
  );

  const [internalStr, setInternalStr] = useState(stringify(value));
  const isMounted = useIsMounted();
  const handleTextareaChange = useCallback<ChangeEventHandler<HTMLTextAreaElement>>(
    evt => {
      if (!syncState || !isMounted.current) {
        return;
      }
      setInternalStr(evt.currentTarget.value);
      try {
        const val =
          fromString === undefined
            ? (evt.currentTarget.value as unknown as T)
            : fromString(evt.currentTarget.value);
        syncState(val);
      } catch {
        // invalid textarea, don't call syncState
      }
    },
    [fromString, isMounted, syncState]
  );

  // Stop propagation when pressing "Enter" to prevent auto submitting forms
  const handleKeyDown = useCallback<KeyboardEventHandler<HTMLTextAreaElement>>(evt => {
    if (evt.key === 'Enter') {
      evt.stopPropagation();
    }
  }, []);

  useEffect(() => setInternalStr(stringify(value)), [stringify, value]);

  useEffect(() => {
    const actualRef = ref ?? internalRef;
    if (focusOnMount && typeof actualRef === 'object') {
      actualRef.current?.focus();
    }
  }, [focusOnMount, internalRef, ref]);

  const textarea = (
    <StyledTextarea
      {...textareaTheme}
      ref={ref ?? internalRef}
      spellCheck={false}
      onChange={handleTextareaChange}
      onKeyDown={handleKeyDown}
      value={internalStr}
      $width={width}
      $height={height}
      $resize={resize}
      {...textareaProps}
    />
  );

  if (label !== undefined) {
    const labelBaseColor = textareaTheme.$textColor;
    const labelColor = /#[\dA-Fa-f]{6}/u.test(labelBaseColor)
      ? `${labelBaseColor}99`
      : /#[\dA-Fa-f]{3}/u.test(labelBaseColor)
        ? `${labelBaseColor}${labelBaseColor.slice(1, 4)}99` // eslint-disable-line @typescript-eslint/no-magic-numbers
        : labelBaseColor;
    return (
      <StyledLabel
        value={label}
        $paddingLeft={textareaTheme.$paddingLeft}
        $fontSize={textareaTheme.$fontSize}
        $marginBottom={textareaTheme.$titleMarginBottom}
        $textColor={labelColor}
      >
        {textarea}
      </StyledLabel>
    );
  }

  return textarea;
}
TextareaInternal.displayName = 'Textarea';

export const Textarea = forwardRef(TextareaInternal) as typeof TextareaInternal;

const StyledTextarea = styled.textarea<
  AddPrefix<FrontendTheme['textarea'], '$'> & {
    $width?: number | string;
    $height?: number | string;
    $resize: TextareaResize;
  }
>`
  ${p => optionalPx('width', p.$width)};
  ${p => optionalPx('height', p.$height)};

  resize: ${p => p.$resize};
  outline: none;
  ${p => optionalPx('padding-top', p.$paddingTop)}
  ${p => optionalPx('padding-right', p.$paddingRight)}
      ${p => optionalPx('padding-bottom', p.$paddingBottom)}
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
  $fontSize: number | string | undefined;
  $marginBottom: number | string;
  $textColor: string | undefined;
}>`
  display: inline-block;
  line-height: 120%;
  font-weight: 700;
  ${p => optional('color', p.$textColor)}
  ${p => optionalPx('padding-left', p.$paddingLeft)}
    ${p => optionalRaw(p.$fontSize, v => `font-size: calc(${cssPx(v)} * 0.8);`)}
      margin-bottom: ${p => cssPx(p.$marginBottom)};
`;
