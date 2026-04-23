import {
    parseAttr,
    clamp,
    type ScrollEffect,
    type EffectInstance,
    type ScrollContext,
} from '../types';

const BREAKPOINT_MD = 768;
const DEFAULT_TITLE_DELAY = 0.2;
const DEFAULT_START_RATIO = 0.9;
const DEFAULT_END_RATIO = 0.45;

export const splitHeadingEffect: ScrollEffect = {
    selector: '[data-split-heading]',
    create(element: HTMLElement): EffectInstance | null {
        const leftIcon = element.querySelector<HTMLElement>('[data-split-icon="left"]');
        const rightIcon = element.querySelector<HTMLElement>('[data-split-icon="right"]');
        const title = element.querySelector<HTMLElement>('[data-split-title]');

        if (!leftIcon || !rightIcon || !title) return null;

        const mobileOnly = element.hasAttribute('data-split-mobile-only');
        const titleDelay = parseAttr(element, 'data-split-title-delay', DEFAULT_TITLE_DELAY);
        const startRatio = parseAttr(element, 'data-split-start', DEFAULT_START_RATIO);
        const endRatio = parseAttr(element, 'data-split-end', DEFAULT_END_RATIO);

        const gapMobileRaw = parseFloat(
            element.getAttribute('data-split-initial-gap-mobile') ?? ''
        );
        const gapSharedRaw = parseFloat(element.getAttribute('data-split-initial-gap') ?? '');
        const initialGapMobile = Number.isFinite(gapMobileRaw)
            ? gapMobileRaw
            : Number.isFinite(gapSharedRaw)
              ? gapSharedRaw
              : 8;
        const initialGapDesktop = Number.isFinite(gapSharedRaw) ? gapSharedRaw : 15;

        element.setAttribute('data-split-ready', 'true');

        let splitDistance = 0;

        function computeSplitDistance(): void {
            const gap = window.innerWidth >= BREAKPOINT_MD ? initialGapDesktop : initialGapMobile;
            splitDistance = title!.offsetWidth / 2 + gap / 2;
        }

        computeSplitDistance();

        return {
            element,
            recalculate() {
                computeSplitDistance();
            },
            update(ctx: ScrollContext) {
                const isMobile = window.innerWidth < BREAKPOINT_MD;

                if (mobileOnly && !isMobile) {
                    leftIcon.style.transform = '';
                    rightIcon.style.transform = '';
                    title.style.opacity = '1';
                    title.style.transform = '';
                    return;
                }

                const rect = element.getBoundingClientRect();
                let progress: number;

                if (
                    ctx.prefersReducedMotion ||
                    (ctx.isFirstRender && rect.top < ctx.viewportHeight * 1.15)
                ) {
                    progress = 1;
                } else {
                    progress = clamp(
                        (ctx.viewportHeight * startRatio - rect.top) /
                            (ctx.viewportHeight * (startRatio - endRatio)),
                        0,
                        1
                    );
                }

                const titleProgress = clamp((progress - titleDelay) / (1 - titleDelay), 0, 1);

                leftIcon.style.transform = `translate3d(${splitDistance * (1 - progress)}px, 0, 0)`;
                rightIcon.style.transform = `translate3d(${-splitDistance * (1 - progress)}px, 0, 0)`;
                title.style.opacity = String(titleProgress);
                title.style.transform = `translate3d(0, ${(1 - titleProgress) * 6}px, 0)`;
            },
        };
    },
};
