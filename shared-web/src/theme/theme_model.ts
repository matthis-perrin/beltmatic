export interface ButtonTheme {
  textColorActive: string | undefined;
  textColorDisabled: string | undefined;
  textColorHover: string | undefined;
  textColorLoading: string | undefined;
  textDecoration: string | undefined;
  textDecorationHover: string | undefined;
  textUnderlineOffset: number | undefined;
  backgroundActive: string | undefined;
  backgroundDisabled: string | undefined;
  backgroundHover: string | undefined;
  backgroundLoading: string | undefined;
  borderColorActive: string | undefined;
  borderColorDisabled: string | undefined;
  borderColorHover: string | undefined;
  borderColorLoading: string | undefined;
  borderWidth: number | undefined;
  focusBorderColor: string | undefined;
  focusBorderWidth: number | undefined;
  focusTextDecoration: string | undefined;
  loaderColor: string | undefined;
  loaderOpacity: number | undefined;
  loaderSize: number | undefined;
  paddingTop: string | number | undefined;
  paddingRight: string | number | undefined;
  paddingBottom: string | number | undefined;
  paddingLeft: string | number | undefined;
  borderRadius: number | undefined;
  fontSize: string | number | undefined;
  fontWeight: string | number | undefined;
  fontFamily: string | undefined;
  lineHeight: string | number | undefined;
  letterSpacing: number | undefined;
  enableSelect: boolean | undefined;
}

interface TextfieldTheme {
  textColor: string;
  textColorDisabled: string;
  backgroundColor: string;
  backgroundColorHover: string;
  backgroundColorFocus: string;
  backgroundColorDisabled: string;
  borderColor: string;
  borderWidth: number;
  hoverBorderColor: string;
  focusBorderColor: string;
  focusBorderWidth: number;
  focusOutlineColor: string;
  focusOutlineWidth: number;
  focusTextColor: string;
  borderRadius: number;
  fontSize: string | number;
  fontWeight: string | number;
  fontFamily: string | undefined;
  titleMarginBottom: string | number;
}

export interface FrontendTheme {
  main: {
    backgroundColor: string;
    accentColor: string;
    textColor: string;
    accentTextColor: string;
    fontFamily: string;
    fontSize: string | number;
    lineHeight: string | number;
  };
  button: ButtonTheme;
  link: ButtonTheme;
  checkbox: {
    size: number | undefined;
    marginRight: number | undefined;
    labelPaddingTop: string | number | undefined;
    labelPaddingRight: string | number | undefined;
    labelPaddingBottom: string | number | undefined;
    labelPaddingLeft: string | number | undefined;
    labelBorderRadius: number | undefined;
    labelHoverColor: string | undefined;
    borderWidth: number | undefined;
    borderRadius: number | undefined;
    backgroundColor: string | undefined;
    borderColor: string | undefined;
    backgroundColorChecked: string | undefined;
    borderColorChecked: string | undefined;
  };
  radio: {
    color: string | undefined;
    radioColor: string | undefined;
    fontSize: number;
    fontWeight: number;
    size: number | undefined;
    labelPaddingTop: string | number | undefined;
    labelPaddingRight: string | number | undefined;
    labelPaddingBottom: string | number | undefined;
    labelPaddingLeft: string | number | undefined;
    labelBorderRadius: number | undefined;
    labelHoverColor: string | undefined;
    titleMarginBottom: string | number;
    inputHeight: string | number | undefined;
  };
  input: TextfieldTheme & {
    paddingRight: string | number;
    paddingLeft: string | number;
    height: number | undefined;
  };
  textarea: TextfieldTheme & {
    paddingTop: string | number;
    paddingRight: string | number;
    paddingBottom: string | number;
    paddingLeft: string | number;
  };
}
