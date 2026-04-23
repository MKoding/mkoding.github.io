import { THEME_COLORS, DEFAULT_THEME, THEME_STORAGE_KEY, type ThemeName } from './tokens';

export function bootstrapTheme(
    themeColors: Record<ThemeName, string>,
    defaultTheme: ThemeName
): void {
    let theme: ThemeName;
    try {
        const stored = localStorage.getItem(THEME_STORAGE_KEY);
        theme = stored === 'dark' || stored === 'light' ? stored : null;
    } catch {
        theme = null;
    }

    if (!theme) {
        theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : defaultTheme;
    }

    document.documentElement.setAttribute('data-theme', theme);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', themeColors[theme]);
}
