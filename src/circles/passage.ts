export interface Verse {
  chapter: number;
  verse: number;
  text: string;
}

const cacheKey = (ref: string, translation: string) => `selah.passage.${translation}.${ref}`;

/** Loads public-domain Bible text from bible-api.com (King James Version unless another is chosen), caching it on this device. */
export async function loadPassage(ref: string, translation = 'kjv'): Promise<Verse[]> {
  try {
    const hit = localStorage.getItem(cacheKey(ref, translation));
    if (hit) return JSON.parse(hit);
  } catch {
    /* no cache available */
  }
  const res = await fetch(`https://bible-api.com/${encodeURIComponent(ref.toLowerCase())}?translation=${encodeURIComponent(translation)}`);
  if (!res.ok) throw new Error('passage unavailable');
  const data = await res.json();
  const verses: Verse[] = (data.verses ?? []).map((v: Verse) => ({ chapter: v.chapter, verse: v.verse, text: String(v.text).replace(/\s+/g, ' ').trim() }));
  if (!verses.length) throw new Error('passage unavailable');
  try {
    localStorage.setItem(cacheKey(ref, translation), JSON.stringify(verses));
  } catch {
    /* fine without a cache */
  }
  return verses;
}
