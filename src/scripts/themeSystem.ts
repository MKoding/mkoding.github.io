import { THEME_COLORS, DEFAULT_THEME, THEME_STORAGE_KEY, type ThemeName } from './tokens';

const ICON_HIDDEN_CLASS = 'hidden';

function readStoredTheme(): ThemeName | null {
    try {
        const stored = localStorage.getItem(THEME_STORAGE_KEY);
        if (stored === 'dark' || stored === 'light') return stored;
    } catch {}
    return null;
}

function writeStoredTheme(theme: ThemeName): void {
    try {
        localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {}
}

function resolveTheme(): ThemeName {
    const stored = readStoredTheme();
    if (stored) return stored;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : DEFAULT_THEME;
}

function applyTheme(theme: ThemeName): void {
    document.documentElement.setAttribute('data-theme', theme);

    const sunIcon = document.getElementById('sun-icon');
    const moonIcon = document.getElementById('moon-icon');
    const isDark = theme === 'dark';
    sunIcon?.classList.toggle(ICON_HIDDEN_CLASS, isDark);
    moonIcon?.classList.toggle(ICON_HIDDEN_CLASS, !isDark);

    const toggleBtn = document.getElementById('theme-toggle');
    if (toggleBtn) {
        toggleBtn.setAttribute(
            'aria-label',
            isDark ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'
        );
        toggleBtn.setAttribute('aria-pressed', isDark ? 'true' : 'false');
    }

    const meta = document.querySelector('meta[name="theme-color"]');
    meta?.setAttribute('content', THEME_COLORS[theme]);

    writeStoredTheme(theme);
}

function toggleTheme(): void {
    const current = document.documentElement.getAttribute('data-theme') as ThemeName;
    applyTheme(current === 'dark' ? 'light' : 'dark');
}

function initializeTheme(): void {
    applyTheme(resolveTheme());
}

export function initializeThemeSystem(): void {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeTheme);
    } else {
        initializeTheme();
    }
    document.getElementById('theme-toggle')?.addEventListener('click', toggleTheme);
}
