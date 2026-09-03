import { computed, reactive, ref, watch } from 'vue'
import { defineStore } from 'pinia'
import { getYuanPerCoin, type ConversionDirection, type CurrencyUnit, type MaterialKind, type SynthesisMode } from '@/services/calculators'

interface CalculatorPreferences {
  rateRmb: string
  rateWan: string
  direction: ConversionDirection
  currencyUnit: CurrencyUnit
  currencyAmount: string
  material: MaterialKind
  synthesisMode: SynthesisMode
  targetLevel: string
  currentLevel: string
  prices: Record<MaterialKind, string>
}

const STORAGE_KEY = 'xyq-tools:calculator-preferences:v1'

/** 创建输入初始值，不将示例价格冒充为玩家所在区服的真实行情。 */
function defaultPreferences(): CalculatorPreferences {
  return {
    rateRmb: '100', rateWan: '', direction: 'sell', currencyUnit: 'wan', currencyAmount: '',
    material: 'gem', synthesisMode: 'single', targetLevel: '10', currentLevel: '0',
    prices: { gem: '', dust: '', starlight: '' },
  }
}

/** 仅从对象读取偏好，忽略数组、空值和不受支持的旧格式。 */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** 校验本地输入结构；损坏字段单独回退，不影响其他有效输入。 */
function restorePreferences(value: unknown): CalculatorPreferences {
  const defaults = defaultPreferences()
  if (!isRecord(value)) return defaults
  for (const key of ['rateRmb', 'rateWan', 'currencyAmount', 'targetLevel', 'currentLevel'] as const) {
    if (typeof value[key] === 'string' && value[key].length <= 32) defaults[key] = value[key]
  }
  if (value.direction === 'sell' || value.direction === 'buy') defaults.direction = value.direction
  if (value.currencyUnit === 'wan' || value.currencyUnit === 'yi') defaults.currencyUnit = value.currencyUnit
  if (value.material === 'gem' || value.material === 'dust' || value.material === 'starlight') defaults.material = value.material
  if (value.synthesisMode === 'single' || value.synthesisMode === 'range') defaults.synthesisMode = value.synthesisMode
  if (isRecord(value.prices)) {
    for (const kind of ['gem', 'dust', 'starlight'] as const) {
      if (typeof value.prices[kind] === 'string' && value.prices[kind].length <= 32) defaults.prices[kind] = value.prices[kind]
    }
  }
  return defaults
}

/** 维护各计算页共用的金价和输入偏好；计算结果始终派生，不重复保存。 */
export const useCalculatorStore = defineStore('calculator', () => {
  const storageWarning = ref('')
  let initial = defaultPreferences()
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved !== null) initial = restorePreferences(JSON.parse(saved))
    console.info(JSON.stringify({ msg: '换算工具偏好已载入', restored: saved !== null }))
  } catch {
    storageWarning.value = '上次输入无法读取，当前计算仍可使用。'
    console.warn(JSON.stringify({ msg: '换算工具偏好读取失败，已使用默认输入' }))
  }
  const preferences = reactive(initial)
  /** 金价只由用户填写的比例派生。 */
  const yuanPerCoin = computed(() => getYuanPerCoin(preferences.rateRmb, preferences.rateWan))

  /** 保存输入偏好，存储不可用时保留当前会话并只提示一次。 */
  function savePreferences(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences))
      storageWarning.value = ''
    } catch {
      if (!storageWarning.value) console.warn(JSON.stringify({ msg: '换算工具输入保存失败' }))
      storageWarning.value = '浏览器无法保存输入，刷新后需要重新填写。'
    }
  }
  watch(preferences, savePreferences, { deep: true, flush: 'post' })

  /** 按钮明确载入演示比例，便于首次使用时了解换算关系。 */
  function applyExampleRate(): void {
    preferences.rateRmb = '100'
    preferences.rateWan = '1250'
    console.info(JSON.stringify({ msg: '换算工具已载入示例金价', rmb: 100, wan: 1250 }))
  }

  return { preferences, yuanPerCoin, storageWarning, applyExampleRate }
})
