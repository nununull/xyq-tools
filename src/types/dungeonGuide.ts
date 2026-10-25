export type DungeonCategory = 'normal' | 'heroic' | 'legendary' | 'special' | 'beginner'

export interface DungeonSource {
  label: string
  url: string
}

export interface DungeonStage {
  title: string
  detail: string
  warning?: string
}

export interface DungeonGuide {
  id: string
  title: string
  category: DungeonCategory
  destiny?: boolean
  availability?: string
  minimumLevel: number
  team: string
  entrance: string
  summary: string
  preparation: readonly string[]
  stages: readonly DungeonStage[]
  cautions: readonly string[]
  sources: readonly DungeonSource[]
}
