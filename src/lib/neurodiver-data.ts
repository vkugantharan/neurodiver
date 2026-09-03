export type View = "home" | "sessions" | "checkin" | "deck" | "profile";
export type ThemePreference = "light" | "dark" | "system";
export type Quadrant =
  | "high-unpleasant"
  | "high-pleasant"
  | "low-unpleasant"
  | "low-pleasant";

export type Session = {
  id: string;
  title: string;
  startAt: Date;
  durationMinutes: number;
  host: string;
  focusStyle: string;
  capacity: number;
  spots: number;
  accent: "mint" | "blue" | "yellow" | "coral";
  meetUrl: string;
};
export type MoodEntry = { id: string; createdAt: string; quadrant: Quadrant };
export type DailyIntention = { date: string; text: string };
export type DeckGoal = "begin" | "focus" | "reset" | "unwind";
export type DeckStyle = "body" | "brain" | "soft";
export type SavedDeck = {
  id: string;
  createdAt: string;
  title: string;
  strategyIds: string[];
};
export type PrototypeState = {
  profile: { name: string; email: string } | null;
  rsvpIds: string[];
  moodHistory: MoodEntry[];
  completedStrategyIds: string[];
  dailyIntention: DailyIntention | null;
  savedDecks: SavedDeck[];
  theme: ThemePreference;
  reducedMotion: boolean;
};
export type Strategy = {
  id: string;
  title: string;
  description: string;
  minutes: number;
  category: string;
  tone: "mint" | "blue" | "yellow" | "coral";
  art?: "/art/blue-reset.png" | "/art/green-grounding.png";
  steps: string[];
};

export const STORAGE_KEY = "neurodiver.prototype.v1";
export const defaultState: PrototypeState = {
  profile: null,
  rsvpIds: [],
  moodHistory: [],
  completedStrategyIds: [],
  dailyIntention: null,
  savedDecks: [],
  theme: "light",
  reducedMotion: false,
};

const SESSION_TEMPLATES = [
  [0, 9, 30, "Soft Start Studio", 50, "Mina", "Quiet focus", 12, 5, "mint"],
  [
    1,
    14,
    0,
    "Get It Out of My Head",
    45,
    "Alex",
    "Planning + focus",
    10,
    3,
    "yellow",
  ],
  [
    2,
    19,
    30,
    "After-Hours Focus Club",
    60,
    "Jules",
    "Cameras optional",
    16,
    7,
    "blue",
  ],
  [
    3,
    10,
    0,
    "Tiny Tasks, Big Relief",
    30,
    "Nadia",
    "Gentle momentum",
    8,
    0,
    "coral",
  ],
  [4, 16, 30, "Quiet Company", 60, "Sam", "Mostly silent", 14, 9, "mint"],
  [5, 11, 0, "Weekend Reset Room", 50, "Iman", "Reset + focus", 12, 4, "blue"],
  [7, 9, 30, "Soft Start Studio", 50, "Mina", "Quiet focus", 12, 6, "mint"],
  [
    8,
    18,
    0,
    "Study Side by Side",
    60,
    "Jules",
    "Study-friendly",
    18,
    11,
    "yellow",
  ],
  [
    9,
    12,
    30,
    "Midday Momentum",
    30,
    "Nadia",
    "Gentle momentum",
    10,
    2,
    "coral",
  ],
  [11, 16, 30, "Quiet Company", 60, "Sam", "Mostly silent", 14, 8, "mint"],
  [
    13,
    20,
    0,
    "Sunday Night Set-Up",
    45,
    "Alex",
    "Planning + focus",
    12,
    6,
    "blue",
  ],
  [
    15,
    14,
    0,
    "Get It Out of My Head",
    45,
    "Alex",
    "Planning + focus",
    10,
    5,
    "yellow",
  ],
  [
    17,
    19,
    30,
    "After-Hours Focus Club",
    60,
    "Jules",
    "Cameras optional",
    16,
    10,
    "blue",
  ],
  [
    19,
    10,
    0,
    "Tiny Tasks, Big Relief",
    30,
    "Nadia",
    "Gentle momentum",
    8,
    3,
    "coral",
  ],
] as const;

export function makeSessions(today: Date): Session[] {
  const base = new Date(today);
  base.setHours(0, 0, 0, 0);
  return SESSION_TEMPLATES.map((item, index) => {
    const [
      dayOffset,
      hour,
      minute,
      title,
      durationMinutes,
      host,
      focusStyle,
      capacity,
      spots,
      accent,
    ] = item;
    const startAt = new Date(base);
    startAt.setDate(base.getDate() + dayOffset);
    startAt.setHours(hour, minute, 0, 0);
    return {
      id: `session-${index + 1}`,
      title,
      startAt,
      durationMinutes,
      host,
      focusStyle,
      capacity,
      spots,
      accent,
      meetUrl: "https://meet.google.com/",
    };
  });
}

export const quadrantInfo: Record<
  Quadrant,
  { label: string; prompt: string; color: string }
> = {
  "high-unpleasant": {
    label: "Sparks everywhere",
    prompt: "Fast, prickly, crowded",
    color: "coral",
  },
  "high-pleasant": {
    label: "Ready to roll",
    prompt: "Upbeat, curious, switched on",
    color: "yellow",
  },
  "low-unpleasant": {
    label: "Running on fumes",
    prompt: "Heavy, hazy, hard to start",
    color: "blue",
  },
  "low-pleasant": {
    label: "Quietly cruising",
    prompt: "Easy, grounded, unhurried",
    color: "mint",
  },
};

