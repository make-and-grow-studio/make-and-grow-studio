export const SITE = {
  name: 'Make & Grow',
  tagline: 'an AI-native studio · design · build · growth',
  email: 'makeandgrowstudios@gmail.com',
  /** WhatsApp Business short link — opens a chat with the studio account. */
  whatsapp: 'https://wa.me/message/R2ISJFJXPDWWI1',
  /** Display form and dial form kept apart: one is read, one is tapped. */
  phone: '+91 87786 21851',
  phoneHref: 'tel:+918778621851',
  /* Stripped of the igsh / igsi / utm_source=qr parameters the share sheet
     appends. They're a referral token tied to how the link was copied, not
     part of the address, and they'd be baked into every visitor's click. */
  instagram: 'https://www.instagram.com/makeandgrow.studio',
  linkedin: 'https://www.linkedin.com/company/make-and-grow-studios/',
  handle: '@makeandgrow.studio',
  location: 'Coimbatore → Worldwide',
  timeZone: 'Asia/Kolkata',
  availability: 'Taking work for Q1',
  year: 2026,
} as const;

/**
 * WhatsApp click-to-chat, with a message already typed for them.
 *
 * This uses the number form rather than the wa.me/message/<code> Business
 * short link, because only the number form accepts a `text` parameter. The
 * short link plays whatever greeting is configured inside the WhatsApp
 * Business app and silently drops anything appended to it — so a prefilled
 * message is not possible through it at all.
 *
 * Assumes the Business account sits on the same line as SITE.phone. If it's
 * a separate number, this is the one value to change.
 */
const WHATSAPP_NUMBER = '918778621851';

export function waLink(message: string) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

/* Ends on a colon and a space on purpose: the cursor lands after it, so the
   first thing they do is finish the sentence rather than face a blank box. */
export const BOOK_MESSAGE =
  "Hi Make & Grow — I'd like to book a call. Here's what I'm making: ";

export const NAV_LINKS = [
  { label: 'About', href: '#about' },
  { label: 'Process', href: '#process' },
  { label: 'What we do', href: '#services' },
  { label: 'Contact', href: '#contact' },
] as const;
