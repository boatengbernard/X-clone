export interface Verse {
  chapter: number;
  verse: number;
  text: string;
}

const cacheKey = (ref: string) => `selah.passage.${ref}`;

/** Loads King James Version text (public domain) from bible-api.com, caching it on this device. */
export async function loadPassage(ref: string): Promise<Verse[]> {
  try {
    const hit = localStorage.getItem(cacheKey(ref));
    if (hit) return JSON.parse(hit);
  } catch {
    /* no cache available */
  }
  const res = await fetch(`https://bible-api.com/${encodeURIComponent(ref.toLowerCase())}?translation=kjv`);
  if (!res.ok) throw new Error('passage unavailable');
  const data = await res.json();
  const verses: Verse[] = (data.verses ?? []).map((v: Verse) => ({ chapter: v.chapter, verse: v.verse, text: String(v.text).replace(/\s+/g, ' ').trim() }));
  if (!verses.length) throw new Error('passage unavailable');
  try {
    localStorage.setItem(cacheKey(ref), JSON.stringify(verses));
  } catch {
    /* fine without a cache */
  }
  return verses;
}
