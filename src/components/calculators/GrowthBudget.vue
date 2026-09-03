<script setup lang="ts">
import { computed } from 'vue'
import { ClipboardList, Pencil, Trash2 } from 'lucide-vue-next'
import CalculatorNumberField from './CalculatorNumberField.vue'
import { useGrowthStore } from '@/stores/useGrowthStore'
import { useCalculatorStore } from '@/stores/useCalculatorStore'
import { formatCoins, formatQuantity, formatYuan, roundMoney } from '@/services/calculators'
import { getGrowthTool, parseGrowthInteger } from '@/services/growthCalculator'

const growth = useGrowthStore()
const calculator = useCalculatorStore()
/** 账号份数只应用一次，单个项目中的份数已由计算服务处理。 */
const accounts = computed(() => parseGrowthInteger(growth.state.accounts, 99, 1))
/** 汇总所有有效项目，同时保留缺失单价和非法项目的状态。 */
const budget = computed(() => {
  let coins = 0
  let missingPrices = 0
  let invalid = 0
  const resources: Record<string, number> = {}
  for (const plan of growth.plans) {
    if (!plan.result) { invalid++; continue }
    if (plan.result.coins === null) missingPrices++
    else coins += plan.result.coins
    const resource = getGrowthTool(plan.input.kind).resource
    resources[resource] = (resources[resource] ?? 0) + plan.result.totalExperience
  }
  const total = accounts.value === null ? null : coins * accounts.value
  return { coins: total !== null && total <= Number.MAX_SAFE_INTEGER ? total : null, missingPrices, invalid, resources }
})
/** 预算投入按共用金价换算人民币，不扣出售手续费。 */
const yuan = computed(() => budget.value.coins === null || calculator.yuanPerCoin === null ? null : roundMoney(budget.value.coins * calculator.yuanPerCoin))
</script>

<template>
  <aside
    class="growth-budget"
    aria-labelledby="growth-budget-title"
  >
    <header class="growth-budget__header">
      <ClipboardList
        :size="20"
        aria-hidden="true"
      />
      <h2 id="growth-budget-title">
        养成预算单
      </h2>
      <span>{{ growth.plans.length }} 项</span>
    </header>
    <div class="growth-budget__body">
      <p class="growth-budget__intro">
        把目标放在一起，算一笔总账。
      </p>
      <div class="growth-account-picker">
        <CalculatorNumberField
          id="growth-accounts"
          v-model="growth.state.accounts"
          label="同配置账号"
          suffix="个"
          :error="accounts === null ? '请输入1至99个账号。' : ''"
        />
        <button
          type="button"
          class="growth-small-button"
          :aria-pressed="growth.state.accounts === '5'"
          @click="growth.state.accounts = growth.state.accounts === '5' ? '1' : '5'"
        >
          五开 × 5
        </button>
      </div>
      <div
        v-if="!growth.plans.length"
        class="growth-budget__empty"
      >
        <span class="growth-budget__empty-line" />
        <p>预算单还是空的</p>
        <small>左侧算好目标，点「加入预算」。<br>三修、四宠修、七技能也能一次加入。</small>
      </div>
      <ol
        v-else
        class="growth-plan-list"
      >
        <li
          v-for="plan in growth.plans"
          :key="plan.id"
          :class="{ 'growth-plan--editing': growth.editingId === plan.id }"
        >
          <div class="growth-plan__name">
            <strong>{{ plan.label }}</strong><small v-if="plan.input.quantity !== '1'">× {{ plan.input.quantity }}</small>
          </div>
          <p>{{ plan.input.current }} → {{ plan.result?.target ?? plan.input.target }} {{ getGrowthTool(plan.input.kind).unit }}</p>
          <b>{{ plan.result ? plan.result.coins === null ? '待填单价' : `${formatCoins(plan.result.coins)}梦幻币` : '请检查输入' }}</b>
          <div class="growth-plan__actions">
            <button
              type="button"
              :aria-label="`修改${plan.label}`"
              @click="growth.editPlan(plan.id)"
            >
              <Pencil
                :size="14"
                aria-hidden="true"
              />
            </button>
            <button
              type="button"
              :aria-label="`移除${plan.label}`"
              @click="growth.removePlan(plan.id)"
            >
              <Trash2
                :size="14"
                aria-hidden="true"
              />
            </button>
          </div>
        </li>
      </ol>
      <div
        v-if="growth.plans.length"
        class="growth-budget__total"
        aria-live="polite"
      >
        <span>{{ budget.missingPrices || budget.invalid ? '已知费用小计' : '预计总投入' }} · {{ accounts ?? '—' }} 个账号</span>
        <strong>{{ formatCoins(budget.coins) }}<small>梦幻币</small></strong>
        <p>折合 <b>{{ formatYuan(yuan) }}</b> 元</p>
        <p
          v-if="budget.missingPrices || budget.invalid"
          class="calc-error"
        >
          {{ budget.missingPrices ? `${budget.missingPrices}项待填单价。` : '' }}{{ budget.invalid ? `${budget.invalid}项输入有误。` : '' }}补全后才是完整预算。
        </p>
        <p
          v-if="accounts !== null && budget.coins === null"
          class="calc-error"
        >
          总金额超出精确计算范围，请减少单价或份数。
        </p>
        <dl class="growth-resource-list">
          <template
            v-for="(value, resource) in budget.resources"
            :key="resource"
          >
            <dt>{{ resource }}</dt><dd>{{ accounts === null ? '—' : formatQuantity(value * accounts) }}</dd>
          </template>
        </dl>
        <small class="growth-budget__note">经验按升级总消耗汇总；梦幻币已扣除各项当前进度。五开将整张预算乘5，配置不同请分开规划。</small>
      </div>
    </div>
    <footer class="growth-budget__footer">
      输入自动保存在当前浏览器
    </footer>
  </aside>
</template>
