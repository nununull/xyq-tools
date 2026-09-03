import { AUXILIARY_BASE_COSTS, BODY_COSTS, CHARACTER_EXPERIENCE, CRAFT_COSTS, DAN_COSTS, SECT_COSTS, STONE_COSTS, STRONG_COINS, type GrowthCost } from '@/data/growthTables'
import { parseAmount } from './calculators'

export type GrowthKind = 'training' | 'pet-training' | 'sect' | 'auxiliary' | 'level' | 'pet-level' | 'dan' | 'fruit'
export type GrowthCategory = '修炼' | '技能' | '等级' | '进阶'
export interface GrowthInput {
  kind: GrowthKind
  variant: string
  current: string
  target: string
  progress: string
  price: string
  quality: string
  quantity: string
  characterLevel: string
  fruitCap: string
  mode: 'target' | 'experience'
}
export interface GrowthTool {
  id: GrowthKind
  name: string
  category: GrowthCategory
  description: string
  unit: string
  max: number
  resource: string
  hint: string
  source: string
}
export const GROWTH_TOOLS: readonly GrowthTool[] = [
  { id: 'training', name: '人物修炼', category: '修炼', description: '攻法双抗 · 猎术', unit: '级', max: 25, resource: '人物修炼经验', hint: '按帮派普通修炼，每次增加10点经验。只计算已开放上限内的升级，不含飞升降修、提升修炼上限的额外消耗。', source: 'https://xyq.17173.com/introduce/zd008.html' },
  { id: 'pet-training', name: '召唤兽修炼', category: '修炼', description: '修炼果数量与成本', unit: '级', max: 25, resource: '召唤兽修炼经验', hint: '每颗修炼果增加150点经验，按整颗购买，余量可用于后续升级。请按角色已开放的修炼上限填写。', source: 'https://xyq.yzz.cn/special/tools/zhsxljs.html' },
  { id: 'sect', name: '师门技能', category: '技能', description: '单项估算 · 七项预算', unit: '级', max: 180, resource: '人物经验', hint: '1—30级免经验，仍消耗梦幻币。技能等级上限受人物等级限制；这里只计算学习成本。', source: 'https://175lg.com/' },
  { id: 'auxiliary', name: '辅助技能', category: '技能', description: '强身强壮 · 生活技能', unit: '级', max: 160, resource: '人物经验', hint: '按帮派普通学习数表估算，实际费用受学习途径影响。帮贡消耗与学习门槛单独列出；强壮、神速最高60级，须满足角色和帮派研究条件。', source: 'https://175lg.com/' },
  { id: 'level', name: '人物升级', category: '等级', description: '经验缺口 · 反推等级', unit: '级', max: 175, resource: '人物经验', hint: '仅计算等级经验，不含技能、飞升、渡劫和化圣任务的消耗。达到经验要求后仍需满足游戏内升级条件。', source: 'https://175lg.com/' },
  { id: 'pet-level', name: '召唤兽升级', category: '等级', description: '升级经验 · 月华露预算', unit: '级', max: 180, resource: '召唤兽经验', hint: '月华露按每瓶「2 × 品质 × 当前等级 + 1000」经验逐次升级估算，不计随机触发的灵佑。宝宝等级仍受人物携带限制。', source: 'https://xyq.yzz.cn/focus/202303/1691880.shtml' },
  { id: 'dan', name: '乾元丹', category: '进阶', description: '九丹消耗与等级要求', unit: '个', max: 9, resource: '人物经验', hint: '按电脑版时间服九丹规则计算，列出炼化每颗乾元丹的经验、梦幻币和人物等级要求。', source: 'https://xyq.yzz.cn/special/tools/qydxhjs.html' },
  { id: 'fruit', name: '潜能果', category: '进阶', description: '兑换经验 · 反推数量', unit: '个', max: 200, resource: '人物经验', hint: '选择游戏内可兑换上限：60—89级50个；90级至未渡劫155级100个；渡劫155—169级150个；170级起200个。第101、151个起经验增幅变化。', source: 'https://www.mhgjx.com/' },
]

