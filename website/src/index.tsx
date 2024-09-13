import {FC, StrictMode} from 'react';
import {createRoot} from 'react-dom/client';

import {addPrefix} from '@shared/lib/type_utils';

import {CssReset} from '@shared-web/components/core/css_reset';
import {GlobalStyle} from '@shared-web/components/core/global_styles';
import {ThemeContext} from '@shared-web/theme/theme_context';

import {App} from '@src/components/app';
import {useThemeData} from '@src/theme';

const Root: FC = () => {
  const themeData = useThemeData();
  return (
    <ThemeContext.Provider value={themeData}>
      <CssReset />
      <App />
      <GlobalStyle {...addPrefix(themeData.main, '$')} />
    </ThemeContext.Provider>
  );
};
Root.displayName = 'Root';

const container = document.getElementById('root');
if (container) {
  createRoot(container).render(
    <StrictMode>
      <Root />
    </StrictMode>
  );
}
