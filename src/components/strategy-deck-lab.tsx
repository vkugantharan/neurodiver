"use client";

import {
  ArrowRight,
  Bookmark,
  Check,
  Clock3,
  Layers3,
  RefreshCw,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  deckGoalInfo,
  deckStyleInfo,
  type DeckGoal,
  type DeckStyle,
  type SavedDeck,
  type Strategy,
} from "@/lib/neurodiver-data";

const goalOrder: DeckGoal[] = ["begin", "focus", "reset", "unwind"];
const styleOrder: DeckStyle[] = ["body", "brain", "soft"];
const timeOptions = [6, 10, 15];

function chooseStrategies(
  strategies: Strategy[],
  goal: DeckGoal,
  style: DeckStyle,
  minutes: number,
  shuffle: number,
) {
  const goalCategories = deckGoalInfo[goal].categories;
  const styleCategories = deckStyleInfo[style].categories;
  const ranked = strategies
    .map((strategy) => ({
      strategy,
      score:
        (goalCategories.includes(strategy.category) ? 6 : 0) +
        (styleCategories.includes(strategy.category) ? 4 : 0),
    }));

  let best: Strategy[] = [];
  let bestScore = -1;
  for (let first = 0; first < ranked.length - 2; first += 1) {
    for (let second = first + 1; second < ranked.length - 1; second += 1) {
      for (let third = second + 1; third < ranked.length; third += 1) {
        const trio = [ranked[first], ranked[second], ranked[third]];
        const duration = trio.reduce(
          (total, item) => total + item.strategy.minutes,
          0,
        );
        const variation =
          ((first * 5 + second * 3 + third * 7 + shuffle * 11) % 9) * 0.3;
        const score =
          trio.reduce((total, item) => total + item.score, 0) + variation;
        if (duration <= minutes && score > bestScore) {
          best = trio.map((item) => item.strategy);
          bestScore = score;
        }
      }
    }
  }
  return best;
}

