import {ComponentPropsWithoutRef, JSX, useCallback, useId} from 'react';
import {styled} from 'styled-components';

import {addPrefix} from '@shared/lib/type_utils';

import {Label} from '@shared-web/components/core/label';
import {Radio} from '@shared-web/components/core/radio';
import {InputHandler} from '@shared-web/lib/react';
import {cssPx, optionalPx, optionalRaw} from '@shared-web/lib/styled_utils';
import {useTheme} from '@shared-web/theme/theme_context';
import {FrontendTheme} from '@shared-web/theme/theme_model';

export interface RadiosProps<T> {
  value: T | undefined;
  values: {value: T; label: string; subLabel?: string}[];
  label?: string | JSX.Element;
  syncState?: (val: T, el: HTMLInputElement) => void;
  asString?: (value: T) => string;
  fromString?: (value: string) => T;
  overrides?: Partial<FrontendTheme['radio']>;
  column?: boolean;
  disabled?: boolean;
}
// eslint-disable-next-line react/function-component-definition
export function Radios<T>(
  props: RadiosProps<T> & Omit<ComponentPropsWithoutRef<'div'>, 'style' | 'children'>
): JSX.Element {
  const {
    value,
    values,
    label,
    syncState,
    asString,
    fromString,
    overrides,
    column,
    disabled,
    ...rest
  } = props;
  const name = useId();
  const {radio} = useTheme();
  const radioTheme = addPrefix({...radio, ...overrides}, '$');

  const handleChange = useCallback<InputHandler>(
    evt => {
      const val =
        fromString === undefined
          ? (evt.currentTarget.value as unknown as T)
          : fromString(evt.currentTarget.value);
      syncState?.(val, evt.currentTarget);
    },
    [fromString, syncState]
  );

  const radios = (
    <Wrapper $column={column} {...rest}>
      {values.map(v => {
        const str = asString === undefined ? (v.value as unknown as string) : asString(v.value);
        return (
          <Radio
            key={str}
            name={name}
            value={str}
            checked={value === v.value}
            onChange={handleChange}
            overrides={overrides}
            disabled={disabled}
          >
            <span>
              {v.label}
              {v.subLabel === undefined ? '' : <SubLabel>{v.subLabel}</SubLabel>}
            </span>
          </Radio>
        );
      })}
    </Wrapper>
  );

  if (label !== undefined) {
    return (
      <StyledLabel
        value={label}
        $paddingLeft={radioTheme.$labelPaddingLeft ?? 0}
        $fontSize={radioTheme.$fontSize}
        $color={radioTheme.$color}
        $marginBottom={radioTheme.$titleMarginBottom}
      >
        {radios}
      </StyledLabel>
    );
  }

  return radios;
}
Radios.displayName = 'Radios';

const Wrapper = styled.div<{$column?: boolean}>`
  display: flex;
  ${p => (p.$column ? `flex-direction: column;` : `align-items: center; gap: 8px;`)}
`;

const StyledLabel = styled(Label)<{
  $paddingLeft: number | string | undefined;
  $fontSize: number | string | undefined;
  $color: string | undefined;
  $marginBottom: number | string;
}>`
  display: inline-block;
  line-height: 120%;
  font-weight: 700;
  opacity: 0.6;
  ${p => optionalRaw(p.$fontSize, v => `font-size: calc(${cssPx(v)} * 0.8);`)}
  ${p => optionalRaw(p.$color, v => `color: ${v};`)}
  ${p => optionalPx('padding-left', p.$paddingLeft)}
  margin-bottom: ${p => cssPx(p.$marginBottom)};
`;

const SubLabel = styled.span`
  color: #00000069;
  font-size: 15px;
  display: inline-block;
  margin-left: 10px;
  font-style: italic;
`;
