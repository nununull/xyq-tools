<script setup lang="ts">
import { computed } from 'vue'
import { ArrowRight, ArrowUpRight, Coins, ReceiptText, Wallet } from 'lucide-vue-next'
import GoldRatePanel from '@/components/calculators/GoldRatePanel.vue'
import CalculatorNumberField from '@/components/calculators/CalculatorNumberField.vue'
import { useCalculatorStore } from '@/stores/useCalculatorStore'
import { calculateSale, CBG_FEE_RATE, COIN_UNITS, formatCoins, formatQuantity, formatYuan, parseAmount, type ConversionDirection, type CurrencyUnit } from '@/services/calculators'
import '@/styles/calculators.css'

const store = useCalculatorStore()
const input = store.preferences
const feePercent = CBG_FEE_RATE * 100
/** 始终从当前方向的单一输入金额推导换算结果。 */
const amount = computed(() => parseAmount(input.currencyAmount))
/** 卖出输入按用户选择的万或亿统一成梦幻币原始数量。 */
const coins = computed(() => {
  if (amount.value === null || store.yuanPerCoin === null) return null
  const converted = amount.value / store.yuanPerCoin
  const result = input.direction === 'sell' ? amount.value * COIN_UNITS[input.currencyUnit] : Math.floor(converted + Math.min(1e-7, Number.EPSILON * converted * 2))
  return Number.isSafeInteger(Math.floor(result)) ? result : null
})
/** 仅卖币方向生成扣费结算，买币方向显示可兑换数量。 */
const sale = computed(() => coins.value === null || store.yuanPerCoin === null ? null : calculateSale(coins.value, store.yuanPerCoin))
/** 非法输入立即移除旧结果，并指出需要修改的金额。 */
const amountError = computed(() => {
  if (input.currencyAmount.trim() && amount.value === null) return '请输入不小于0的金额，最多8位小数，且不超过1万亿。'
  if (amount.value !== null && store.yuanPerCoin !== null && (coins.value === null || sale.value === null)) return '换算金额过大，请减小金额或调整比例。'
  return ''
})
/** 有效输入不足时给出具体下一步。 */
const emptyHint = computed(() => store.yuanPerCoin === null ? '先填上方金价比例，再输入要换算的金额。' : '输入左侧金额，这里立即给出换算结果。')

/** 切换换算方向时沿用同一笔金额的价值，避免把梦幻币数量直接当成人民币。 */
function changeDirection(direction: ConversionDirection): void {
  if (input.direction === direction) return
  const nextAmount = direction === 'buy' ? sale.value?.gross : coins.value === null ? null : coins.value / COIN_UNITS[input.currencyUnit]
  input.currencyAmount = nextAmount === null || nextAmount === undefined ? '' : nextAmount.toLocaleString('en-US', { useGrouping: false, maximumFractionDigits: 8 })
  input.direction = direction
  globalThis.console.info(JSON.stringify({ msg: '金价换算方向已切换', direction }))
}

/** 改变显示单位时换算输入数值，保留这笔梦幻币的实际数量。 */
function changeUnit(event: globalThis.Event): void {
  const next = (event.target as globalThis.HTMLSelectElement).value as CurrencyUnit
  const previous = input.currencyUnit
  if (amount.value !== null) input.currencyAmount = (amount.value * COIN_UNITS[previous] / COIN_UNITS[next]).toLocaleString('en-US', { useGrouping: false, maximumFractionDigits: 8 })
  input.currencyUnit = next
}
</script>

