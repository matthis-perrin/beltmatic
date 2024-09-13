/* eslint-disable @typescript-eslint/no-magic-numbers */
export interface RGB {
  r: number; // 0 to 255
  g: number; // 0 to 255
  b: number; // 0 to 255
}

export interface HSL {
  h: number; // 0 to 360 degrees
  s: number; // 0 to 1
  l: number; // 0 to 1
}

// Black as a RGB. This is the default in case of errors.
const BLACK: RGB = {r: 0, g: 0, b: 0};

export function gray(light: number): string {
  const v = Math.round(light * 255);
  return rgbToHex({r: v, g: v, b: v});
}

export function hexToRgb(hex: string): RGB {
  // Remove the trailing '#'
  if (!hex.startsWith('#')) {
    return BLACK;
  }
  hex = hex.slice(1);

  // Handle 3 char color format (eg: '#000')
  if (hex.length === 3) {
    const [rStr, gStr, bStr] = hex;
    hex = [rStr, rStr, gStr, gStr, bStr, bStr].join('');
  } else if (hex.length !== 6) {
    return BLACK;
  }

  // Parse as hexadecimal
  const integer = parseInt(hex, 16);

  // Extract RGB components
  /* eslint-disable no-bitwise */
  const r = (integer >> 16) & 0xff;
  const g = (integer >> 8) & 0xff;
  const b = integer & 0xff;
  /* eslint-enable no-bitwise */

  return {r, g, b};
}

export function rgbToHex(rgb: RGB): string {
  const {r, g, b} = rgb;
  const integer =
    // eslint-disable-next-line no-bitwise
    ((Math.round(r) & 0xff) << 16) + ((Math.round(g) & 0xff) << 8) + (Math.round(b) & 0xff);

  const string = integer.toString(16).toUpperCase();
  return `#${'000000'.slice(string.length) + string}`;
}

export function rgbToHsl(rgb: RGB): HSL {
  // Normalize components
  let {r, g, b} = rgb;
  r /= 255;
  g /= 255;
  b /= 255;

  // Compute lightness
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;

  // Compute saturation
  const d = max - min;
  if (d === 0) {
    return {h: 0, s: 0, l};
  }
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

  // Compute hue
  let h = 0;
  if (max === r) {
    h = (g - b) / d + (g < b ? 6 : 0);
  } else if (max === g) {
    h = (b - r) / d + 2;
  } else {
    h = (r - g) / d + 4;
  }
  h *= 60;

  return {h, s, l};
}

export function hslToRgb({h, s, l}: HSL): RGB {
  const chroma = (1 - Math.abs(2 * l - 1)) * s;
  const huePrime = h / 60;
  const secondComponent = chroma * (1 - Math.abs((huePrime % 2) - 1));

  const huePrimeRounded = Math.floor(huePrime);
  let red = 0;
  let green = 0;
  let blue = 0;

  if (huePrimeRounded === 0) {
    red = chroma;
    green = secondComponent;
    blue = 0;
  } else if (huePrimeRounded === 1) {
    red = secondComponent;
    green = chroma;
    blue = 0;
  } else if (huePrimeRounded === 2) {
    red = 0;
    green = chroma;
    blue = secondComponent;
  } else if (huePrimeRounded === 3) {
    red = 0;
    green = secondComponent;
    blue = chroma;
  } else if (huePrimeRounded === 4) {
    red = secondComponent;
    green = 0;
    blue = chroma;
  } else if (huePrimeRounded === 5) {
    red = chroma;
    green = 0;
    blue = secondComponent;
  }

  const lightnessAdjustment = l - chroma / 2;
  red += lightnessAdjustment;
  green += lightnessAdjustment;
  blue += lightnessAdjustment;

  return {
    r: Math.abs(Math.round(red * 255)),
    g: Math.abs(Math.round(green * 255)),
    b: Math.abs(Math.round(blue * 255)),
  };
}

const rgbConvert = (v: number): number => {
  const n = v / 255;
  return n <= 0.04045 ? n / 12.92 : ((n + 0.055) / 1.055) ** 2.4;
};
function luminance(rgb: RGB): number {
  const r = rgbConvert(rgb.r);
  const g = rgbConvert(rgb.g);
  const b = rgbConvert(rgb.b);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function luminanceContrast(l1: number, l2: number): number {
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

const grayScale = [...new Array(256)].map((_, gray) => {
  const rgb = {r: gray, g: gray, b: gray};
  return {
    hex: rgbToHex(rgb),
    lum: luminance(rgb),
  };
});

// Return the color that has the highest contrast when displayed over the `backgroundColor`
export function textColor(backgroundColor: RGB, contrast: number): string {
  const lum = luminance(backgroundColor);

  let bestGray: {hex: string; lum: number; c: number} | undefined;
  for (const gray of grayScale) {
    const c = luminanceContrast(gray.lum, lum);
    // No curent best
    if (!bestGray) {
      bestGray = {...gray, c};
    }
    // Valid contrast
    else if (c >= contrast) {
      // Current best is valid but current contrast closer to target than current best
      if (bestGray.c >= contrast && bestGray.c - contrast > c - contrast) {
        bestGray = {...gray, c};
      }
      // Current best is not valid
      else if (bestGray.c < contrast) {
        bestGray = {...gray, c};
      }
    }
    // Non-valid contrast, but still better than current best which is also non-valid
    else if (bestGray.c < contrast && c > bestGray.c) {
      bestGray = {...gray, c};
    }
  }

  return bestGray?.hex ?? '#000000';
}
/* eslint-enable @typescript-eslint/no-magic-numbers */
