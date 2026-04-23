import type { ScrollEffect, EffectInstance, ScrollContext } from './types';

export class ScrollEngine {
    private instances: EffectInstance[] = [];
    private effects: ScrollEffect[] = [];
    private scheduled = false;
    private isFirstRender = true;
    private stableViewportHeight = 0;
    private visibleElements = new Set<HTMLElement>();

    register(effect: ScrollEffect): void {
        this.effects.push(effect);
    }

    init(): void {
        this.refreshViewportHeight();
        this.collectInstances();
        this.setupObserver();
        this.update();
        window.addEventListener('scroll', () => this.schedule(), { passive: true });
        this.setupResizeHandlers();
    }

    private collectInstances(): void {
        for (const effect of this.effects) {
            document.querySelectorAll<HTMLElement>(effect.selector).forEach((el) => {
                const instance = effect.create(el);
                if (instance) this.instances.push(instance);
            });
        }
    }

    private setupObserver(): void {
        const observer = new IntersectionObserver(
            (entries) => {
                for (const entry of entries) {
                    if (entry.isIntersecting) {
                        this.visibleElements.add(entry.target as HTMLElement);
                    } else {
                        this.visibleElements.delete(entry.target as HTMLElement);
                    }
                }
            },
            { rootMargin: '100px 0px' },
        );
        for (const instance of this.instances) observer.observe(instance.element);
    }

    private getContext(): ScrollContext {
        return {
            viewportHeight: this.getViewportHeight(),
            prefersReducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
            isFirstRender: this.isFirstRender,
        };
    }

    private update(): void {
        const ctx = this.getContext();
        for (const instance of this.instances) {
            if (this.isFirstRender || this.visibleElements.has(instance.element)) {
                instance.update(ctx);
            }
        }
        this.isFirstRender = false;
    }

    private schedule(): void {
        if (this.scheduled) return;
        this.scheduled = true;
        requestAnimationFrame(() => {
            this.update();
            this.scheduled = false;
        });
    }

    private refreshViewportHeight(): void {
        const visualH = window.visualViewport?.height ?? 0;
        this.stableViewportHeight = Math.round(Math.max(window.innerHeight, visualH));
    }

    private getViewportHeight(): number {
        if (this.stableViewportHeight <= 0) this.refreshViewportHeight();
        return this.stableViewportHeight;
    }

    private setupResizeHandlers(): void {
        let resizeTimeout: ReturnType<typeof setTimeout>;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                this.refreshViewportHeight();
                for (const instance of this.instances) instance.recalculate();
                this.update();
            }, 150);
        });

        window.visualViewport?.addEventListener('resize', () => {
            this.refreshViewportHeight();
            this.schedule();
        });

        const refreshLayout = () => {
            this.refreshViewportHeight();
            for (const instance of this.instances) instance.recalculate();
            this.schedule();
        };
        window.addEventListener('load', refreshLayout, { once: true });
        if ('fonts' in document) {
            (document as Document & { fonts: FontFaceSet }).fonts.ready.then(refreshLayout);
        }
    }
}
