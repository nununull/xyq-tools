<script setup lang="ts">
import { computed } from 'vue'
import { ArrowLeftRight } from 'lucide-vue-next'
import CalculatorNumberField from './CalculatorNumberField.vue'
import { useCalculatorStore } from '@/stores/useCalculatorStore'
import { COIN_UNITS, formatCoins, formatYuan, parseAmount } from '@/services/calculators'

const store = useCalculatorStore()
/** 金价两侧必须为正数，空输入保留填写提示。 */
const rmbError = computed(() => store.preferences.rateRmb.trim() && parseAmount(store.preferences.rateRmb, false) === null ? '请输入大于0的金额，最多8位小数。' : '')
/** 梦幻币比例单独校验，避免除零或显示过期结果。 */
const wanError = computed(() => store.preferences.rateWan.trim() && parseAmount(store.preferences.rateWan, false) === null ? '请输入大于0的金额，最多8位小数。' : '')
</script>

<template>
  <section
    class="rate-panel"
    aria-labelledby="rate-title"
  >
    <div class="rate-panel__heading">
      <div>
        <h2 id="rate-title">
          金价比例
        </h2>
        <p>按本区实际成交比例填写</p>
      </div>
      <button
        type="button"
        class="calc-text-button"
        @click="store.applyExampleRate"
      >
        填入示例
      </button>
    </div>
    <div class="rate-panel__equation">
      <CalculatorNumberField
        id="rate-rmb"
        v-model="store.preferences.rateRmb"
        label="人民币"
        suffix="元"
        :error="rmbError"
      />
      <ArrowLeftRight
        :size="20"
        class="rate-panel__equals"
        aria-hidden="true"
      />
      <CalculatorNumberField
        id="rate-wan"
        v-model="store.preferences.rateWan"
        label="梦幻币"
        suffix="万"
        placeholder="例如 1250"
        :error="wanError"
      />
      <div class="rate-panel__reference">
        <template v-if="store.yuanPerCoin !== null">
          <span>1 元 <b>≈ {{ formatCoins(1 / store.yuanPerCoin) }}梦幻币</b></span>
          <span>100 万 <b>≈ {{ formatYuan(store.yuanPerCoin * COIN_UNITS.wan * 100) }} 元</b></span>
        </template>
        <span v-else>填好比例，两页计算一起生效。</span>
      </div>
    </div>
    <p
      v-if="store.storageWarning"
      class="calc-error"
      role="status"
    >
      {{ store.storageWarning }}
    </p>
  </section>
</template>
