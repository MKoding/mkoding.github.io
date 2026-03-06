type ThemeName = 'dark' | 'light';

const THEME_STORAGE_KEY = 'theme';
const DEFAULT_THEME: ThemeName = 'light';
const THEME_DARK: ThemeName = 'dark';
const THEME_LIGHT: ThemeName = 'light';
const ICON_HIDDEN_CLASS = 'hidden';

function applyThemeColorMeta(themeName: ThemeName): void {
    const themeColorMeta = document.querySelector('meta[name="theme-color"]');
    if (!themeColorMeta) {
        return;
    }

    const color = themeName === THEME_DARK ? '#0f0f0f' : '#ffffff';
    themeColorMeta.setAttribute('content', color);
}

function getStoredTheme(): ThemeName {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    return (stored as ThemeName) || DEFAULT_THEME;
}

function applyThemeToDocument(themeName: ThemeName): void {
    const htmlElement = document.documentElement;
    const sunIcon = document.getElementById('sun-icon');
    const moonIcon = document.getElementById('moon-icon');

    htmlElement.setAttribute('data-theme', themeName);

    const isDarkTheme = themeName === THEME_DARK;
    sunIcon?.classList.toggle(ICON_HIDDEN_CLASS, isDarkTheme);
    moonIcon?.classList.toggle(ICON_HIDDEN_CLASS, !isDarkTheme);
    applyThemeColorMeta(themeName);

    localStorage.setItem(THEME_STORAGE_KEY, themeName);
}

function toggleThemeMode(): void {
    const htmlElement = document.documentElement;
    const currentTheme = htmlElement.getAttribute('data-theme') as ThemeName;
    const nextTheme = currentTheme === THEME_DARK ? THEME_LIGHT : THEME_DARK;
    applyThemeToDocument(nextTheme);
}

function initializeTheme(): void {
    const preferredTheme = getStoredTheme();
    applyThemeToDocument(preferredTheme);
}

export function initializeThemeSystem(): void {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeTheme);
    } else {
        initializeTheme();
    }

    const themeToggleButton = document.getElementById('theme-toggle');
    themeToggleButton?.addEventListener('click', toggleThemeMode);
}
