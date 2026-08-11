<script setup lang="ts">
import { ref, watch } from 'vue'
import { VueDraggable } from 'vue-draggable-plus'
import ShopCard from '@/components/shops/ShopCard.vue'
import type { Shop, ShopCategory } from '@/types/domain'

const props = defineProps<{
  category: ShopCategory
  title: string
  shops: Shop[]
}>()

const emit = defineEmits<{
  add: [category: ShopCategory]
  edit: [id: string]
  remove: [id: string]
  reorder: [category: ShopCategory, ids: string[]]
}>()

const sortableShops = ref<Shop[]>([])
let dragging = false

/** 从输入店铺创建排序副本，拖拽过程不得直接改写领域数组。 */
function syncSortableShops(): void {
  sortableShops.value = [...props.shops].sort((left, right) => left.order - right.order)
}

/** 锁定外部顺序同步，避免覆盖正在拖动的临时结果。 */
function startDragging(): void {
  dragging = true
}

/** 一次性提交当前分类的店铺 ID 顺序。 */
function commitShopOrder(): void {
  emit('reorder', props.category, sortableShops.value.map(({ id }) => id))
}

/** 提交拖拽结果并恢复领域顺序，结束本轮拖动。 */
function finishDragging(): void {
  commitShopOrder()
  dragging = false
  syncSortableShops()
}

/** 用键盘移动当前分类的单个可见店铺，并复用现有排序事件提交顺序。 */
function moveShop(id: string, direction: 'up' | 'down'): void {
  const currentIndex = sortableShops.value.findIndex((shop) => shop.id === id)
  const targetIndex = currentIndex + (direction === 'up' ? -1 : 1)
  if (currentIndex < 0 || targetIndex < 0 || targetIndex >= sortableShops.value.length) return

  const reorderedShops = [...sortableShops.value]
  const [shop] = reorderedShops.splice(currentIndex, 1)
  if (shop === undefined) return
  reorderedShops.splice(targetIndex, 0, shop)
  sortableShops.value = reorderedShops
  commitShopOrder()
  syncSortableShops()
}

/** 请求在当前分类新增店铺。 */
function addShop(): void {
  emit('add', props.category)
}

watch(
  () => props.shops.map(({ id, order }) => `${id}:${order}`).join('|'),
  () => {
    if (!dragging) syncSortableShops()
  },
  { immediate: true },
)
</script>

<template>
  <section
    class="shop-category"
    :aria-labelledby="`shop-category-${category}`"
  >
    <header class="shop-category__header">
      <div>
        <h3 :id="`shop-category-${category}`">
          {{ title }}
        </h3>
        <span>{{ shops.length }} 家店铺</span>
      </div>
      <button
        type="button"
        :aria-label="`新增${title}店铺`"
        @click="addShop"
      >
        新增
      </button>
    </header>

    <div
      v-if="sortableShops.length === 0"
      class="shop-category__empty"
      role="status"
    >
      该分类当前没有可显示店铺。
    </div>

    <VueDraggable
      v-else
      v-model="sortableShops"
      class="shop-category__list"
      handle=".shop-card__drag-handle"
      ghost-class="shop-category__ghost"
      :animation="160"
      :aria-label="`${title}店铺排序列表`"
      @start="startDragging"
      @end="finishDragging"
    >
      <ShopCard
        v-for="(shop, index) in sortableShops"
        :key="shop.id"
        :shop="shop"
        :can-move-up="index > 0"
        :can-move-down="index < sortableShops.length - 1"
        @edit="emit('edit', $event)"
        @remove="emit('remove', $event)"
        @move="moveShop"
      />
    </VueDraggable>
  </section>
</template>

<style scoped>
.shop-category {
  display: grid;
  align-content: start;
  gap: 1rem;
  min-width: 0;
  padding: 1rem;
  background: var(--surface-soft);
  border: 1px solid var(--border);
  border-radius: 0.75rem;
}

.shop-category__header,
.shop-category__header > div {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.shop-category__header > div {
  min-width: 0;
}

.shop-category h3 {
  margin: 0;
  font-size: 1.125rem;
  letter-spacing: -0.02em;
}

.shop-category__header span {
  color: var(--text-muted);
  font-size: 0.75rem;
  white-space: nowrap;
}

.shop-category__header button {
  padding: 0.4375rem 0.625rem;
  font-size: 0.8125rem;
}

.shop-category__list {
  display: grid;
  gap: 0.625rem;
}

.shop-category__ghost {
  opacity: 0.35;
}

.shop-category__empty {
  padding: 1.25rem;
  color: var(--text-muted);
  border: 1px dashed var(--border);
  border-radius: 0.625rem;
  font-size: 0.875rem;
  text-align: center;
}

@media (max-width: 34rem) {
  .shop-category__header {
    align-items: start;
  }

  .shop-category__header > div {
    display: grid;
    justify-content: start;
    gap: 0.25rem;
  }
}
</style>
