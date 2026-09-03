<script setup lang="ts">
import { computed } from 'vue'
import { ArrowRight, ArrowUpRight, BookOpen, CircleHelp, Leaf, Plus, RotateCcw, Sparkles, Swords, TrendingUp } from 'lucide-vue-next'
import CalculatorNumberField from '@/components/calculators/CalculatorNumberField.vue'
import GoldRatePanel from '@/components/calculators/GoldRatePanel.vue'
import GrowthBudget from '@/components/calculators/GrowthBudget.vue'
import { useCalculatorStore } from '@/stores/useCalculatorStore'
import { useGrowthStore } from '@/stores/useGrowthStore'
import { AUXILIARY_TYPES, calculateGrowth, createGrowthInput, DAN_LEVELS, getGrowthMax, getGrowthName, getGrowthTool, GROWTH_TOOLS, PET_TRAINING_TYPES, TRAINING_TYPES, validateGrowth, type GrowthCategory } from '@/services/growthCalculator'
import { formatCoins, formatQuantity, formatYuan, roundMoney } from '@/services/calculators'
import '@/styles/calculators.css'
import '@/styles/growth.css'

const growth = useGrowthStore()
const calculator = useCalculatorStore()
const categories = [{ name: '修炼', icon: Swords }, { name: '技能', icon: BookOpen }, { name: '等级', icon: TrendingUp }, { name: '进阶', icon: Sparkles }] as const
/** 工具、输入和结果保持单向派生，切换时保留每个工具的草稿。 */
const input = computed(() => growth.input)
/** 当前工具的名称、范围和说明统一取目录配置。 */
const tool = computed(() => getGrowthTool(input.value.kind))
/** 分类中仅展示相关工具，避免八个表单同时铺满页面。 */
const siblings = computed(() => GROWTH_TOOLS.filter(item => item.category === tool.value.category))
/** 根据工具展示对应技能或修炼类型。 */
const variants = computed(() => input.value.kind === 'training' ? TRAINING_TYPES : input.value.kind === 'pet-training' ? PET_TRAINING_TYPES : input.value.kind === 'auxiliary' ? AUXILIARY_TYPES : [])
/** 表单校验与预算复算使用同一套规则。 */
const errors = computed(() => validateGrowth(input.value))
/** 计算器直接响应输入，不需要反复点击计算按钮。 */
const result = computed(() => calculateGrowth(input.value))
/** 投入成本沿用金价，不套用出售梦幻币的手续费。 */
const yuan = computed(() => result.value?.coins == null || calculator.yuanPerCoin === null ? null : roundMoney(result.value.coins * calculator.yuanPerCoin))
/** 等级与潜能果以经验为主结果，其他工具以所需梦幻币为主结果。 */
const experienceFirst = computed(() => input.value.kind === 'level' || input.value.kind === 'fruit')
/** 只给有当前进度的工具展示经验抵扣输入。 */
const hasProgress = computed(() => ['training', 'pet-training', 'level', 'pet-level', 'fruit'].includes(input.value.kind))
/** 仅需要购买材料的工具显示区服单价。 */
const material = computed(() => input.value.kind === 'pet-training' ? '修炼果' : input.value.kind === 'pet-level' ? '月华露' : '')
/** 成组按钮明确展开项目数，玩家可以继续分别修改。 */
const batchLabel = computed(() => input.value.kind === 'training' ? '加入三修同级' : input.value.kind === 'pet-training' ? '加入四宠修同级' : input.value.kind === 'sect' ? '加入七技能同级' : '')
/** 当前级进度与可自由分配的经验使用不同标签。 */
const progressLabel = computed(() => experienceFirst.value ? '可用人物经验' : input.value.kind === 'pet-level' ? '当前级已有经验' : '当前级已有修炼经验')
/** 预算中的份数乘法保持可见，逐级表始终列出单份数据。 */
const quantitySuffix = computed(() => result.value && result.value.quantity > 1 ? ` · ${result.value.quantity}份合计` : '')

/** 切换分类时打开该分类首个工具。 */
function selectCategory(category: GrowthCategory): void {
  if (tool.value.category === category) return
  growth.selectTool(GROWTH_TOOLS.find(item => item.category === category)!.id)
}

/** 切换辅助技能时调整超出上限的等级，保留其他有效输入。 */
function changeVariant(): void {
  const max = getGrowthMax(input.value)
  if (Number(input.value.target) > max) input.value.target = String(max)
  if (Number(input.value.current) > max) input.value.current = String(max)
}

