import { ScrollEngine } from './scrollEngine';
import { horizontalParallaxEffect } from './effects/horizontalParallax';
import { splitHeadingEffect } from './effects/splitHeading';
import { imageRevealEffect } from './effects/imageReveal';

export function initializeAnimationSystem(): void {
    const engine = new ScrollEngine();
    engine.register(horizontalParallaxEffect);
    engine.register(splitHeadingEffect);
    engine.register(imageRevealEffect);

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => engine.init());
    } else {
        engine.init();
    }
}
