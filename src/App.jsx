import { useEffect, useMemo, useRef, useState } from 'react'
import ClubCard from './components/ClubCard.jsx'
import { CATEGORIES, clubs } from './data/clubs.js'
import {
  buildFeed,
  loadState,
  resetSkipped,
  saveState,
  swipe,
  toggleInterest,
  unsave,
} from './lib/deck.js'

const byId = Object.fromEntries(clubs.map((c) => [c.id, c]))

function Onboarding({ state, setState, onDone }) {
  return (
    <main className="onboarding">
      <h1>What are you into?</h1>
      <p>Pick a few and we'll show those clubs first. You can change this later.</p>
      <div className="interest-grid">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            className={`interest ${state.interests.includes(c) ? 'on' : ''}`}
            onClick={() => setState((s) => toggleInterest(s, c))}
            aria-pressed={state.interests.includes(c)}
          >
            {c}
          </button>
        ))}
      </div>
      <button className="primary" onClick={onDone}>
        {state.interests.length ? 'Show me clubs' : 'Skip, show everything'}
      </button>
    </main>
  )
}

function Saved({ state, setState }) {
  const saved = state.saved.map((id) => byId[id]).filter(Boolean)
  if (saved.length === 0) {
    return <p className="empty">Nothing saved yet. Swipe right on a club you like.</p>
  }
  return (
    <ul className="saved-list">
      {saved.map((club) => (
        <li key={club.id} style={{ borderLeftColor: club.colors[0] }}>
          <span className="saved-emoji">{club.emoji}</span>
          <div>
            <strong>{club.name}</strong>
            <small>{club.meets}</small>
          </div>
          <button onClick={() => setState((s) => unsave(s, club.id))} aria-label={`Remove ${club.name}`}>
            Remove
          </button>
        </li>
      ))}
    </ul>
  )
}

export default function App() {
  const [state, setState] = useState(() => loadState())
  const [tab, setTab] = useState(() => (loadState().interests.length ? 'discover' : 'onboarding'))
  const [filter, setFilter] = useState(null)
  const feedRef = useRef(null)

  useEffect(() => saveState(state), [state])

  const feed = useMemo(() => buildFeed(clubs, state, filter), [state, filter])

  function handleSwipe(id, direction) {
    setState((s) => swipe(s, id, direction))
  }

  // arrow keys for people testing on a laptop
  useEffect(() => {
    function onKey(e) {
      if (tab !== 'discover' || feed.length === 0) return
      if (e.key === 'ArrowRight') handleSwipe(feed[0].id, 'save')
      if (e.key === 'ArrowLeft') handleSwipe(feed[0].id, 'skip')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [tab, feed])

  if (tab === 'onboarding') {
    return <Onboarding state={state} setState={setState} onDone={() => setTab('discover')} />
  }

  return (
    <div className="app">
      <header>
        <span className="logo">RSO Swipe</span>
        <nav>
          <button className={tab === 'discover' ? 'on' : ''} onClick={() => setTab('discover')}>
            Discover
          </button>
          <button className={tab === 'saved' ? 'on' : ''} onClick={() => setTab('saved')}>
            Saved ({state.saved.length})
          </button>
          <button onClick={() => setTab('onboarding')}>Interests</button>
        </nav>
      </header>

      {tab === 'discover' && (
        <>
          <div className="filters">
            <button className={!filter ? 'on' : ''} onClick={() => setFilter(null)}>
              For you
            </button>
            {CATEGORIES.map((c) => (
              <button key={c} className={filter === c ? 'on' : ''} onClick={() => setFilter(c)}>
                {c}
              </button>
            ))}
          </div>
          {feed.length === 0 ? (
            <div className="empty">
              <p>You've seen every club{filter ? ` in ${filter}` : ''}.</p>
              {state.skipped.length > 0 && (
                <button className="primary" onClick={() => setState(resetSkipped)}>
                  Show skipped clubs again
                </button>
              )}
            </div>
          ) : (
            <div className="feed" ref={feedRef}>
              {feed.map((club, i) => (
                <ClubCard key={club.id} club={club} onSwipe={handleSwipe} active={i === 0} />
              ))}
            </div>
          )}
        </>
      )}

      {tab === 'saved' && <Saved state={state} setState={setState} />}

      <footer>Sample clubs for testing, not real RSO listings yet.</footer>
    </div>
  )
}
