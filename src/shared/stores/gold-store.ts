import { create } from 'zustand'

const GOLD_KEY = 'goldmaster.gold21'
const FREEZE_KEY = 'goldmaster.freezeGold'

function readStoredGold21(): number {
  try {
    const saved = Number(localStorage.getItem(GOLD_KEY))
    return saved > 0 ? saved : 0
  } catch {
    return 0
  }
}

function readStoredFreeze(): boolean {
  try {
    return localStorage.getItem(FREEZE_KEY) === '1'
  } catch {
    return false
  }
}

interface GoldState {
  gold21: number
  lastFetchTime: string | null
  freezeGold: boolean
  setGold21: (price: number) => void
  setLastFetchTime: (time: string | null) => void
  setFreezeGold: (freeze: boolean) => void
}

export const useGoldStore = create<GoldState>((set) => ({
  gold21: readStoredGold21(),
  lastFetchTime: null,
  freezeGold: readStoredFreeze(),
  setGold21: (price) => {
    if (price > 0) {
      try {
        localStorage.setItem(GOLD_KEY, String(price))
      } catch {
        /* ignored */
      }
    }
    set({ gold21: price })
  },
  setLastFetchTime: (time) => set({ lastFetchTime: time }),
  setFreezeGold: (freeze) => {
    try {
      localStorage.setItem(FREEZE_KEY, freeze ? '1' : '0')
    } catch {
      /* ignored */
    }
    set({ freezeGold: freeze })
  },
}))