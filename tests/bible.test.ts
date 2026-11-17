import { afterEach, describe, expect, it, vi } from 'vitest';
import { BIBLES, BIBLES_BY_LANGUAGE, bibleById, gatewayLink } from '../src/bible.ts';
import { loadPassage } from '../src/circles/passage.ts';

describe('Bible translations', () => {
  it('falls back to the King James Version for unknown or unset choices', () => {
    expect(bibleById(undefined).id).toBe('kjv');
    expect(bibleById('nope').id).toBe('kjv');
    expect(bibleById('dra').abbr).toBe('DRA');
  });

  it('has unique ids and lists English first', () => {
    expect(new Set(BIBLES.map((b) => b.id)).size).toBe(BIBLES.length);
    expect(BIBLES_BY_LANGUAGE[0][0]).toBe('English');
  });

  it('links to BibleGateway in the same translation when it has it', () => {
    expect(gatewayLink('John 3:16', 'web')).toContain('version=WEB');
    expect(gatewayLink('John 3:16', 'swahili')).toContain('version=KJV');
  });
});

describe('loadPassage', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('asks for the chosen translation and caches each translation separately', async () => {
    const store = new Map<string, string>();
    vi.stubGlobal('localStorage', { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => store.set(k, v) });
    const fetchMock = vi.fn(async (url: string) => ({
      ok: true,
      json: async () => ({ verses: [{ chapter: 3, verse: 16, text: url.includes('rv1909') ? 'Porque de tal manera' : 'For God so loved' }] }),
    }));
    vi.stubGlobal('fetch', fetchMock);

    expect((await loadPassage('John 3:16', 'rv1909'))[0].text).toBe('Porque de tal manera');
    expect((await loadPassage('John 3:16'))[0].text).toBe('For God so loved');
    expect(fetchMock.mock.calls.map((c) => c[0])).toEqual([
      'https://bible-api.com/john%203%3A16?translation=rv1909',
      'https://bible-api.com/john%203%3A16?translation=kjv',
    ]);
    await loadPassage('John 3:16', 'rv1909');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
