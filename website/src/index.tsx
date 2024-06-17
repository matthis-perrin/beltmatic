import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';

import {addPrefix} from '@shared/lib/type_utils';

import {CssReset} from '@shared-web/components/core/css_reset';
import {GlobalStyle} from '@shared-web/components/core/global_styles';
import {ThemeContext} from '@shared-web/theme/theme_context';

import {App} from '@src/components/app';
import {theme} from '@src/theme';

const container = document.getElementById('root');
if (container) {
  createRoot(container).render(
    <StrictMode>
      <ThemeContext.Provider value={theme}>
        <CssReset />
        <App />
        <GlobalStyle {...addPrefix(theme.main, '$')} />
      </ThemeContext.Provider>
    </StrictMode>
  );
}
