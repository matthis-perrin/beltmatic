import {Children, cloneElement, JSX} from 'react';
import {styled} from 'styled-components';

import {Custom, EmptyFragment} from '@shared-web/lib/react';

interface OverlayProps {
  overlayContent?: JSX.Element | JSX.Element[];
  opacity?: number;
  color?: string;
  borderRadius?: number;
  element: JSX.Element;
}

const defaultOpacity = 0.75;
const defaultColor = 'white';
const defaultBorderRadius = 0;

export const Overlay: Custom<OverlayProps, 'div'> = ({
  element,
  overlayContent,
  opacity = defaultOpacity,
  color = defaultColor,
  borderRadius = defaultBorderRadius,
  ...rest
}) => {
  return cloneElement(element, {
    style: {...element.props.style, position: 'relative'},
    children: [
      ...Children.map(element.props.children, c => c),
      <OverlayAlpha
        key="overlay-alpha"
        $bg={color}
        $opacity={opacity}
        $borderRadius={borderRadius}
      ></OverlayAlpha>,
      overlayContent ? (
        <OverlayContent key="overlay-content" {...rest}>
          {overlayContent}
        </OverlayContent>
      ) : (
        EmptyFragment
      ),
    ],
  });
};
Overlay.displayName = 'Overlay';

const OverlayPosition = styled.div`
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
`;

const OverlayAlpha = styled(OverlayPosition)<{
  $bg: string;
  $opacity: number;
  $borderRadius: number;
}>`
  background-color: ${p => p.$bg};
  opacity: ${p => p.$opacity};
  border-radius: ${p => p.$borderRadius};
`;
const OverlayContent = styled(OverlayPosition)`
  display: flex;
  align-items: center;
  justify-content: center;
`;
