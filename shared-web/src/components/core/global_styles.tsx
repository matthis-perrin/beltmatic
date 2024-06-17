import {createGlobalStyle, css} from 'styled-components';

import {AddPrefix} from '@shared/lib/type_utils';

import {FrontendTheme} from '@shared-web/theme/theme_model';

export const ThemeGlobalCss = css<AddPrefix<FrontendTheme['main'], '$'>>`
  font-family: ${p => p.$fontFamily};
  font-size: ${p => p.$fontSize}px;
  line-height: ${p => p.$lineHeight};
  background-color: ${p => p.$backgroundColor};
  color: ${p => p.$textColor};
`;

export const GlobalStyle = createGlobalStyle`${css<AddPrefix<FrontendTheme['main'], '$'>>`
  html,
  body,
  #app {
    width: 100%;
    height: 100%;
    font-weight: 400;
    ${ThemeGlobalCss};
  }

  [hidden] {
    display: none !important;
  }
`}`;
