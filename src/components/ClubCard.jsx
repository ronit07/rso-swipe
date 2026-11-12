import { useRef, useState } from 'react'
import { gestureResult } from '../lib/deck.js'

// One full-screen "reel". Drag it right to save, left to skip.
// Scrolling up/down is handled by the parent (scroll-snap), so here I only
// care about horizontal drags and ignore mostly-vertical ones.
export default function ClubCard({ club, onSwipe, active }) {
  const [dx, setDx] = useState(0)
  const [leaving, setLeaving] = useState(null)
  const start = useRef(null)

  function onPointerDown(e) {
    start.current = { x: e.clientX, y: e.clientY, horizontal: null }
  }

  function onPointerMove(e) {
    if (!start.current) return
    const moveX = e.clientX - start.current.x
    const moveY = e.clientY - start.current.y
    if (start.current.horizontal === null && (Math.abs(moveX) > 8 || Math.abs(moveY) > 8)) {
      start.current.horizontal = Math.abs(moveX) > Math.abs(moveY)
      if (start.current.horizontal) e.currentTarget.setPointerCapture(e.pointerId)
    }
    if (start.current.horizontal) setDx(moveX)
  }

  function finish(direction) {
    setLeaving(direction)
    // let the fly-out animation play before the card is removed
    setTimeout(() => onSwipe(club.id, direction), 220)
  }

  function onPointerUp() {
    if (!start.current) return
    const result = start.current.horizontal ? gestureResult(dx) : null
    start.current = null
    if (result) finish(result)
    else setDx(0)
  }

  const offset = leaving === 'save' ? 600 : leaving === 'skip' ? -600 : dx
  const hint = gestureResult(dx, 40)

  return (
    <section className="reel" aria-hidden={!active}>
      <article
        className="card"
        style={{
          background: `linear-gradient(160deg, ${club.colors[0]}, ${club.colors[1]})`,
          transform: `translateX(${offset}px) rotate(${offset / 25}deg)`,
          transition: dx === 0 || leaving ? 'transform 0.22s ease-out' : 'none',
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        {hint && <div className={`stamp stamp-${hint}`}>{hint === 'save' ? 'SAVE' : 'NOPE'}</div>}
        <div className="emoji" aria-hidden="true">
          {club.emoji}
        </div>
        <h2>{club.name}</h2>
        <p className="tagline">{club.tagline}</p>
        <div className="chips">
          {club.categories.map((c) => (
            <span key={c} className="chip">
              {c}
            </span>
          ))}
          <span className={`chip commit-${club.commitment}`}>{club.commitment} commitment</span>
        </div>
        <p className="description">{club.description}</p>
        <p className="meets">🗓️ {club.meets}</p>
        <div className="vibes">
          {club.vibe.map((v) => (
            <span key={v}>#{v.replace(/\s+/g, '')}</span>
          ))}
        </div>
      </article>
      <div className="actions">
        <button className="btn skip" onClick={() => finish('skip')} aria-label={`Skip ${club.name}`}>
          ✕
        </button>
        <button className="btn save" onClick={() => finish('save')} aria-label={`Save ${club.name}`}>
          ♥
        </button>
      </div>
    </section>
  )
}
