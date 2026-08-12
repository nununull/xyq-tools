<script setup lang="ts">
import { computed, ref } from 'vue'
import ShopCategorySection from '@/components/shops/ShopCategorySection.vue'
import ShopFormModal from '@/components/shops/ShopFormModal.vue'
import { useToolStore } from '@/stores/useToolStore'
import { useUiStore } from '@/stores/useUiStore'
import type { Shop, ShopCategory, ShopDraft } from '@/types/domain'

const CATEGORY_DEFINITIONS: readonly { category: ShopCategory; title: string }[] = [
  { category: 'medicine', title: '三药' },
  { category: 'furniture', title: '家具' },
  { category: 'summon', title: '召唤兽' },
  { category: 'cooking', title: '烹饪' },
]

const toolStore = useToolStore()
const uiStore = useUiStore()
const searchInput = ref('')
const formOpen = ref(false)
const editingShopId = ref<string | null>(null)
const defaultCategory = ref<ShopCategory>('medicine')

const normalizedQuery = computed(() => searchInput.value.trim().toLocaleLowerCase())
const searching = computed(() => normalizedQuery.value.length > 0)
const editingShop = computed<Shop | undefined>(() =>
  toolStore.shops.find(({ id }) => id === editingShopId.value),
)

/** 判断店铺的编号、名称、商品或备注是否包含当前搜索词。 */
function matchesSearch(shop: Shop): boolean {
  const query = normalizedQuery.value
  if (query.length === 0) return true
  return [shop.number, shop.name, ...shop.items, shop.note].some((value) =>
    value.toLocaleLowerCase().includes(query),
  )
}

/** 返回指定分类按领域顺序排列且符合搜索条件的店铺。 */
function filterCategory(category: ShopCategory): Shop[] {
  return toolStore.shops
    .filter((shop) => shop.category === category && matchesSearch(shop))
    .sort((left, right) => left.order - right.order)
}

const filteredShops = computed<Record<ShopCategory, Shop[]>>(() => ({
  medicine: filterCategory('medicine'),
  furniture: filterCategory('furniture'),
  summon: filterCategory('summon'),
  cooking: filterCategory('cooking'),
}))

const matchCount = computed(() =>
  CATEGORY_DEFINITIONS.reduce(
    (count, { category }) => count + filteredShops.value[category].length,
    0,
  ),
)

/** 返回可展示的未知异常文本。 */
function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

/** 打开指定分类的空白新增店铺表单。 */
function openAddShopForm(category: ShopCategory): void {
  editingShopId.value = null
  defaultCategory.value = category
  formOpen.value = true
}

/** 打开已有店铺表单，不存在的目标会给出明确反馈。 */
function openEditShopForm(id: string): void {
  const shop = toolStore.shops.find((candidate) => candidate.id === id)
  if (shop === undefined) {
    uiStore.toast('店铺不存在，无法编辑。', 'warning')
    return
  }
  editingShopId.value = id
  defaultCategory.value = shop.category
  formOpen.value = true
}

/** 关闭店铺表单并清除编辑目标。 */
function closeShopForm(): void {
  formOpen.value = false
  editingShopId.value = null
}

/** 新增或更新店铺，并统一给出成功或失败反馈。 */
function saveShop(draft: ShopDraft): void {
  if (editingShopId.value === null) {
    const shop = toolStore.addShop(draft)
    closeShopForm()
    uiStore.toast(`已新增店铺 ${shop.number} ${shop.name}。`, 'success')
    return
  }

  const shopId = editingShopId.value
  if (!toolStore.updateShop(shopId, draft)) {
    uiStore.toast('店铺不存在，修改未保存。', 'danger')
    return
  }
  closeShopForm()
  uiStore.toast(`已保存店铺 ${draft.number} ${draft.name}。`, 'success')
}

/** 合并搜索可见项的临时顺序，并只调用一次领域重排方法。 */
function reorderShops(category: ShopCategory, visibleIds: string[]): void {
  if (!searching.value) {
    toolStore.reorderShops(category, visibleIds)
    return
  }

  const shops = toolStore.shops
    .filter((shop) => shop.category === category)
    .sort((left, right) => left.order - right.order)
  const visibleIdSet = new Set(visibleIds)
  let visibleIndex = 0
  const mergedIds = shops.map((shop) => {
    if (!visibleIdSet.has(shop.id)) return shop.id
    const reorderedId = visibleIds[visibleIndex]
    visibleIndex += 1
    return reorderedId ?? shop.id
  })
  toolStore.reorderShops(category, mergedIds)
}

