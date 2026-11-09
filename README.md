# X-clone

A social feed app inspired by X/Twitter, built with **React 19 + TypeScript + Vite**. No backend: everything is stored in your browser's `localStorage`.

## Features

- **Home timeline** with *For you* and *Following* tabs
- **Compose posts** (280-character limit with a progress ring, `Ctrl/⌘ + Enter` to post)
- **Like, repost, reply, bookmark, copy link** and **delete** your own posts
- **Threaded post pages** that show the conversation above and replies below
- **Profiles** with Posts / Replies / Likes tabs, follow/unfollow, and an **Edit profile** dialog
- **Explore/search** across posts, people and `#hashtags`, with a trending sidebar
- **Notifications** for likes, reposts, replies and follows, with an unread badge
- **Clickable** `#hashtags`, `@mentions` and links
- **Light and dark themes**
- **Responsive layout:** full sidebar → icon rail → mobile bottom nav with a floating post button

## Getting started

```bash
npm install
npm run dev      # start the dev server at http://localhost:5173
npm run build    # type-check and build for production into dist/
npm run lint
```

To clear your data and restore the demo content, go to **Profile → Edit profile → Reset demo data**.

## Project structure

```
src/
  App.tsx            # route → page mapping
  router.ts          # tiny hash-based router (#/home, #/post/:id, #/:handle …)
  store.tsx          # app state (useReducer + Context), persisted to localStorage
  types.ts           # User, Post, Notification types
  utils.tsx          # time formatting, rich text (hashtags/mentions/links)
  data/seed.ts       # demo users and posts
  components/        # Layout, PostCard, Composer, Avatar, Modal, Icons …
  pages/             # Home, Explore, Notifications, Bookmarks, Profile, PostDetail
```

## Ideas for next steps

- Add a real backend (e.g. Supabase or Firebase) for accounts and shared data
- Image uploads in posts
- Quote posts and polls
- Direct messages
