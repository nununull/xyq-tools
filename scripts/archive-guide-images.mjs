/* global AbortSignal, Buffer, console, fetch, process, setTimeout, TextDecoder, URL */
import { createHash } from 'node:crypto'
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { inflateSync } from 'node:zlib'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const ASSET_ROOT = path.join(ROOT, 'public/guide-images')
const CACHE = path.join(os.tmpdir(), 'xyq-guide-image-pages')
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/142.0 Safari/537.36'
// 该哈希经目视确认是旧站点的“图片无法显示”占位卡，不属于攻略正文。
const REJECTED_IMAGE_HASHES = new Set(['a4635ba4e853b3066babadc25a23370923e165ec9eafe4943a8479b0a32ccd11'])
const BODY_SELECTORS = [
  { className: 'warp_center' },
  { className: 'c-detail' },
  { className: 'newstext' },
  { className: 'article-content' },
  { className: 'gb-final-mod-article' },
  { id: 'mp-editor' },
  { id: 'article' },
  { id: 'Content' },
  { id: 'contentText' },
  { className: 'text-con' },
  { className: 'text' },
]

/** 使用统一的单行中文日志保留下载请求、结果与所属攻略。 */
function log(msg, context = {}) {
  console.info(JSON.stringify({ msg, ...context }))
}

/** 解析明确的命令行选项，拒绝缺少输入或输出的归档任务。 */
function optionsFromArguments() {
  const options = {}
  for (let index = 2; index < process.argv.length; index += 2) {
    options[process.argv[index].replace(/^--/, '')] = process.argv[index + 1]
  }
  if (!options.input || !options.output) throw new Error('必须提供 --input 与 --output')
  return { ...options, concurrency: Math.max(1, Math.min(6, Number(options.concurrency) || 3)) }
}

/** 解码正文常见的 HTML 实体，保持图片地址与原图题注完整。 */
function decodeHtml(value) {
  return value.replace(/&(?:amp|quot|apos|lt|gt|nbsp|#\d+|#x[\da-f]+);/gi, (entity) => {
    const named = { '&amp;': '&', '&quot;': '"', '&apos;': "'", '&lt;': '<', '&gt;': '>', '&nbsp;': ' ' }
    if (named[entity.toLowerCase()] !== undefined) return named[entity.toLowerCase()]
    const hexadecimal = entity.toLowerCase().startsWith('&#x')
    return String.fromCodePoint(Number.parseInt(entity.slice(hexadecimal ? 3 : 2, -1), hexadecimal ? 16 : 10))
  })
}

/** 提取标签属性，同时兼容单引号、双引号与无引号写法。 */
function attributesOf(tag) {
  const attributes = {}
  for (const match of tag.matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g)) {
    attributes[match[1].toLowerCase()] = decodeHtml(match[2] ?? match[3] ?? match[4] ?? '')
  }
  return attributes
}

/** 按标签深度截取正文容器，避免把推荐位、头像与页脚广告算成攻略图。 */
function extractContainer(html, selector) {
  for (const match of html.matchAll(/<(div|article|section)\b[^>]*>/gi)) {
    const attributes = attributesOf(match[0])
    if (selector.id && attributes.id !== selector.id) continue
    if (selector.className && !attributes.class?.split(/\s+/).includes(selector.className)) continue
    const tagPattern = new RegExp(`</?${match[1]}\\b[^>]*>`, 'gi')
    tagPattern.lastIndex = match.index
    let depth = 0
    for (let tag = tagPattern.exec(html); tag; tag = tagPattern.exec(html)) {
      depth += tag[0].startsWith('</') ? -1 : 1
      if (depth === 0) return html.slice(match.index + match[0].length, tag.index)
    }
  }
  return null
}

/** 只接受已识别的正文区域，未知网站需显式提供容器，禁止抓整站图片。 */
function articleBody(html, source) {
  let result = source.selector ? extractContainer(html, source.selector) : null
  if (source.selector && result === null) throw new Error('指定的攻略正文容器不存在')
  for (const selector of BODY_SELECTORS) {
    if (result !== null) break
    const body = extractContainer(html, selector)
    if (body !== null && /<img\b/i.test(body)) result = body
  }
  if (result !== null && source.bodyEnd) {
    const boundary = result.indexOf(source.bodyEnd)
    if (boundary < 0) throw new Error(`未找到已核对的正文边界：${source.bodyEnd}`)
    result = result.slice(0, boundary)
  }
  return result
}

