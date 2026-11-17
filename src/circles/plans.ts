import { gatewayLink } from '../bible';
export interface PlanDay {
  /** What the reader sees, e.g. "John 3". */
  ref: string;
  question: string;
}

export interface Plan {
  id: string;
  title: string;
  blurb: string;
  minutes: string;
  tag?: string;
  days: PlanDay[];
}

const rotate = (refs: string[], questions: string[]): PlanDay[] =>
  refs.map((ref, i) => ({ ref, question: questions[i % questions.length] }));

const JOHN_QUESTIONS = [
  'Where do you need light to reach today?',
  'Jesus turned water into wine at a wedding. What ordinary part of your day could He meet you in?',
  'Nicodemus came at night with his questions. What question would you bring to Jesus?',
  'The woman at the well was known fully and not turned away. What would you want Jesus to know about you?',
  'The man by the pool waited 38 years. What have you been waiting on for a long time?',
  'Jesus calls Himself the bread of life. What are you hungry for right now?',
  'People argued about who Jesus was. Who do you say He is today?',
  '"Neither do I condemn thee." Where do you need to hear that?',
  'The blind man said, "One thing I know." What is one thing you know about God?',
  'The good shepherd knows His sheep by name. How does it feel to be known like that?',
  'Jesus wept, even though He was about to raise Lazarus. What grief can you bring to Him?',
  'Mary poured out something costly. What could you offer God this week?',
  'Jesus washed His friends\' feet. Who could you serve in a small way today?',
  '"Let not your heart be troubled." What is troubling your heart?',
  '"Abide in me." What helps you stay close to God, and what pulls you away?',
  'Jesus promised the Helper. Where do you need help today?',
  'Jesus prayed for you in this chapter. Which line of His prayer stands out?',
  'Peter denied Jesus three times. Have you ever felt you let God down?',
  '"It is finished." What do you keep trying to finish that Jesus already has?',
  'Mary recognised Jesus when He said her name. When have you sensed God near?',
  'Jesus restored Peter over breakfast. What would a fresh start look like for you?',
];

const PSALM_QUESTIONS = [
  'Which line could you pray as your own today?',
  'What is this psalm honest about that you find hard to say?',
  'Where does the writer turn from struggle to trust?',
  'What does this psalm say God is like?',
  'Who could you pray this psalm for today?',
  'What would change if you believed one verse here fully?',
  'What is one thing you can thank God for right now?',
];

const PSALMS = [23, 13, 46, 34, 42, 27, 121, 91, 139, 62, 40, 31, 32, 51, 103, 16, 25, 37, 63, 73, 77, 86, 116, 130, 142, 145, 18, 30, 4, 147];

const VERSES = [
  'Lamentations 3:22-23', 'Matthew 11:28-30', 'Isaiah 41:10', 'Psalm 34:18', 'Philippians 4:6-7', '2 Corinthians 12:9',
  'Romans 8:1', 'Romans 8:28', 'John 14:27', 'Isaiah 40:31', 'Proverbs 3:5-6', 'Psalm 46:1', '1 Peter 5:7', 'Philippians 1:6',
];

const VERSE_QUESTIONS = [
  'Read it slowly twice. Which word stays with you?',
  'What does this verse promise?',
  'How could you carry this verse into the rest of today?',
  'What would it look like to trust this today?',
];

const ROMANS_QUESTIONS = [
  'What does this chapter say about grace?',
  'Which verse would you underline, and why?',
  'What does this chapter say about who you are in Christ?',
  'Is there something here that is hard to accept? Bring it to God honestly.',
  'How could this chapter change how you treat someone this week?',
];

export const PLANS: Plan[] = [
  {
    id: 'john-21',
    title: 'Gospel of John',
    blurb: 'Meet Jesus one chapter at a time.',
    minutes: 'about 5 min a day',
    tag: 'Most joined',
    days: JOHN_QUESTIONS.map((question, i) => ({ ref: `John ${i + 1}`, question })),
  },
  {
    id: 'psalms-30',
    title: 'Psalms for hard days',
    blurb: 'Honest prayers for when faith feels heavy.',
    minutes: 'about 3 min a day',
    days: rotate(PSALMS.map((n) => `Psalm ${n}`), PSALM_QUESTIONS),
  },
  {
    id: 'verse-14',
    title: 'One verse a day',
    blurb: 'The gentlest way to start again.',
    minutes: 'under 1 min a day',
    tag: 'Gentlest',
    days: rotate(VERSES, VERSE_QUESTIONS),
  },
  {
    id: 'romans-16',
    title: 'Romans',
    blurb: 'Grace, struggle and hope, chapter by chapter.',
    minutes: 'about 8 min a day',
    days: rotate(Array.from({ length: 16 }, (_, i) => `Romans ${i + 1}`), ROMANS_QUESTIONS),
  },
];

export const planById = (id: string) => PLANS.find((p) => p.id === id);

/** A link to read the passage elsewhere when the text cannot be loaded. */
export const passageLink = (ref: string, translation?: string) => gatewayLink(ref, translation);
