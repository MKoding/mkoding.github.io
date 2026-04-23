import {
    parseAttr,
    clamp,
    type ScrollEffect,
    type EffectInstance,
    type ScrollContext,
} from '../types';

const DEFAULT_MOVEMENT_DISTANCE = 80;
const DEFAULT_MIN_OPACITY = 0.2;
const DEFAULT_FREEZE_POINT = 0.5;
const OPACITY_MULTIPLIER = 1.5;

export const horizontalParallaxEffect: ScrollEffect = {
    selector: '.scroll-parallax',
    create(element: HTMLElement): EffectInstance {
        const movementDistance = parseAttr(
            element,
            'data-parallax-movement',
            DEFAULT_MOVEMENT_DISTANCE
        );
        const minimumOpacity = parseAttr(element, 'data-parallax-min-opacity', DEFAULT_MIN_OPACITY);
        const freezePointRatio = parseAttr(
            element,
            'data-parallax-freeze-point',
            DEFAULT_FREEZE_POINT
        );
        const direction = element.classList.contains('parallax-right') ? -1 : 1;

        return {
            element,
            recalculate() {},
            update(ctx: ScrollContext) {
                if (ctx.prefersReducedMotion) {
                    element.style.transform = '';
                    element.style.opacity = '1';
                    return;
                }

                const rect = element.getBoundingClientRect();
                const freezePixels = freezePointRatio * (ctx.viewportHeight / 2);
                const elementCenterY = rect.top + rect.height / 2;
                const viewportCenterY = ctx.viewportHeight / 2;
                const distanceFromCenter = viewportCenterY - elementCenterY;

                let progress = Math.max(
                    0,
                    (Math.abs(distanceFromCenter) - freezePixels) / (ctx.viewportHeight / 2)
                );
                if (elementCenterY < viewportCenterY) {
                    progress = Math.max(
                        0,
                        (-distanceFromCenter - freezePixels) / (ctx.viewportHeight / 2)
                    );
                }
                progress = clamp(progress, 0, 1);

                const opacityProgress = clamp(progress * OPACITY_MULTIPLIER, 0, 1);
                element.style.transform = `translate3d(${progress * movementDistance * direction}px, 0, 0)`;
                element.style.opacity = String(
                    minimumOpacity + (1 - minimumOpacity) * (1 - opacityProgress)
                );
            },
        };
    },
};
