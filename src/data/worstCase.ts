import type { AppState, Post, User } from '../types';
import { createSeedState } from './seed';

/**
 * Dev-only fixtures for stress-testing the feed (break-ui). Loaded with ?data=worst|empty|one|huge
 * in development; never persisted. Every value is something a real member could produce, or the
 * limit the app accepts: names 50 chars (Auth.tsx), posts 500 (Composer.tsx), verses 60.
 */
export type Fixture = 'worst' | 'empty' | 'one' | 'huge';
export const FIXTURES: Fixture[] = ['worst', 'empty', 'one', 'huge'];

const now = Date.now();
const ago = (minutes: number) => new Date(now - minutes * 60_000).toISOString();
const ids = (n: number, prefix = 'x') => Array.from({ length: n }, (_, i) => `${prefix}${i}`);

const u = (o: Partial<User> & Pick<User, 'id' | 'name' | 'handle' | 'tradition'>): User => ({
  bio: '',
  joined: '2026-01-10T00:00:00.000Z',
  avatarColor: '#3f5b7a',
  bannerColor: '#1f2a3c',
  following: [],
  ...o,
});
const p = (o: Partial<Post> & Pick<Post, 'id' | 'authorId' | 'text' | 'createdAt'>): Post => ({ kind: 'post', amens: [], praying: [], reposts: [], ...o });

const users: User[] = [
  // The signed-in member: long, hyphenated, diacritics.
  u({ id: 'w_me', name: 'Aleksandra Wiśniewska-Kowalczyk', handle: 'aleksandra_wk', tradition: 'Catholic', avatarColor: '#8e3b46', following: ['w_long', 'w_fox', 'w_jo', 'w_viet', 'w_rtl', 'w_cjk'] }),
  // 50 characters, the sign-up maximum, with a suffix; the longest tradition.
  u({ id: 'w_long', name: 'Christopher Alexander Montgomery-Fitzwilliam III', handle: 'cmontgomeryfitz', tradition: 'Non-denominational', avatarColor: '#2f6f5e' }),
  u({ id: 'w_fox', name: '🦊 Fox', handle: 'foxreads', tradition: 'Seeker', avatarColor: '#b5603b' }),
  u({ id: 'w_jo', name: 'Jo', handle: 'jo', tradition: 'Guest', avatarColor: '#6b7280' }),
  u({ id: 'w_viet', name: 'Đặng Thị Ngọc Hân', handle: 'ngochan', tradition: 'Pentecostal', avatarColor: '#5a4a8a' }),
  u({ id: 'w_rtl', name: 'نور الهدى عبد الرحمن', handle: 'noor', tradition: 'Orthodox', avatarColor: '#a67c2e' }),
  u({ id: 'w_cjk', name: '王秀英', handle: 'xiuying', tradition: 'Evangelical', avatarColor: '#4b6b8a' }),
];

const LONG_TEXT =
  'Read the whole of 1 Corinthians 13 aloud this morning before anyone else was up. "Love suffereth long, and is kind; love envieth not; love vaunteth not itself, is not puffed up." I kept stopping at "is not easily provoked" because I am, very easily, before coffee. Writing it here so you can ask me in a week. Notes from our study are at https://example.com/groups/st-hedwig-young-adults/studies/1-corinthians/chapter-13/notes?week=4&leader=aleksandra if anyone wants them.';

function worstPosts(): Post[] {
  return [
    // Longest name + longest tradition + 60-char verse + 500-char text + a long URL + four-digit counts.
    p({ id: 'w1', authorId: 'w_long', kind: 'devotion', verse: '1 Corinthians 13:4-8; Romans 12:9-21; Colossians 3:12-14', text: LONG_TEXT.slice(0, 500), createdAt: ago(3), amens: ids(1284, 'a'), praying: ids(10_032, 'p') }),
    // Emoji-first name, an unbreakable email, a German compound.
    p({ id: 'w2', authorId: 'w_fox', kind: 'question', text: 'Who do I write to about the Glaubensbekenntnisauslegungsgruppe? The only contact I have is bartholomew.fitzgerald@northwind-industries-holdings.example.com', createdAt: ago(9), amens: ['w_jo'] }),
    // Two-letter name, a three-year-old prayer request, nothing reacted.
    p({ id: 'w3', authorId: 'w_jo', kind: 'prayer', text: 'pray', createdAt: new Date(now - 3 * 365 * 86_400_000).toISOString() }),
    // Stacked diacritics, blank lines, markup that must stay literal.
    p({ id: 'w4', authorId: 'w_viet', text: 'Cảm ơn Chúa vì hôm nay.\n\n\n\nThank you, Lord, for today. <b>not bold</b> &amp; **not bold either**', createdAt: ago(40), amens: ['w_me'], reposts: ['w_long'] }),
    // Right-to-left name and text.
    p({ id: 'w5', authorId: 'w_rtl', text: 'الرب راعيّ فلا يعوزني شيء. Psalm 23 in Arabic this morning.', createdAt: ago(75), amens: ids(1, 'b') }),
    // CJK name; a reply that disagrees, replying to the longest name.
    p({ id: 'w6', authorId: 'w_cjk', replyToId: 'w1', stance: 'differ', text: '我觉得第七节最难。', createdAt: ago(2), amens: ids(99, 'c') }),
    p({ id: 'w7', authorId: 'w_viet', replyToId: 'w1', stance: 'nuance', text: 'Câu 7 với tôi.', createdAt: ago(1) }),
    p({ id: 'w8', authorId: 'w_rtl', replyToId: 'w1', stance: 'question', text: 'Which translation?', createdAt: ago(1) }),
  ];
}

export function createFixtureState(fixture: Fixture): AppState {
  const base = createSeedState();
  const shell = { ...base, currentUserId: 'w_me', notifications: [], bookmarks: {}, reports: [], circles: [], memberships: [], circleMessages: [] };
  const byId = <T extends { id: string }>(xs: T[]) => Object.fromEntries(xs.map((x) => [x.id, x]));

  if (fixture === 'empty') return { ...shell, users: byId(users.slice(0, 1)), posts: {} };
  if (fixture === 'one') {
    const one = [p({ id: 'o1', authorId: 'w_jo', kind: 'prayer', text: 'One amen, one prayer, one reply.', createdAt: ago(1), amens: ['w_me'], praying: ['w_viet'] }), p({ id: 'o1r', authorId: 'w_viet', replyToId: 'o1', text: 'Praying.', createdAt: ago(0) })];
    return { ...shell, users: byId(users), posts: byId(one) };
  }
  if (fixture === 'huge') {
    const many = Array.from({ length: 1000 }, (_, i) => p({ id: `h${i}`, authorId: users[1 + (i % 6)].id, kind: (['post', 'devotion', 'question', 'prayer'] as const)[i % 4], verse: i % 4 === 1 ? 'John 3:16' : undefined, text: `Post ${i + 1} of 1,000. ${LONG_TEXT.slice(0, 80 + (i % 5) * 60)}`, createdAt: ago(i * 7), amens: ids(i % 13, `h${i}a`) }));
    return { ...shell, users: byId(users), posts: byId(many) };
  }
  return { ...shell, users: byId(users), posts: byId(worstPosts()) };
}
