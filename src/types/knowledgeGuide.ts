export type KnowledgeSection = 'tips' | 'achievements' | 'summon-insights'

export interface KnowledgeSource {
  label: string
  url: string
}

export interface KnowledgeGuide {
  id: string
  title: string
  topic: string
  kind: 'mechanic' | 'experience'
  summary: string
  conditionLabel?: string
  condition: string
  stepsLabel?: string
  steps: readonly string[]
  cautions: readonly string[]
  sources: readonly KnowledgeSource[]
  image?: {
    src: string
    alt: string
    width: number
    height: number
  }
}

export interface KnowledgeCollection {
  introduction: string
  searchPlaceholder: string
  help?: KnowledgeGuide
  note?: string
  guides: readonly KnowledgeGuide[]
}
