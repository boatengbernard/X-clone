/** Draws a shareable Scripture card (1080×1350, the portrait size WhatsApp and Instagram show in full). */
export interface VerseCardInput {
  reference?: string;
  verseText?: string;
  reflection: string;
  authorName: string;
  handle: string;
}

const W = 1080;
const H = 1350;
const PAD = 96;
const INK = '#1f2a3c';
const MUTED = '#5d6677';
const GOLD = '#a67c2e';
const PAPER = '#fbf6ea';
const RULE = '#e3d8bf';
const SERIF = "'Newsreader', Georgia, 'Times New Roman', serif";
const SANS = "'IBM Plex Sans', system-ui, -apple-system, 'Segoe UI', sans-serif";

/** Splits text into lines that fit maxWidth, ending with "…" if it runs past maxLines. */
export function wrapLines(measure: (s: string) => number, text: string, maxWidth: number, maxLines: number): string[] {
  const words = text.replace(/\s+/g, ' ').trim().split(' ').filter(Boolean);
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (measure(next) <= maxWidth || !line) line = next;
    else {
      lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  if (lines.length <= maxLines) return lines;
  const kept = lines.slice(0, maxLines);
  let last = kept[maxLines - 1];
  while (last && measure(`${last}…`) > maxWidth) last = last.slice(0, -1);
  kept[maxLines - 1] = `${last.trimEnd()}…`;
  return kept;
}

export async function drawVerseCard(input: VerseCardInput): Promise<Blob> {
  try {
    await Promise.all([document.fonts.load(`italic 56px ${SERIF}`), document.fonts.load(`500 30px ${SANS}`)]);
  } catch {
    /* fall back to system fonts */
  }
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas unavailable');

  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = RULE;
  ctx.lineWidth = 4;
  ctx.strokeRect(40, 40, W - 80, H - 80);

  // Ribbon marker hanging from the top edge.
  ctx.fillStyle = GOLD;
  ctx.beginPath();
  ctx.moveTo(W - 200, 40);
  ctx.lineTo(W - 152, 40);
  ctx.lineTo(W - 152, 170);
  ctx.lineTo(W - 176, 146);
  ctx.lineTo(W - 200, 170);
  ctx.closePath();
  ctx.fill();

  const maxW = W - PAD * 2;
  const measureWith = (font: string) => (t: string) => {
    ctx.font = font;
    return ctx.measureText(t).width;
  };

  // Lay the text out first, then centre the whole block between the top edge and the footer.
  type Block = { font: string; color: string; lines: string[]; lineH: number; after: number };
  const blocks: Block[] = [];
  if (input.reference) {
    const font = `600 30px ${SANS}`;
    blocks.push({ font, color: GOLD, lines: [input.reference.toUpperCase()], lineH: 30, after: 50 });
  }
  if (input.verseText) {
    const size = input.verseText.length > 260 ? 46 : 56;
    const font = `italic ${size}px ${SERIF}`;
    blocks.push({ font, color: INK, lines: wrapLines(measureWith(font), `“${input.verseText}”`, maxW, 9), lineH: size * 1.3, after: 36 });
  }
  const rSize = input.verseText ? 34 : 54;
  const rFont = input.verseText ? `400 ${rSize}px ${SANS}` : `${rSize}px ${SERIF}`;
  const firstName = input.authorName.split(' ')[0];
  const reflection = input.verseText ? `${firstName}: “${input.reflection}”` : input.reflection;
  const used = blocks.reduce((h, bl) => h + bl.lines.length * bl.lineH + bl.after, 0);
  const top = 150;
  const bottom = H - 230;
  const room = Math.max(2, Math.floor((bottom - top - used) / (rSize * 1.4)));
  blocks.push({ font: rFont, color: input.verseText ? MUTED : INK, lines: wrapLines(measureWith(rFont), reflection, maxW, room), lineH: rSize * 1.4, after: 0 });

  const total = blocks.reduce((h, bl) => h + bl.lines.length * bl.lineH + bl.after, 0);
  let y = top + Math.max(0, (bottom - top - total) / 2);
  ctx.textBaseline = 'top';
  for (const bl of blocks) {
    ctx.font = bl.font;
    ctx.fillStyle = bl.color;
    for (const l of bl.lines) {
      ctx.fillText(l, PAD, y);
      y += bl.lineH;
    }
    y += bl.after;
  }
  ctx.textBaseline = 'alphabetic';

  // Footer: Selah mark and the author.
  ctx.fillStyle = RULE;
  ctx.fillRect(PAD, H - 190, maxW, 3);
  ctx.fillStyle = GOLD;
  ctx.fillRect(PAD + 9, H - 150, 9, 52);
  ctx.fillRect(PAD, H - 135, 27, 9);
  ctx.font = `italic 48px ${SERIF}`;
  ctx.fillText('Selah', PAD + 46, H - 105);
  ctx.fillStyle = MUTED;
  ctx.font = `400 28px ${SANS}`;
  ctx.textAlign = 'right';
  ctx.fillText(`${input.authorName} · @${input.handle}`, W - PAD, H - 112);

  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('could not draw card'))), 'image/png'));
}
