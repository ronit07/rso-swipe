import { describe, expect, it } from 'vitest'
import { clubs } from '../data/clubs.js'
import {
  buildFeed,
  emptyState,
  gestureResult,
  loadState,
  resetSkipped,
  saveState,
  scoreClub,
  swipe,
  toggleInterest,
  unsave,
} from './deck.js'

const club = (id, categories, commitment = 'medium') => ({ id, categories, commitment })

describe('scoreClub', () => {
  it('ranks clubs with more matching interests higher', () => {
    const interests = ['Tech', 'Academic']
    expect(scoreClub(club('a', ['Tech', 'Academic']), interests)).toBeGreaterThan(
      scoreClub(club('b', ['Tech']), interests),
    )
  })

  it('pushes clubs with no matching interest to the bottom', () => {
    expect(scoreClub(club('a', ['Sports'], 'low'), ['Tech'])).toBe(-1)
  })

  it('gives low commitment clubs a small boost', () => {
    expect(scoreClub(club('a', ['Tech'], 'low'), ['Tech'])).toBe(4)
    expect(scoreClub(club('b', ['Tech'], 'high'), ['Tech'])).toBe(3)
  })
})

describe('buildFeed', () => {
  it('shows every club when nothing has been picked or swiped', () => {
    expect(buildFeed(clubs, emptyState())).toHaveLength(clubs.length)
  })

  it('puts matching clubs first', () => {
    const state = toggleInterest(emptyState(), 'Faith')
    expect(buildFeed(clubs, state)[0].categories).toContain('Faith')
  })

  it('hides clubs that were already saved or skipped', () => {
    let state = swipe(emptyState(), 'byte-builders', 'save')
    state = swipe(state, 'case-club', 'skip')
    const ids = buildFeed(clubs, state).map((c) => c.id)
    expect(ids).not.toContain('byte-builders')
    expect(ids).not.toContain('case-club')
    expect(ids).toHaveLength(clubs.length - 2)
  })

  it('can filter to one category', () => {
    const feed = buildFeed(clubs, emptyState(), 'Outdoors')
    expect(feed.length).toBeGreaterThan(0)
    expect(feed.every((c) => c.categories.includes('Outdoors'))).toBe(true)
  })

  it('keeps the original order for ties', () => {
    const list = [club('a', ['Tech']), club('b', ['Tech']), club('c', ['Tech'])]
    expect(buildFeed(list, emptyState()).map((c) => c.id)).toEqual(['a', 'b', 'c'])
  })
})

describe('swipe', () => {
  it('moves a club from skipped to saved if you change your mind', () => {
    let state = swipe(emptyState(), 'x', 'skip')
    state = swipe(state, 'x', 'save')
    expect(state.saved).toEqual(['x'])
    expect(state.skipped).toEqual([])
  })

  it('does not save the same club twice', () => {
    let state = swipe(emptyState(), 'x', 'save')
    state = swipe(state, 'x', 'save')
    expect(state.saved).toEqual(['x'])
  })

  it('rejects unknown directions', () => {
    expect(() => swipe(emptyState(), 'x', 'up')).toThrow()
  })

  it('does not mutate the old state', () => {
    const before = emptyState()
    swipe(before, 'x', 'save')
    expect(before.saved).toEqual([])
  })
})

describe('other actions', () => {
  it('unsave removes a saved club', () => {
    expect(unsave(swipe(emptyState(), 'x', 'save'), 'x').saved).toEqual([])
  })

  it('resetSkipped brings skipped clubs back but keeps saved ones', () => {
    let state = swipe(emptyState(), 'a', 'save')
    state = swipe(state, 'b', 'skip')
    state = resetSkipped(state)
    expect(state.saved).toEqual(['a'])
    expect(state.skipped).toEqual([])
  })

  it('toggleInterest adds then removes', () => {
    const once = toggleInterest(emptyState(), 'Arts')
    expect(once.interests).toEqual(['Arts'])
    expect(toggleInterest(once, 'Arts').interests).toEqual([])
  })
})

describe('gestureResult', () => {
  it('needs a big enough drag', () => {
    expect(gestureResult(120)).toBe('save')
    expect(gestureResult(-120)).toBe('skip')
    expect(gestureResult(40)).toBe(null)
  })
})

describe('storage', () => {
  const fakeStorage = () => {
    const data = {}
    return {
      getItem: (k) => data[k] ?? null,
      setItem: (k, v) => {
        data[k] = v
      },
    }
  }

  it('round trips state', () => {
    const storage = fakeStorage()
    const state = swipe(toggleInterest(emptyState(), 'Tech'), 'x', 'save')
    saveState(state, storage)
    expect(loadState(storage)).toEqual(state)
  })

  it('survives corrupted or blocked storage', () => {
    const broken = { getItem: () => '{not json', setItem: () => { throw new Error('full') } }
    expect(loadState(broken)).toEqual(emptyState())
    expect(() => saveState(emptyState(), broken)).not.toThrow()
    expect(loadState(undefined)).toEqual(emptyState())
  })
})
