import {CSSProperties, FC} from 'react';
import {keyframes, styled} from 'styled-components';

import {DeepPartial} from '@shared/lib/type_utils';

import {useTheme} from '@shared-web/theme/theme_context';

const DEFAULT_SIZE = 44;
const DEFAULT_OPACITY = 0.6;
const DEFAULT_THICKNESS = 3.6;
const DEFAULT_DASH_SPEED_MS = 1400;
const DEFAULT_DASH_EASING = 'ease-in-out';
const DEFAULT_ROTATION_SPEED_MS = 1400;
const DEFAULT_ROTATION_EASING = 'linear';

interface DashOptions {
  /**
   * How long in ms for the circle to grow then shrink
   * Default: 1400
   */
  $dashSpeedMs: number;
  /**
   * The easing used during the grow/shrink animation
   * Default: ease-in-out
   */
  $dashEasing: string;
}

interface RotationOptions {
  /**
   * How long in ms for the loading indicator to perform full rotation
   * Default: 1400
   */
  $rotationSpeedMs: number;
  /**
   * The easing used during the rotation animation
   * Default: linear
   */
  $rotationEasing: string;
}

interface LoadingIndicatorProps {
  /**
   * Color of the circle.
   */
  color: string;
  /**
   * Outter diameter of the circle (will be the effective size taken by the component)
   * Default: 44
   */
  size: number;
  /**
   * Opacity of the component
   * Default: 0.4
   */
  opacity: CSSProperties['opacity'];
  /**
   * Thickness of the ring of the circle
   * Default: 3.6
   */
  thickness: number;
  /**
   * Options controling the rotation animation
   */
  rotation: RotationOptions;
  /**
   * Options controling the "dash" animation (the arc of the circle growing and shrinking)
   */
  dash: DashOptions;
}

// Display a rotating <div>, a <svg> that draws a ring using a <circle>.
// The ring is animated (grown/shrinked) by animating the stroke-dasharray
// and stroke-dashoffset attribute.
export const LoadingIndicator: FC<DeepPartial<LoadingIndicatorProps>> = ({
  color,
  size = DEFAULT_SIZE,
  thickness = DEFAULT_THICKNESS,
  opacity = DEFAULT_OPACITY,
  rotation,
  dash,
}) => {
  const {
    $rotationSpeedMs: rotationSpeedMs = DEFAULT_ROTATION_SPEED_MS,
    $rotationEasing: rotationEasing = DEFAULT_ROTATION_EASING,
  } = rotation ?? {};
  const {
    $dashSpeedMs: dashSpeedMs = DEFAULT_DASH_SPEED_MS,
    $dashEasing: dashEasing = DEFAULT_DASH_EASING,
  } = dash ?? {};

  const {
    main: {accentColor},
  } = useTheme();

  return (
    <Wrapper
      size={size}
      opacity={opacity}
      $rotationSpeedMs={rotationSpeedMs}
      $rotationEasing={rotationEasing}
    >
      <svg viewBox={`${size / 2} ${size / 2} ${size} ${size}`}>
        <StyledCircle
          cx={size}
          cy={size}
          r={(size - thickness) / 2}
          fill="none"
          strokeWidth={thickness}
          stroke={color ?? accentColor}
          $size={size}
          $fullCircle={Math.PI * (size - thickness)}
          $dashSpeedMs={dashSpeedMs}
          $dashEasing={dashEasing}
        ></StyledCircle>
      </svg>
    </Wrapper>
  );
};
LoadingIndicator.displayName = 'LoadingIndicator';

// Wrapper (div) of the LoadingIndicator that handles sizing and the rotation animation
const circleRotateKeyFrames = keyframes`
    0% {transform: rotate(0deg);}
    100% {transform: rotate(-360deg);}
`;

const Wrapper = styled.div<RotationOptions & {size: number; opacity: CSSProperties['opacity']}>`
  animation-name: ${circleRotateKeyFrames};
  animation-duration: ${props => `${props.$rotationSpeedMs}ms`};
  animation-timing-function: ${props => props.$rotationEasing};
  animation-iteration-count: infinite;
  transform-origin: 50% 50%;
  width: ${p => p.size}px;
  height: ${p => p.size}px;
  ${p => (p.opacity === undefined ? undefined : `opacity: ${p.opacity};`)}
`;

// Circle element in the SVG that handles drawing the ring and the dash animation
type StyledCircleProps = {$size: number; $fullCircle: number} & DashOptions;

const getCicrcleDashKeyframes = ({
  $fullCircle,
}: StyledCircleProps): ReturnType<typeof keyframes> => keyframes`
    0% {
        stroke-dashoffset: ${0 * $fullCircle};
    }
    100% {
        stroke-dashoffset: ${2 * $fullCircle};
    }
  `;

const StyledCircle = styled.circle<StyledCircleProps>`
  animation-name: ${props => getCicrcleDashKeyframes(props)};
  animation-duration: ${props => `${props.$dashSpeedMs}ms`};
  animation-timing-function: ${props => props.$dashEasing};
  animation-iteration-count: infinite;
  stroke-dasharray: ${props => props.$fullCircle};
`;
