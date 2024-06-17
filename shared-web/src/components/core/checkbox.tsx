import {ChangeEventHandler, Dispatch, SetStateAction, useCallback} from 'react';
import {styled} from 'styled-components';

import {AddPrefix, addPrefix} from '@shared/lib/type_utils';

import {Label, LabelProps} from '@shared-web/components/core/label';
import {CustomWithout} from '@shared-web/lib/react';
import {cssPx, optional, optionalPx, optionalRaw} from '@shared-web/lib/styled_utils';
import {useTheme} from '@shared-web/theme/theme_context';
import {FrontendTheme} from '@shared-web/theme/theme_model';

export interface CheckboxProps {
  overrides?: Partial<FrontendTheme['checkbox']>;
  syncState?: Dispatch<SetStateAction<boolean>> | Dispatch<SetStateAction<boolean | undefined>>;
  children: LabelProps['value'];
}

export const Checkbox: CustomWithout<CheckboxProps, 'input', 'children' | 'size'> = ({
  overrides,
  syncState,
  children,
  checked,
  ...inputProps
}) => {
  const {disabled} = inputProps;
  const {checkbox: themeDefault} = useTheme();
  const checkboxTheme = addPrefix({...themeDefault, ...overrides}, '$');

  const handleChange = useCallback<ChangeEventHandler<HTMLInputElement>>(
    evt => {
      syncState?.(evt.currentTarget.checked);
    },
    [syncState]
  );

  const LabelClass = disabled ? DisabledLabel : EnabledLabel;

  return (
    <LabelClass labelAfter labelWrap value={children} {...checkboxTheme}>
      <Input
        type="checkbox"
        checked={checked ?? false}
        onChange={handleChange}
        {...checkboxTheme}
        {...inputProps}
      />
    </LabelClass>
  );
};
Checkbox.displayName = 'Checkbox';

const BaseLabel = styled(Label)<AddPrefix<FrontendTheme['checkbox'], '$'>>`
  display: flex;
  align-items: center;
  user-select: none;
  ${p => optionalPx('padding-top', p.$labelPaddingTop)}
  ${p => optionalPx('padding-right', p.$labelPaddingRight)}
  ${p => optionalPx('padding-bottom', p.$labelPaddingBottom)}
  ${p => optionalPx('padding-left', p.$labelPaddingLeft)}
  ${p => optionalRaw(p.$labelPaddingLeft, v => `margin-left: -${cssPx(v)};`)}
  ${p => optionalPx('border-radius', p.$labelBorderRadius)}
`;
const EnabledLabel = styled(BaseLabel)<AddPrefix<FrontendTheme['checkbox'], '$'>>`
  cursor: pointer;
  &:hover {
    ${p => optional('background-color', p.$labelHoverColor)}
  }
`;
const DisabledLabel = styled(BaseLabel)`
  opacity: 0.4;
`;

const defaultMarginRight = 8;
const defaultSize = 16;
const defaultBorderRadius = 4;

const Input = styled.input<AddPrefix<FrontendTheme['checkbox'], '$'>>`
  appearance: none;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: ${p => p.$marginRight ?? defaultMarginRight}px;
  width: ${p => cssPx(p.$size ?? defaultSize)};
  height: ${p => cssPx(p.$size ?? defaultSize)};
  &:before {
    content: '';
    width: ${p => cssPx(p.$size ?? defaultSize)};
    height: ${p => cssPx(p.$size ?? defaultSize)};
    background-color: ${p => p.$backgroundColor ?? '#ffffff'};
    border-radius: ${p => cssPx(p.$borderRadius ?? defaultBorderRadius)};
    border-style: solid;
    ${p => optionalRaw(p.$borderColor, v => `border-color: ${v};`)}
    ${p => optionalPx('border-width', p.$borderWidth)}
  }
  &:checked:before {
    background-color: ${p => p.$backgroundColorChecked ?? '#ffffff'};
    ${p => optionalRaw(p.$borderColorChecked, v => `border-color: ${v};`)}
  }
  &:hover {
  }
`;
