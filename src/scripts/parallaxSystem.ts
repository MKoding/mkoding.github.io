interface ParallaxElementConfig {
    element: HTMLElement;
    movementDistance: number;
    minimumOpacity: number;
    freezePointRatio: number;
    movementDirection: number;
}

interface SplitHeadingConfig {
    element: HTMLElement;
    leftIcon: HTMLElement;
    rightIcon: HTMLElement;
    title: HTMLElement;
    splitDistance: number;
    titleDelay: number;
    startRatio: number;
    endRatio: number;
    initialGap: number;
}

interface MikelParallaxEffectConfig {
    element: HTMLElement;
    startPointRatio: number;
    freezePointRatio: number;
}

const PARALLAX_SELECTOR = '.scroll-parallax';
const PARALLAX_RIGHT_CLASS = 'parallax-right';
const SPLIT_HEADING_SELECTOR = '[data-split-heading]';
const MIKEL_PARALLAX_SELECTOR = '.mikel-parallax-effect';
const DEFAULT_MOVEMENT_DISTANCE = 80;
const DEFAULT_MIN_OPACITY = 0.2;
const DEFAULT_FREEZE_POINT = 0.5;
const DEFAULT_TITLE_DELAY = 0.2;
const DEFAULT_SPLIT_REVEAL_START = 0.9;
const DEFAULT_SPLIT_REVEAL_END = 0.45;
const DIRECTION_LEFT = 1;
const DIRECTION_RIGHT = -1;
const OPACITY_INTENSITY_MULTIPLIER = 1.5;

// Breakpoint responsive values (Tailwind breakpoints)
const BREAKPOINT_MD = 768;

function getResponsiveValue(mobileValue: number, desktopValue: number): number {
    return typeof window !== 'undefined' && window.innerWidth >= BREAKPOINT_MD
        ? desktopValue
        : mobileValue;
}

const parallaxElementsConfig: ParallaxElementConfig[] = [];
const splitHeadingsConfig: SplitHeadingConfig[] = [];
const mikelParallaxEffectsConfig: MikelParallaxEffectConfig[] = [];
let isScrollAnimationScheduled = false;
let isFirstParallaxRender = true;
let stableViewportHeight = 0;
// Keep animations transform-driven across all browsers to avoid jank on mobile and desktop.
let useLightweightAnimation = true;

function getCurrentViewportHeight(): number {
    if (typeof window === 'undefined') return 0;
    const visualViewportHeight = window.visualViewport?.height ?? 0;
    // Use the larger value to avoid over-splitting headings on initial mobile browser chrome state.
    return Math.round(Math.max(window.innerHeight, visualViewportHeight));
}

function refreshStableViewportHeight(): void {
    stableViewportHeight = getCurrentViewportHeight();
}

function getViewportHeight(): number {
    if (stableViewportHeight <= 0) {
        refreshStableViewportHeight();
    }
    return stableViewportHeight;
}

function extractParallaxConfig(element: HTMLElement): ParallaxElementConfig {
    const movementDistance =
        parseFloat(element.getAttribute('data-parallax-movement') ?? '') ||
        DEFAULT_MOVEMENT_DISTANCE;

    const minimumOpacity =
        parseFloat(element.getAttribute('data-parallax-min-opacity') ?? '') || DEFAULT_MIN_OPACITY;

    const freezePointRatio =
        parseFloat(element.getAttribute('data-parallax-freeze-point') ?? '') ||
        DEFAULT_FREEZE_POINT;

    const movementDirection = element.classList.contains(PARALLAX_RIGHT_CLASS)
        ? DIRECTION_RIGHT
        : DIRECTION_LEFT;

    return {
        element,
        movementDistance,
        minimumOpacity,
        freezePointRatio,
        movementDirection,
    };
}

