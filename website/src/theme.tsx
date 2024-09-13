import {createDataStore} from '@shared-web/lib/data_store';
import {createTheme} from '@shared-web/theme/theme_base';
import {FrontendTheme} from '@shared-web/theme/theme_model';

export const theme: FrontendTheme = createTheme(
  {accentColor: '#0049be', dark: false},
  {
    input: {fontSize: 20, paddingLeft: 16, paddingRight: 16, height: 48},
    button: {fontSize: 20, paddingLeft: 8, paddingRight: 8, paddingTop: 8, paddingBottom: 8},
  }
);

const themeDataStore = createDataStore<FrontendTheme>(theme);
export const getThemeData = themeDataStore.getData;
export const setThemeData = themeDataStore.setData;
export const useThemeData = themeDataStore.useData;
