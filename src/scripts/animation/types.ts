export interface ScrollContext {
    viewportHeight: number;
    prefersReducedMotion: boolean;
    isFirstRender: boolean;
}

export interface EffectInstance {
    element: HTMLElement;
    recalculate(): void;
    update(ctx: ScrollContext): void;
}

export interface ScrollEffect {
    selector: string;
    create(element: HTMLElement): EffectInstance | null;
}

export function parseAttr(el: HTMLElement, attr: string, fallback: number): number {
    const parsed = parseFloat(el.getAttribute(attr) ?? '');
    return Number.isFinite(parsed) ? parsed : fallback;
}

export function clamp(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, value));
}