function calculateParallaxProgress(
    elementRect: DOMRect,
    windowHeight: number,
    freezePointPixels: number
): number {
    const elementCenterY = elementRect.top + elementRect.height / 2;
    const viewportCenterY = windowHeight / 2;
    const distanceFromCenter = viewportCenterY - elementCenterY;

    const distanceFromFreezePoint = Math.abs(distanceFromCenter) - freezePointPixels;
    let progressValue = Math.max(0, distanceFromFreezePoint / (windowHeight / 2));

    if (elementCenterY < viewportCenterY) {
        progressValue = Math.max(0, (-distanceFromCenter - freezePointPixels) / (windowHeight / 2));
    }

    return Math.min(progressValue, 1);
}

function calculateOpacity(progress: number, minimumOpacity: number): number {
    const opacityProgress = Math.min(1, Math.max(0, progress * OPACITY_INTENSITY_MULTIPLIER));
    return minimumOpacity + (1 - minimumOpacity) * (1 - opacityProgress);
}

function clampValue(value: number, minValue: number, maxValue: number): number {
    return Math.min(maxValue, Math.max(minValue, value));
}

function calculateRevealProgress(
    elementRect: DOMRect,
    windowHeight: number,
    startRatio: number,
    endRatio: number
): number {
    const startPosition = windowHeight * startRatio;
    const endPosition = windowHeight * endRatio;
    return clampValue((startPosition - elementRect.top) / (startPosition - endPosition), 0, 1);
}

function extractSplitHeadingConfig(element: HTMLElement): SplitHeadingConfig | null {
    const leftIcon = element.querySelector<HTMLElement>('[data-split-icon="left"]');
    const rightIcon = element.querySelector<HTMLElement>('[data-split-icon="right"]');
    const title = element.querySelector<HTMLElement>('[data-split-title]');

    if (!leftIcon || !rightIcon || !title) return null;

    const initialGapMobile =
        parseFloat(element.getAttribute('data-split-initial-gap-mobile') ?? '') ||
        parseFloat(element.getAttribute('data-split-initial-gap') ?? '') ||
        8;
    const initialGapDesktop =
        parseFloat(element.getAttribute('data-split-initial-gap') ?? '') || 15;
    const initialGap = getResponsiveValue(initialGapMobile, initialGapDesktop);

    const titleDelay =
        parseFloat(element.getAttribute('data-split-title-delay') ?? '') || DEFAULT_TITLE_DELAY;
    const startRatio =
        parseFloat(element.getAttribute('data-split-start') ?? '') || DEFAULT_SPLIT_REVEAL_START;
    const endRatio =
        parseFloat(element.getAttribute('data-split-end') ?? '') || DEFAULT_SPLIT_REVEAL_END;

    element.setAttribute('data-split-ready', 'true');

    const titleWidth = title.offsetWidth;
    const baseOffset = initialGap / 2;

    return {
        element,
        leftIcon,
        rightIcon,
        title,
        splitDistance: titleWidth / 2 + baseOffset,
        titleDelay,
        startRatio,
        endRatio,
        initialGap,
    };
}

function recalculateSplitDistance(config: SplitHeadingConfig): void {
    const titleWidth = config.title.offsetWidth;
    const baseOffset = config.initialGap / 2;
    config.splitDistance = titleWidth / 2 + baseOffset;
}