export const TRAINING_TYPES = [
  { id: 'attack', name: '攻击修炼', coins: 30000 }, { id: 'magic', name: '法术修炼', coins: 30000 },
  { id: 'defense', name: '防御修炼', coins: 20000 }, { id: 'resist', name: '抗法修炼', coins: 20000 },
  { id: 'hunting', name: '猎术修炼', coins: 30000 },
] as const
export const PET_TRAINING_TYPES = [
  { id: 'attack', name: '攻击控制力' }, { id: 'magic', name: '法术控制力' },
  { id: 'defense', name: '防御控制力' }, { id: 'resist', name: '抗法控制力' },
] as const
export const AUXILIARY_TYPES: readonly { id: string; name: string; table: readonly GrowthCost[] | 'strong'; max: number }[] = [
  { id: 'body', name: '强身术', table: BODY_COSTS, max: 140 },
  { id: 'meditation', name: '冥想', table: AUXILIARY_BASE_COSTS, max: 160 },
  { id: 'strong', name: '强壮', table: 'strong', max: 60 },
  { id: 'speed', name: '神速', table: 'strong', max: 60 },
  { id: 'craft', name: '打造技巧', table: CRAFT_COSTS, max: 160 },
  { id: 'tailoring', name: '裁缝技巧', table: CRAFT_COSTS, max: 160 },
  { id: 'alchemy', name: '炼金术', table: CRAFT_COSTS, max: 160 },
  { id: 'medicine', name: '中药医理', table: AUXILIARY_BASE_COSTS, max: 160 },
  { id: 'cooking', name: '烹饪技巧', table: AUXILIARY_BASE_COSTS, max: 160 },
  { id: 'health', name: '养生之道', table: AUXILIARY_BASE_COSTS, max: 160 },
  { id: 'fitness', name: '健身术', table: AUXILIARY_BASE_COSTS, max: 160 },
  { id: 'furniture', name: '巧匠之术', table: AUXILIARY_BASE_COSTS, max: 160 },
  { id: 'smelting', name: '熔炼技巧', table: AUXILIARY_BASE_COSTS, max: 160 },
  { id: 'hidden', name: '暗器技巧', table: AUXILIARY_BASE_COSTS, max: 160 },
  { id: 'stone', name: '灵石技巧', table: STONE_COSTS, max: 120 },
]
export const DAN_LEVELS = [0, 69, 89, 109, 129, 155, 159, 164, 168, 171] as const
export interface GrowthRow { level: number; experience: number; coins: number | null; items: number }
export interface GrowthResult {
  rows: GrowthRow[]
  target: number
  experience: number
  totalExperience: number
  coins: number | null
  items: number
  overflow: number
  quantity: number
  helpUsed: number
  helpThreshold: number
  helpStarting: number
}
export type GrowthErrors = Partial<Record<keyof GrowthInput, string>>

/** 为八类工具分别建立输入，切换页面时互不覆盖。 */
export function createGrowthInput(kind: GrowthKind): GrowthInput {
  const defaults: Record<GrowthKind, [string, string, string]> = {
    training: ['attack', '0', '9'], 'pet-training': ['attack', '0', '10'], sect: ['', '70', '79'],
    auxiliary: ['body', '100', '140'], level: ['', '69', '89'], 'pet-level': ['', '30', '79'],
    dan: ['', '0', '1'], fruit: ['', '0', '100'],
  }
  const [variant, current, target] = defaults[kind]
  return { kind, variant, current, target, progress: '0', price: '', quality: '500', quantity: '1', characterLevel: '69', fruitCap: '100', mode: 'target' }
}

/** 工具元信息来自固定目录，不接受外部注入的模块名称。 */
export function getGrowthTool(kind: GrowthKind): GrowthTool {
  return GROWTH_TOOLS.find(tool => tool.id === kind)!
}