export const strategies: Strategy[] = [
  {
    id: "shake-static",
    title: "Shake Out the Static",
    description:
      "Give restless energy somewhere safe to go before choosing what comes next.",
    minutes: 2,
    category: "Move",
    tone: "coral",
    steps: [
      "Plant both feet and loosen your shoulders.",
      "Shake your hands for twenty seconds.",
      "Roll your shoulders slowly, then let your jaw soften.",
      "Notice one thing that feels even 1% quieter.",
    ],
  },
  {
    id: "one-line-dump",
    title: "One-Line Brain Dump",
    description:
      "Turn the loudest thought into one visible, workable sentence.",
    minutes: 3,
    category: "Unclutter",
    tone: "yellow",
    steps: [
      "Name the thought taking up the most space.",
      "Write it as one imperfect sentence.",
      "Circle the part you can influence today.",
      "Choose one action that takes under five minutes.",
    ],
  },
  {
    id: "slow-exhale",
    title: "Longer Exhale",
    description:
      "A low-pressure breathing rhythm to create a little more room.",
    minutes: 2,
    category: "Breathe",
    tone: "blue",
    art: "/art/blue-reset.png",
    steps: [
      "Let your breathing stay natural.",
      "Breathe in gently for a count of three.",
      "Breathe out softly for a count of five.",
      "Repeat without forcing depth or perfection.",
    ],
  },
  {
    id: "ride-the-spark",
    title: "Ride the Spark",
    description:
      "Use bright energy on one meaningful thing without opening five new tabs.",
    minutes: 3,
    category: "Focus",
    tone: "yellow",
    steps: [
      "Name the thing you are excited to do.",
      "Define what ‘enough for now’ looks like.",
      "Close or park unrelated tabs.",
      "Start a ten-minute focus window.",
    ],
  },
  {
    id: "share-the-win",
    title: "Save the Good Signal",
    description: "Capture what is working so future-you can find it again.",
    minutes: 2,
    category: "Notice",
    tone: "mint",
    steps: [
      "Name what feels good right now.",
      "Notice what helped create it.",
      "Write one sentence to future-you.",
      "Choose whether to continue or pause while it still feels good.",
    ],
  },
  {
    id: "tiny-restart",
    title: "The Tiny Restart",
    description:
      "Lower the starting line until the next step feels genuinely possible.",
    minutes: 3,
    category: "Restart",
    tone: "blue",
    steps: [
      "Pick one task you are carrying.",
      "Shrink it to an action under two minutes.",
      "Remove one obstacle from your space.",
      "Do only the tiny version, then reassess.",
    ],
  },
  {
    id: "sensory-soften",
    title: "Soften the Edges",
    description:
      "Reduce one source of friction instead of asking yourself for more effort.",
    minutes: 4,
    category: "Senses",
    tone: "blue",
    art: "/art/blue-reset.png",
    steps: [
      "Lower one light or screen brightness.",
      "Reduce one sound, texture, or notification.",
      "Take a sip of water if it is nearby.",
      "Choose a place for the next five quiet minutes.",
    ],
  },
  {
    id: "rest-without-solving",
    title: "Rest Without Solving",
    description:
      "Let a calm moment be useful without turning it into another assignment.",
    minutes: 5,
    category: "Ground",
    tone: "mint",
    art: "/art/green-grounding.png",
    steps: [
      "Let your body be supported by the chair or floor.",
      "Notice three steady shapes around you.",
      "Unclench one place you are holding tension.",
      "Stay here without planning the next thing.",
    ],
  },
  {
    id: "gentle-intention",
    title: "Choose a Gentle Intention",
    description: "Carry your settled energy into one kind, clear next choice.",
    minutes: 3,
    category: "Reflect",
    tone: "mint",
    steps: [
      "Ask what would feel supportive next.",
      "Choose one intention, not a full list.",
      "Make it specific and flexible.",
      "Give yourself permission to revise it later.",
    ],
  },
];

export const strategyMap: Record<Quadrant, string[]> = {
  "high-unpleasant": ["shake-static", "one-line-dump", "slow-exhale"],
  "high-pleasant": ["ride-the-spark", "share-the-win", "one-line-dump"],
  "low-unpleasant": ["tiny-restart", "sensory-soften", "slow-exhale"],
  "low-pleasant": ["rest-without-solving", "gentle-intention", "share-the-win"],
};

export const deckGoalInfo: Record<
  DeckGoal,
  { label: string; title: string; categories: string[] }
> = {
  begin: {
    label: "Help me begin",
    title: "A gentle start",
    categories: ["Restart", "Unclutter", "Focus"],
  },
  focus: {
    label: "Help me stay with it",
    title: "A steadier focus",
    categories: ["Focus", "Notice", "Unclutter"],
  },
  reset: {
    label: "Help me reset",
    title: "A nervous-system breather",
    categories: ["Breathe", "Move", "Senses"],
  },
  unwind: {
    label: "Help me come down",
    title: "A softer landing",
    categories: ["Ground", "Breathe", "Reflect"],
  },
};

export const deckStyleInfo: Record<
  DeckStyle,
  { label: string; hint: string; categories: string[] }
> = {
  body: {
    label: "Move with it",
    hint: "More physical and sensory",
    categories: ["Move", "Senses", "Breathe"],
  },
  brain: {
    label: "Untangle it",
    hint: "More clarity and structure",
    categories: ["Unclutter", "Focus", "Restart"],
  },
  soft: {
    label: "Keep it soft",
    hint: "Lower-demand and grounding",
    categories: ["Ground", "Reflect", "Notice"],
  },
};
