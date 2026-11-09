import type { AppState, Post, User } from '../types';

const now = Date.now();
const ago = (minutes: number) => new Date(now - minutes * 60_000).toISOString();

const users: User[] = [
  {
    id: 'u_me',
    name: 'Bernard Boateng',
    handle: 'bernard',
    bio: 'Building things on the internet. Coffee, code and creativity.',
    location: 'Accra, Ghana',
    website: 'github.com/boatengbernard',
    joined: '2021-03-01T00:00:00.000Z',
    avatarColor: '#1d9bf0',
    bannerColor: '#0f4c75',
    following: ['u_ama', 'u_dev', 'u_nasa'],
  },
  {
    id: 'u_ama',
    name: 'Ama Mensah',
    handle: 'amacodes',
    bio: 'Frontend engineer · design systems · speaker',
    location: 'Kumasi',
    joined: '2019-07-12T00:00:00.000Z',
    avatarColor: '#f91880',
    bannerColor: '#5c1a3a',
    verified: true,
    following: ['u_me', 'u_dev'],
  },
  {
    id: 'u_dev',
    name: 'Dev Weekly',
    handle: 'devweekly',
    bio: 'The best of web development, every week.',
    website: 'devweekly.example',
    joined: '2018-01-20T00:00:00.000Z',
    avatarColor: '#00ba7c',
    bannerColor: '#0b3d2e',
    verified: true,
    following: [],
  },
  {
    id: 'u_nasa',
    name: 'Space Facts',
    handle: 'spacefacts',
    bio: 'Daily facts about our universe 🚀',
    joined: '2017-05-05T00:00:00.000Z',
    avatarColor: '#7856ff',
    bannerColor: '#1e1450',
    following: [],
  },
  {
    id: 'u_kofi',
    name: 'Kofi Asante',
    handle: 'kofi_a',
    bio: 'Product designer. Football on weekends ⚽',
    location: 'London',
    joined: '2022-09-14T00:00:00.000Z',
    avatarColor: '#ff7a00',
    bannerColor: '#4a2600',
    following: ['u_ama'],
  },
  {
    id: 'u_lena',
    name: 'Lena Ortiz',
    handle: 'lenabuilds',
    bio: 'Indie hacker shipping small apps. Currently: #buildinpublic',
    joined: '2020-11-02T00:00:00.000Z',
    avatarColor: '#ffd400',
    bannerColor: '#4d4000',
    following: ['u_dev'],
  },
];

const posts: Post[] = [
  { id: 'p1', authorId: 'u_ama', text: 'Hot take: most UI bugs are really state bugs wearing a CSS costume. #frontend #react', createdAt: ago(12), likes: ['u_dev', 'u_kofi', 'u_lena'], reposts: ['u_kofi'], views: 1840 },
  { id: 'p2', authorId: 'u_dev', text: 'This week in web dev:\n\n• Vite keeps getting faster\n• CSS nesting is everywhere now\n• View transitions are 🔥\n\nFull issue → devweekly.example #webdev', createdAt: ago(45), likes: ['u_ama', 'u_me'], reposts: ['u_ama', 'u_lena'], views: 9200 },
  { id: 'p3', authorId: 'u_nasa', text: 'A day on Venus is longer than a year on Venus. It takes 243 Earth days to rotate once, but only 225 to orbit the Sun. 🪐 #space', createdAt: ago(90), likes: ['u_me', 'u_kofi', 'u_ama', 'u_lena'], reposts: ['u_me'], views: 25300 },
  { id: 'p4', authorId: 'u_lena', text: 'Day 37 of #buildinpublic: hit 100 users on my habit tracker. Didn’t spend a cent on ads. Just kept talking to people.', createdAt: ago(180), likes: ['u_ama'], reposts: [], views: 640 },
  { id: 'p5', authorId: 'u_kofi', text: 'Designers: please stop putting light grey text on white backgrounds. Your users’ eyes thank you. #design #a11y', createdAt: ago(300), likes: ['u_ama', 'u_lena', 'u_me'], reposts: ['u_ama'], views: 3100 },
  { id: 'p6', authorId: 'u_me', text: 'Started building my own X clone today. React + TypeScript. Let’s see how far I get 👀 #buildinpublic', createdAt: ago(420), likes: ['u_ama', 'u_lena'], reposts: [], views: 410 },
  { id: 'p7', authorId: 'u_ama', text: '@bernard nice! Ping me if you want a design review 🙌', createdAt: ago(400), replyToId: 'p6', likes: ['u_me'], reposts: [], views: 120 },
  { id: 'p8', authorId: 'u_lena', text: '@bernard following along! Ship early, ship often.', createdAt: ago(390), replyToId: 'p6', likes: [], reposts: [], views: 90 },
  { id: 'p9', authorId: 'u_dev', text: 'TypeScript tip: use `satisfies` to check a value against a type without widening it. #typescript', createdAt: ago(720), likes: ['u_me', 'u_kofi'], reposts: ['u_me'], views: 5400 },
  { id: 'p10', authorId: 'u_nasa', text: 'Neutron stars are so dense that a teaspoon of one would weigh about 6 billion tons. #space', createdAt: ago(1500), likes: ['u_lena'], reposts: [], views: 18000 },
  { id: 'p11', authorId: 'u_kofi', text: 'What a match last night ⚽ Still can’t believe that last-minute goal.', createdAt: ago(2000), likes: [], reposts: [], views: 260 },
];

export function createSeedState(): AppState {
  return {
    currentUserId: 'u_me',
    users: Object.fromEntries(users.map((u) => [u.id, u])),
    posts: Object.fromEntries(posts.map((p) => [p.id, p])),
    bookmarks: ['p3'],
    notifications: [
      { id: 'n1', kind: 'like', actorId: 'u_ama', postId: 'p6', createdAt: ago(410), read: false },
      { id: 'n2', kind: 'reply', actorId: 'u_ama', postId: 'p7', createdAt: ago(400), read: false },
      { id: 'n3', kind: 'reply', actorId: 'u_lena', postId: 'p8', createdAt: ago(390), read: false },
      { id: 'n4', kind: 'follow', actorId: 'u_ama', createdAt: ago(3000), read: true },
    ],
    theme: 'dark',
  };
}
