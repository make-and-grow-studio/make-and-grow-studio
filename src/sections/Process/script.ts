export type Speaker = 'you' | 'mg';

export type Message = {
  step: number;
  from: Speaker;
  text: string;
  /** Shown beside the name, as in a real thread. */
  at: string;
  attach?: { name: string; kind: 'fig' | 'png' };
  /** Emoji reaction pill under the message. */
  react?: { emoji: string; count: number };
};

export const STEPS = [
  { n: '01', label: 'First message' },
  { n: '02', label: 'The brief' },
  { n: '03', label: 'On the board' },
  { n: '04', label: 'Live' },
] as const;

export const SCRIPT: Message[] = [
  {
    step: 1,
    from: 'you',
    at: '10:02',
    text: 'we’re launching in six weeks and the site is nowhere',
  },
  { step: 1, from: 'mg', at: '10:04', text: 'six weeks is plenty. what are you making?' },

  {
    step: 2,
    from: 'you',
    at: '10:31',
    text: 'everything’s in here, sorry it’s a lot',
    attach: { name: 'brief.pdf', kind: 'fig' },
  },
  {
    step: 2,
    from: 'mg',
    at: '10:33',
    text: 'good — more is easier. you’ll see something Thursday.',
  },

  {
    step: 3,
    from: 'mg',
    at: 'Day 2',
    text: 'first pass. the hero’s doing the heavy lifting',
    attach: { name: 'home-01.png', kind: 'png' },
  },
  {
    step: 3,
    from: 'you',
    at: 'Day 2',
    text: 'this is it. can the headline hit harder?',
    react: { emoji: '🔥', count: 2 },
  },
  {
    step: 3,
    from: 'mg',
    at: 'Day 2',
    text: 'already redrawing. say the word as often as you like.',
  },

  { step: 4, from: 'mg', at: 'Day 5', text: 'it’s live. go and get found.' },
];
