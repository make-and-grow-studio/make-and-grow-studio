import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { Draggable } from 'gsap/Draggable';

/* Flip was registered here but never used anywhere in the site. Registering
   a plugin is what pulls it into the bundle, so it was pure weight on every
   visitor's first paint. Add it back only alongside real usage. */
gsap.registerPlugin(ScrollTrigger, SplitText, Draggable);

// Everything on this site leans on the same feel.
gsap.defaults({ ease: 'expo.out', duration: 1.1 });

export { gsap, ScrollTrigger, SplitText, Draggable };