/** 通过危险确认删除店铺，并捕获确认流程可能抛出的异常。 */
async function requestRemoveShop(id: string): Promise<void> {
  const shop = toolStore.shops.find((candidate) => candidate.id === id)
  if (shop === undefined) {
    uiStore.toast('店铺不存在，无法删除。', 'warning')
    return
  }

  try {
    const confirmed = await uiStore.confirm({
      title: `删除店铺 ${shop.number} ${shop.name}？`,
      description: `编号 ${shop.number}、名称 ${shop.name} 的店铺资料会被永久删除，此操作无法撤销。`,
      tone: 'danger',
      confirmLabel: '删除店铺',
    })
    if (!confirmed) return

    if (toolStore.removeShop(id)) {
      uiStore.toast(`已删除店铺 ${shop.number} ${shop.name}。`, 'success')
      return
    }
    uiStore.toast('店铺已不存在，删除未执行。', 'warning')
  } catch (error: unknown) {
    uiStore.toast(`删除确认失败：${getErrorMessage(error)}`, 'danger')
  }
}

/** 清空搜索词并恢复四个分类的完整列表。 */
function clearSearch(): void {
  searchInput.value = ''
}
</script>

<template>
  <section
    class="shop-panel"
    aria-labelledby="shop-panel-title"
  >
    <header class="shop-panel__header">
      <div>
        <p class="shop-panel__eyebrow">
          商会速查
        </p>
        <h2 id="shop-panel-title">
          店铺分类与商品检索
        </h2>
        <p>四类店铺始终同页展示；调整分类请编辑店铺资料。</p>
      </div>

      <div class="shop-panel__search">
        <label for="shop-search">搜索店铺</label>
        <div>
          <input
            id="shop-search"
            v-model="searchInput"
            type="search"
            name="shop-search"
            autocomplete="off"
            placeholder="编号、名称、商品或备注"
          >
          <button
            v-if="searchInput.length > 0"
            type="button"
            aria-label="清空店铺搜索"
            @click="clearSearch"
          >
            清空
          </button>
        </div>
      </div>
    </header>

    <p
      v-if="searching && matchCount === 0"
      class="shop-panel__no-results"
      role="status"
    >
      没有匹配店铺。现有数据没有被删除，清空搜索即可恢复全部列表。
    </p>
    <p
      v-else-if="searching"
      class="shop-panel__result-count"
      role="status"
    >
      找到 {{ matchCount }} 家匹配店铺。
    </p>

    <div class="shop-panel__categories">
      <ShopCategorySection
        v-for="definition in CATEGORY_DEFINITIONS"
        :key="definition.category"
        :category="definition.category"
        :title="definition.title"
        :shops="filteredShops[definition.category]"
        @add="openAddShopForm"
        @edit="openEditShopForm"
        @remove="requestRemoveShop"
        @reorder="reorderShops"
      />
    </div>

    <ShopFormModal
      :open="formOpen"
      :shop="editingShop"
      :default-category="defaultCategory"
      @save="saveShop"
      @close="closeShopForm"
    />
  </section>
</template>

<style scoped>
.shop-panel {
  display: grid;
  gap: 0.75rem;
}

.shop-panel__header {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 1.5rem;
}

.shop-panel__header > div:first-child {
  min-width: 0;
  max-width: 35rem;
}

.shop-panel__eyebrow,
.shop-panel h2,
.shop-panel__header p {
  margin-top: 0;
}

.shop-panel__eyebrow {
  margin-bottom: 0.5rem;
  color: var(--mint-700);
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.12em;
}

.shop-panel h2 {
  margin-bottom: 0.5rem;
  font-size: 1.25rem;
  letter-spacing: -0.03em;
}

.shop-panel__header p:last-child {
  margin-bottom: 0;
  color: var(--text-muted);
  font-size: 0.875rem;
  line-height: 1.6;
}

.shop-panel__search {
  display: grid;
  flex: 0 1 22rem;
  gap: 0.375rem;
  color: var(--text-muted);
  font-size: 0.75rem;
  font-weight: 700;
}

.shop-panel__search > div {
  display: flex;
}

.shop-panel__search input {
  min-width: 0;
  width: 100%;
  padding: 0.6875rem 0.75rem;
  color: var(--text);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 0.5rem 0 0 0.5rem;
}

.shop-panel__search button {
  padding: 0.6875rem 0.75rem;
  color: var(--text-muted);
  background: var(--surface-soft);
  border-color: var(--border);
  border-left: 0;
  border-radius: 0 0.5rem 0.5rem 0;
}

.shop-panel__no-results,
.shop-panel__result-count {
  margin: 0;
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
}

.shop-panel__no-results {
  color: var(--text);
  background: var(--surface-soft);
  border: 1px dashed var(--border);
}

.shop-panel__result-count {
  color: var(--mint-700);
  background: color-mix(in srgb, var(--mint-500) 12%, transparent);
}

.shop-panel__categories {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.625rem;
  align-items: start;
}

@media (max-width: 52rem) {
  .shop-panel__header {
    display: grid;
    align-items: start;
  }

  .shop-panel__search {
    width: 100%;
    max-width: 28rem;
  }

  .shop-panel__categories {
    grid-template-columns: 1fr;
  }
}
</style>
