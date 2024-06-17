import {styled} from 'styled-components';

import {Custom} from '@shared-web/lib/react';
import {cssPx, optional, optionalRaw} from '@shared-web/lib/styled_utils';

const DEFAULT_ICON_SIZE = 24;

export interface SvgIconData {
  viewBox: string;
  element: JSX.Element;
}

interface SvgIconProps {
  icon: SvgIconData;
  width?: number | string;
  height?: number | string;
  size?: number | string;
  color?: string;
  colorHover?: string;
}

export const SvgIcon: Custom<SvgIconProps, 'svg'> = props => {
  const {icon, size, width, height, color = 'black', colorHover, onClick, ...rest} = props;
  const {viewBox, element} = icon;
  const w = width ?? size;
  const h = height ?? size;
  const sizeOverride = w === undefined && h === undefined ? DEFAULT_ICON_SIZE : undefined;
  const handleClick = onClick;
  return (
    <ColoredSvg
      viewBox={viewBox}
      $width={sizeOverride ?? w}
      $height={sizeOverride ?? h}
      $fill={color}
      $fillHover={colorHover ?? color}
      $clickable={onClick !== undefined}
      onClick={handleClick}
      {...rest}
    >
      {element}
    </ColoredSvg>
  );
};
SvgIcon.displayName = 'SvgIcon';

const ColoredSvg = styled.svg<{
  $fill?: string;
  $fillHover?: string;
  $clickable?: boolean;
  $width: number | string | undefined;
  $height: number | string | undefined;
}>`
  ${p => optional('fill', p.$fill)}
  ${p => optionalRaw(p.$fillHover, v => `&:hover { fill: ${v}; }`)}
  ${p => optionalRaw(p.$width, v => `width: ${cssPx(v)};`)}
  ${p => optionalRaw(p.$height, v => `height: ${cssPx(v)};`)}
  ${p => (p.$clickable ? 'cursor: pointer;' : undefined)}
`;
