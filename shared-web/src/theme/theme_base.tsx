import {DeepPartial} from '@shared/lib/type_utils';

import {hexToRgb, hslToRgb, RGB, rgbToHex, rgbToHsl, textColor} from '@shared-web/theme/colors';
import {FrontendTheme} from '@shared-web/theme/theme_model';
import {background, borderColor, paddings} from '@shared-web/theme/theme_utils';

/* eslint-disable @typescript-eslint/no-magic-numbers */
export function createTheme(
  opts?: {
    accentColor?: string;
    dark?: boolean;
    contrast?: number;
  },
  overrides?: DeepPartial<FrontendTheme>
): FrontendTheme {
  const {accentColor = 'rgb(0, 0, 0)', dark = false, contrast = 7} = opts ?? {};

  // Compute accent color
  const accentColorRgb = hexToRgb(accentColor);
  const accentColorHsl = rgbToHsl(accentColorRgb);

  // Compute a "light" and "dim" version of the accent color
  const {h, s, l} = accentColorHsl;
  const accentColorHoverHsl = {h, s, l: l * 1.3};
  const accentColorHoverRgb = hslToRgb(accentColorHoverHsl);
  const accentColorHover = rgbToHex(accentColorHoverRgb);
  const accentColorDisabled = `${accentColor}a0`;

  // Compute the best text color for each theme colors
  const accentTextColor = textColor(accentColorRgb, contrast);
  const accentTextColorHover = textColor(accentColorHoverRgb, contrast);
  const accentTextColorDisabled = `${accentTextColor}a0`;

  // Compute the background colors
  const backgroundShadeRgb = (shade: number): RGB => {
    const light = dark ? shade : 1 - shade;
    const v = Math.round(light * 255);
    return {r: v, g: v, b: v};
  };
  const backgroundShade = (shade: number): string => rgbToHex(backgroundShadeRgb(shade));
  const backgroundColorRgb = backgroundShadeRgb(0);
  const backgroundColor = rgbToHex(backgroundColorRgb);
  const backgroundTextColor = textColor(backgroundColorRgb, contrast);

  const highlight1 = backgroundShade(0.06);
  const highlight2 = backgroundShade(0.1);
  const highlight3 = backgroundShade(0.12);
  const highlight4 = backgroundShade(0.24);
  const highlight5 = backgroundShade(0.4);

  // Base styling for buttons
  const buttonBase = {
    textColorLoading: 'transparent',
    textDecoration: undefined,
    ...borderColor(undefined),
    borderWidth: 0,
    fontFamily: undefined,
    fontWeight: 500,
    lineHeight: 1.75,
    letterSpacing: undefined,
    textUnderlineOffset: 3,
  } as const;

  // Base styling for textfields
  const baseTextfield = {
    backgroundColor,
    backgroundColorHover: backgroundColor,
    backgroundColorFocus: backgroundColor,
    backgroundColorDisabled: backgroundShade(0.08),
    borderColor: `${accentColor}99`,
    hoverBorderColor: `${accentColor}dd`,
    focusBorderColor: accentColor,
    textColor: backgroundTextColor,
    textColorDisabled: textColor(backgroundShadeRgb(0.08), 3),
    focusTextColor: backgroundTextColor,
    borderRadius: 6,
    focusOutlineColor: `${accentColor}33`,
    focusOutlineWidth: 4,
    borderWidth: 1,
    focusBorderWidth: 1,
    fontSize: 16,
    fontFamily: undefined,
    fontWeight: 400,
    titleMarginBottom: '0.4em',
  } as const;

  return {
    main: {
      dark,
      backgroundColor,
      highlight1,
      highlight2,
      highlight3,
      highlight4,
      highlight5,
      accentColor: accentColorHover,
      textColor: backgroundTextColor,
      accentTextColor: accentTextColorHover,
      fontFamily: 'sans-serif',
      fontSize: 16,
      lineHeight: 1.5,
    },
    button: {
      ...buttonBase,
      textColorActive: accentTextColor,
      textColorDisabled: accentTextColorDisabled,
      textColorHover: accentTextColorHover,
      textDecorationHover: undefined,
      backgroundActive: accentColor,
      backgroundDisabled: accentColorDisabled,
      backgroundHover: accentColorHover,
      backgroundLoading: accentColorDisabled,
      focusBorderColor: '#ef8b59',
      focusBorderWidth: 2,
      focusTextDecoration: undefined,
      paddingTop: 8,
      paddingRight: 16,
      paddingBottom: 8,
      paddingLeft: 16,
      borderRadius: 6,
      fontSize: 15,
      enableSelect: false,
      loaderColor: accentTextColor,
      loaderOpacity: 1,
      loaderSize: 24,
      ...overrides?.button,
    },
    link: {
      ...buttonBase,
      textColorActive: accentColor,
      textColorDisabled: accentColorDisabled,
      textColorLoading: accentColorDisabled,
      textColorHover: accentColor,
      textDecorationHover: 'underline',
      ...background('transparent'),
      focusBorderColor: undefined,
      focusBorderWidth: undefined,
      focusTextDecoration: 'underline',
      ...paddings(0),
      borderRadius: undefined,
      fontSize: undefined,
      enableSelect: true,
      loaderColor: accentColor,
      loaderOpacity: 0.3,
      loaderSize: 20,
      ...overrides?.link,
    },
    checkbox: {
      labelPaddingTop: 8,
      labelPaddingRight: 8,
      labelPaddingBottom: 8,
      labelPaddingLeft: 8,
      labelBorderRadius: 6,
      labelHoverColor: highlight1,
      size: undefined,
      backgroundColor: 'transparent',
      backgroundColorChecked: accentColor,
      borderColor: accentColor,
      borderColorChecked: accentColor,
      borderRadius: 4,
      borderWidth: 2,
      marginRight: 8,
      ...overrides?.checkbox,
    },
    radio: {
      color: backgroundTextColor,
      radioColor: accentColor,
      fontSize: 16,
      fontWeight: 500,
      labelPaddingTop: 8,
      labelPaddingRight: 8,
      labelPaddingBottom: 8,
      labelPaddingLeft: 8,
      labelBorderRadius: 6,
      labelHoverColor: highlight1,
      size: undefined,
      titleMarginBottom: '0.4em',
      inputHeight: undefined,
      ...overrides?.radio,
    },
    input: {
      ...baseTextfield,
      paddingRight: 16,
      paddingLeft: 16,
      height: 48,
      ...overrides?.input,
    },
    textarea: {
      ...baseTextfield,
      paddingTop: 8,
      paddingRight: 16,
      paddingBottom: 8,
      paddingLeft: 16,
      ...overrides?.textarea,
    },
  };
}
/* eslint-enable @typescript-eslint/no-magic-numbers */
