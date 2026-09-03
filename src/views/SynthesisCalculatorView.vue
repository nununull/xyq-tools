<script setup lang="ts">
import { computed } from 'vue'
import { ArrowUpRight, Gem, Layers3, Sparkles, Star } from 'lucide-vue-next'
import GoldRatePanel from '@/components/calculators/GoldRatePanel.vue'
import CalculatorNumberField from '@/components/calculators/CalculatorNumberField.vue'
import { useCalculatorStore } from '@/stores/useCalculatorStore'
import { buildSynthesisRows, COIN_UNITS, formatCoins, formatQuantity, formatYuan, getMaterialRule, MATERIAL_RULES, parseAmount, roundMoney, type MaterialKind } from '@/services/calculators'
import '@/styles/calculators.css'

const store = useCalculatorStore()
const input = store.preferences
const icons = { gem: Gem, dust: Sparkles, starlight: Star }
/** 材料说明、等级上限和配方统一取自同一规则。 */
const rule = computed(() => getMaterialRule(input.material))
/** 将目标等级限制在该材料支持的整数范围内。 */
const target = computed(() => parseAmount(input.targetLevel, false))
/** 连续打段的当前等级表示已镶嵌的段数，单颗计算从一级材料开始。 */
const current = computed(() => input.synthesisMode === 'single' ? 0 : parseAmount(input.currentLevel))
/** 单价允许为空，未填时仍然显示所需材料数量。 */
const price = computed(() => parseAmount(input.prices[input.material]))
/** 目标等级错误不进入递推，避免异常输入或过时结果。 */
const targetError = computed(() => target.value === null || !Number.isInteger(target.value) || target.value > rule.value.maxLevel ? `请输入1至${rule.value.maxLevel}之间的整数等级。` : '')
/** 连续打段只计算当前段数之后的材料，不重复计算已经镶嵌的部分。 */
const currentError = computed(() => current.value === null || !Number.isInteger(current.value) || (target.value !== null && current.value >= target.value) ? '当前段数须为非负整数，且小于目标等级。' : '')
/** 单价为负数或格式非法时显示字段提示。 */
const priceError = computed(() => input.prices[input.material].trim() && price.value === null ? '请输入不小于0的单价，最多8位小数。' : '')
/** 逐级明细是总量和费用的唯一来源，避免独立计算产生口径差异。 */
const rows = computed(() => targetError.value || currentError.value ? [] : buildSynthesisRows(input.material, target.value!, current.value!))
/** 单颗取目标行材料数，连续打段取所选区间累计材料数。 */
const quantity = computed(() => {
  const last = rows.value.at(-1)
  return last === undefined ? null : input.synthesisMode === 'single' ? last.quantity : last.cumulativeQuantity
})
/** 仅在数量和单价有效时估算材料成本。 */
const totalCoins = computed(() => quantity.value === null ? null : costInCoins(quantity.value))
/** 人民币成本使用原始金价，不减去卖币手续费。 */
const totalYuan = computed(() => totalCoins.value === null || store.yuanPerCoin === null ? null : roundMoney(totalCoins.value * store.yuanPerCoin))
/** 成本超过数值精度时明确提示，而不是输出无穷大或截断值。 */
const costOverflow = computed(() => quantity.value !== null && price.value !== null && (totalCoins.value === null || (store.yuanPerCoin !== null && totalYuan.value === null)))

/** 按一级单价折算梦幻币成本，金额超过安全精度时返回空值。 */
function costInCoins(count: number): number | null {
  if (price.value === null) return null
  const result = count * price.value * COIN_UNITS.wan
  return Number.isFinite(result) && result <= Number.MAX_SAFE_INTEGER ? result : null
}

/** 将同一份材料成本换算为人民币，供明细和汇总共用。 */
function costInYuan(count: number): number | null {
  const coins = costInCoins(count)
  return coins === null || store.yuanPerCoin === null ? null : roundMoney(coins * store.yuanPerCoin)
}

/** 切换材料时保留各自单价，并将等级收敛到新材料的有效范围。 */
function changeMaterial(kind: MaterialKind): void {
  if (input.material === kind) return
  const maxLevel = getMaterialRule(kind).maxLevel
  if (target.value !== null && target.value > maxLevel) input.targetLevel = String(maxLevel)
  if (current.value !== null && current.value >= Number(input.targetLevel)) input.currentLevel = String(Number(input.targetLevel) - 1)
  input.material = kind
  globalThis.console.info(JSON.stringify({ msg: '合成材料已切换', material: kind }))
}
</script>

