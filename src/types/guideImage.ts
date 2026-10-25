export type GuideImageScope = 'dungeons' | 'artifacts' | 'adventures'

export interface GuideImageFile {
  file: string
  width: number
  height: number
  hash: string
}

export interface ArchivedGuideImage extends GuideImageFile {
  caption: string
  sourceUrl: string
  sourcePage: string
  thumbnail: GuideImageFile
}

export interface GuideImageSource {
  url: string
  label: string
  status: 'saved' | 'partial' | 'no-images' | 'failed'
  pages: number
  imageCount: number
  failedImages: number
  message?: string
}

export interface GuideImageCollection {
  title: string
  images: readonly ArchivedGuideImage[]
  sources: readonly GuideImageSource[]
}

export interface GuideImageArchive {
  scope: GuideImageScope
  archivedAt: string
  guides: Readonly<Record<string, GuideImageCollection>>
}

export interface LocalGuideImage extends ArchivedGuideImage {
  src: string
  thumbnailSrc: string
}