function updateSplitHeadings(windowHeight: number): void {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    splitHeadingsConfig.forEach((config) => {
        const isMobileOnly = config.element.hasAttribute('data-split-mobile-only');
        const isMobile = window.innerWidth < BREAKPOINT_MD;

        // Si es mobile-only y estamos en desktop, no animar
        if (isMobileOnly && !isMobile) {
            config.leftIcon.style.transform = '';
            config.rightIcon.style.transform = '';
            config.title.style.opacity = '1';
            config.title.style.transform = '';
            return;
        }

        const elementRect = config.element.getBoundingClientRect();
        let progress = prefersReducedMotion
            ? 1
            : calculateRevealProgress(
                  elementRect,
                  windowHeight,
                  config.startRatio,
                  config.endRatio
              );

        // First paint: headings already visible should start in final state (no separated icons).
        if (isFirstParallaxRender && elementRect.top < windowHeight * 1.15) {
            progress = 1;
        }
        const titleProgress = clampValue(
            (progress - config.titleDelay) / (1 - config.titleDelay),
            0,
            1
        );
        const totalDistance = config.splitDistance;

        config.leftIcon.style.transform = `translate3d(${totalDistance * (1 - progress)}px, 0, 0)`;
        config.rightIcon.style.transform = `translate3d(${-totalDistance * (1 - progress)}px, 0, 0)`;
        config.title.style.opacity = String(titleProgress);
        config.title.style.transform = `translate3d(0, ${(1 - titleProgress) * 6}px, 0)`;
    });
}

function interpolateColor(colorStart: string, colorEnd: string, progress: number): string {
    // Parse rgba colors
    const startMatch = colorStart.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/);
    const endMatch = colorEnd.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/);

    if (!startMatch || !endMatch) return colorStart;

    const [, r1, g1, b1, a1] = startMatch;
    const [, r2, g2, b2, a2] = endMatch;

    const r = Math.round(Number(r1) + (Number(r2) - Number(r1)) * progress);
    const g = Math.round(Number(g1) + (Number(g2) - Number(g1)) * progress);
    const b = Math.round(Number(b1) + (Number(b2) - Number(b1)) * progress);
    const a = (Number(a1) + (Number(a2) - Number(a1)) * progress).toFixed(3);

    return `rgba(${r}, ${g}, ${b}, ${a})`;
}

function updateMikelParallaxEffects(windowHeight: number): void {
    mikelParallaxEffectsConfig.forEach((config) => {
        const elementRect = config.element.getBoundingClientRect();
        const startPointPixels = config.startPointRatio * windowHeight;
        const freezePointPixels = config.freezePointRatio * windowHeight;

        // Progress: 0 cuando el elemento entra por abajo (startPoint), 1 cuando llega al freeze-point
        const progress = clampValue(
            (windowHeight - elementRect.top - startPointPixels) /
                (freezePointPixels - startPointPixels),
            0,
            1
        );

        // Interpolate transform
        const translateY = -8 * progress;
        const scale = 1 + 0.02 * progress;
        const rotate = 3 * progress;

        // Mikel parallax effect always applies color and shadow effects (no lightweight mode)
        // Interpolate grayscale
        const grayscale = 100 - progress * 100;

        // Interpolate shadows
        const shadowLight1 = interpolateColor(
            'rgba(0, 0, 0, 0.15)',
            'rgba(0, 102, 255, 0.3)',
            progress
        );
        const shadowLight2 = interpolateColor(
            'rgba(0, 0, 0, 0.0)',
            'rgba(0, 102, 255, 0.2)',
            progress
        );

        config.element.style.filter = `grayscale(${grayscale}%)`;
        config.element.style.transform = `translate3d(0, ${translateY}px, 0) scale(${scale}) rotateZ(${rotate}deg)`;
        config.element.style.boxShadow = `0 10px 25px ${shadowLight1}, 0 25px 50px ${shadowLight2}`;
    });
}

function extractMikelParallaxConfig(element: HTMLElement): MikelParallaxEffectConfig | null {
    const startPointRatio = parseFloat(element.getAttribute('data-parallax-start-point') ?? '0');
    const freezePointRatio = parseFloat(element.getAttribute('data-parallax-freeze-point') ?? '');

    if (isNaN(freezePointRatio)) return null;

    return {
        element,
        startPointRatio,
        freezePointRatio,
    };
}

