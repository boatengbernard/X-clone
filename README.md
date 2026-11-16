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
- **Reading Circles.** Small groups of 6–8 people reading the same short Bible plan every day. See [Reading Circles](#reading-circles) below.
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

## Reading Circles

For believers who keep starting reading plans and quitting. Open **Circles** in the sidebar (or the bottom bar on phones). The design storyboard is in [`storyboard/reading-circles.html`](storyboard/reading-circles.html).

1. **A gentle invitation.** If you aren't in a circle, a Reading Circles card appears under the first Home post about struggling to read the Bible. The right rail also links to Circles.
2. **Pick a short plan.** Gospel of John (21 days), Psalms for hard days (30), One verse a day (14) or Romans (16).
3. **Set a rhythm.** Choose a quiet moment and a reminder time, and decide whether your circle should notice if you go quiet.
4. **Get matched.** You join the fullest open circle on your plan that started in the last week, or start a new one. Each circle has a guide.
5. **Read.** One passage (King James Version, loaded from bible-api.com with a BibleGateway link if it fails), one question, and an "I've read it" button.
6. **Share one line (optional),** or just mark it read. Members can tap 🙏 to pray for each post. Circle posts never appear on the public feed.
7. **Miss days without losing progress.** 2 grace days each week (Monday to Sunday). Progress never resets.
8. **Finish.** See a summary, start another plan under the same circle name, and offer to guide a new circle.

Care and safety: if someone writes about self-harm or suicide they see crisis helplines straight away and their guide is alerted. Members who chose "Notice if I miss 2 days" show up on the guide's screen after 2 quiet days. If the guide leaves, the role passes to someone who has finished a plan, or else the longest-standing member.

A sample circle, **Morning Light**, is seeded with the sample members and guided by Kofi. The demo account isn't in it, so you can try the join flow. Data saved before Reading Circles existed is upgraded with the sample circle on load.

Code: rules in `src/circles/` (`progress.ts`, `matching.ts`, `safety.ts`, `plans.ts`), store actions in `src/circles/reducer.ts`, screens in `src/pages/Circles.tsx` and `src/pages/circles/`. Tests are in `tests/`.

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
npm test         # Reading Circles rules and store actions
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
