/**
 * Entry point.
 *  1. always: anchors + smooth scroll, menu, fitted titles, header/background/WhatsApp-button chrome
 *  2. motion only: intro → hero entrance, reveals, parallax/words/stack, marquee, cursor bubble
 * Without JS or with reduced motion every section is a static, fully readable layout.
 */
import { fine } from './core/dom';
import { start } from './core/loop';
import { initSmooth } from './core/smooth';
import { initChrome } from './features/chrome';
import { initCursor } from './features/cursor';
import { initFit } from './features/fit';
import { heroIn, runIntro } from './features/intro';
import { initMarquee } from './features/marquee';
import { initMenu } from './features/menu';
import { initReveal } from './features/reveal';
import { initScrollFx } from './features/scroll-fx';

const motion = document.documentElement.classList.contains('m');

initSmooth(motion);
initFit(); // first: later measurements depend on the fitted sizes
initMenu();
initChrome();

if (motion) {
  const intro = runIntro();
  intro.hero.then(heroIn);
  initReveal(intro.done);
  initScrollFx();
  initMarquee();
  if (fine()) initCursor();
}
start();
