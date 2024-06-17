import {
  ChangeEventHandler,
  ComponentPropsWithoutRef,
  DetailedHTMLProps,
  ElementType,
  FC,
  HTMLAttributes,
  JSX,
  memo,
  MouseEvent,
  MouseEventHandler,
  useMemo,
} from 'react';

export type Custom<Props, Element extends ElementType, Omitted extends string = ''> = FC<
  Props & Omit<ComponentPropsWithoutRef<Element>, 'style' | Omitted>
>;
export type CustomWithStyle<Props, Element extends ElementType> = FC<
  Props & ComponentPropsWithoutRef<Element>
>;
export type CustomWithout<
  Props,
  Element extends ElementType,
  Excluded extends keyof ComponentPropsWithoutRef<Element>,
> = FC<Props & Omit<ComponentPropsWithoutRef<Element>, 'style' | Excluded>>;

export type InputHandler = ChangeEventHandler<HTMLInputElement>;
export type ButtonHandler = MouseEventHandler<HTMLButtonElement>;

export const NULL_REF = null;
export const EmptyFragment = <></>;

export type AsyncMouseHandler<T = Element> = (event: MouseEvent<T>) => Promise<void>;

export type DivProps = Omit<
  DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement>,
  'ref'
>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ComponentClass = React.FunctionComponent<any> | React.ComponentClass<any>;

export function useComponentClass(element: JSX.Element): ComponentClass {
  // eslint-disable-next-line react-hooks/exhaustive-deps, react/display-name
  return useMemo(() => memo(() => element), []);
}

function wrapElements(classes: ComponentClass[]): JSX.Element {
  const [FirstClass, ...rest] = classes;
  if (FirstClass === undefined) {
    return EmptyFragment;
  }
  if (rest.length === 0) {
    return <FirstClass />;
  }
  return <FirstClass>{wrapElements(rest)}</FirstClass>;
}

export function useWrappedComponentClass(classes: ComponentClass[]): ComponentClass {
  return useComponentClass(wrapElements(classes));
}