export function StrategyDeckLab({
  strategies,
  savedDecks,
  onOpenStrategy,
  onSaveDeck,
  onRemoveDeck,
}: {
  strategies: Strategy[];
  savedDecks: SavedDeck[];
  onOpenStrategy: (strategy: Strategy) => void;
  onSaveDeck: (deck: SavedDeck) => void;
  onRemoveDeck: (id: string) => void;
}) {
  const [goal, setGoal] = useState<DeckGoal>("begin");
  const [style, setStyle] = useState<DeckStyle>("soft");
  const [minutes, setMinutes] = useState(10);
  const [shuffle, setShuffle] = useState(0);
  const [hasGenerated, setHasGenerated] = useState(false);

  const deck = useMemo(
    () => chooseStrategies(strategies, goal, style, minutes, shuffle),
    [goal, minutes, shuffle, strategies, style],
  );
  const deckSignature = deck.map((item) => item.id).join("|");
  const alreadySaved = savedDecks.some(
    (saved) => saved.strategyIds.join("|") === deckSignature,
  );
  const totalMinutes = deck.reduce((total, item) => total + item.minutes, 0);

  const generate = () => {
    setShuffle((value) => value + 1);
    setHasGenerated(true);
  };
  const save = () => {
    if (alreadySaved || !deck.length) return;
    onSaveDeck({
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      title: deckGoalInfo[goal].title,
      strategyIds: deck.map((item) => item.id),
    });
  };

  return (
    <div className="deck-page-layout">
      <section className="deck-builder" aria-labelledby="deck-builder-title">
        <div className="deck-builder-intro">
          <span className="deck-lab-mark"><Layers3 /></span>
          <div>
            <p className="eyebrow">BUILD FOR THE MOMENT YOU ARE IN</p>
            <h2 id="deck-builder-title">Mix your strategy deck.</h2>
            <p>Three practical cards. No diagnosis, productivity score or perfect answer required.</p>
          </div>
        </div>

        <fieldset className="deck-choice-group">
          <legend>What would help?</legend>
          <div className="deck-choice-grid goal-choices">
            {goalOrder.map((option) => (
              <button
                type="button"
                className={goal === option ? "selected" : ""}
                onClick={() => setGoal(option)}
                aria-pressed={goal === option}
                key={option}
              >
                {deckGoalInfo[option].label}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className="deck-choice-group">
          <legend>What kind of support can you tolerate?</legend>
          <div className="deck-choice-grid style-choices">
            {styleOrder.map((option) => (
              <button
                type="button"
                className={style === option ? "selected" : ""}
                onClick={() => setStyle(option)}
                aria-pressed={style === option}
                key={option}
              >
                <strong>{deckStyleInfo[option].label}</strong>
                <small>{deckStyleInfo[option].hint}</small>
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className="deck-choice-group time-choice-group">
          <legend>How much room do you have?</legend>
          <div className="deck-time-choices">
            {timeOptions.map((option) => (
              <button
                type="button"
                className={minutes === option ? "selected" : ""}
                onClick={() => setMinutes(option)}
                aria-pressed={minutes === option}
                key={option}
              >
                {option} min
              </button>
            ))}
          </div>
        </fieldset>

        <button className="primary-button deck-generate" onClick={generate}>
          <Sparkles /> {hasGenerated ? "Remix my deck" : "Build my deck"}
        </button>
      </section>

      <section className={`deck-result ${hasGenerated ? "revealed" : ""}`} aria-live="polite">
        {hasGenerated ? (
          <>
            <div className="deck-result-heading">
              <div>
                <p className="eyebrow">YOUR THREE-CARD PATH</p>
                <h2>{deckGoalInfo[goal].title}</h2>
                <span><Clock3 /> About {totalMinutes} minutes altogether</span>
              </div>
              <div className="deck-result-actions">
                <button className="icon-button" onClick={generate} aria-label="Shuffle this deck">
                  <RefreshCw />
                </button>
                <button className="secondary-button" onClick={save} disabled={alreadySaved}>
                  {alreadySaved ? <Check /> : <Bookmark />}
                  {alreadySaved ? "Saved" : "Save deck"}
                </button>
              </div>
            </div>
            <div className="generated-deck">
              {deck.map((strategy, index) => (
                <article className={`generated-card tone-${strategy.tone}`} key={strategy.id}>
                  <div className="generated-card-top">
                    <span>Card {index + 1}</span>
                    <span><Clock3 /> {strategy.minutes} min</span>
                  </div>
                  <div className="generated-card-symbol" aria-hidden="true"><Sparkles /></div>
                  <small>{strategy.category}</small>
                  <h3>{strategy.title}</h3>
                  <p>{strategy.description}</p>
                  <button className="text-button" onClick={() => onOpenStrategy(strategy)}>
                    Open this card <ArrowRight />
                  </button>
                </article>
              ))}
            </div>
          </>
        ) : (
          <div className="deck-placeholder">
            <div className="card-fan" aria-hidden="true"><i /><i /><i /></div>
            <p className="eyebrow">YOUR DECK WILL LAND HERE</p>
            <h2>Less searching.<br />More <em>starting.</em></h2>
            <p>Choose what feels possible and we’ll turn it into a short path.</p>
          </div>
        )}
      </section>

      <section className="saved-decks" aria-labelledby="saved-decks-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">YOUR POCKET LIBRARY</p>
            <h2 id="saved-decks-title">Saved decks</h2>
          </div>
          <span className="count-pill">{savedDecks.length} saved</span>
        </div>
        {savedDecks.length ? (
          <div className="saved-deck-grid">
            {savedDecks.map((saved) => {
              const cards = saved.strategyIds
                .map((id) => strategies.find((strategy) => strategy.id === id))
                .filter((strategy): strategy is Strategy => Boolean(strategy));
              return (
                <article className="saved-deck-card" key={saved.id}>
                  <div>
                    <span><Layers3 /> {cards.length} cards</span>
                    <button onClick={() => onRemoveDeck(saved.id)} aria-label={`Remove ${saved.title}`}>
                      <Trash2 />
                    </button>
                  </div>
                  <h3>{saved.title}</h3>
                  <p>{cards.map((card) => card.title).join(" · ")}</p>
                  <button className="text-button" onClick={() => cards[0] && onOpenStrategy(cards[0])}>
                    Start first card <ArrowRight />
                  </button>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="saved-decks-empty">
            <Bookmark />
            <p>Save a mix that feels useful and it will wait here on this device.</p>
          </div>
        )}
      </section>
    </div>
  );
}
