"use client";

import Image from "next/image";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  ChevronRight,
  CircleUserRound,
  Clock3,
  ExternalLink,
  HeartPulse,
  Home,
  Layers3,
  LogOut,
  Menu,
  Moon,
  Pause,
  Play,
  RefreshCw,
  RotateCcw,
  Settings2,
  Sparkles,
  Sun,
  Target,
  UsersRound,
  Video,
  X,
} from "lucide-react";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Modal } from "@/components/modal";
import { StrategyDeckLab } from "@/components/strategy-deck-lab";
import {
  defaultState,
  makeSessions,
  quadrantInfo,
  strategies,
  strategyMap,
  STORAGE_KEY,
  type PrototypeState,
  type Quadrant,
  type Session,
  type Strategy,
  type ThemePreference,
  type View,
} from "@/lib/neurodiver-data";

const navItems: { id: View; label: string; icon: typeof Home }[] = [
  { id: "home", label: "Home", icon: Home },
  { id: "sessions", label: "Sessions", icon: CalendarDays },
  { id: "checkin", label: "Check-in", icon: HeartPulse },
  { id: "deck", label: "Deck Lab", icon: Layers3 },
  { id: "profile", label: "Profile", icon: CircleUserRound },
];
function loadState(): PrototypeState {
  try {
    const parsed = JSON.parse(
      localStorage.getItem(STORAGE_KEY) || "null",
    ) as Partial<PrototypeState> | null;
    return parsed
      ? {
          ...defaultState,
          ...parsed,
          rsvpIds: Array.isArray(parsed.rsvpIds) ? parsed.rsvpIds : [],
          moodHistory: Array.isArray(parsed.moodHistory)
            ? parsed.moodHistory
            : [],
          completedStrategyIds: Array.isArray(parsed.completedStrategyIds)
            ? parsed.completedStrategyIds
            : [],
          savedDecks: Array.isArray(parsed.savedDecks) ? parsed.savedDecks : [],
        }
      : defaultState;
  } catch {
    return defaultState;
  }
}
const dateText = (date: Date, options: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat("en-MY", options).format(date);
const timeText = (date: Date) =>
  dateText(date, { hour: "2-digit", minute: "2-digit", hour12: false });
const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();
const localDayKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

function SessionCard({
  session,
  booked,
  onOpen,
}: {
  session: Session;
  booked: boolean;
  onOpen: () => void;
}) {
  const remaining = Math.max(0, session.spots - (booked ? 1 : 0));
  return (
    <button
      className={`session-card tone-${session.accent}`}
      onClick={onOpen}
      aria-label={`View ${session.title}`}
    >
      <div className="session-time">
        <strong>{timeText(session.startAt)}</strong>
        <span>{session.durationMinutes} min</span>
      </div>
      <div className="session-card-copy">
        <div className="session-meta">
          <span>{session.focusStyle}</span>
          {booked ? (
            <span className="status-pill booked">Booked</span>
          ) : session.spots === 0 ? (
            <span className="status-pill full">Full</span>
          ) : null}
        </div>
        <h3>{session.title}</h3>
        <p>
          with {session.host} ·{" "}
          {session.spots === 0
            ? "Join another time"
            : `${remaining} places left`}
        </p>
      </div>
      <ChevronRight className="session-chevron" aria-hidden="true" />
    </button>
  );
}
function EmptyBooking({ onBrowse }: { onBrowse: () => void }) {
  return (
    <div className="empty-booking">
      <span className="empty-icon">
        <CalendarDays />
      </span>
      <h3>Your next room is waiting</h3>
      <p>Choose a time when a little shared momentum would help.</p>
      <button className="text-button" onClick={onBrowse}>
        Browse sessions <ArrowRight />
      </button>
    </div>
  );
}

export default function NeuroDiverApp() {
  const [mounted, setMounted] = useState(false);
  const [state, setState] = useState<PrototypeState>(defaultState);
  const [view, setView] = useState<View>("home");
  const [today, setToday] = useState<Date | null>(null);
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [successSession, setSuccessSession] = useState<Session | null>(null);
  const [cancelSession, setCancelSession] = useState<Session | null>(null);
  const [selectedQuadrant, setSelectedQuadrant] = useState<Quadrant | null>(
    null,
  );
  const [activeStrategy, setActiveStrategy] = useState<Strategy | null>(null);
  const [strategyStep, setStrategyStep] = useState(0);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [resetOpen, setResetOpen] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setState(loadState());
      setToday(new Date());
      setMounted(true);
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);
  useEffect(() => {
    if (mounted) localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [mounted, state]);
  useEffect(() => {
    if (!mounted) return;
    const root = document.documentElement;
    const dark =
      state.theme === "dark" ||
      (state.theme === "system" &&
        window.matchMedia("(prefers-color-scheme: dark)").matches);
    root.dataset.theme = dark ? "dark" : "light";
    root.dataset.motion = state.reducedMotion ? "reduced" : "full";
  }, [mounted, state.theme, state.reducedMotion]);
  useEffect(() => {
    if (!timerRunning) return;
    const timer = window.setInterval(
      () =>
        setTimerSeconds((value) => {
          if (value <= 1) {
            setTimerRunning(false);
            return 0;
          }
          return value - 1;
        }),
      1000,
    );
    return () => window.clearInterval(timer);
  }, [timerRunning]);
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const sessions = useMemo(() => (today ? makeSessions(today) : []), [today]);
  const rsvpSet = useMemo(() => new Set(state.rsvpIds), [state.rsvpIds]);
  const upcoming = sessions.filter((session) => rsvpSet.has(session.id));
  const latestMood = state.moodHistory.at(-1)?.quadrant ?? null;
  const todayKey = today ? localDayKey(today) : "";
  const todayMood = state.moodHistory.findLast(
    (entry) => localDayKey(new Date(entry.createdAt)) === todayKey,
  )?.quadrant;
  const todayIntention =
    state.dailyIntention?.date === todayKey ? state.dailyIntention.text : "";
  const dailyProgress = [Boolean(todayIntention), Boolean(todayMood), upcoming.length > 0].filter(
    Boolean,
  ).length;
  const displayName = state.profile?.name.split(" ")[0] || "friend";
  const changeView = useCallback(
    (next: View) => {
      setView(next);
      setMobileMenu(false);
      window.scrollTo({
        top: 0,
        behavior: state.reducedMotion ? "auto" : "smooth",
      });
    },
    [state.reducedMotion],
  );

  const login = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const name = String(data.get("name") || "").trim();
    const email = String(data.get("email") || "").trim();
    if (name && email)
      setState((current) => ({ ...current, profile: { name, email } }));
  };
  const updateProfile = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const name = String(data.get("name") || "").trim();
    const email = String(data.get("email") || "").trim();
    if (name && email) {
      setState((current) => ({ ...current, profile: { name, email } }));
      setToast("Profile updated on this device");
    }
  };
  const rsvp = (session: Session) => {
    if (session.spots === 0 || rsvpSet.has(session.id)) return;
    setState((current) => ({
      ...current,
      rsvpIds: [...current.rsvpIds, session.id],
    }));
    setSelectedSession(null);
    setSuccessSession(session);
  };
  const cancelRsvp = (session: Session) => {
    setState((current) => ({
      ...current,
      rsvpIds: current.rsvpIds.filter((id) => id !== session.id),
    }));
    setCancelSession(null);
    setSelectedSession(null);
    setToast("Your RSVP has been cancelled");
  };
  const chooseMood = (quadrant: Quadrant) => {
    setSelectedQuadrant(quadrant);
    setState((current) => ({
      ...current,
      moodHistory: [
        ...current.moodHistory
          .filter(
            (entry) =>
              localDayKey(new Date(entry.createdAt)) !== localDayKey(new Date()),
          )
          .slice(-13),
        {
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
          quadrant,
        },
      ],
    }));
    setToast("Pace noted. Your suggestions are ready.");
  };
  const saveDailyIntention = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const text = String(data.get("intention") || "").trim();
    if (!text) return;
    setState((current) => ({
      ...current,
      dailyIntention: { date: todayKey, text },
    }));
    setToast("Tiny aim saved for today");
  };
  const openStrategy = (strategy: Strategy) => {
    setActiveStrategy(strategy);
    setStrategyStep(0);
    setTimerSeconds(strategy.minutes * 60);
    setTimerRunning(false);
  };
  const completeStrategy = () => {
    if (!activeStrategy) return;
    setState((current) => ({
      ...current,
      completedStrategyIds: current.completedStrategyIds.includes(
        activeStrategy.id,
      )
        ? current.completedStrategyIds
        : [...current.completedStrategyIds, activeStrategy.id],
    }));
    setTimerRunning(false);
    setTimerSeconds(0);
    setToast("You made a little room. That counts.");
  };
  const saveDeck = (deck: PrototypeState["savedDecks"][number]) => {
    setState((current) => ({
      ...current,
      savedDecks: [deck, ...current.savedDecks].slice(0, 8),
    }));
    setToast("Deck saved to your pocket library");
  };
  const removeDeck = (id: string) => {
    setState((current) => ({
      ...current,
      savedDecks: current.savedDecks.filter((deck) => deck.id !== id),
    }));
    setToast("Deck removed");
  };
  const resetData = () => {
    localStorage.removeItem(STORAGE_KEY);
    setState(defaultState);
    setSelectedQuadrant(null);
    setView("home");
    setResetOpen(false);
  };

  if (!mounted || !today)
    return (
      <div className="app-loading">
        <div className="brand-mark">N</div>
        <span>Making some space…</span>
      </div>
    );
  if (!state.profile)
    return (
      <main className="login-page">
        <section className="login-copy">
          <a className="brand" href="#" aria-label="NeuroDiver home">
            <span className="brand-mark">N</span>
            <span>NeuroDiver</span>
          </a>
          <div className="login-message">
            <p className="eyebrow">FOCUS, WITH COMPANY</p>
            <h1>
              <span>You don&apos;t have to</span>
              <span>
                do it <em>alone.</em>
              </span>
            </h1>
            <p>
              Find a body-doubling room, meet your energy where it is, and take
              one kinder next step.
            </p>
          </div>
          <div className="login-art" aria-hidden="true">
            <div className="orbit orbit-one" />
            <div className="orbit orbit-two" />
            <Image
              src="/art/green-grounding.png"
              alt=""
              width={520}
              height={520}
              priority
            />
          </div>
        </section>
        <section className="login-panel" aria-labelledby="login-title">
          <div className="login-form-wrap">
            <span className="mini-spark">
              <Sparkles />
            </span>
            <p className="eyebrow">PROTOTYPE ACCESS</p>
            <h2 id="login-title">Come on in.</h2>
            <p className="form-intro">
              Use any name and email to explore the experience.
            </p>
            <form onSubmit={login}>
              <label htmlFor="name">What should we call you?</label>
              <input
                id="name"
                name="name"
                autoComplete="name"
                required
                placeholder="e.g. Maya"
              />
              <label htmlFor="email">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="you@example.com"
              />
              <button className="primary-button login-button" type="submit">
                Enter NeuroDiver <ArrowRight />
              </button>
            </form>
            <p className="privacy-note">
              <span>●</span> Demo only. No account is created and nothing leaves
              this browser.
            </p>
          </div>
        </section>
      </main>
    );

  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() + weekOffset);
  weekStart.setHours(0, 0, 0, 0);
  const weekDays = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + index);
    return date;
  });
  const visibleSessions = sessions.filter((session) =>
    weekDays.some((day) => sameDay(day, session.startAt)),
  );
  const recommendedIds =
    strategyMap[selectedQuadrant ?? latestMood ?? "low-pleasant"];
  const recommended = recommendedIds
    .map((id) => strategies.find((item) => item.id === id))
    .filter(Boolean) as Strategy[];

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileMenu ? "mobile-open" : ""}`}>
        <div className="sidebar-top">
          <button
            className="mobile-close"
            onClick={() => setMobileMenu(false)}
            aria-label="Close menu"
          >
            <X />
          </button>
          <a
            className="brand"
            href="#"
            onClick={(event) => {
              event.preventDefault();
              changeView("home");
            }}
          >
            <span className="brand-mark">N</span>
            <span>NeuroDiver</span>
          </a>
          <p className="nav-kicker">YOUR SPACE</p>
          <nav aria-label="Primary navigation">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  className={view === item.id ? "active" : ""}
                  onClick={() => changeView(item.id)}
                  aria-current={view === item.id ? "page" : undefined}
                >
                  <Icon />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
        <div className="sidebar-support">
          <span>
            <Sparkles />
          </span>
          <strong>Need a softer screen?</strong>
          <p>Reduce movement in your profile settings.</p>
          <button onClick={() => changeView("profile")}>Open settings</button>
        </div>
        <button
          className="sidebar-profile"
          onClick={() => changeView("profile")}
        >
          <span className="avatar">
            {state.profile.name.slice(0, 1).toUpperCase()}
          </span>
          <span>
            <strong>{state.profile.name}</strong>
            <small>Prototype member</small>
          </span>
          <ChevronRight />
        </button>
      </aside>
      {mobileMenu ? (
        <button
          className="menu-scrim"
          onClick={() => setMobileMenu(false)}
          aria-label="Close menu"
        />
      ) : null}
      <main className="main-area">
        <header className="topbar">
          <button
            className="mobile-menu-button"
            onClick={() => setMobileMenu(true)}
            aria-label="Open menu"
          >
            <Menu />
          </button>
          <div className="mobile-brand">
            <span className="brand-mark">N</span>
            <strong>NeuroDiver</strong>
          </div>
          <div className="topbar-actions">
            <span className="today-label">
              {dateText(today, {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </span>
            <button
              className="icon-button"
              onClick={() =>
                setState((current) => ({
                  ...current,
                  theme: current.theme === "dark" ? "light" : "dark",
                }))
              }
              aria-label="Toggle light and dark mode"
            >
              {state.theme === "dark" ? <Sun /> : <Moon />}
            </button>
            <button
              className="avatar-button"
              onClick={() => changeView("profile")}
              aria-label="Open profile"
            >
              {state.profile.name.slice(0, 1).toUpperCase()}
            </button>
          </div>
        </header>

        {view === "home" ? (
          <div className="page home-page">
            <section className="welcome-grid">
              <div className="welcome-copy">
                <p className="eyebrow">YOUR DAY, YOUR PACE</p>
                <h1>
                  Hey {displayName}.<br />
                  What would feel <em>helpful?</em>
                </h1>
                <p>
                  No streaks to protect. No pressure to perform. Just a few good
                  places to begin.
                </p>
                <div className="welcome-actions">
                  <button
                    className="primary-button"
                    onClick={() => changeView("sessions")}
                  >
                    <UsersRound /> Find a focus room
                  </button>
                  <button
                    className="secondary-button"
                    onClick={() => changeView("checkin")}
                  >
                    <HeartPulse /> Check in with myself
                  </button>
                </div>
              </div>
              <div className="welcome-visual" aria-hidden="true">
                <span className="visual-note note-one">
                  one thing
                  <br />
                  at a time
                </span>
                <span className="visual-note note-two">
                  showing up
                  <br />
                  counts
                </span>
                <Image
                  src="/art/blue-reset.png"
                  alt=""
                  width={480}
                  height={480}
                  priority
                />
              </div>
            </section>
            <section className="daily-loop" aria-labelledby="daily-loop-title">
              <div className="daily-loop-heading">
                <div>
                  <p className="eyebrow">YOUR DAILY LANDING STRIP</p>
                  <h2 id="daily-loop-title">Three small ways back in.</h2>
                  <p>Use one, use all three, or leave them for another day.</p>
                </div>
                <div
                  className="daily-progress"
                  aria-label={`${dailyProgress} of 3 daily anchors complete`}
                >
                  <span>
                    <strong>{dailyProgress}</strong>/3 anchors placed
                  </span>
                  <div aria-hidden="true">
                    {[0, 1, 2].map((step) => (
                      <i className={step < dailyProgress ? "complete" : ""} key={step} />
                    ))}
                  </div>
                </div>
              </div>
              <div className="daily-step-grid">
                <article className={`daily-step ${todayIntention ? "complete" : ""}`}>
                  <div className="daily-step-top">
                    <span className="daily-step-number">01</span>
                    {todayIntention ? <Check aria-label="Complete" /> : <Target aria-hidden="true" />}
                  </div>
                  <h3>Name one tiny aim.</h3>
                  <p>Make the starting line small enough to step over.</p>
                  <form onSubmit={saveDailyIntention}>
                    <input
                      name="intention"
                      aria-label="One tiny aim for today"
                      placeholder="e.g. open the document"
                      defaultValue={todayIntention}
                      maxLength={80}
                    />
                    <button type="submit" aria-label="Save today’s tiny aim">
                      {todayIntention ? "Update" : "Save"}
                    </button>
                  </form>
                </article>
                <article className={`daily-step ${todayMood ? "complete" : ""}`}>
                  <div className="daily-step-top">
                    <span className="daily-step-number">02</span>
                    {todayMood ? <Check aria-label="Complete" /> : <HeartPulse aria-hidden="true" />}
                  </div>
                  <h3>Notice your current pace.</h3>
                  <p>
                    {todayMood
                      ? quadrantInfo[todayMood].label
                      : "Pick the closest rhythm—no perfect label needed."}
                  </p>
                  <button className="text-button" onClick={() => changeView("checkin")}>
                    {todayMood ? "See my suggestions" : "Check in now"} <ArrowRight />
                  </button>
                </article>
                <article className={`daily-step ${upcoming.length ? "complete" : ""}`}>
                  <div className="daily-step-top">
                    <span className="daily-step-number">03</span>
                    {upcoming.length ? <Check aria-label="Complete" /> : <UsersRound aria-hidden="true" />}
                  </div>
                  <h3>Add a little company.</h3>
                  <p>
                    {upcoming[0]
                      ? `${upcoming[0].title} is waiting for you.`
                      : "Reserve a focus room before motivation has to appear."}
                  </p>
                  <button className="text-button" onClick={() => changeView("sessions")}>
                    {upcoming.length ? "View my room" : "Find a room"} <ArrowRight />
                  </button>
                </article>
              </div>
            </section>
            <section className="home-lower-grid">
              <div className="section-block next-session-block">
                <div className="section-heading">
                  <div>
                    <p className="eyebrow">BODY DOUBLING</p>
                    <h2>Up next</h2>
                  </div>
                  <button
                    className="text-button"
                    onClick={() => changeView("sessions")}
                  >
                    See calendar <ArrowRight />
                  </button>
                </div>
                {upcoming[0] ? (
                  <div className="hero-session-card">
                    <div className="date-tile">
                      <span>
                        {dateText(upcoming[0].startAt, { month: "short" })}
                      </span>
                      <strong>
                        {dateText(upcoming[0].startAt, { day: "numeric" })}
                      </strong>
                    </div>
                    <div className="hero-session-copy">
                      <span className="status-pill booked">You&apos;re in</span>
                      <h3>{upcoming[0].title}</h3>
                      <p>
                        {timeText(upcoming[0].startAt)} ·{" "}
                        {upcoming[0].durationMinutes} min · with{" "}
                        {upcoming[0].host}
                      </p>
                    </div>
                    <a
                      className="join-button"
                      href={upcoming[0].meetUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Join Meet <Video />
                    </a>
                  </div>
                ) : (
                  <EmptyBooking onBrowse={() => changeView("sessions")} />
                )}
              </div>
              <div className="section-block mood-snapshot">
                <div className="section-heading">
                  <div>
                    <p className="eyebrow">A QUICK PAUSE</p>
                    <h2>Where&apos;s your pace today?</h2>
                  </div>
                </div>
                {latestMood ? (
                  <button
                    className={`latest-mood tone-${quadrantInfo[latestMood].color}`}
                    onClick={() => changeView("checkin")}
                  >
                    <span className="mood-dot" />
                    <span>
                      <small>Latest check-in</small>
                      <strong>{quadrantInfo[latestMood].label}</strong>
                      <em>{quadrantInfo[latestMood].prompt}</em>
                    </span>
                    <ChevronRight />
                  </button>
                ) : (
                  <button
                    className="mood-empty"
                    onClick={() => changeView("checkin")}
                  >
                    <span>Choose the nearest rhythm. No perfect words needed.</span>
                    <ArrowRight />
                  </button>
                )}
                <div
                  className="mood-trail"
                  aria-label={`${state.moodHistory.length} recent mood check-ins`}
                >
                  {state.moodHistory.length ? (
                    state.moodHistory
                      .slice(-7)
                      .map((entry) => (
                        <span
                          key={entry.id}
                          className={`trail-dot tone-${quadrantInfo[entry.quadrant].color}`}
                        />
                      ))
                  ) : (
                    <>
                      {Array.from({ length: 5 }, (_, index) => (
                        <span className="trail-dot ghost" key={index} />
                      ))}
                    </>
                  )}
                </div>
                <p className="gentle-note">
                  Energy is information, not a score.
                </p>
              </div>
            </section>
            <section className="deck-promo">
              <div className="deck-promo-copy">
                <p className="eyebrow">NEW · STRATEGY DECK LAB</p>
                <h2>Build a path for the brain you have <em>today.</em></h2>
                <p>
                  Tell us what would help, how much time you have, and whether
                  you want movement, clarity or softness. We’ll mix three
                  practical cards—no endless browsing required.
                </p>
                <button className="primary-button" onClick={() => changeView("deck")}>
                  <Layers3 /> Mix my deck
                </button>
                {state.savedDecks.length ? (
                  <span>{state.savedDecks.length} saved in your pocket library</span>
                ) : null}
              </div>
              <div className="deck-promo-art" aria-hidden="true">
                <div className="promo-card promo-card-one"><Sparkles /></div>
                <div className="promo-card promo-card-two"><HeartPulse /></div>
                <div className="promo-card promo-card-three"><Target /></div>
              </div>
            </section>
          </div>
        ) : null}

        {view === "sessions" ? (
          <div className="page sessions-page">
            <div className="page-heading-row">
              <div>
                <p className="eyebrow">FOCUS, WITH COMPANY</p>
                <h1>Find your room.</h1>
                <p>Come as you are. Cameras are always optional.</p>
              </div>
              <div className="week-controls">
                <button
                  className="icon-button"
                  onClick={() => setWeekOffset(Math.max(0, weekOffset - 7))}
                  disabled={weekOffset === 0}
                  aria-label="Previous week"
                >
                  <ArrowLeft />
                </button>
                <span>
                  {dateText(weekDays[0], { month: "short", day: "numeric" })} –{" "}
                  {dateText(weekDays[6], { month: "short", day: "numeric" })}
                </span>
                <button
                  className="icon-button"
                  onClick={() => setWeekOffset(Math.min(14, weekOffset + 7))}
                  disabled={weekOffset === 14}
                  aria-label="Next week"
                >
                  <ArrowRight />
                </button>
              </div>
            </div>
            <div
              className="calendar-strip"
              aria-label="Seven day session calendar"
            >
              {weekDays.map((day) => {
                const count = sessions.filter((session) =>
                  sameDay(day, session.startAt),
                ).length;
                return (
                  <div
                    key={day.toISOString()}
                    className={sameDay(day, today) ? "today" : ""}
                  >
                    <span>{dateText(day, { weekday: "short" })}</span>
                    <strong>{dateText(day, { day: "numeric" })}</strong>
                    <small>
                      {count
                        ? `${count} ${count === 1 ? "room" : "rooms"}`
                        : "—"}
                    </small>
                  </div>
                );
              })}
            </div>
            <div className="sessions-layout">
              <section className="section-block available-panel">
                <div className="section-heading">
                  <div>
                    <p className="eyebrow">AVAILABLE THIS WEEK</p>
                    <h2>Choose a time</h2>
                  </div>
                  <span className="count-pill">
                    {visibleSessions.length} rooms
                  </span>
                </div>
                <div className="agenda-list">
                  {weekDays.map((day) => {
                    const daySessions = visibleSessions.filter((session) =>
                      sameDay(day, session.startAt),
                    );
                    if (!daySessions.length) return null;
                    return (
                      <div className="agenda-day" key={day.toISOString()}>
                        <div className="agenda-date">
                          <span>{dateText(day, { weekday: "long" })}</span>
                          <strong>
                            {dateText(day, { month: "long", day: "numeric" })}
                          </strong>
                        </div>
                        <div className="agenda-cards">
                          {daySessions.map((session) => (
                            <SessionCard
                              key={session.id}
                              session={session}
                              booked={rsvpSet.has(session.id)}
                              onOpen={() => setSelectedSession(session)}
                            />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                  {!visibleSessions.length ? (
                    <div className="blank-week">
                      <CalendarDays />
                      <h3>A quieter week</h3>
                      <p>There are no rooms in this date range yet.</p>
                    </div>
                  ) : null}
                </div>
              </section>
              <aside className="section-block upcoming-panel">
                <div className="section-heading">
                  <div>
                    <p className="eyebrow">YOUR CALENDAR</p>
                    <h2>My upcoming</h2>
                  </div>
                  <span className="count-pill mint">{upcoming.length}</span>
                </div>
                {upcoming.length ? (
                  <div className="upcoming-stack">
                    {upcoming.map((session) => (
                      <div className="upcoming-card" key={session.id}>
                        <div className={`date-tile tone-${session.accent}`}>
                          <span>
                            {dateText(session.startAt, { month: "short" })}
                          </span>
                          <strong>
                            {dateText(session.startAt, { day: "numeric" })}
                          </strong>
                        </div>
                        <div>
                          <span>
                            {timeText(session.startAt)} ·{" "}
                            {session.durationMinutes} min
                          </span>
                          <h3>{session.title}</h3>
                          <p>with {session.host}</p>
                          <div className="upcoming-actions">
                            <a
                              href={session.meetUrl}
                              target="_blank"
                              rel="noreferrer"
                            >
                              Join Google Meet <ExternalLink />
                            </a>
                            <button onClick={() => setCancelSession(session)}>
                              Cancel
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyBooking
                    onBrowse={() =>
                      document
                        .querySelector(".available-panel")
                        ?.scrollIntoView({ behavior: "smooth" })
                    }
                  />
                )}
              </aside>
            </div>
          </div>
        ) : null}

        {view === "checkin" ? (
          <div className="page checkin-page">
            <section className="checkin-intro">
              <p className="eyebrow">A TEN-SECOND SELF-SCAN</p>
              <h1>
                Which pace feels
                <br />
                closest <em>right now?</em>
              </h1>
              <p>
                Choose the nearest rhythm, not a perfect label. You can update
                it whenever the day shifts.
              </p>
            </section>
            <section
              className="mood-picker"
              aria-label="Choose the pace closest to how you feel"
            >
              {(Object.keys(quadrantInfo) as Quadrant[]).map((quadrant) => {
                const info = quadrantInfo[quadrant];
                return (
                  <button
                    key={quadrant}
                    className={`mood-orb tone-${info.color} ${selectedQuadrant === quadrant ? "selected" : ""}`}
                    onClick={() => chooseMood(quadrant)}
                    aria-pressed={selectedQuadrant === quadrant}
                  >
                    <span className="orb-shine" />
                    <strong>{info.label}</strong>
                    <small>{info.prompt}</small>
                    {selectedQuadrant === quadrant ? (
                      <span className="orb-check">
                        <Check />
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </section>
            <section
              className={`strategy-section ${selectedQuadrant || latestMood ? "visible" : ""}`}
            >
              <div className="section-heading strategy-heading">
                <div>
                  <p className="eyebrow">CHOSEN FOR THIS MOMENT</p>
                  <h2>Try one gentle thing.</h2>
                  <p>
                    {selectedQuadrant
                      ? `For when you feel ${quadrantInfo[selectedQuadrant].prompt.toLowerCase()}.`
                      : "Based on your latest check-in."}
                  </p>
                </div>
                <span className="scribble-note">
                  you only
                  <br />
                  need one ↘
                </span>
              </div>
              <div className="strategy-grid">
                {recommended.map((strategy) => (
                  <button
                    key={strategy.id}
                    className={`strategy-card tone-${strategy.tone}`}
                    onClick={() => openStrategy(strategy)}
                  >
                    <div className="strategy-art">
                      {strategy.art ? (
                        <Image
                          src={strategy.art}
                          alt=""
                          width={260}
                          height={260}
                        />
                      ) : (
                        <span className="abstract-mark">
                          <Sparkles />
                        </span>
                      )}
                    </div>
                    <div className="strategy-copy">
                      <div>
                        <span>{strategy.category}</span>
                        <span>
                          <Clock3 /> {strategy.minutes} min
                        </span>
                      </div>
                      <h3>{strategy.title}</h3>
                      <p>{strategy.description}</p>
                      <span className="strategy-open">
                        Start gently <ArrowRight />
                      </span>
                    </div>
                    {state.completedStrategyIds.includes(strategy.id) ? (
                      <span className="completed-badge">
                        <Check /> Tried
                      </span>
                    ) : null}
                  </button>
                ))}
              </div>
            </section>
          </div>
        ) : null}

        {view === "deck" ? (
          <div className="page deck-page">
            <div className="page-heading-row deck-page-heading">
              <div>
                <p className="eyebrow">PERSONALISED WITHOUT THE PRESSURE</p>
                <h1>Strategy Deck Lab.</h1>
                <p>Mix a few useful next moves for this exact moment.</p>
              </div>
              <span className="deck-page-sticker">made for<br />right now ↘</span>
            </div>
            <StrategyDeckLab
              strategies={strategies}
              savedDecks={state.savedDecks}
              onOpenStrategy={openStrategy}
              onSaveDeck={saveDeck}
              onRemoveDeck={removeDeck}
            />
          </div>
        ) : null}

        {view === "profile" ? (
          <div className="page profile-page">
            <div className="page-heading-row">
              <div>
                <p className="eyebrow">MAKE IT YOURS</p>
                <h1>Your space.</h1>
                <p>Adjust the experience without turning it into a project.</p>
              </div>
            </div>
            <div className="profile-grid">
              <section className="profile-identity">
                <div className="profile-avatar-large">
                  {state.profile.name.slice(0, 1).toUpperCase()}
                </div>
                <h2>{state.profile.name}</h2>
                <p>{state.profile.email}</p>
                <div className="profile-mini-stats">
                  <div>
                    <strong>{upcoming.length}</strong>
                    <span>booked</span>
                  </div>
                  <div>
                    <strong>{state.moodHistory.length}</strong>
                    <span>check-ins</span>
                  </div>
                  <div>
                    <strong>{state.completedStrategyIds.length}</strong>
                    <span>strategies</span>
                  </div>
                </div>
                <button
                  className="secondary-button"
                  onClick={() =>
                    setState((current) => ({ ...current, profile: null }))
                  }
                >
                  <LogOut /> Leave demo
                </button>
              </section>
              <div className="settings-stack">
                <section className="settings-card">
                  <div className="settings-title">
                    <span>
                      <CircleUserRound />
                    </span>
                    <div>
                      <h2>Demo identity</h2>
                      <p>Saved only on this device.</p>
                    </div>
                  </div>
                  <form className="profile-form" onSubmit={updateProfile}>
                    <label htmlFor="profile-name">Name</label>
                    <input
                      id="profile-name"
                      name="name"
                      defaultValue={state.profile.name}
                      required
                    />
                    <label htmlFor="profile-email">Email</label>
                    <input
                      id="profile-email"
                      name="email"
                      type="email"
                      defaultValue={state.profile.email}
                      required
                    />
                    <button className="primary-button" type="submit">
                      Save changes
                    </button>
                  </form>
                </section>
                <section className="settings-card">
                  <div className="settings-title">
                    <span>
                      <Settings2 />
                    </span>
                    <div>
                      <h2>Display & comfort</h2>
                      <p>A screen that asks a little less of you.</p>
                    </div>
                  </div>
                  <div className="setting-row">
                    <div>
                      <strong>Appearance</strong>
                      <span>Light is the NeuroDiver signature.</span>
                    </div>
                    <div className="segmented-control">
                      {(["light", "dark", "system"] as ThemePreference[]).map(
                        (theme) => (
                          <button
                            key={theme}
                            className={state.theme === theme ? "active" : ""}
                            onClick={() =>
                              setState((current) => ({ ...current, theme }))
                            }
                          >
                            {theme === "light" ? (
                              <Sun />
                            ) : theme === "dark" ? (
                              <Moon />
                            ) : (
                              <RefreshCw />
                            )}
                            <span>{theme}</span>
                          </button>
                        ),
                      )}
                    </div>
                  </div>
                  <div className="setting-row">
                    <div>
                      <strong>Reduce motion</strong>
                      <span>Keep transitions quiet and immediate.</span>
                    </div>
                    <button
                      className={`switch ${state.reducedMotion ? "on" : ""}`}
                      role="switch"
                      aria-checked={state.reducedMotion}
                      onClick={() =>
                        setState((current) => ({
                          ...current,
                          reducedMotion: !current.reducedMotion,
                        }))
                      }
                    >
                      <span />
                    </button>
                  </div>
                </section>
                <section className="settings-card danger-card">
                  <div className="settings-title">
                    <span>
                      <RotateCcw />
                    </span>
                    <div>
                      <h2>Reset prototype</h2>
                      <p>
                        Clear your demo profile, daily aim, bookings and
                        check-ins from this browser.
                      </p>
                    </div>
                  </div>
                  <button
                    className="danger-button"
                    onClick={() => setResetOpen(true)}
                  >
                    Reset all demo data
                  </button>
                </section>
              </div>
            </div>
            <p className="wellbeing-note">
              NeuroDiver offers general wellbeing support, not medical or
              mental-health treatment advice.
            </p>
          </div>
        ) : null}
      </main>
      <nav className="bottom-nav" aria-label="Mobile navigation">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              className={view === item.id ? "active" : ""}
              onClick={() => changeView(item.id)}
            >
              <Icon />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <Modal
        open={Boolean(selectedSession)}
        onClose={() => setSelectedSession(null)}
        title={selectedSession?.title ?? "Session details"}
        eyebrow="BODY DOUBLING ROOM"
      >
        {selectedSession ? (
          <div className="session-modal-content">
            <div className="modal-date-line">
              <span className={`date-tile tone-${selectedSession.accent}`}>
                <span>
                  {dateText(selectedSession.startAt, { month: "short" })}
                </span>
                <strong>
                  {dateText(selectedSession.startAt, { day: "numeric" })}
                </strong>
              </span>
              <div>
                <strong>
                  {dateText(selectedSession.startAt, {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                  })}
                </strong>
                <span>
                  {timeText(selectedSession.startAt)} ·{" "}
                  {selectedSession.durationMinutes} minutes
                </span>
              </div>
            </div>
            <div className="session-details-grid">
              <div>
                <UsersRound />
                <span>Hosted by</span>
                <strong>{selectedSession.host}</strong>
              </div>
              <div>
                <Video />
                <span>Room style</span>
                <strong>{selectedSession.focusStyle}</strong>
              </div>
            </div>
            <div className="camera-note">
              <span>◎</span>
              <p>
                <strong>Cameras are optional.</strong>
                <br />
                Quiet participation is real participation.
              </p>
            </div>
            {rsvpSet.has(selectedSession.id) ? (
              <>
                <a
                  className="primary-button modal-full-button"
                  href={selectedSession.meetUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Join Google Meet <ExternalLink />
                </a>
              <button
                className="modal-cancel-link"
                onClick={() => {
                  setSelectedSession(null);
                  setCancelSession(selectedSession);
                }}
              >
                  Cancel my RSVP
                </button>
              </>
            ) : (
              <button
                className="primary-button modal-full-button"
                disabled={selectedSession.spots === 0}
                onClick={() => rsvp(selectedSession)}
              >
                {selectedSession.spots === 0
                  ? "This room is full"
                  : "Confirm my place"}
                <ArrowRight />
              </button>
            )}
            <p className="modal-footnote">
              No email will be sent in this prototype.
            </p>
          </div>
        ) : null}
      </Modal>
      <Modal
        open={Boolean(successSession)}
        onClose={() => setSuccessSession(null)}
        title="You’re confirmed."
        eyebrow="YOUR PLACE IS SAVED"
        className="success-modal"
      >
        {successSession ? (
          <div className="success-content">
            <span className="success-mark">
              <Check />
            </span>
            <p>
              Thanks, {displayName}. We&apos;ve added{" "}
              <strong>{successSession.title}</strong> to your upcoming sessions.
            </p>
            <div className="success-session-line">
              <CalendarDays />
              <span>
                {dateText(successSession.startAt, {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })}
                <strong>
                  {timeText(successSession.startAt)} ·{" "}
                  {successSession.durationMinutes} min
                </strong>
              </span>
            </div>
            <a
              className="primary-button modal-full-button"
              href={successSession.meetUrl}
              target="_blank"
              rel="noreferrer"
            >
              Join Google Meet <ExternalLink />
            </a>
            <button
              className="secondary-button modal-full-button"
              onClick={() => {
                setSuccessSession(null);
                changeView("sessions");
              }}
            >
              View my upcoming
            </button>
            <p className="modal-footnote">
              The Meet button is now available whenever you return.
            </p>
          </div>
        ) : null}
      </Modal>
      <Modal
        open={Boolean(cancelSession)}
        onClose={() => setCancelSession(null)}
        title="Cancel this RSVP?"
        eyebrow="NO GUILT, NO PENALTY"
      >
        {cancelSession ? (
          <div className="confirm-content">
            <p>
              Your place in <strong>{cancelSession.title}</strong> will become
              available to someone else.
            </p>
            <div className="confirm-actions">
              <button
                className="danger-button"
                onClick={() => cancelRsvp(cancelSession)}
              >
                Yes, cancel my place
              </button>
              <button
                className="secondary-button"
                onClick={() => setCancelSession(null)}
              >
                Keep my place
              </button>
            </div>
          </div>
        ) : null}
      </Modal>
      <Modal
        open={Boolean(activeStrategy)}
        onClose={() => {
          setActiveStrategy(null);
          setTimerRunning(false);
        }}
        title={activeStrategy?.title ?? "Guided strategy"}
        eyebrow={activeStrategy?.category.toUpperCase()}
        className="strategy-modal"
      >
        {activeStrategy ? (
          <div className="guided-content">
            <div className={`guided-hero tone-${activeStrategy.tone}`}>
              {activeStrategy.art ? (
                <Image
                  src={activeStrategy.art}
                  alt=""
                  width={300}
                  height={300}
                />
              ) : (
                <Sparkles />
              )}
            </div>
            <p>{activeStrategy.description}</p>
            <div className="step-progress">
              <span
                style={{
                  width: `${((strategyStep + 1) / activeStrategy.steps.length) * 100}%`,
                }}
              />
            </div>
            <p className="step-count">
              Step {strategyStep + 1} of {activeStrategy.steps.length}
            </p>
            <h3>{activeStrategy.steps[strategyStep]}</h3>
            <div className="timer-display">
              <Clock3 />
              <strong>
                {String(Math.floor(timerSeconds / 60)).padStart(2, "0")}:
                {String(timerSeconds % 60).padStart(2, "0")}
              </strong>
              <button
                onClick={() => setTimerRunning((running) => !running)}
                aria-label={timerRunning ? "Pause timer" : "Start timer"}
              >
                {timerRunning ? <Pause /> : <Play />}
              </button>
              <button
                onClick={() => {
                  setTimerRunning(false);
                  setTimerSeconds(activeStrategy.minutes * 60);
                }}
                aria-label="Restart timer"
              >
                <RotateCcw />
              </button>
            </div>
            <div className="guided-actions">
              <button
                className="secondary-button"
                disabled={strategyStep === 0}
                onClick={() => setStrategyStep((step) => Math.max(0, step - 1))}
              >
                <ArrowLeft /> Back
              </button>
              {strategyStep < activeStrategy.steps.length - 1 ? (
                <button
                  className="primary-button"
                  onClick={() => setStrategyStep((step) => step + 1)}
                >
                  Next step <ArrowRight />
                </button>
              ) : (
                <button className="primary-button" onClick={completeStrategy}>
                  <Check /> Complete gently
                </button>
              )}
            </div>
          </div>
        ) : null}
      </Modal>
      <Modal
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        title="Start fresh?"
        eyebrow="RESET PROTOTYPE"
      >
        <div className="confirm-content">
          <p>
            This clears the demo identity, daily aim, RSVPs, pace history,
            saved decks, completed strategies and display settings stored in
            this browser.
          </p>
          <div className="confirm-actions">
            <button className="danger-button" onClick={resetData}>
              Clear everything
            </button>
            <button
              className="secondary-button"
              onClick={() => setResetOpen(false)}
            >
              Keep my data
            </button>
          </div>
        </div>
      </Modal>
      {toast ? (
        <div className="toast" role="status">
          <Check /> {toast}
        </div>
      ) : null}
    </div>
  );
}
