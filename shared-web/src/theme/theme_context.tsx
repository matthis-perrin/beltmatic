import {createContext, useContext} from 'react';

import {baseTheme} from '@shared-web/theme/theme_base';
import {FrontendTheme} from '@shared-web/theme/theme_model';

export const ThemeContext = createContext<FrontendTheme>({...baseTheme});
export function useTheme(): FrontendTheme {
  return useContext(ThemeContext);
}
