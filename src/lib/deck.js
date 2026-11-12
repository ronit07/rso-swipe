// All the logic that decides which club shows up next. Kept separate from
// the React components so it can be tested on its own (deck.test.js).

export const STORAGE_KEY = 'rso-swipe-v1'

export function emptyState() {
  return { interests: [], saved: [], skipped: [] }
}

// How well a club matches what the student picked.
// +3 for every interest that matches, +1 if it is low commitment
// (most people want to try something before committing), and anything
// with zero matching interests drops to the bottom.
export function scoreClub(club, interests) {
  const matches = club.categories.filter((c) => interests.includes(c)).length
  if (interests.length > 0 && matches === 0) return -1
  return matches * 3 + (club.commitment === 'low' ? 1 : 0)
}

// The feed: clubs the student hasn't swiped on yet, best matches first.
// Ties keep the original order so the feed doesn't jump around.
export function buildFeed(clubs, state, categoryFilter = null) {
  const seen = new Set([...state.saved, ...state.skipped])
  return clubs
    .map((club, index) => ({ club, index, score: scoreClub(club, state.interests) }))
    .filter(({ club }) => !seen.has(club.id))
    .filter(({ club }) => !categoryFilter || club.categories.includes(categoryFilter))
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map(({ club }) => club)
}

export function swipe(state, clubId, direction) {
  if (direction !== 'save' && direction !== 'skip') {
    throw new Error(`unknown swipe direction: ${direction}`)
  }
  // swiping the same club twice shouldn't add it twice
  const saved = state.saved.filter((id) => id !== clubId)
  const skipped = state.skipped.filter((id) => id !== clubId)
  if (direction === 'save') saved.push(clubId)
  else skipped.push(clubId)
  return { ...state, saved, skipped }
}

export function unsave(state, clubId) {
  return { ...state, saved: state.saved.filter((id) => id !== clubId) }
}

// skipped clubs come back into the feed, saved ones stay saved
export function resetSkipped(state) {
  return { ...state, skipped: [] }
}

export function toggleInterest(state, category) {
  const interests = state.interests.includes(category)
    ? state.interests.filter((c) => c !== category)
    : [...state.interests, category]
  return { ...state, interests }
}

// localStorage can throw (private browsing, storage full, blocked), so
// both of these fail quietly and the app just doesn't remember anything.
export function loadState(storage = globalThis.localStorage) {
  try {
    const raw = storage?.getItem(STORAGE_KEY)
    if (!raw) return emptyState()
    const parsed = JSON.parse(raw)
    return {
      interests: Array.isArray(parsed.interests) ? parsed.interests : [],
      saved: Array.isArray(parsed.saved) ? parsed.saved : [],
      skipped: Array.isArray(parsed.skipped) ? parsed.skipped : [],
    }
  } catch {
    return emptyState()
  }
}

export function saveState(state, storage = globalThis.localStorage) {
  try {
    storage?.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // ignore, see comment above
  }
}

// Decide what a drag gesture means. dx is horizontal movement in px.
export function gestureResult(dx, threshold = 90) {
  if (dx > threshold) return 'save'
  if (dx < -threshold) return 'skip'
  return null
}
