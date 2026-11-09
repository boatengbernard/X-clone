# Selah

Selah is a calm social network for sharing Scripture, sermons and honest questions with believers from every tradition. There are no ads and no outrage ranking, and every post tells you why you are seeing it.

This repository holds the **Selah web app**, built with React 19, TypeScript and Vite. It grew out of an earlier X-style clone.

## What's in the app

- **Open sign-up.** Anyone can create an account with a name, username, email, password and the tradition they identify with (Catholic, Orthodox, Baptist, Pentecostal, Reformed, Seeker, Guest and more). Log in and log out work too.
- **Begin with a verse.** A new member's first post is a devotion: pick a passage and say how it is speaking to you.
- **Four feeds:**
  - **Gathered:** ranked by a formula anyone can read
  - **Perspectives:** conversations where several traditions are answering
  - **Following**
  - **Latest**
- **"Why you see this"** appears on every post in the feed.
- **Post types:** post, devotion (with a Bible passage), question, prayer request.
- **Reactions:** *Amen*, *Praying* (on devotions and prayer requests), repost, bookmark, copy link.
- **Disagree well.** Replies can be labelled *Agree*, *Adding nuance*, *Respectfully differ* or *Question*. On a conversation page you can filter replies by tradition to hear one voice at a time.
- **Sermons that load only when you tap play.** Paste a YouTube, Instagram, X, TikTok or Snapchat link. YouTube, Instagram and TikTok can play inside Selah after a tap. Every link also has an "Open on …" button.
- **Report** mocking, abuse, harassment or spam. A reported post is hidden for the person who reported it.
- **Explore:** search posts, passages and people, and filter by tradition. The sidebar shows the passages people are reading and suggests members from other traditions.
- **Profiles** with Posts, Devotions, Replies and Amens tabs, follow and unfollow, and profile editing.
- **Notifications** for amens, prayers, reposts, replies and follows.
- **Light and dark themes** that follow the system setting, with a manual override. Works on phones.

### How Gathered is ranked

```
score = recency × kind lift × conversation lift × follow lift

recency           = 1 / (1 + hours_old / 12)
kind lift         = devotion 1.5 · prayer 1.4 · question 1.2 · post 1.0
conversation lift = 1 + 0.25 × (number of traditions replying, max 4)
follow lift       = 1.2 if you follow the author, else 1.0
```

See `gatheredScore` and `whyYouSee` in `src/utils.tsx`.

## Important: this is a preview build

All accounts and posts are stored in the browser's `localStorage`, so each browser has its own copy of Selah. Before a public launch, the app needs:

1. **A backend** (for example Supabase or Firebase) for real accounts, password resets, shared posts and moderation.
2. **Hosting** (for example Vercel or Netlify).
3. **A moderation queue** for reports. Reports are stored today, but nobody reviews them yet.

The data layer lives in `src/store.tsx`, which keeps that swap contained.

## Getting started

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # type-check and build into dist/
npm run lint
```

To look around without signing up, choose **Log in → Look around with the demo account**. To restore the sample content, go to **Profile → Edit profile → Reset all data**.

## Project structure

```
src/
  App.tsx            routes (sign-up/log-in when signed out, the app when signed in)
  router.ts          small hash router (#/home, #/post/:id, #/:handle …)
  store.tsx          state, actions and localStorage persistence; password hashing
  types.ts           User, Post, traditions, stances
  utils.tsx          ranking, "why you see this", link and video detection
  data/seed.ts       sample members and conversations
  components/        Layout, PostCard, Composer, VideoCard, dialogs …
  pages/             Auth, Welcome, Home, Explore, PostDetail, Profile, Notifications, Bookmarks
```

## Landing page

`site/` holds the marketing page (`selah.html`) plus `terms.html` and `privacy.html`. The published copy lives on claude.ai, and its sign-up buttons point to the app preview. The Terms and Privacy pages are plain-language drafts: have them reviewed by a lawyer and add a contact address before launch.
