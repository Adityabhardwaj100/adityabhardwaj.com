export interface JournalItem {
  id: string;
  title: string;
  date: string;
  /** Optional image URL. Falls back to a generated placeholder texture when omitted. */
  src?: string;
  /** Accent color used for the generated placeholder + back face. */
  color: string;
  /** Optional article text, shown in a scrollable panel over the card's
   *  back face once it's flipped open. Paragraphs are separated by a
   *  blank line. Cards without a body just show the plain back face. */
  body?: string;
}

export interface Vec2 {
  x: number;
  y: number;
}
