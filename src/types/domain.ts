export type AccountStatus = 'idle' | 'running' | 'paused' | 'waiting' | 'ready' | 'completed'

export interface Account {
  id: string
  name: string
  note: string
  order: number
  status: AccountStatus
  accumulatedMs: number
  highValueCount: number
  startedAt: number | null
  waitingUntil: number | null
  completedAt: number | null
}

export type AccountDraft = Pick<Account, 'name' | 'note'>

export type ShopCategory = 'medicine' | 'furniture' | 'summon' | 'cooking'

export interface Shop {
  id: string
  category: ShopCategory
  number: string
  name: string
  items: string[]
  note: string
  order: number
}

export type ShopDraft = Pick<Shop, 'category' | 'number' | 'name' | 'items' | 'note'>

export interface PersistedState {
  version: number
  activeDate: string
  accounts: Account[]
  shops: Shop[]
}
