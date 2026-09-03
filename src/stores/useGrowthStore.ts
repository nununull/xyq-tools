import { computed, reactive, ref, watch } from 'vue'
import { defineStore } from 'pinia'
import { calculateGrowth, createGrowthInput, GROWTH_TOOLS, getGrowthName, type GrowthInput, type GrowthKind } from '@/services/growthCalculator'

interface GrowthPlan { id: string; label: string; input: GrowthInput }
const STORAGE_KEY = 'xyq-tools:growth-inputs:v1'
const INPUT_KEYS = ['variant', 'current', 'target', 'progress', 'price', 'quality', 'quantity', 'characterLevel', 'fruitCap'] as const

/** 只读取普通对象，损坏的本地存储不会进入计算。 */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** 从持久化内容恢复已知字段，数值合法性由计算服务统一校验。 */
function restoreInput(value: unknown, kind: GrowthKind): GrowthInput {
  const input = createGrowthInput(kind)
  if (!isRecord(value)) return input
  for (const key of INPUT_KEYS) {
    if (typeof value[key] === 'string' && value[key].length <= 32) input[key] = value[key]
  }
  if (value.mode === 'experience' && (kind === 'level' || kind === 'fruit')) input.mode = 'experience'
  return input
}

/** 保存养成输入和预算项目，所有金额、经验和汇总均实时派生。 */
export const useGrowthStore = defineStore('growth', () => {
  const drafts = Object.fromEntries(GROWTH_TOOLS.map(tool => [tool.id, createGrowthInput(tool.id)])) as Record<GrowthKind, GrowthInput>
  const state = reactive({ active: 'training' as GrowthKind, drafts, plans: [] as GrowthPlan[], accounts: '1' })
  const storageWarning = ref('')
  const editingId = ref<string | null>(null)
  const notice = ref('')
  try {
    const raw: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null')
    if (isRecord(raw)) {
      if (GROWTH_TOOLS.some(tool => tool.id === raw.active)) state.active = raw.active as GrowthKind
      if (typeof raw.accounts === 'string' && raw.accounts.length <= 32) state.accounts = raw.accounts
      if (isRecord(raw.drafts)) {
        for (const tool of GROWTH_TOOLS) state.drafts[tool.id] = restoreInput(raw.drafts[tool.id], tool.id)
      }
      if (Array.isArray(raw.plans)) {
        for (const entry of raw.plans) {
          if (!isRecord(entry) || !isRecord(entry.input)) continue
          const savedKind = entry.input.kind
          if (!GROWTH_TOOLS.some(tool => tool.id === savedKind)) continue
          const kind = entry.input.kind as GrowthKind
          state.plans.push({ id: crypto.randomUUID(), label: kind === 'sect' && typeof entry.label === 'string' ? entry.label.slice(0, 40) : '', input: restoreInput(entry.input, kind) })
        }
      }
    }
    console.info(JSON.stringify({ msg: '养成计算输入已载入', plans: state.plans.length }))
  } catch {
    storageWarning.value = '上次输入无法读取，当前计算仍可使用。'
    console.warn(JSON.stringify({ msg: '养成计算输入读取失败' }))
  }
  /** 当前草稿随工具切换，不覆盖其他工具输入。 */
  const input = computed(() => state.drafts[state.active])
  /** 预算结果始终从项目输入派生，不存储金额快照。 */
  const plans = computed(() => state.plans.map(plan => ({ ...plan, label: plan.label || getGrowthName(plan.input), result: calculateGrowth(plan.input) })))

  /** 仅保存用户输入；浏览器拒绝存储时保留当前页面状态。 */
  function save(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
      storageWarning.value = ''
    } catch {
      if (!storageWarning.value) console.warn(JSON.stringify({ msg: '养成计算输入保存失败' }))
      storageWarning.value = '浏览器无法保存输入，刷新后需要重新填写。'
    }
  }
  watch(state, save, { deep: true, flush: 'post' })

  /** 切换工具并结束预算条目的编辑状态。 */
  function selectTool(kind: GrowthKind): void {
    state.active = kind
    editingId.value = null
    notice.value = ''
  }

  /** 将当前目标加入预算，或明确替换正在编辑的项目。 */
  function savePlan(): void {
    const result = calculateGrowth(input.value)
    if (!result || !result.rows.length) return
    const draft = { ...input.value }
    const previous = state.plans.find(plan => plan.id === editingId.value)
    if (previous) previous.input = draft
    else state.plans.push({ id: crypto.randomUUID(), label: '', input: draft })
    notice.value = previous ? '预算项目已更新。' : '已加入预算单。'
    editingId.value = null
    console.info(JSON.stringify({ msg: previous ? '养成预算项目已更新' : '养成目标已加入预算', kind: draft.kind, plans: state.plans.length }))
  }

  /** 将同级配置展开为独立项目，方便逐项调整三修、四宠修或七技能。 */
  function addBatch(): void {
    if (!calculateGrowth(input.value)?.rows.length) return
    const kind = input.value.kind
    const variants = kind === 'training' ? [input.value.variant === 'magic' ? 'magic' : 'attack', 'defense', 'resist'] : kind === 'pet-training' ? ['attack', 'magic', 'defense', 'resist'] : Array.from({ length: 7 }, () => '')
    variants.forEach((variant, index) => {
      const draft = { ...input.value, variant, quantity: '1' }
      state.plans.push({ id: crypto.randomUUID(), label: kind === 'sect' ? `师门技能 ${index + 1}` : '', input: draft })
    })
    editingId.value = null
    notice.value = `已加入${variants.length}项同级目标，可在预算单中逐项修改。`
    console.info(JSON.stringify({ msg: '养成预算已批量添加', kind, count: variants.length }))
  }

  /** 载入项目的输入副本，点击更新后才替换预算中的原目标。 */
  function editPlan(id: string): void {
    const plan = state.plans.find(item => item.id === id)
    if (!plan) return
    state.active = plan.input.kind
    state.drafts[plan.input.kind] = { ...plan.input }
    editingId.value = id
    notice.value = `正在修改「${plan.label || getGrowthName(plan.input)}」。改好后点击更新此项。`
  }

  /** 删除指定目标，其他项目的配置与结果保持独立。 */
  function removePlan(id: string): void {
    state.plans = state.plans.filter(plan => plan.id !== id)
    if (editingId.value === id) editingId.value = null
    notice.value = '预算项目已移除。'
    console.info(JSON.stringify({ msg: '养成预算项目已移除', plans: state.plans.length }))
  }

  return { state, input, plans, editingId, notice, storageWarning, selectTool, savePlan, addBatch, editPlan, removePlan }
})
