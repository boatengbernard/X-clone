import type { AppState, Post, User } from '../types';

const now = Date.now();
const ago = (minutes: number) => new Date(now - minutes * 60_000).toISOString();

const base = { bio: '', following: [] as string[] };

/** Example members. These are sample accounts so the app is not empty on first open. */
const users: User[] = [
  { ...base, id: 'u_abena', name: 'Abena Owusu', handle: 'abena', tradition: 'Evangelical', bio: 'Demo account. Choir on Sundays, spreadsheets on Mondays.', location: 'Accra', joined: '2026-01-10T00:00:00.000Z', avatarColor: '#a67c2e', bannerColor: '#1f2a3c', following: ['u_maria', 'u_nikolai', 'u_grace'], demo: true },
  { ...base, id: 'u_maria', name: 'Maria Lopez', handle: 'marialopez', tradition: 'Catholic', bio: 'Catechist. Morning Mass, evening rosary, too much coffee.', location: 'Seville', joined: '2025-11-02T00:00:00.000Z', avatarColor: '#8e3b46', bannerColor: '#3d1a20', following: ['u_nikolai', 'u_sam'] },
  { ...base, id: 'u_nikolai', name: 'Nikolai Petrov', handle: 'nikolai', tradition: 'Orthodox', bio: 'Iconography student. Slow prayer, strong tea.', location: 'Sofia', joined: '2025-10-14T00:00:00.000Z', avatarColor: '#3f5b7a', bannerColor: '#162436', following: ['u_maria'] },
  { ...base, id: 'u_daniel', name: 'Daniel Cho', handle: 'daniel', tradition: 'Baptist', bio: 'Youth pastor. I share the sermons that helped me most this week.', location: 'Seoul', joined: '2025-12-01T00:00:00.000Z', avatarColor: '#2f6f5e', bannerColor: '#10302a', following: ['u_grace', 'u_kofi'] },
  { ...base, id: 'u_grace', name: 'Grace Okafor', handle: 'graceokafor', tradition: 'Pentecostal', bio: 'Worship leader in Lagos. Songs on mercy, always.', location: 'Lagos', joined: '2025-09-20T00:00:00.000Z', avatarColor: '#b5603b', bannerColor: '#4a2414', following: ['u_daniel', 'u_abena'] },
  { ...base, id: 'u_kofi', name: 'Kofi Mensah', handle: 'kofimensah', tradition: 'Reformed', bio: 'Elder, father of three, reader of old books.', location: 'Kumasi', joined: '2025-08-08T00:00:00.000Z', avatarColor: '#5a4a8a', bannerColor: '#211a3a', following: ['u_daniel'] },
  { ...base, id: 'u_sam', name: 'Sam Whitaker', handle: 'samw', tradition: 'Seeker', bio: 'Asking honest questions. Not sure yet, and that is fine.', location: 'Leeds', joined: '2026-02-11T00:00:00.000Z', avatarColor: '#6b7280', bannerColor: '#2a2f38', following: ['u_maria', 'u_daniel'] },
];

const p = (o: Partial<Post> & Pick<Post, 'id' | 'authorId' | 'text' | 'createdAt'>): Post => ({
  kind: 'post',
  amens: [],
  praying: [],
  reposts: [],
  ...o,
});

