import SmoothScroll from './components/SmoothScroll';
import Preloader from './components/Preloader/Preloader';
import Cursor from './components/Cursor/Cursor';
import Grain from './components/Grain';
import Board from './components/Board/Board';
import Rail from './components/Rail/Rail';
import Nav from './components/Nav/Nav';
import Hero from './sections/Hero/Hero';
import Marquee from './components/Marquee/Marquee';
import Bento from './sections/Bento/Bento';
import Process from './sections/Process/Process';
import Services from './sections/Services/Services';
import Contact from './sections/Contact/Contact';
import Footer from './sections/Footer/Footer';

const BIG = ['Design', 'Build', 'Grow', 'AI-Native'] as const;
const THIN = [
  'Premium craft',
  'Shipped at the speed of AI',
  'Coimbatore → worldwide',
] as const;

export default function App() {
  return (
    <>
      {/* SmoothScroll first: layout effects run in tree order, and the
          preloader locks scrolling from its own — Lenis has to exist by then. */}
      <SmoothScroll />
      <Preloader />
      <Board />
      <Grain />
      <Cursor />
      <Rail />
      <Nav />

      <main id="main">
        <Hero />

        {/* Counter-moving pair: the thin strip travelling the other way is
            what stops the two reading as one thick band. */}
        <div className="marquee-band">
          <Marquee words={BIG} speed={55} />
          <Marquee words={THIN} speed={34} direction={-1} variant="mono" phoneHide />
        </div>

        <Bento />
        <Process />
        <Services />
        <Contact />
      </main>

      <Footer />
    </>
  );
}
