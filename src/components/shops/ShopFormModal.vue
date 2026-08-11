<script setup lang="ts">
import { ref, watch } from 'vue'
import BaseModal from '@/components/common/BaseModal.vue'
import type { Shop, ShopCategory, ShopDraft } from '@/types/domain'

const props = withDefaults(
  defineProps<{
    open: boolean
    shop?: Shop
    defaultCategory?: ShopCategory
  }>(),
  {
    shop: undefined,
    defaultCategory: 'medicine',
  },
)

const emit = defineEmits<{
  save: [draft: ShopDraft]
  close: []
}>()

const CATEGORY_OPTIONS: readonly { value: ShopCategory; label: string }[] = [
  { value: 'medicine', label: '三药' },
  { value: 'furniture', label: '家具' },
  { value: 'summon', label: '召唤兽' },
  { value: 'cooking', label: '烹饪' },
]

const category = ref<ShopCategory | ''>('medicine')
const number = ref('')
const name = ref('')
const itemsInput = ref('')
const note = ref('')
const categoryError = ref('')
const numberError = ref('')
const nameError = ref('')

/** 将自由输入的商品名称标准化为去空、去重的关键词。 */
function normalizeItems(input: string): string[] {
  return [...new Set(input.split(/[、，,\n]/).map((item) => item.trim()).filter(Boolean))]
}

/** 按当前编辑目标重置全部字段和错误，避免复用弹窗时串值。 */
function resetForm(): void {
  category.value = props.shop?.category ?? props.defaultCategory
  number.value = props.shop?.number ?? ''
  name.value = props.shop?.name ?? ''
  itemsInput.value = props.shop?.items.join('、') ?? ''
  note.value = props.shop?.note ?? ''
  categoryError.value = ''
  numberError.value = ''
  nameError.value = ''
}

/** 校验必填资料并提交经过标准化的店铺草稿。 */
function submitForm(): void {
  const trimmedNumber = number.value.trim()
  const trimmedName = name.value.trim()
  categoryError.value = category.value === '' ? '请选择店铺分类。' : ''
  numberError.value = trimmedNumber.length === 0 ? '店铺编号不能为空。' : ''
  nameError.value = trimmedName.length === 0 ? '店铺名称不能为空。' : ''

  if (
    category.value === '' ||
    categoryError.value.length > 0 ||
    numberError.value.length > 0 ||
    nameError.value.length > 0
  ) {
    return
  }

  emit('save', {
    category: category.value,
    number: trimmedNumber,
    name: trimmedName,
    items: normalizeItems(itemsInput.value),
    note: note.value.trim(),
  })
}

/** 关闭表单但不提交当前输入。 */
function closeForm(): void {
  emit('close')
}

watch(
  () => [props.open, props.shop?.id, props.defaultCategory] as const,
  ([open]) => {
    if (open) resetForm()
  },
  { immediate: true },
)

watch(category, (value) => {
  if (value !== '') categoryError.value = ''
})

watch(number, (value) => {
  if (value.trim().length > 0) numberError.value = ''
})

watch(name, (value) => {
  if (value.trim().length > 0) nameError.value = ''
})
</script>

