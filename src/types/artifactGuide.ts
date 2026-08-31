export type ArtifactSeries = 'start' | 'turn'

export type ArtifactVerdict = 'recommended' | 'conditional' | 'skip'

export type ArtifactMaterialCost = 'none' | 'low' | 'medium' | 'high'

export interface ArtifactMaterial {
  name: string
  detail: string
}

export interface ArtifactSource {
  label: string
  publishedAt: string
  url: string
}

export interface ArtifactTask {
  id: string
  name: string
  series: ArtifactSeries
  verdict: ArtifactVerdict
  verdictNote: string
  materialCost: ArtifactMaterialCost
  materials: readonly ArtifactMaterial[]
  communitySummary: string
  cautions: readonly string[]
  suggestedStars: string
  sources: readonly ArtifactSource[]
}
