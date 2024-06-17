import {Children, cloneElement, JSX, useId} from 'react';

import {CustomWithout} from '@shared-web/lib/react';

export interface LabelProps {
  value: string | JSX.Element;
  children: JSX.Element;
  labelAfter?: boolean;
  labelWrap?: boolean;
}

export const Label: CustomWithout<LabelProps, 'label', 'children'> = props => {
  const {value, labelAfter, labelWrap, children, ...rest} = props;
  const id = useId();
  const element = cloneElement(children, {id});

  if (labelWrap) {
    if (labelAfter) {
      return typeof value === 'string' || value.type !== 'label' ? (
        <label htmlFor={id} {...rest}>
          {element}
          {value}
        </label>
      ) : (
        cloneElement(value, {
          htmlFor: id,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
          children: [element, Children.toArray(value.props.children)],
        })
      );
    }
    return typeof value === 'string' || value.type !== 'label' ? (
      <label htmlFor={id} {...rest}>
        {value}
        {element}
      </label>
    ) : (
      cloneElement(value, {
        htmlFor: id,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        children: [Children.toArray(value.props.children), element],
      })
    );
  }
  const label =
    typeof value === 'string' || value.type !== 'label' ? (
      <label htmlFor={id} {...rest}>
        {value}
      </label>
    ) : (
      cloneElement(value, {htmlFor: id})
    );
  if (labelAfter) {
    return (
      <>
        {element}
        {label}
      </>
    );
  }
  return (
    <>
      {label}
      {element}
    </>
  );
};
Label.displayName = 'Label';