<template>
  <div class="calculator-page">
    <header class="calculator-header">
      <div>
        <p class="calculator-eyebrow">
          <Gem
            :size="16"
            aria-hidden="true"
          /> 梦幻西游 · 合成计算
        </p>
        <h1>往上合一级，<span>花多少？</span></h1>
        <p class="calculator-intro">
          一颗的成本，一路打上去的花费，都算清楚。
        </p>
      </div>
      <RouterLink
        :to="{ name: 'currency-converter' }"
        class="calculator-related"
      >
        去算卖币到手价 <ArrowUpRight
          :size="16"
          aria-hidden="true"
        />
      </RouterLink>
    </header>

    <GoldRatePanel />

    <section
      class="synthesis-workbench"
      aria-label="合成计算设置与结果"
    >
      <div
        class="material-picker"
        aria-label="材料类型"
      >
        <button
          v-for="item in MATERIAL_RULES"
          :key="item.id"
          type="button"
          :aria-pressed="input.material === item.id"
          @click="changeMaterial(item.id)"
        >
          <component
            :is="icons[item.id]"
            :size="20"
            aria-hidden="true"
          />
          <span>{{ item.name }}</span>
          <small>最高 {{ item.maxLevel }} 级</small>
        </button>
      </div>
      <div class="synthesis-workbench__body">
        <div class="synthesis-settings">
          <div
            class="calc-segment"
            aria-label="合成方式"
          >
            <button
              type="button"
              :aria-pressed="input.synthesisMode === 'single'"
              @click="input.synthesisMode = 'single'"
            >
              合一颗
            </button>
            <button
              type="button"
              :aria-pressed="input.synthesisMode === 'range'"
              @click="input.synthesisMode = 'range'"
            >
              连续打段
            </button>
          </div>
          <div class="synthesis-settings__levels">
            <CalculatorNumberField
              v-if="input.synthesisMode === 'range'"
              id="current-level"
              v-model="input.currentLevel"
              label="当前已打段数"
              suffix="段"
              :error="currentError"
            />
            <CalculatorNumberField
              id="target-level"
              v-model="input.targetLevel"
              :label="input.synthesisMode === 'range' ? '目标段数' : '目标等级'"
              :suffix="input.synthesisMode === 'range' ? '段' : '级'"
              :error="targetError"
            />
          </div>
          <CalculatorNumberField
            id="material-price"
            v-model="input.prices[input.material]"
            :label="`一级${rule.name}单价`"
            suffix="万梦幻币"
            placeholder="填单价，算出总花费"
            :error="priceError"
          />
          <p class="synthesis-settings__hint">
            {{ input.synthesisMode === 'single' ? '计算合成一颗目标等级材料的费用。' : '从当前段数的下一段起，逐段计算至目标段数。' }}
          </p>
        </div>

        <div
          class="synthesis-summary"
          aria-live="polite"
          aria-atomic="true"
        >
          <p class="synthesis-summary__label">
            <Layers3
              :size="17"
              aria-hidden="true"
            />{{ input.synthesisMode === 'single' ? `合成一颗 ${input.targetLevel} 级${rule.name}` : `${input.currentLevel} 段 → ${input.targetLevel} 段${rule.name}` }}
          </p>
          <div class="synthesis-summary__quantity">
            <span>共需一级{{ rule.name }}</span><p><strong>{{ quantity === null ? '—' : formatQuantity(quantity) }}</strong><span>颗</span></p>
          </div>
          <dl class="synthesis-summary__cost">
            <div><dt>梦幻币成本</dt><dd>{{ formatCoins(totalCoins) }}</dd></div>
            <div><dt>折合人民币</dt><dd><small>¥</small> {{ formatYuan(totalYuan) }}</dd></div>
          </dl>
          <p
            v-if="costOverflow"
            class="calc-error"
            role="alert"
          >
            金额过大，请减小单价或调整金价比例。
          </p>
          <p
            v-else
            class="synthesis-summary__hint"
          >
            {{ price === null ? '填一级单价，即可查看花费。' : store.yuanPerCoin === null ? '填上方金价，即可查看人民币成本。' : '按一级材料单价估算，人民币金额未扣卖币手续费。' }}
          </p>
        </div>
      </div>
    </section>

    <section
      class="synthesis-details"
      aria-labelledby="details-title"
    >
      <div class="synthesis-details__heading">
        <h2 id="details-title">
          逐级合成明细
        </h2><span>{{ input.synthesisMode === 'single' ? '每级各合成一颗，末行对应本次目标' : '每段消耗一颗，累计为本次打段总成本' }}</span>
      </div>
      <div
        class="synthesis-details__scroll"
        tabindex="0"
        role="region"
        aria-label="逐级材料和成本明细，可横向滚动"
      >
        <table>
          <caption class="calc-sr-only">
            {{ rule.name }}各等级材料数量及成本
          </caption>
          <thead>
            <tr>
              <th scope="col">
                等级
              </th><th scope="col">
                一级材料
              </th><th scope="col">
                单颗成本
              </th><th scope="col">
                折合人民币
              </th><th
                v-if="input.synthesisMode === 'range'"
                scope="col"
              >
                累计成本 / 人民币
              </th><th scope="col">
                本级合成配方
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="row in rows"
              :key="row.level"
              :class="{ 'synthesis-details__target': row.level === target }"
            >
              <th scope="row">
                <span class="level-chip">{{ row.level }} 级</span><small v-if="row.level === target">目标</small>
              </th>
              <td>{{ formatQuantity(row.quantity) }} <small>颗</small></td>
              <td>{{ formatCoins(costInCoins(row.quantity)) }}</td>
              <td>{{ formatYuan(costInYuan(row.quantity)) }}</td>
              <td v-if="input.synthesisMode === 'range'">
                {{ formatCoins(costInCoins(row.cumulativeQuantity)) }}<small class="synthesis-details__yuan">¥ {{ formatYuan(costInYuan(row.cumulativeQuantity)) }}</small>
              </td>
              <td class="synthesis-details__recipe">
                {{ row.recipe }}
              </td>
            </tr>
            <tr v-if="rows.length === 0">
              <td
                :colspan="input.synthesisMode === 'range' ? 6 : 5"
                class="synthesis-details__empty"
              >
                填写有效等级后显示明细。
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="synthesis-rule">
        <Gem
          :size="16"
          aria-hidden="true"
        /><p>{{ rule.description }}按满足合成技能要求计算，费用仅含材料。</p><a
          :href="rule.source"
          target="_blank"
          rel="noopener noreferrer"
        >查看规则 <ArrowUpRight
          :size="14"
          aria-hidden="true"
        /></a>
      </div>
    </section>
    <footer class="calculator-footer">
      <span>单价按材料分别记住，切换后无需重填。</span><span>金价与金价换算共用 · 输入保存在此浏览器</span>
    </footer>
  </div>
</template>
