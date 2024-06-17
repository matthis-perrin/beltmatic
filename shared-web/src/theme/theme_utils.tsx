import {AddPrefix} from '@shared/lib/type_utils';

interface States {
  Active: string | undefined;
  Disabled: string | undefined;
  Hover: string | undefined;
  Loading: string | undefined;
}

function allStates<Prefix extends string>(
  prefix: Prefix,
  value: string | undefined
): AddPrefix<States, Prefix> {
  return {
    [`${prefix}Active`]: value,
    [`${prefix}Disabled`]: value,
    [`${prefix}Hover`]: value,
    [`${prefix}Loading`]: value,
  } as AddPrefix<States, Prefix>;
}

export function background(val: string | undefined): AddPrefix<States, 'background'> {
  return allStates('background', val);
}
export function textColor(val: string | undefined): AddPrefix<States, 'textColor'> {
  return allStates('textColor', val);
}
export function borderColor(val: string | undefined): AddPrefix<States, 'borderColor'> {
  return allStates('borderColor', val);
}
export function paddings(val: number): {
  paddingTop: number;
  paddingRight: number;
  paddingBottom: number;
  paddingLeft: number;
} {
  return {
    paddingTop: val,
    paddingRight: val,
    paddingBottom: val,
    paddingLeft: val,
  };
}
