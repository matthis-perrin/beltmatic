import {ComponentPropsWithoutRef, FC, useCallback, useState} from 'react';
import {styled} from 'styled-components';

import {borderAndBackground, Input} from '@shared-web/components/core/input';
import {optional, optionalPx} from '@shared-web/lib/styled_utils';
import {useGlobalKeyPress} from '@shared-web/lib/use_global_key_press';
import {useTheme} from '@shared-web/theme/theme_context';
import {FrontendTheme} from '@shared-web/theme/theme_model';

interface EditableInputProps {
  value: string;
  onChange: (newValue: string) => void;
  overrides?: Partial<FrontendTheme['input']>;
  inputProps?: Partial<Omit<ComponentPropsWithoutRef<'input'>, 'style' | 'value' | 'children'>>;
  textWidth?: string | number;
}

export const EditableInput: FC<EditableInputProps> = props => {
  const {value, onChange, overrides = {}, inputProps, textWidth} = props;
  const [isEditing, setIsEditing] = useState(false);
  const {input} = useTheme();

  const handleTextClick = useCallback(() => setIsEditing(true), []);
  const resetInput = useCallback(() => setIsEditing(false), []);

  useGlobalKeyPress(['Enter', 'Escape'], resetInput);

  if (isEditing) {
    return (
      <Input
        value={value}
        syncState={onChange}
        onBlur={resetInput}
        overrides={overrides}
        {...inputProps}
      />
    );
  }
  return (
    <TextWrapper $theme={{...input, ...overrides}} $width={textWidth} onClick={handleTextClick}>
      {value}
    </TextWrapper>
  );
};

EditableInput.displayName = 'EditableInput';

const TextWrapper = styled.div<{$theme: FrontendTheme['input']; $width?: string | number}>`
  display: flex;
  align-items: center;
  ${p => optionalPx('height', p.$theme.height)}
  ${p => optionalPx('width', p.$width)}
  box-sizing: border-box;

  ${p => optionalPx('padding-right', p.$theme.paddingRight)}
  ${p => optionalPx('padding-left', p.$theme.paddingLeft)}
  
  ${p => optional('font-family', p.$theme.fontFamily)}
  ${p => optional('font-weight', p.$theme.fontWeight)}
  ${p => optionalPx('font-size', p.$theme.fontSize)}
  ${p => optional('color', p.$theme.textColor)}
  
  ${p => optionalPx('border-radius', p.$theme.borderRadius)}
  ${p =>
    borderAndBackground({
      borderColor: 'transparent',
      backgroundColor: 'transparent',
      borderWidth: p.$theme.borderWidth,
    })}

  &:hover {
    ${p =>
      borderAndBackground({
        borderColor: p.$theme.hoverBorderColor,
        backgroundColor: p.$theme.backgroundColorHover,
        borderWidth: p.$theme.borderWidth,
      })}
  }
`;