/** 规范化公开图片链接，拒绝内联占位内容与非网络协议。 */
function publicUrl(value, base) {
  try {
    if (!/^(?:https?:|\/|\.\.?\/)/i.test(value) && !/\.(?:html?|shtml|jpe?g|png|webp|gif)(?:[?#]|$)/i.test(value)) return null
    const url = new URL(decodeHtml(value), base)
    url.hash = ''
    return ['http:', 'https:'].includes(url.protocol) ? url.href : null
  } catch {
    return null
  }
}

/** 从正文图片选择原图地址，优先使用显式的大图与懒加载地址。 */
function imageCandidates(body, pageUrl, title) {
  const images = []
  for (const match of body.matchAll(/<img\b[^>]*>/gi)) {
    const attributes = attributesOf(match[0])
    const anchorStart = body.lastIndexOf('<a', match.index)
    const anchorEnd = body.lastIndexOf('</a>', match.index)
    const anchor = anchorStart > anchorEnd ? attributesOf(body.slice(anchorStart, body.indexOf('>', anchorStart) + 1)) : {}
    const linkedUrl = anchor.href && publicUrl(anchor.href, pageUrl)
    const linkedOriginal = linkedUrl && /viewpic\.htm/i.test(linkedUrl)
      ? new URL(linkedUrl).searchParams.get('url')
      : linkedUrl && /\.(?:jpe?g|png|webp|gif)(?:\?|$)/i.test(linkedUrl) ? linkedUrl : undefined
    const original = attributes.onclick?.match(/showbigpic\([^,]+,\s*['"]([^'"]+)['"]/i)?.[1] || linkedOriginal
    const value = original || attributes['data-original'] || attributes['data-src'] || attributes['data-lazy-src'] || attributes['data-echo'] || attributes.src
    const url = value && publicUrl(value, pageUrl)
    if (!url || /(?:avatar|qrcode|qr-code|logo|\/newpage\/|\/common\/img\/|\.svg(?:\?|$))/i.test(url)) continue
    if (images.some((image) => image.url === url)) continue
    const originalAlt = attributes.alt?.trim()
    const caption = originalAlt && !/^(?:游侠网\d*|图片\d*|image\d*|图\d*)$/i.test(originalAlt)
      ? originalAlt
      : `${title} · 原文配图 ${images.length + 1}`
    images.push({ url, caption })
  }
  return images
}

/** 仅跟随同一文章的数字分页，不进入相关推荐或其他攻略。 */
function paginationUrls(html, initialUrl) {
  const initial = new URL(initialUrl)
  const match = initial.pathname.match(/^(.*\/)(\d+)(?:_\d+|_all)?\.(html|shtml)$/i)
  if (!match) return []
  const pattern = new RegExp(`^${match[1].replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}${match[2]}(?:_\\d+|_all)?\\.${match[3]}$`, 'i')
  return [...html.matchAll(/<a\b[^>]*href\s*=\s*["']([^"']+)["'][^>]*>/gi)]
    .map((link) => publicUrl(link[1], initialUrl))
    .filter((url) => url && new URL(url).hostname === initial.hostname && pattern.test(new URL(url).pathname))
}

/** 带有限重试读取公开资源，请求使用真实原文地址作为 Referer。 */
async function request(url, referer = url) {
  let failure
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: { 'User-Agent': USER_AGENT, Referer: referer },
        redirect: 'follow',
        signal: AbortSignal.timeout(25000),
      })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const buffer = Buffer.from(await response.arrayBuffer())
      if (buffer.length > 25 * 1024 * 1024) throw new Error('单个资源超过 25 MB，需人工核对')
      return { buffer, contentType: response.headers.get('content-type') ?? '', url: response.url }
    } catch (error) {
      failure = error
      if (attempt < 2) await new Promise((resolve) => setTimeout(resolve, 800))
    }
  }
  throw failure
}

