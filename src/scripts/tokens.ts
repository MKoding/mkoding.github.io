export type ThemeName = 'dark' | 'light';

export const THEME_COLORS: Record<ThemeName, string> = {
    dark: '#0f0f0f',
    light: '#ffffff',
};

export const DEFAULT_THEME: ThemeName = 'light';
export const THEME_STORAGE_KEY = 'theme';
