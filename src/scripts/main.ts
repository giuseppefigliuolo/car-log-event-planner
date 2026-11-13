/**
 * Entry point.
 *  1. always: anchors + smooth scroll, menu, fitted titles, header/background/WhatsApp-button chrome,
 *     the mobile hero's deck (drag, "Sfoglia")
 *  2. motion only: intro → hero entrance (+ the deck flying in, then its autoplay), reveals, the 300+ counter,
 *     parallax/words/stack, marquee, cursor bubble
 * Without JS or with reduced motion every section is a static, fully readable layout.
 */
import { fine } from './core/dom';
import { start } from './core/loop';
import { initDefer } from './core/defer';
import { initSmooth } from './core/smooth';
import { initChrome } from './features/chrome';
import { initCount } from './features/count';
import { initCursor } from './features/cursor';
import { initDeck } from './features/deck';
import { initFit } from './features/fit';
import { heroIn, runIntro } from './features/intro';
import { initMarquee } from './features/marquee';
import { initMenu } from './features/menu';
import { initReveal } from './features/reveal';
import { initReviews } from './features/reviews';
import { initScrollFx } from './features/scroll-fx';

const motion = document.documentElement.classList.contains('m');

initSmooth(motion);
initDefer();
initFit(); // first: later measurements depend on the fitted sizes
initMenu();
initChrome();
const deck = initDeck(motion);

if (motion) {
  const intro = runIntro();
  intro.hero.then((delay) => {
    heroIn(delay);
    deck?.enter(delay);
  });
  initReveal(intro.done);
  initCount();
  initScrollFx();
  initReviews();
  initMarquee();
  if (fine()) initCursor();
}
start();
