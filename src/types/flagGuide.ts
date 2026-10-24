export interface FlagPoint {
  name: string
  coordinates: readonly [number, number]
  directClick?: boolean
  note?: string
}

export interface FlagPlan {
  title: string
  points: readonly FlagPoint[]
}

export interface FlagSheet {
  id: string
  title: string
  image: string
  imageDescription: string
  notice?: string
  plans: readonly FlagPlan[]
}

export interface FlagGuideSource {
  title: string
  author: string
  publishedAt: string
  url: string
}

export interface FlagGuide {
  id: string
  title: string
  description: string
  preparation: string
  tips: readonly string[]
  sheets: readonly FlagSheet[]
  source?: FlagGuideSource
}
