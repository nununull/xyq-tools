/** 返回浏览器本地自然日键，避免 UTC 日期造成凌晨误重置。 */
export function getLocalDateKey(now: Date): string {
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