/** 重置当前计算器的输入，预算中已加入的目标不受影响。 */
function resetDraft(): void {
  const kind = input.value.kind
  growth.state.drafts[kind] = createGrowthInput(kind)
  growth.selectTool(kind)
}
</script>

<template>
  <div class="calculator-page growth-page">
    <header class="calculator-header">
      <div>
        <p class="calculator-eyebrow">
          <Leaf
            :size="16"
            aria-hidden="true"
          /> 梦幻西游 · 养成计算 <span class="growth-edition">电脑版 / 时间服</span>
        </p>
        <h1>想练到哪，<span>先算清账。</span></h1>
        <p class="calculator-intro">
          修炼、技能、等级和进阶，把目标变成看得见的花费。
        </p>
      </div>
      <RouterLink
        :to="{ name: 'synthesis-calculator' }"
        class="calculator-related"
      >
        去算宝石与灵饰 <ArrowUpRight
          :size="16"
          aria-hidden="true"
        />
      </RouterLink>
    </header>

    <GoldRatePanel />

    <nav
      class="growth-categories"
      aria-label="养成分类"
    >
      <button
        v-for="category in categories"
        :key="category.name"
        type="button"
        :aria-pressed="tool.category === category.name"
        @click="selectCategory(category.name)"
      >
        <component
          :is="category.icon"
          :size="19"
          aria-hidden="true"
        /><span>{{ category.name }}</span>
        <small>{{ category.name === '修炼' ? '人修 / 宠修' : category.name === '技能' ? '师门 / 辅助' : category.name === '等级' ? '人物 / 召唤兽' : '乾元丹 / 潜能果' }}</small>
      </button>
    </nav>

    <div class="growth-layout">
      <section
        class="growth-workbench"
        aria-label="养成目标与计算结果"
      >
        <div
          class="growth-tool-switch"
          aria-label="计算工具"
        >
          <button
            v-for="item in siblings"
            :key="item.id"
            type="button"
            :aria-pressed="input.kind === item.id"
            @click="growth.selectTool(item.id)"
          >
            {{ item.name }}<small>{{ item.description }}</small>
          </button>
        </div>

        <div class="growth-editor">
          <div class="growth-inputs">
            <div class="growth-section-heading">
              <div><p>设定养成目标</p><h2>{{ getGrowthName(input) }}</h2></div>
              <button
                type="button"
                class="calc-text-button"
                @click="resetDraft"
              >
                <RotateCcw
                  :size="14"
                  aria-hidden="true"
                /> 重置
              </button>
            </div>
            <div
              v-if="experienceFirst"
              class="calc-segment growth-mode"
              aria-label="经验计算方式"
            >
              <button
                type="button"
                :aria-pressed="input.mode === 'target'"
                @click="input.mode = 'target'"
              >
                按目标算消耗
              </button>
              <button
                type="button"
                :aria-pressed="input.mode === 'experience'"
                @click="input.mode = 'experience'"
              >
                按经验反推{{ input.kind === 'fruit' ? '数量' : '等级' }}
              </button>
            </div>
            <div
              v-if="variants.length || input.kind === 'fruit' || input.kind === 'dan'"
              class="growth-context-fields"
            >
              <div
                v-if="variants.length"
                class="calc-field growth-select"
              >
                <label for="growth-variant">{{ input.kind === 'auxiliary' ? '辅助技能' : '修炼类型' }}</label>
                <select
                  id="growth-variant"
                  v-model="input.variant"
                  :aria-invalid="Boolean(errors.variant)"
                  @change="changeVariant"
                >
                  <option
                    v-for="variant in variants"
                    :key="variant.id"
                    :value="variant.id"
                  >
                    {{ variant.name }}
                  </option>
                </select>
                <p
                  v-if="errors.variant"
                  class="calc-error"
                >
                  {{ errors.variant }}
                </p>
              </div>
              <div
                v-if="input.kind === 'fruit'"
                class="calc-field growth-select"
              >
                <label for="growth-fruit-cap">角色可兑换上限</label>
                <select
                  id="growth-fruit-cap"
                  v-model="input.fruitCap"
                  @change="changeVariant"
                >
                  <option
                    v-for="cap in [50, 100, 150, 200]"
                    :key="cap"
                    :value="String(cap)"
                  >
                    {{ cap }} 个
                  </option>
                </select>
              </div>
              <CalculatorNumberField
                v-if="input.kind === 'dan'"
                id="growth-character-level"
                v-model="input.characterLevel"
                label="人物等级"
                suffix="级"
                :error="errors.characterLevel"
              />
              <span class="growth-range-hint">{{ input.kind === 'fruit' ? '当前角色' : '计算支持' }}上限 {{ getGrowthMax(input) }} {{ tool.unit }}</span>
            </div>

            <div class="growth-target-line">
              <CalculatorNumberField
                id="growth-current"
                v-model="input.current"
                :label="tool.unit === '个' ? '当前已有' : '当前等级'"
                :suffix="tool.unit"
                :error="errors.current"
                large
              />
              <ArrowRight
                :size="24"
                aria-hidden="true"
              />
              <CalculatorNumberField
                v-if="input.mode === 'target'"
                id="growth-target"
                v-model="input.target"
                :label="tool.unit === '个' ? '目标数量' : '目标等级'"
                :suffix="tool.unit"
                :error="errors.target"
                large
              />
              <div
                v-else
                class="growth-reachable"
              >
                <span>经验最多可{{ input.kind === 'fruit' ? '换到' : '升到' }}</span><strong>{{ result?.target ?? '—' }}<small>{{ tool.unit }}</small></strong>
              </div>
            </div>

            <div class="growth-extra-fields">
              <CalculatorNumberField
                v-if="hasProgress"
                id="growth-progress"
                v-model="input.progress"
                :label="progressLabel"
                suffix="点"
                placeholder="没有可填0"
                :error="errors.progress"
              />
              <CalculatorNumberField
                v-if="material"
                id="growth-price"
                v-model="input.price"
                :label="`${material}单价`"
                suffix="万梦幻币"
                placeholder="填单价，算材料成本"
                :error="errors.price"
              />
              <CalculatorNumberField
                v-if="input.kind === 'pet-level'"
                id="growth-quality"
                v-model="input.quality"
                label="月华露品质"
                :error="errors.quality"
              />
              <CalculatorNumberField
                id="growth-quantity"
                v-model="input.quantity"
                label="同目标份数"
                suffix="份"
                :error="errors.quantity"
              />
            </div>
            <p class="growth-field-note">
              {{ hasProgress ? '经验填写原始点数，不是“万”。' : '' }}份数表示独立项目，每份使用上面相同的等级与进度。
            </p>
          </div>
          <div class="growth-output">
            <div
              class="growth-result"
              aria-live="polite"
              aria-atomic="true"
            >
              <div class="growth-result__primary">
                <span>{{ experienceFirst ? '升级 / 兑换总经验' : '预计投入' }}{{ quantitySuffix }}</span>
                <strong v-if="experienceFirst">{{ result ? formatCoins(result.totalExperience) : '—' }}<small>经验</small></strong>
                <strong v-else>{{ formatCoins(result?.coins ?? null) }}<small>梦幻币</small></strong>
                <p
                  v-if="!result"
                  class="calc-error"
                >
                  输入有误，修改标红字段后重新计算。
                </p>
                <p v-else-if="experienceFirst">
                  {{ input.mode === 'experience' ? '兑换 / 升级后剩余' : '还需准备' }} <b>{{ formatQuantity(input.mode === 'experience' ? result.overflow : result.experience) }}</b> 点经验
                </p>
                <p v-else-if="material && !input.price.trim()">
                  填入{{ material }}单价，即可估算花费。
                </p>
                <p
                  v-else-if="result.coins === null"
                  class="calc-error"
                >
                  金额超出精确计算范围，请减少单价或份数。
                </p>
                <p v-else>
                  折合 <b>{{ formatYuan(yuan) }}</b> 元 <span v-if="calculator.yuanPerCoin === null">· 先填写金价比例</span>
                </p>
                <p
                  v-if="result && result.coins !== null && calculator.yuanPerCoin !== null && !experienceFirst && yuan === null"
                  class="calc-error"
                >
                  人民币金额超出精确计算范围，请调整金价或份数。
                </p>
              </div>
              <dl
                v-if="result"
                class="growth-result__details"
              >
                <template v-if="!experienceFirst">
                  <dt>{{ tool.resource }}</dt><dd>{{ formatQuantity(result.experience) }} <small>点</small></dd>
                </template>
                <template v-if="material">
                  <dt>需要{{ material }}</dt><dd>{{ formatQuantity(result.items) }} <small>{{ material === '月华露' ? '瓶' : '颗' }}</small></dd>
                </template>
                <template v-if="input.kind === 'training'">
                  <dt>修炼次数</dt><dd>{{ formatQuantity(result.items) }} <small>次</small></dd>
                </template>
                <template v-if="result.overflow > 0 && !experienceFirst">
                  <dt>溢出经验</dt><dd>{{ formatQuantity(result.overflow) }} <small>点</small></dd>
                </template>
                <template v-if="input.kind === 'training'">
                  <dt>历史帮贡要求</dt><dd>{{ formatQuantity(result.helpThreshold) }} <small>/ 每份，不消耗</small></dd>
                </template>
                <template v-if="input.kind === 'auxiliary'">
                  <dt>消耗帮贡</dt><dd>{{ formatQuantity(result.helpUsed) }}</dd><dt>末级学习门槛</dt><dd>{{ formatQuantity(result.helpThreshold) }} <small>/ 每份</small></dd><dt>一路点完至少持有</dt><dd>{{ formatQuantity(result.helpStarting) }} <small>帮贡 / 每份</small></dd>
                </template>
                <template v-if="input.kind === 'dan'">
                  <dt>目标人物等级要求</dt><dd>{{ DAN_LEVELS[result.target] }} <small>级</small></dd>
                </template>
              </dl>
            </div>

            <div class="growth-add-actions">
              <button
                type="button"
                class="growth-primary-button"
                :disabled="!result?.rows.length"
                @click="growth.savePlan"
              >
                <Plus
                  :size="17"
                  aria-hidden="true"
                />{{ growth.editingId ? '更新此项' : '加入预算' }}
              </button>
              <button
                v-if="batchLabel && !growth.editingId"
                type="button"
                class="growth-secondary-button"
                :disabled="!result?.rows.length"
                @click="growth.addBatch"
              >
                {{ batchLabel }}
              </button>
            </div>
            <p
              v-if="growth.notice"
              class="growth-notice"
              role="status"
            >
              {{ growth.notice }}
            </p>
          </div>
        </div>

        <details
          class="growth-breakdown"
          :open="Boolean(result?.rows.length)"
        >
          <summary>逐级消耗 <span>{{ result?.rows.length ?? 0 }} 级明细 · 单份</span></summary>
          <div
            v-if="result?.rows.length"
            class="growth-table-scroll"
            tabindex="0"
            aria-label="逐级消耗明细，可滚动"
          >
            <table>
              <thead>
                <tr>
                  <th scope="col">
                    {{ tool.unit === '个' ? '兑换序号' : '升级区间' }}
                  </th><th scope="col">
                    {{ tool.resource }}
                  </th><th
                    v-if="!experienceFirst"
                    scope="col"
                  >
                    {{ material ? `${material}用量` : input.kind === 'auxiliary' ? '消耗帮贡' : input.kind === 'dan' ? '人物等级' : '梦幻币' }}
                  </th><th
                    v-if="material || input.kind === 'auxiliary' || input.kind === 'dan'"
                    scope="col"
                  >
                    梦幻币
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="row in result.rows"
                  :key="row.level"
                >
                  <td>{{ tool.unit === '个' ? `第${row.level}个` : `${row.level - 1} → ${row.level}` }}</td><td>{{ formatQuantity(row.experience) }}</td><td v-if="!experienceFirst">
                    {{ material ? formatQuantity(row.items) : input.kind === 'auxiliary' ? row.level : input.kind === 'dan' ? `${DAN_LEVELS[row.level]}级` : formatCoins(row.coins) }}
                  </td><td v-if="material || input.kind === 'auxiliary' || input.kind === 'dan'">
                    {{ formatCoins(row.coins) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p
            v-else
            class="growth-table-empty"
          >
            填入有效目标后显示明细；当前值等于目标时无需升级。
          </p>
        </details>
        <details class="growth-rules">
          <summary>
            <CircleHelp
              :size="15"
              aria-hidden="true"
            /> 计算规则与来源
          </summary><p>{{ tool.hint }}</p><p>明细经验是每级完整需求；当前进度只抵扣一次。材料用量按逐级消耗计算，溢出经验会带入下一级。人民币表示投入成本，不扣卖币手续费。</p><a
            :href="tool.source"
            target="_blank"
            rel="noopener noreferrer"
          >查看规则参考 <ArrowUpRight
            :size="13"
            aria-hidden="true"
          /></a>
        </details>
      </section>

      <GrowthBudget />
    </div>
    <p
      v-if="growth.storageWarning"
      class="calc-error"
      role="status"
    >
      {{ growth.storageWarning }}
    </p>
    <footer class="calculator-footer">
      按当前区服价格规划养成，实际消耗以游戏内学习界面为准。
    </footer>
  </div>
</template>
