import {createContext, useContext} from 'react';

import {createTheme} from '@shared-web/theme/theme_base';
import {FrontendTheme} from '@shared-web/theme/theme_model';

export const ThemeContext = createContext<FrontendTheme>(createTheme());
export function useTheme(): FrontendTheme {
  return useContext(ThemeContext);
}