/** 按所选技能或潜能果上限约束输入范围。 */
export function getGrowthMax(input: GrowthInput): number {
  if (input.kind === 'auxiliary') return AUXILIARY_TYPES.find(item => item.id === input.variant)?.max ?? 0
  if (input.kind === 'fruit') return [50, 100, 150, 200].includes(Number(input.fruitCap)) ? Number(input.fruitCap) : 0
  return getGrowthTool(input.kind).max
}

/** 生成预算条目的业务名称，避免保存一份会过时的结果标题。 */
export function getGrowthName(input: GrowthInput): string {
  if (input.kind === 'training') return TRAINING_TYPES.find(item => item.id === input.variant)?.name ?? '人物修炼'
  if (input.kind === 'pet-training') return `宠修 · ${PET_TRAINING_TYPES.find(item => item.id === input.variant)?.name ?? ''}`
  if (input.kind === 'auxiliary') return AUXILIARY_TYPES.find(item => item.id === input.variant)?.name ?? '辅助技能'
  return getGrowthTool(input.kind).name
}

/** 读取累计数表的相邻差，保持明细与汇总只有一个数据来源。 */
function costDifference(table: readonly GrowthCost[], level: number): GrowthCost {
  return [table[level]![0] - table[level - 1]![0], table[level]![1] - table[level - 1]![1]]
}

/** 计算升到指定等级或兑换指定果子的单级消耗。 */
export function growthStep(input: GrowthInput, level: number): GrowthCost {
  switch (input.kind) {
    case 'training': case 'pet-training': return [(level * level + 3 * level + 11) * 10, 0]
    case 'sect': return costDifference(SECT_COSTS, level)
    case 'auxiliary': {
      const skill = AUXILIARY_TYPES.find(item => item.id === input.variant)!
      if (skill.table === 'strong') {
        const coins = STRONG_COINS[level]! - STRONG_COINS[level - 1]!
        return [coins * 4, coins]
      }
      return costDifference(skill.table, level)
    }
    case 'level': return [CHARACTER_EXPERIENCE[level]! - CHARACTER_EXPERIENCE[level - 1]!, 0]
    case 'pet-level': return [50 * level * level * (level > 155 ? 3 : level > 150 ? 2 : 1), 0]
    case 'dan': return costDifference(DAN_COSTS, level)
    case 'fruit': return [(level <= 100 ? 1000 + 15 * (level - 1) : level <= 150 ? 2500 + 80 * (level - 100) : 6500 + 120 * (level - 150)) * 10000, 0]
  }
}

/** 仅接受范围内的十进制整数，不将空值、小数或指数形式当作等级。 */
export function parseGrowthInteger(value: string, max: number, min = 0): number | null {
  const number = parseAmount(value)
  return number !== null && Number.isInteger(number) && number >= min && number <= max ? number : null
}

/** 完整校验输入，异常字段会清空本次结果，避免继续展示旧金额。 */
export function validateGrowth(input: GrowthInput): GrowthErrors {
  const errors: GrowthErrors = {}
  const max = getGrowthMax(input)
  const current = parseGrowthInteger(input.current, max)
  const target = parseGrowthInteger(input.target, max)
  const progress = parseGrowthInteger(input.progress.trim() || '0', 1e12)
  const options = input.kind === 'training' ? TRAINING_TYPES : input.kind === 'pet-training' ? PET_TRAINING_TYPES : input.kind === 'auxiliary' ? AUXILIARY_TYPES : null
  if (options && !options.some(option => option.id === input.variant)) errors.variant = '请选择有效的类型。'
  if (!max) errors.fruitCap = '请选择有效的等级或数量上限。'
  if (current === null) errors.current = `请输入0至${max}之间的整数。`
  if (input.mode === 'target' && (target === null || (current !== null && target < current))) errors.target = `目标须在当前值至${max}之间。`
  if (parseGrowthInteger(input.quantity, 99, 1) === null) errors.quantity = '请输入1至99之间的整数份数。'
  if (progress === null) errors.progress = '请输入非负整数经验，最多1万亿。'
  if (!errors.variant && !errors.current && current !== null && progress !== null && ['training', 'pet-training', 'pet-level'].includes(input.kind)) {
    const limit = current < max ? growthStep(input, current + 1)[0] : 0
    if ((limit === 0 && progress > 0) || (limit > 0 && progress >= limit)) errors.progress = limit ? `当前级经验必须小于${limit.toLocaleString('zh-CN')}，已升级请修改当前等级。` : '已达上限，当前级经验请填0。'
  }
  if (['pet-training', 'pet-level'].includes(input.kind) && input.price.trim() && (parseAmount(input.price) === null || Number(input.price) > 10000)) errors.price = '单价须在0至10000万梦幻币之间，最多8位小数。'
  if (input.kind === 'pet-level' && parseGrowthInteger(input.quality, 1000, 1) === null) errors.quality = '请输入1至1000之间的整数品质。'
  if (input.kind === 'dan') {
    const character = parseGrowthInteger(input.characterLevel, 175, 0)
    if (character === null) errors.characterLevel = '请输入0至175之间的人物等级。'
    else if (target !== null && character < DAN_LEVELS[target]!) errors.target = `第${target}颗乾元丹需要人物达到${DAN_LEVELS[target]}级。`
  }
  return errors
}

