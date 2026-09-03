export type MaterialKind = 'gem' | 'dust' | 'starlight'
export type SynthesisMode = 'single' | 'range'
export type CurrencyUnit = 'wan' | 'yi'
export type ConversionDirection = 'sell' | 'buy'

export const CBG_FEE_RATE = 0.05
export const COIN_UNITS = { wan: 10_000, yi: 100_000_000 } as const

interface MaterialRule {
  id: MaterialKind
  name: string
  maxLevel: number
  multiplier: number
  description: string
  extraMaterials: Readonly<Record<number, readonly number[]>>
  source: string
}

// 高等级合成包含额外提交的材料；重复等级表示需要多颗该等级材料。
export const MATERIAL_RULES: readonly MaterialRule[] = [
  {
    id: 'gem', name: '宝石', maxLevel: 20, multiplier: 2,
    description: '同类宝石二合一；12级起计入必成所需的额外宝石。',
    extraMaterials: { 12: [3, 5, 6], 13: [9], 14: [9, 10], 15: [9, 12], 16: [11, 12, 13], 17: [15], 18: [13, 14, 16], 19: [15, 16, 17], 20: [17, 18, 18] },
    source: 'https://www.mhxy175.com/index.php?a=index&aid=89&c=View&m=home',
  },
  {
    id: 'dust', name: '五色灵尘', maxLevel: 15, multiplier: 2,
    description: '2级二合一；3级起，另需一份低两级的五色灵尘。',
    extraMaterials: {},
    source: 'https://ol.3dmgame.com/gl/304240.html',
  },
  {
    id: 'starlight', name: '星辉石', maxLevel: 11, multiplier: 3,
    description: '星辉石三合一；9级起计入必成所需的额外星辉石。',
    extraMaterials: { 9: [5], 10: [6, 7], 11: [9] },
    source: 'https://www.mhxy175.com/index.php?a=index&aid=93&c=View&m=home',
  },
]

export interface SynthesisRow {
  level: number
  quantity: number
  cumulativeQuantity: number
  recipe: string
}

/** 只接受普通十进制金额，拒绝负数、指数、无穷值及超出精度范围的输入。 */
export function parseAmount(input: string, allowZero = true): number | null {
  const value = input.trim()
  if (!/^(?:\d+(?:\.\d{0,8})?|\.\d{1,8})$/.test(value)) return null
  const amount = Number(value)
  return Number.isFinite(amount) && amount <= 1e12 && (allowZero ? amount >= 0 : amount > 0)
    ? amount : null
}

/** 将金额统一舍入到分，超出安全金额范围时停止输出估算结果。 */
export function roundMoney(value: number): number | null {
  if (!Number.isFinite(value) || value < 0 || value * 100 > Number.MAX_SAFE_INTEGER) return null
  return Math.round((value + Number.EPSILON * value) * 100) / 100
}

/** 从原始金价单向派生人民币单价，两个页面使用同一个换算口径。 */
export function getYuanPerCoin(rmb: string, wan: string): number | null {
  const yuan = parseAmount(rmb, false)
  const coins = parseAmount(wan, false)
  return yuan === null || coins === null ? null : yuan / (coins * COIN_UNITS.wan)
}

/** 结算卖币金额；手续费按折算金额收取，净额与手续费严格相加等于总额。 */
export function calculateSale(coins: number, yuanPerCoin: number) {
  const gross = roundMoney(coins * yuanPerCoin)
  if (gross === null) return null
  const fee = roundMoney(gross * CBG_FEE_RATE)
  if (fee === null) return null
  return { gross, fee, net: (Math.round(gross * 100) - Math.round(fee * 100)) / 100 }
}

/** 查找材料唯一规则，供等级校验、配方展示与成本计算共同使用。 */
export function getMaterialRule(kind: MaterialKind): MaterialRule {
  return MATERIAL_RULES.find((rule) => rule.id === kind)!
}

/** 递推全部一级材料消耗，额外材料也按实际配方递归折算。 */
export function buildSynthesisRows(kind: MaterialKind, target: number, current = 0): SynthesisRow[] {
  const rule = getMaterialRule(kind)
  if (!Number.isInteger(target) || target < 1 || target > rule.maxLevel ||
      !Number.isInteger(current) || current < 0 || current >= target) return []
  const quantities: number[] = [0, 1]
  const rows: SynthesisRow[] = []
  let cumulativeQuantity = 0
  for (let level = 1; level <= target; level += 1) {
    const extras = kind === 'dust' && level >= 3 ? [level - 2] : rule.extraMaterials[level] ?? []
    const quantity = level === 1 ? 1 :
      rule.multiplier * quantities[level - 1]! + extras.reduce((sum, extra) => sum + quantities[extra]!, 0)
    quantities[level] = quantity
    if (level <= current) continue
    cumulativeQuantity += quantity
    const recipe = level === 1 ? '直接购买一级材料' :
      [`${rule.multiplier}颗${level - 1}级`, ...extras.map((extra) => `1颗${extra}级`)].join(' + ')
    rows.push({ level, quantity, cumulativeQuantity, recipe })
  }
  return rows
}

/** 统一展示人民币精度，缺少输入时保留明确的空值占位。 */
export function formatYuan(value: number | null): string {
  return value === null ? '—' : value.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

/** 按万或亿展示梦幻币，避免大额结果挤满页面。 */
export function formatCoins(coins: number | null): string {
  if (coins === null) return '—'
  const divisor = coins >= COIN_UNITS.yi ? COIN_UNITS.yi : COIN_UNITS.wan
  return `${(coins / divisor).toLocaleString('zh-CN', { maximumFractionDigits: 4 })}${divisor === COIN_UNITS.yi ? '亿' : '万'}`
}

/** 使用千分位展示完整材料数量。 */
export function formatQuantity(value: number): string {
  return value.toLocaleString('zh-CN')
}