/** 缓存原文 HTML 以支持中断续传；缓存仅留在临时目录，不进入产品代码。 */
async function readPage(url) {
  const cacheFile = path.join(CACHE, `${createHash('sha256').update(url).digest('hex')}.json`)
  try {
    return JSON.parse(await readFile(cacheFile, 'utf8'))
  } catch {
    const response = await request(url)
    const declared = response.contentType.match(/charset=([^;\s]+)/i)?.[1]
    const header = response.buffer.subarray(0, 4000).toString('ascii')
    const charset = declared || header.match(/charset\s*=\s*["']?([\w-]+)/i)?.[1] || 'utf-8'
    const page = { html: new TextDecoder(charset).decode(response.buffer), url: response.url }
    await writeFile(cacheFile, JSON.stringify(page))
    return page
  }
}

/** 验证真实文件签名和尺寸，防止把防盗链错误页或跟踪像素存成图片。 */
function imageFormat(buffer) {
  if (buffer.length >= 24 && buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) {
    const compressed = []
    let ended = false
    for (let offset = 8; offset + 12 <= buffer.length;) {
      const length = buffer.readUInt32BE(offset)
      if (offset + length + 12 > buffer.length) throw new Error('PNG 数据块被截断')
      const type = buffer.subarray(offset + 4, offset + 8).toString()
      if (type === 'IDAT') compressed.push(buffer.subarray(offset + 8, offset + 8 + length))
      if (type === 'IEND') { ended = true; break }
      offset += length + 12
    }
    if (!ended || !compressed.length) throw new Error('PNG 缺少完整的图像数据或结束块')
    inflateSync(Buffer.concat(compressed), { maxOutputLength: 100 * 1024 * 1024 })
    return { extension: 'png', width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) }
  }
  if (buffer.length >= 10 && /^GIF8[79]a$/.test(buffer.subarray(0, 6).toString())) {
    return { extension: 'gif', width: buffer.readUInt16LE(6), height: buffer.readUInt16LE(8) }
  }
  if (buffer.length >= 30 && buffer.subarray(0, 4).toString() === 'RIFF' && buffer.subarray(8, 12).toString() === 'WEBP') {
    if (buffer.readUInt32LE(4) + 8 > buffer.length) throw new Error('WebP 文件被截断')
    const chunk = buffer.subarray(12, 16).toString()
    if (chunk === 'VP8X') return { extension: 'webp', width: buffer.readUIntLE(24, 3) + 1, height: buffer.readUIntLE(27, 3) + 1 }
    if (chunk === 'VP8 ') return { extension: 'webp', width: buffer.readUInt16LE(26) & 0x3fff, height: buffer.readUInt16LE(28) & 0x3fff }
    if (chunk === 'VP8L') {
      const bits = buffer.readUInt32LE(21)
      return { extension: 'webp', width: (bits & 0x3fff) + 1, height: ((bits >>> 14) & 0x3fff) + 1 }
    }
  }
  if (buffer.length >= 4 && buffer[0] === 0xff && buffer[1] === 0xd8) {
    if (buffer.lastIndexOf(Buffer.from([0xff, 0xd9])) < 2) throw new Error('JPEG 缺少结束标记')
    for (let offset = 2; offset + 8 < buffer.length;) {
      if (buffer[offset] !== 0xff) break
      const marker = buffer[offset + 1]
      if (marker === 0xff) { offset += 1; continue }
      if ([0xd8, 0xd9].includes(marker)) { offset += 2; continue }
      if ([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(marker)) {
        return { extension: 'jpg', width: buffer.readUInt16BE(offset + 7), height: buffer.readUInt16BE(offset + 5) }
      }
      const length = buffer.readUInt16BE(offset + 2)
      if (length < 2) break
      offset += length + 2
    }
  }
  throw new Error('响应不是可验证的 PNG/JPEG/GIF/WebP 图片')
}

/** 在限定并发下按输入顺序返回结果，确保配图顺序与原文一致。 */
async function mapLimited(values, concurrency, action) {
  const results = new Array(values.length)
  let next = 0
  await Promise.all(Array.from({ length: Math.min(concurrency, values.length) }, async () => {
    while (next < values.length) {
      const index = next++
      results[index] = await action(values[index], index)
    }
  }))
  return results
}

/** 校验既有归档的内容与索引一致，损坏或缺失的文件不能作为离线备份。 */
async function readVerifiedArchiveImage(image) {
  const buffer = await readFile(path.join(ASSET_ROOT, image.file))
  const hash = createHash('sha256').update(buffer).digest('hex')
  const format = imageFormat(buffer)
  if (hash !== image.hash || format.width !== image.width || format.height !== image.height) {
    throw new Error(`本地图片与归档索引不符：${image.file}`)
  }
  return buffer
}

/** 优先复用完整的本地原图，缓存缺失或损坏时重新请求原地址修复。 */
async function readCandidateImage(candidate, cached) {
  if (cached) {
    try {
      return { buffer: await readVerifiedArchiveImage(cached), reused: true }
    } catch (error) {
      log('本地图片不可用，重新下载原图', { file: cached.file, url: candidate.url, referer: candidate.sourcePage, error: String(error) })
    }
  }
  return { buffer: (await request(candidate.url, candidate.sourcePage)).buffer, reused: false }
}

/** 归档单份攻略的所有明确来源，失败信息保留在元数据中供页面和核查使用。 */
async function archiveGuide(scope, guide, previous, concurrency) {
  if (!/^[a-z0-9-]+$/.test(guide.id)) throw new Error(`攻略标识非法：${guide.id}`)
  const directory = path.join(ASSET_ROOT, 'originals')
  await mkdir(directory, { recursive: true })
  const images = []
  const sources = []
  const hashes = new Set()
  const cacheByUrl = new Map((previous?.images ?? []).map((image) => [image.sourceUrl, image]))

  for (const rawSource of guide.sources) {
    const originalSource = typeof rawSource === 'string' ? { url: rawSource } : rawSource
    const source = { ...originalSource, ...originalSource.extraction }
    const record = { url: source.url, label: source.label || guide.title, status: 'no-images', pages: 0, imageCount: 0, failedImages: 0 }
    const extraPages = Array.isArray(source.pages) ? source.pages : source.extraPages ?? []
    const extraction = { selector: source.selector, bodyEnd: source.bodyEnd, excludeImageUrls: source.excludeImageUrls, followPages: source.followPages, minimumImageWidth: source.minimumImageWidth, minimumImageHeight: source.minimumImageHeight, extraPages: extraPages.length ? extraPages : undefined }
    if (Object.values(extraction).some((value) => value !== undefined)) record.extraction = extraction
    const pending = [...new Set([source.url, ...extraPages])]
    const visited = new Set()
    const candidates = []
    try {
      while (pending.length && visited.size < 35) {
        const pageUrl = pending.shift()
        if (visited.has(pageUrl)) continue
        visited.add(pageUrl)
        log('读取攻略原文', { scope, id: guide.id, url: pageUrl })
        const page = await readPage(pageUrl)
        const body = articleBody(page.html, source)
        record.pages += 1
        if (body !== null) {
          for (const image of imageCandidates(body, page.url, guide.title)) {
            if (source.excludeImageUrls?.includes(image.url)) continue
            if (!candidates.some((item) => item.url === image.url)) candidates.push({ ...image, sourcePage: page.url })
          }
        }
        if (source.followPages !== false) {
          pending.push(...paginationUrls(page.html, page.url).filter((url) => !visited.has(url)))
        }
      }
      const downloaded = await mapLimited(candidates, concurrency, async (candidate) => {
        try {
          const cached = cacheByUrl.get(candidate.url)
          const { buffer, reused } = await readCandidateImage(candidate, cached)
          const format = imageFormat(buffer)
          if (format.width < (source.minimumImageWidth ?? 16) || format.height < (source.minimumImageHeight ?? 16)) return null
          const hash = createHash('sha256').update(buffer).digest('hex')
          if (REJECTED_IMAGE_HASHES.has(hash)) throw new Error('已确认的站点错误占位图，拒绝归档')
          record.imageCount += 1
          // 未变化的本地原图继续复用派生缩略图，不把优化结果还原成下载前的大文件。
          if (cached?.hash === hash) {
            if (!reused) await writeFile(path.join(ASSET_ROOT, cached.file), buffer)
            return { ...cached, caption: candidate.caption, sourcePage: candidate.sourcePage }
          }
          const file = `originals/${hash.slice(0, 20)}.${format.extension}`
          await writeFile(path.join(ASSET_ROOT, file), buffer)
          return { file, caption: candidate.caption, sourceUrl: candidate.url, sourcePage: candidate.sourcePage, width: format.width, height: format.height, hash }
        } catch (error) {
          record.failedImages += 1
          log('正文图片下载失败', { scope, id: guide.id, url: candidate.url, referer: candidate.sourcePage, error: String(error) })
          return null
        }
      })
      for (const image of downloaded.filter(Boolean)) {
        if (hashes.has(image.hash)) continue
        hashes.add(image.hash)
        images.push(image)
      }
      if (record.imageCount) record.status = record.failedImages ? 'partial' : 'saved'
      else if (record.failedImages) record.status = 'failed'
      if (!candidates.length) record.message = '来源未解析出可下载的正文配图'
    } catch (error) {
      record.status = 'failed'
      record.message = String(error)
    }
    sources.push(record)
    log('攻略来源归档完成', { scope, id: guide.id, ...record })
  }
  // 来源下线或只抓到部分正文时，已有的有效备份继续留在索引里。
  const incompleteRefresh = previous?.images?.length && sources.some((source) => source.status !== 'saved')
  if (incompleteRefresh) {
    const excludedUrls = new Set(guide.sources.flatMap((source) => typeof source === 'string'
      ? [] : source.extraction?.excludeImageUrls ?? source.excludeImageUrls ?? []))
    let preserved = 0
    for (const image of previous.images) {
      if (hashes.has(image.hash) || excludedUrls.has(image.sourceUrl)) continue
      try {
        await readVerifiedArchiveImage(image)
        images.push(image)
        hashes.add(image.hash)
        preserved += 1
      } catch (error) {
        log('旧配图备份校验失败', { scope, id: guide.id, file: image.file, error: String(error) })
      }
    }
    log('来源未完整刷新，保留已有有效配图', { scope, id: guide.id, preserved })
  }
  return { title: guide.title, images, sources }
}

/** 逐份保存归档索引，中断后保留已下载图片和已完成攻略。 */
async function main() {
  const options = optionsFromArguments()
  const input = JSON.parse(await readFile(path.resolve(options.input), 'utf8'))
  if (!['dungeons', 'artifacts', 'adventures'].includes(input.scope)) throw new Error('未知攻略分类')
  const output = path.resolve(ROOT, options.output)
  if (!output.startsWith(path.join(ROOT, 'src/data/guide-images') + path.sep)) throw new Error('输出必须位于 src/data/guide-images/')
  await mkdir(path.dirname(output), { recursive: true })
  await mkdir(CACHE, { recursive: true })
  let archive = { scope: input.scope, archivedAt: new Date().toISOString(), guides: {} }
  try { archive = JSON.parse(await readFile(output, 'utf8')) } catch { /* 首次归档尚无索引。 */ }
  const guides = Array.isArray(input.guides) ? input.guides : Object.entries(input.guides).map(([id, guide]) => ({ id, ...guide }))
  for (const guide of guides) {
    archive.guides[guide.id] = await archiveGuide(input.scope, guide, archive.guides[guide.id], options.concurrency)
    archive.archivedAt = new Date().toISOString()
    await writeFile(`${output}.tmp`, JSON.stringify(archive, null, 2) + '\n')
    await rename(`${output}.tmp`, output)
  }
  log('整批攻略图片归档完成', { scope: input.scope, guides: Object.keys(archive.guides).length, images: Object.values(archive.guides).reduce((total, guide) => total + guide.images.length, 0), output })
  log('发布前生成缩略图并无损优化新增原图', { command: 'python scripts/optimize-guide-images.py' })
}

main().catch((error) => {
  log('图片归档任务失败', { error: String(error) })
  process.exitCode = 1
})