<template>
  <div class="calculator-page">
    <header class="calculator-header">
      <div>
        <p class="calculator-eyebrow">
          <Coins
            :size="16"
            aria-hidden="true"
          /> 梦幻西游 · 金价换算
        </p>
        <h1>这笔梦幻币，<span>到手多少？</span></h1>
        <p class="calculator-intro">
          换算归换算，手续费单独算。每一笔都明明白白。
        </p>
      </div>
      <RouterLink
        :to="{ name: 'synthesis-calculator' }"
        class="calculator-related"
      >
        去算合成成本 <ArrowUpRight
          :size="16"
          aria-hidden="true"
        />
      </RouterLink>
    </header>

    <GoldRatePanel />

    <div class="currency-workbench">
      <section
        class="currency-input"
        aria-label="换算输入"
      >
        <div
          class="calc-segment"
          aria-label="换算方向"
        >
          <button
            type="button"
            :aria-pressed="input.direction === 'sell'"
            @click="changeDirection('sell')"
          >
            梦幻币换人民币
          </button>
          <button
            type="button"
            :aria-pressed="input.direction === 'buy'"
            @click="changeDirection('buy')"
          >
            人民币换梦幻币
          </button>
        </div>
        <CalculatorNumberField
          id="currency-amount"
          v-model="input.currencyAmount"
          :label="input.direction === 'sell' ? '要换算的梦幻币' : '要换算的人民币'"
          placeholder="0"
          :error="amountError"
          large
        >
          <template #suffix>
            <select
              v-if="input.direction === 'sell'"
              aria-label="梦幻币单位"
              :value="input.currencyUnit"
              @change="changeUnit"
            >
              <option value="wan">
                万梦幻币
              </option>
              <option value="yi">
                亿梦幻币
              </option>
            </select>
            <span v-else>元</span>
          </template>
        </CalculatorNumberField>
        <p class="currency-input__caption">
          {{ input.direction === 'sell' ? '同时算出折算金额和扣费后的卖币到手金额。' : '按金价比例计算可以买到的梦幻币数量。' }}
        </p>
        <div class="currency-input__note">
          <ReceiptText
            :size="19"
            aria-hidden="true"
          />
          <div><strong>藏宝阁手续费 {{ feePercent }}%</strong><p>卖币按折算金额扣费，买币按原比例换算。</p></div>
        </div>
      </section>

      <section
        class="settlement"
        aria-label="换算结果"
        aria-live="polite"
        aria-atomic="true"
      >
        <div class="settlement__heading">
          <Wallet
            :size="19"
            aria-hidden="true"
          /><h2>{{ input.direction === 'sell' ? '卖币结算单' : '买币换算单' }}</h2><span>人民币 / 梦幻币</span>
        </div>
        <template v-if="sale !== null && !amountError && coins !== null">
          <dl class="settlement__lines">
            <div><dt>{{ input.direction === 'sell' ? '梦幻币数量' : '人民币金额' }}</dt><dd>{{ input.direction === 'sell' ? `${formatCoins(coins)}梦幻币` : `${formatYuan(amount)} 元` }}</dd></div>
            <div v-if="input.direction === 'sell'">
              <dt>折算金额</dt><dd>{{ formatYuan(sale.gross) }} <small>元</small></dd>
            </div>
            <div
              v-if="input.direction === 'sell'"
              class="settlement__fee"
            >
              <dt>藏宝阁手续费 <span>{{ feePercent }}%</span></dt><dd>− {{ formatYuan(sale.fee) }} <small>元</small></dd>
            </div>
            <div v-else>
              <dt>兑换方向</dt><dd>
                人民币 <ArrowRight
                  :size="14"
                  aria-hidden="true"
                /> 梦幻币
              </dd>
            </div>
          </dl>
          <div class="settlement__total">
            <span>{{ input.direction === 'sell' ? '扣费后实际到手' : '可兑换梦幻币' }}</span>
            <p v-if="input.direction === 'sell'">
              <strong>{{ formatYuan(sale.net) }}</strong><span>元</span>
            </p>
            <p v-else>
              <strong>{{ formatCoins(coins) }}</strong><span>梦幻币</span>
            </p>
            <small>{{ input.direction === 'sell' ? '到手金额 = 折算金额 − 手续费' : `共 ${formatQuantity(coins)} 梦幻币，按整数向下取整` }}</small>
          </div>
        </template>
        <div
          v-else
          class="settlement__empty"
        >
          <span>等待换算</span><strong>—</strong><p>{{ amountError ? '修正输入后，结算单会自动更新。' : emptyHint }}</p>
        </div>
      </section>
    </div>
    <footer class="calculator-footer">
      <span>比例由你填写，结果随输入更新。</span><span>金价与合成计算共用 · 输入保存在此浏览器</span>
    </footer>
  </div>
</template>
