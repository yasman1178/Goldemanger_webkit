import { create } from 'zustand'

const GOLD_KEY = 'goldmaster.gold21'
const GOLD_BUY_KEY = 'goldmaster.gold21Buy'
const FREEZE_KEY = 'goldmaster.freezeGold'

function readStoredGold21(): number {
  try {
    const saved = Number(localStorage.getItem(GOLD_KEY))
    return saved > 0 ? saved : 0
  } catch {
    return 0
  }
}

function readStoredGold21Buy(): number {
  try {
    const saved = Number(localStorage.getItem(GOLD_BUY_KEY))
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
  gold21Buy: number
  lastFetchTime: string | null
  freezeGold: boolean
  setGold21: (price: number) => void
  setGold21Buy: (price: number) => void
  setLastFetchTime: (time: string | null) => void
  setFreezeGold: (freeze: boolean) => void
}

export const useGoldStore = create<GoldState>((set) => ({
  gold21: readStoredGold21(),
  gold21Buy: readStoredGold21Buy(),
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
  setGold21Buy: (price) => {
    if (price > 0) {
      try {
        localStorage.setItem(GOLD_BUY_KEY, String(price))
      } catch {
        /* ignored */
      }
    }
    set({ gold21Buy: price })
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