/** 将当前进度逐级抵扣；材料整份取整后的溢出会传递到下一级。 */
export function calculateGrowth(input: GrowthInput): GrowthResult | null {
  if (Object.keys(validateGrowth(input)).length) return null
  const current = Number(input.current)
  const progress = Number(input.progress)
  const quantity = Number(input.quantity)
  const reverse = input.mode === 'experience' && (input.kind === 'level' || input.kind === 'fruit')
  let target = reverse ? getGrowthMax(input) : Number(input.target)
  let available = progress
  if (reverse) {
    target = current
    while (target < getGrowthMax(input) && available >= growthStep(input, target + 1)[0]) {
      available -= growthStep(input, ++target)[0]
    }
  }
  const hasProgress = ['training', 'pet-training', 'level', 'pet-level', 'fruit'].includes(input.kind)
  let carry = hasProgress ? progress : 0
  let totalExperience = 0
  let helpUsed = 0
  let helpStarting = 0
  const rows: GrowthRow[] = []
  const price = parseAmount(input.price)
  for (let level = current + 1; level <= target; level++) {
    const [experience, baseCoins] = growthStep(input, level)
    totalExperience += experience
    const needed = Math.max(0, experience - carry)
    carry = Math.max(0, carry - experience)
    let coins: number | null = baseCoins
    let items = 0
    if (input.kind === 'training' || input.kind === 'pet-training' || input.kind === 'pet-level') {
      const perItem = input.kind === 'training' ? 10 : input.kind === 'pet-training' ? 150 : 2 * Number(input.quality) * (level - 1) + 1000
      items = Math.ceil(needed / perItem)
      carry += items * perItem - needed
      coins = input.kind === 'training' ? items * TRAINING_TYPES.find(type => type.id === input.variant)!.coins : items === 0 ? 0 : price === null ? null : items * price * 10000
    }
    if (input.kind === 'auxiliary') {
      helpStarting = Math.max(helpStarting, helpUsed + level * 5)
      helpUsed += level
    }
    rows.push({ level, experience, coins, items })
  }
  const rawCoins = rows.some(row => row.coins === null) ? null : rows.reduce((sum, row) => sum + row.coins!, 0) * quantity
  return {
    rows, target, quantity, totalExperience: totalExperience * quantity,
    experience: Math.max(0, totalExperience - (hasProgress ? progress : 0)) * quantity,
    coins: rawCoins !== null && Number.isFinite(rawCoins) && rawCoins <= Number.MAX_SAFE_INTEGER ? rawCoins : null,
    items: rows.reduce((sum, row) => sum + row.items, 0) * quantity,
    overflow: carry * quantity, helpUsed: helpUsed * quantity, helpStarting,
    helpThreshold: target === current ? 0 : input.kind === 'training' ? target * 150 : input.kind === 'auxiliary' ? target * 5 : 0,
  }
}
