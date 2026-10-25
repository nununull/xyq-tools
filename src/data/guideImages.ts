import type { GuideImageArchive, GuideImageCollection, GuideImageScope, LocalGuideImage } from '@/types/guideImage'

const archives = import.meta.glob<GuideImageArchive>('./guide-images/*.json', { eager: true, import: 'default' })

/** 以归档索引为唯一来源查找配图，重复归档标识直接报错，防止静默覆盖。 */
function collectImageArchives(): ReadonlyMap<string, GuideImageCollection> {
  const collections = new Map<string, GuideImageCollection>()
  for (const archive of Object.values(archives)) {
    for (const [id, collection] of Object.entries(archive.guides)) {
      const key = `${archive.scope}/${id}`
      if (collections.has(key)) throw new Error(`攻略配图索引重复：${key}`)
      collections.set(key, collection)
    }
  }
  return collections
}

const collections = collectImageArchives()

/** 获取单份攻略的归档状态与出处，页面不复制维护配图清单。 */
export function getGuideImageCollection(scope: GuideImageScope, id: string): GuideImageCollection | undefined {
  return collections.get(`${scope}/${id}`)
}

/** 把归档文件映射为构建后的本站地址，图片缺失时拒绝回退到外站盗链。 */
export function getLocalGuideImages(scope: GuideImageScope, id: string): readonly LocalGuideImage[] {
  return (getGuideImageCollection(scope, id)?.images ?? []).map((image) => {
    if (!image.thumbnail) throw new Error(`攻略尚未生成缩略图：${image.file}`)
    const base = `${import.meta.env.BASE_URL}guide-images/`
    return { ...image, src: `${base}${image.file}`, thumbnailSrc: `${base}${image.thumbnail.file}` }
  })
}