function updateParallaxTransforms(): void {
    const windowHeight = getViewportHeight();

    parallaxElementsConfig.forEach((config) => {
        const elementRect = config.element.getBoundingClientRect();
        const freezePointPixels = config.freezePointRatio * (windowHeight / 2);

        const progress = calculateParallaxProgress(elementRect, windowHeight, freezePointPixels);
        const translationXDistance =
            Math.min(progress, 1) * config.movementDistance * config.movementDirection;
        const opacityValue = calculateOpacity(progress, config.minimumOpacity);

        config.element.style.transform = `translate3d(${translationXDistance}px, 0, 0)`;
        config.element.style.opacity = String(opacityValue);
    });

    if (splitHeadingsConfig.length > 0) {
        updateSplitHeadings(windowHeight);
    }

    if (mikelParallaxEffectsConfig.length > 0) {
        updateMikelParallaxEffects(windowHeight);
    }

    isFirstParallaxRender = false;
}

function scheduleParallaxUpdate(): void {
    if (isScrollAnimationScheduled) return;

    isScrollAnimationScheduled = true;
    window.requestAnimationFrame(() => {
        updateParallaxTransforms();
        isScrollAnimationScheduled = false;
    });
}

function initializeParallax(): void {
    refreshStableViewportHeight();

    const parallaxElements = document.querySelectorAll<HTMLElement>(PARALLAX_SELECTOR);

    parallaxElements.forEach((element) => {
        parallaxElementsConfig.push(extractParallaxConfig(element));
    });

    const splitHeadings = document.querySelectorAll<HTMLElement>(SPLIT_HEADING_SELECTOR);
    splitHeadings.forEach((element) => {
        const config = extractSplitHeadingConfig(element);
        if (config) splitHeadingsConfig.push(config);
    });
    splitHeadingsConfig.forEach((config) => recalculateSplitDistance(config));

    const mikelParallaxEffects = document.querySelectorAll<HTMLElement>(MIKEL_PARALLAX_SELECTOR);
    mikelParallaxEffects.forEach((element) => {
        const config = extractMikelParallaxConfig(element);
        if (config) mikelParallaxEffectsConfig.push(config);
    });

    updateParallaxTransforms();
    window.addEventListener('scroll', scheduleParallaxUpdate, { passive: true });

    // Handle window resize to recalculate responsive values
    function handleResize(): void {
        splitHeadingsConfig.length = 0;
        const updatedSplitHeadings = document.querySelectorAll<HTMLElement>(SPLIT_HEADING_SELECTOR);
        updatedSplitHeadings.forEach((element) => {
            const config = extractSplitHeadingConfig(element);
            if (config) splitHeadingsConfig.push(config);
        });

        splitHeadingsConfig.forEach((config) => recalculateSplitDistance(config));

        mikelParallaxEffectsConfig.length = 0;
        const updatedMikelEffects = document.querySelectorAll<HTMLElement>(MIKEL_PARALLAX_SELECTOR);
        updatedMikelEffects.forEach((element) => {
            const config = extractMikelParallaxConfig(element);
            if (config) mikelParallaxEffectsConfig.push(config);
        });

        updateParallaxTransforms();
    }

    let resizeTimeout: NodeJS.Timeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(handleResize, 150);
    });

    window.visualViewport?.addEventListener('resize', () => {
        refreshStableViewportHeight();
        scheduleParallaxUpdate();
    });

    // Re-sync after full load and font resolution to avoid wrong initial split distance on reload.
    function refreshSplitHeadingLayout(): void {
        refreshStableViewportHeight();
        splitHeadingsConfig.forEach((config) => recalculateSplitDistance(config));
        scheduleParallaxUpdate();
    }

    window.addEventListener('load', refreshSplitHeadingLayout, { once: true });

    if ('fonts' in document) {
        (document as Document & { fonts: FontFaceSet }).fonts.ready.then(() => {
            refreshSplitHeadingLayout();
        });
    }
}

export function initializeParallaxSystem(): void {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeParallax);
    } else {
        initializeParallax();
    }
}
