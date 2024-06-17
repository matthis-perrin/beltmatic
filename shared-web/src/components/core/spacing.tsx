import {JSX} from 'react';
import {styled} from 'styled-components';

import {Custom} from '@shared-web/lib/react';
import {cssPx} from '@shared-web/lib/styled_utils';

interface SpacingProps {
  height?: number;
  width?: number;
}

export const Spacing: Custom<SpacingProps, 'div'> = ({
  width = '100%',
  height = '100%',
  ...rest
}) => <StyledSpacing $width={width} $height={height} {...rest} />;
Spacing.displayName = 'Spacing';

export function joinWithSpacing(elements: JSX.Element[], spacing: SpacingProps): JSX.Element {
  const children: JSX.Element[] = [];
  for (const [i, element] of elements.entries()) {
    if (i > 0) {
      children.push(<Spacing key={`spacing-${i}`} {...spacing} />);
    }
    children.push(element);
  }

  return <>{children}</>;
}

const StyledSpacing = styled.div<{$width: number | string; $height: number | string}>`
  width: ${p => cssPx(p.$width)};
  height: ${p => cssPx(p.$height)};
  flex-shrink: 0;
`;