const posts: Post[] = [
  p({ id: 'q1', authorId: 'u_sam', kind: 'question', text: 'Is baptism something God does to us, or something we do for God?', createdAt: ago(55), amens: ['u_maria', 'u_kofi'] }),
  p({ id: 'q1r1', authorId: 'u_maria', replyToId: 'q1', stance: 'nuance', text: 'Baptism is God’s action. It is a sacrament, and grace is truly given through the water and the Word.', createdAt: ago(50), amens: ['u_nikolai'] }),
  p({ id: 'q1r2', authorId: 'u_nikolai', replyToId: 'q1', stance: 'agree', text: 'Both. God acts, and we respond in a life of repentance. Many of us were baptized as infants and grow into it.', createdAt: ago(46), amens: ['u_maria', 'u_sam'] }),
  p({ id: 'q1r3', authorId: 'u_daniel', replyToId: 'q1', stance: 'differ', text: 'I would gently differ. In Acts, belief comes first and baptism follows as the believer’s public answer.', createdAt: ago(41), amens: ['u_grace'] }),
  p({ id: 'q1r4', authorId: 'u_grace', replyToId: 'q1', stance: 'question', text: 'For me it was both an obedience and a moment God met me. Could the two be held together?', createdAt: ago(37), amens: ['u_sam', 'u_daniel'] }),
  p({ id: 'q1r5', authorId: 'u_kofi', replyToId: 'q1', stance: 'nuance', text: 'A sign and seal of God’s promise. We baptize households, trusting him to keep what he pledged.', createdAt: ago(30) }),
  p({ id: 'q1r6', authorId: 'u_sam', replyToId: 'q1', stance: 'agree', text: 'Thank you all. This is the first time I have seen believers disagree without a fight.', createdAt: ago(22), amens: ['u_maria', 'u_nikolai', 'u_daniel', 'u_grace', 'u_kofi'] }),

  p({ id: 'd1', authorId: 'u_nikolai', kind: 'devotion', verse: 'Psalm 141:2', text: 'Let my prayer be set before you as incense. Lighting a candle before Vespers tonight and asking for a quieter heart.', createdAt: ago(95), amens: ['u_maria', 'u_abena'], praying: ['u_grace'] }),
  p({ id: 'd2', authorId: 'u_abena', kind: 'devotion', verse: 'Isaiah 41:10', text: 'Fear has been loud this week. Reading this slowly and letting it be quieter than the noise.', createdAt: ago(240), amens: ['u_maria', 'u_grace', 'u_kofi'], praying: ['u_nikolai'] }),
  p({ id: 'p1', authorId: 'u_grace', text: 'Sunday’s worship set, three songs on mercy. Which hymn on mercy do you return to most?', createdAt: ago(130), amens: ['u_abena', 'u_daniel'] }),
  p({ id: 'p1r1', authorId: 'u_maria', replyToId: 'p1', text: '“There’s a wideness in God’s mercy.” Every time.', createdAt: ago(120), amens: ['u_grace'] }),
  p({ id: 'p2', authorId: 'u_daniel', text: 'Forty minutes on the prodigal son. The part about the older brother stayed with me all week. Search “prodigal son older brother sermon” on YouTube if you want to go deeper: https://www.youtube.com/results?search_query=prodigal+son+older+brother+sermon', createdAt: ago(300), amens: ['u_kofi', 'u_sam'], reposts: ['u_grace'] }),
  p({ id: 'pr1', authorId: 'u_kofi', kind: 'prayer', text: 'Please pray for my mother, who has surgery on Thursday morning. Thank you, friends.', createdAt: ago(400), amens: ['u_daniel'], praying: ['u_abena', 'u_grace', 'u_maria', 'u_daniel', 'u_nikolai'] }),
  p({ id: 'd3', authorId: 'u_maria', kind: 'devotion', verse: 'Lamentations 3:22-23', text: 'His mercies are new every morning. I needed the word “new” today.', createdAt: ago(720), amens: ['u_nikolai', 'u_sam'] }),
  p({ id: 'q2', authorId: 'u_abena', kind: 'question', text: 'How do you keep a habit of prayer when work gets busy? Looking for practical ideas.', createdAt: ago(1500), amens: ['u_grace'] }),
  p({ id: 'q2r1', authorId: 'u_nikolai', replyToId: 'q2', stance: 'nuance', text: 'The Jesus Prayer. Short enough to pray on the bus, deep enough for a lifetime.', createdAt: ago(1450), amens: ['u_abena'] }),
  p({ id: 'q2r2', authorId: 'u_kofi', replyToId: 'q2', stance: 'agree', text: 'Fixed times. Morning and evening, five minutes each, before the phone comes out.', createdAt: ago(1400), amens: ['u_abena'] }),
];

export function createSeedState(): AppState {
  return {
    version: 1,
    currentUserId: null,
    users: Object.fromEntries(users.map((u) => [u.id, u])),
    posts: Object.fromEntries(posts.map((x) => [x.id, x])),
    bookmarks: { u_abena: ['pr1'] },
    notifications: [
      { id: 'n1', kind: 'amen', actorId: 'u_maria', targetUserId: 'u_abena', postId: 'd2', createdAt: ago(230) },
      { id: 'n2', kind: 'praying', actorId: 'u_nikolai', targetUserId: 'u_abena', postId: 'd2', createdAt: ago(200) },
      { id: 'n3', kind: 'follow', actorId: 'u_grace', targetUserId: 'u_abena', createdAt: ago(900) },
      { id: 'n4', kind: 'reply', actorId: 'u_nikolai', targetUserId: 'u_abena', postId: 'q2r1', createdAt: ago(1450) },
      { id: 'n5', kind: 'reply', actorId: 'u_kofi', targetUserId: 'u_abena', postId: 'q2r2', createdAt: ago(1400) },
    ],
    lastSeenNotifications: {},
    reports: [],
    theme: 'system',
  };
}

export const VERSE_SUGGESTIONS = [
  'Psalm 23:1-3',
  'John 3:16',
  'Philippians 4:6-7',
  'Romans 8:28',
  'Proverbs 3:5-6',
  'Isaiah 41:10',
  'Matthew 11:28-30',
  'Lamentations 3:22-23',
];
