/** Public-domain and freely licensed translations served by bible-api.com. */
export interface Bible {
  id: string;
  abbr: string;
  name: string;
  language: string;
  /** BibleGateway's code for the same translation, when it has one. */
  gateway?: string;
}

export const DEFAULT_BIBLE = 'kjv';

export const BIBLES: Bible[] = [
  { id: 'kjv', abbr: 'KJV', name: 'King James Version', language: 'English', gateway: 'KJV' },
  { id: 'web', abbr: 'WEB', name: 'World English Bible', language: 'English', gateway: 'WEB' },
  { id: 'bsb', abbr: 'BSB', name: 'Berean Standard Bible', language: 'English' },
  { id: 'asv', abbr: 'ASV', name: 'American Standard Version (1901)', language: 'English', gateway: 'ASV' },
  { id: 'bbe', abbr: 'BBE', name: 'Bible in Basic English', language: 'English' },
  { id: 'dra', abbr: 'DRA', name: 'Douay-Rheims 1899 (Catholic)', language: 'English', gateway: 'DRA' },
  { id: 'darby', abbr: 'DARBY', name: 'Darby Bible', language: 'English', gateway: 'DARBY' },
  { id: 'oeb-us', abbr: 'OEB', name: 'Open English Bible, US Edition', language: 'English' },
  { id: 'oeb-cw', abbr: 'OEB-CW', name: 'Open English Bible, Commonwealth Edition', language: 'English' },
  { id: 'webbe', abbr: 'WEBBE', name: 'World English Bible, British Edition', language: 'English' },
  { id: 'cuv-simp', abbr: 'CUV', name: 'Chinese Union Version (Simplified)', language: 'Chinese' },
  { id: 'cuv', abbr: 'CUV-T', name: 'Chinese Union Version (Traditional)', language: 'Chinese' },
  { id: 'bkr', abbr: 'BKR', name: 'Bible kralická', language: 'Czech' },
  { id: 'danish', abbr: 'DA', name: 'Danish Bible (1931/1907)', language: 'Danish' },
  { id: 'statenvertaling', abbr: 'SV', name: 'Statenvertaling (1637)', language: 'Dutch' },
  { id: 'biblia', abbr: 'FI', name: 'Finnish Bible', language: 'Finnish' },
  { id: 'luther1912', abbr: 'LUT', name: 'Luther Bible 1912', language: 'German' },
  { id: 'karoli', abbr: 'KAR', name: 'Károli Bible', language: 'Hungarian' },
  { id: 'riveduta', abbr: 'RIV', name: 'Riveduta (Luzzi, 1924)', language: 'Italian' },
  { id: 'kougo', abbr: 'JA', name: 'Japanese Kougo (Colloquial)', language: 'Japanese' },
  { id: 'bungo', abbr: 'JA-B', name: 'Japanese Bungo (Classical)', language: 'Japanese' },
  { id: 'korean', abbr: 'KRV', name: 'Korean Revised Version', language: 'Korean' },
  { id: 'clementine', abbr: 'VUL', name: 'Clementine Latin Vulgate', language: 'Latin' },
  { id: 'norwegian', abbr: 'NO', name: 'Norwegian Bible', language: 'Norwegian' },
  { id: 'gdanska', abbr: 'PBG', name: 'Gdańsk Bible', language: 'Polish' },
  { id: 'rccv', abbr: 'RCCV', name: 'Romanian Corrected Cornilescu', language: 'Romanian' },
  { id: 'synodal', abbr: 'RUS', name: 'Russian Synodal Translation', language: 'Russian' },
  { id: 'rv1909', abbr: 'RV1909', name: 'Reina-Valera 1909', language: 'Spanish' },
  { id: 'bes', abbr: 'BES', name: 'La Biblia en Español Sencillo', language: 'Spanish' },
  { id: 'pddpt', abbr: 'PDDPT', name: 'Palabra de Dios para ti', language: 'Spanish' },
  { id: 'vbl', abbr: 'VBL', name: 'Versión Biblia Libre', language: 'Spanish' },
  { id: 'swahili', abbr: 'SW', name: 'Swahili Bible', language: 'Swahili' },
  { id: 'swedish', abbr: 'SV1917', name: 'Swedish Bible', language: 'Swedish' },
  { id: 'tagalog', abbr: 'TL', name: 'Ang Dating Biblia', language: 'Tagalog' },
  { id: 'cadman', abbr: 'VI', name: 'Cadman Bible (1934)', language: 'Vietnamese' },
];

export const bibleById = (id?: string): Bible => BIBLES.find((b) => b.id === id) ?? BIBLES[0];

/** Translations grouped by language, English first, for a picker. */
export const BIBLES_BY_LANGUAGE: [string, Bible[]][] = [...new Set(BIBLES.map((b) => b.language))].map((lang) => [lang, BIBLES.filter((b) => b.language === lang)]);

export const gatewayLink = (ref: string, id?: string) =>
  `https://www.biblegateway.com/passage/?search=${encodeURIComponent(ref)}&version=${bibleById(id).gateway ?? 'KJV'}`;
