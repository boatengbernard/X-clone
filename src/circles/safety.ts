const CRISIS = /\b(suicid\w*|kill(ing)? myself|end(ing)? (my|it all)|end my life|self[- ]?harm\w*|hurt(ing)? myself|cut(ting)? myself|want(ed)? to die|don'?t want to (live|be here)|better off dead|no reason to live)\b/i;

/** True when text mentions self-harm or suicide. Errs on the side of showing help. */
export const mentionsCrisis = (text: string) => CRISIS.test(text);

export const CRISIS_HELP = [
  { label: 'If you are in immediate danger', detail: 'Call your local emergency number now.' },
  { label: 'US', detail: 'Call or text 988 (Suicide & Crisis Lifeline)' },
  { label: 'UK and Ireland', detail: 'Call Samaritans on 116 123' },
  { label: 'Anywhere else', detail: 'Find a free helpline at findahelpline.com' },
];

const STRUGGLE = /\b(bible|scripture|devotion(al)?s?|quiet time|reading plan|word of god|read(ing)? the word)\b/i;

/** Feed posts about struggling to read Scripture get a gentle Reading Circles suggestion. */
export const suggestsCircles = (text: string) => STRUGGLE.test(text);
