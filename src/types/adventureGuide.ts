export interface AdventurePath {
  id: string
  label?: string
  steps: readonly string[]
}

export interface AdventureEnding {
  id: string
  title: string
  paths: readonly AdventurePath[]
}

export interface AdventureGuide {
  id: string
  title: string
  verifiedAt: string
  sourceUrls: readonly string[]
  endings: readonly AdventureEnding[]
}
