import {createGlobalStyle} from 'styled-components';

export const CssReset = createGlobalStyle`
  *,
  *::before,
  *::after {
    margin: 0;
    padding: 0;
    text-decoration: none;
    outline: none;
    box-sizing: border-box;
  }

  body {
    scroll-behavior: smooth;
    text-rendering: optimizeLegibility;
  }

  code,
  pre,
  textarea,
  input,
  select,
  button {
    font: inherit;
  }

  em {
    font-style: normal;
  }

  th,
  b,
  strong,
  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    font-weight: inherit;
    font-size: inherit;
  }

  a,
  img,
  a img,
  iframe,
  form,
  fieldset,
  table,
  button {
    border: none;
  }

  table {
    border-collapse: collapse;
    border-spacing: 0;
  }

  th,
  td {
    text-align: left;
    vertical-align: top;
  }

  a {
    color: inherit;
  }
`;
