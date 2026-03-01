type ThemeName = 'dark' | 'light';

const THEME_STORAGE_KEY = 'theme';
const DEFAULT_THEME: ThemeName = 'dark';
const THEME_DARK: ThemeName = 'dark';
const THEME_LIGHT: ThemeName = 'light';
const ICON_HIDDEN_CLASS = 'hidden';

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
