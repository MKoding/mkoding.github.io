import {
    parseAttr,
    clamp,
    type ScrollEffect,
    type EffectInstance,
    type ScrollContext,
} from '../types';

function interpolateColor(start: string, end: string, progress: number): string {
    const s = start.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/);
    const e = end.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/);
    if (!s || !e) return start;

    const r = Math.round(Number(s[1]) + (Number(e[1]) - Number(s[1])) * progress);
    const g = Math.round(Number(s[2]) + (Number(e[2]) - Number(s[2])) * progress);
    const b = Math.round(Number(s[3]) + (Number(e[3]) - Number(s[3])) * progress);
    const a = (Number(s[4]) + (Number(e[4]) - Number(s[4])) * progress).toFixed(3);

    return `rgba(${r}, ${g}, ${b}, ${a})`;
}

export const imageRevealEffect: ScrollEffect = {
    selector: '.mikel-parallax-effect',
    create(element: HTMLElement): EffectInstance | null {
        const startPointRatio = parseAttr(element, 'data-parallax-start-point', 0);
        const freezePointRatioRaw = parseFloat(
            element.getAttribute('data-parallax-freeze-point') ?? ''
        );

        if (!Number.isFinite(freezePointRatioRaw)) return null;

        const freezePointRatio = freezePointRatioRaw;

        return {
            element,
            recalculate() {},
            update(ctx: ScrollContext) {
                if (ctx.prefersReducedMotion) {
                    element.style.transform = '';
                    element.style.filter = '';
                    element.style.boxShadow = '';
                    return;
                }

                const rect = element.getBoundingClientRect();
                const startPixels = startPointRatio * ctx.viewportHeight;
                const freezePixels = freezePointRatio * ctx.viewportHeight;

                const progress = clamp(
                    (ctx.viewportHeight - rect.top - startPixels) / (freezePixels - startPixels),
                    0,
                    1
                );

                const shadow1 = interpolateColor(
                    'rgba(0, 0, 0, 0.15)',
                    'rgba(0, 102, 255, 0.3)',
                    progress
                );
                const shadow2 = interpolateColor(
                    'rgba(0, 0, 0, 0.0)',
                    'rgba(0, 102, 255, 0.2)',
                    progress
                );

                element.style.filter = `grayscale(${100 - progress * 100}%)`;
                element.style.transform = `translate3d(0, ${-8 * progress}px, 0) scale(${1 + 0.02 * progress}) rotateZ(${3 * progress}deg)`;
                element.style.boxShadow = `0 10px 25px ${shadow1}, 0 25px 50px ${shadow2}`;
            },
        };
    },
};
