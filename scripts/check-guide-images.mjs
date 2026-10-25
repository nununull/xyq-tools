/* global console, process */
import { createHash } from 'node:crypto'
import { readdir, readFile, stat } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const ASSET_ROOT = path.join(ROOT, 'public/guide-images')
const IMAGE_BUDGET = 900 * 1024 * 1024
const THUMBNAIL_BUDGET = 128 * 1024

/** 核对本地资源路径与内容哈希命名，拒绝外站地址、越界路径和缺失尺寸。 */
function validateResource(resource, directory) {
  if (!resource || !new RegExp(`^${directory}/[a-f0-9]{20}\\.(?:jpe?g|png|gif|webp)$`).test(resource.file)
    || !/^[a-f0-9]{64}$/.test(resource.hash) || !resource.file.includes(resource.hash.slice(0, 20))
    || !Number.isInteger(resource.width) || resource.width <= 0 || !Number.isInteger(resource.height) || resource.height <= 0) {
    throw new Error(`攻略资源索引非法：${resource?.file ?? '未生成'}`)
  }
  if (directory === 'thumbnails' && (resource.width > 480 || resource.height > 320)) {
    throw new Error(`缩略图尺寸超出预算：${resource.file}`)
  }
}

/** 构建前验证索引引用和图片体积，让静态目录中的漏文件与原图膨胀直接阻断发布。 */
async function main() {
  const indexRoot = path.join(ROOT, 'src/data/guide-images')
  const indexes = (await readdir(indexRoot)).filter((file) => file.endsWith('.json'))
  const resources = new Map()
  const guides = new Set()
  let imageCount = 0
  for (const index of indexes) {
    const archive = JSON.parse(await readFile(path.join(indexRoot, index), 'utf8'))
    for (const [id, guide] of Object.entries(archive.guides)) {
      const key = `${archive.scope}/${id}`
      if (guides.has(key) || !guide.images.length) throw new Error(`攻略图库重复或为空：${key}`)
      guides.add(key)
      for (const image of guide.images) {
        validateResource(image, 'originals')
        validateResource(image.thumbnail, 'thumbnails')
        resources.set(image.file, image.hash)
        resources.set(image.thumbnail.file, image.thumbnail.hash)
        imageCount += 1
      }
    }
  }
  let totalBytes = 0
  for (const [file, hash] of resources) {
    const info = await stat(path.join(ASSET_ROOT, file))
    if (!info.isFile() || info.size === 0) throw new Error(`攻略图片为空或不是文件：${file}`)
    const actualHash = createHash('sha256').update(await readFile(path.join(ASSET_ROOT, file))).digest('hex')
    if (actualHash !== hash) throw new Error(`攻略图片与索引哈希不符：${file}`)
    if (file.startsWith('thumbnails/') && info.size > THUMBNAIL_BUDGET) throw new Error(`缩略图文件超出 128 KiB：${file}`)
    totalBytes += info.size
  }
  for (const directory of ['originals', 'thumbnails']) {
    for (const file of await readdir(path.join(ASSET_ROOT, directory))) {
      if (!resources.has(`${directory}/${file}`)) throw new Error(`存在未被攻略引用的资源，请先运行 images:optimize：${directory}/${file}`)
    }
  }
  if (totalBytes > IMAGE_BUDGET) throw new Error(`攻略图片超过 900 MiB 发布预算：${totalBytes} 字节`)
  console.info(JSON.stringify({ msg: '攻略图片构建检查通过', guides: guides.size, images: imageCount, files: resources.size, bytes: totalBytes }))
}

main().catch((error) => {
  console.error(JSON.stringify({ msg: '攻略图片构建检查失败', error: String(error) }))
  process.exitCode = 1
})