<template>
  <BaseModal
    :open="open"
    :title="shop === undefined ? '新增店铺' : '编辑店铺'"
    description="分类调整只能在这里完成；商品可用顿号、逗号或换行分隔。"
    @close="closeForm"
  >
    <form
      class="shop-form"
      @submit.prevent="submitForm"
    >
      <label class="shop-form__field">
        <span>分类</span>
        <select
          v-model="category"
          name="shop-category"
          :aria-invalid="categoryError.length > 0"
          :aria-describedby="categoryError.length > 0 ? 'shop-category-error' : undefined"
        >
          <option
            v-for="option in CATEGORY_OPTIONS"
            :key="option.value"
            :value="option.value"
          >
            {{ option.label }}
          </option>
        </select>
      </label>
      <p
        v-if="categoryError.length > 0"
        id="shop-category-error"
        class="shop-form__error"
        role="alert"
      >
        {{ categoryError }}
      </p>

      <div class="shop-form__row">
        <div>
          <label class="shop-form__field">
            <span>店铺编号</span>
            <input
              v-model="number"
              name="shop-number"
              type="text"
              autocomplete="off"
              maxlength="30"
              placeholder="例如：101"
              :aria-invalid="numberError.length > 0"
              :aria-describedby="numberError.length > 0 ? 'shop-number-error' : undefined"
            >
          </label>
          <p
            v-if="numberError.length > 0"
            id="shop-number-error"
            class="shop-form__error"
            role="alert"
          >
            {{ numberError }}
          </p>
        </div>

        <div>
          <label class="shop-form__field">
            <span>店铺名称</span>
            <input
              v-model="name"
              name="shop-name"
              type="text"
              autocomplete="off"
              maxlength="60"
              placeholder="例如：长安药铺"
              :aria-invalid="nameError.length > 0"
              :aria-describedby="nameError.length > 0 ? 'shop-name-error' : undefined"
            >
          </label>
          <p
            v-if="nameError.length > 0"
            id="shop-name-error"
            class="shop-form__error"
            role="alert"
          >
            {{ nameError }}
          </p>
        </div>
      </div>

      <label class="shop-form__field">
        <span>商品（可选）</span>
        <textarea
          v-model="itemsInput"
          name="shop-items"
          rows="3"
          maxlength="500"
          placeholder="金创药、九转回魂丹，五龙丹"
        />
        <small>支持顿号、中文逗号、英文逗号和换行，重复项会自动去除。</small>
      </label>

      <label class="shop-form__field">
        <span>备注（可选）</span>
        <textarea
          v-model="note"
          name="shop-note"
          rows="2"
          maxlength="200"
          placeholder="例如：午后经常补货"
        />
      </label>

      <footer class="shop-form__actions">
        <button
          class="shop-form__secondary"
          type="button"
          aria-label="取消店铺资料编辑"
          @click="closeForm"
        >
          取消
        </button>
        <button
          type="submit"
          :aria-label="shop === undefined ? '保存新增店铺' : `保存店铺 ${shop.number} ${shop.name} 的修改`"
        >
          {{ shop === undefined ? '新增店铺' : '保存修改' }}
        </button>
      </footer>
    </form>
  </BaseModal>
</template>

<style scoped>
.shop-form {
  display: grid;
  gap: 1rem;
}

.shop-form__row {
  display: grid;
  grid-template-columns: minmax(0, 0.7fr) minmax(0, 1.3fr);
  gap: 0.75rem;
}

.shop-form__field {
  display: grid;
  gap: 0.5rem;
  color: var(--text);
  font-size: 0.9375rem;
  font-weight: 700;
}

.shop-form__field input,
.shop-form__field select,
.shop-form__field textarea {
  width: 100%;
  padding: 0.75rem 0.875rem;
  color: var(--text);
  background: color-mix(in srgb, var(--surface) 82%, white);
  border: 1px solid var(--border);
  border-radius: 0.5rem;
  font: inherit;
  font-weight: 400;
  line-height: 1.5;
}

.shop-form__field textarea {
  resize: vertical;
}

.shop-form__field small {
  color: var(--text-muted);
  font-size: 0.75rem;
  font-weight: 400;
  line-height: 1.5;
}

.shop-form__field [aria-invalid='true'] {
  border-color: var(--danger);
}

.shop-form__error {
  margin: -0.5rem 0 0;
  color: var(--danger);
  font-size: 0.875rem;
}

.shop-form__row .shop-form__error {
  margin-top: 0.5rem;
}

.shop-form__actions {
  display: flex;
  justify-content: end;
  gap: 0.75rem;
  margin-top: 0.5rem;
}

.shop-form__secondary {
  color: var(--text);
  background: transparent;
  border-color: var(--border);
}

.shop-form__secondary:hover {
  background: var(--surface-soft);
  border-color: var(--border);
}

@media (max-width: 30rem) {
  .shop-form__row {
    grid-template-columns: 1fr;
  }
}
</style>
