<script setup lang="ts">
/* global KeyboardEvent */
import type { Shop } from '@/types/domain'

const props = defineProps<{
  shop: Shop
  canMoveUp: boolean
  canMoveDown: boolean
}>()

const emit = defineEmits<{
  edit: [id: string]
  remove: [id: string]
  move: [id: string, direction: 'up' | 'down']
}>()

/** 请求编辑当前店铺资料。 */
function editShop(): void {
  emit('edit', props.shop.id)
}

/** 请求删除当前店铺。 */
function removeShop(): void {
  emit('remove', props.shop.id)
}

/** 用上下方向键请求移动店铺，越过分类边界时不改变顺序。 */
function handleSortKey(event: KeyboardEvent): void {
  const direction = event.key === 'ArrowUp' ? 'up' : event.key === 'ArrowDown' ? 'down' : null
  if (direction === null) return

  event.preventDefault()
  if (direction === 'up' && !props.canMoveUp) return
  if (direction === 'down' && !props.canMoveDown) return
  emit('move', props.shop.id, direction)
}
</script>

<template>
  <article
    class="shop-card"
    :aria-label="`店铺 ${shop.number} ${shop.name}`"
  >
    <button
      class="shop-card__drag-handle"
      type="button"
      :aria-label="`调整店铺 ${shop.number} ${shop.name} 顺序，按上、下方向键移动`"
      :title="`拖动排序；按上、下方向键移动店铺 ${shop.number} ${shop.name}`"
      aria-keyshortcuts="ArrowUp ArrowDown"
      :aria-disabled="!canMoveUp && !canMoveDown"
      @keydown="handleSortKey"
    >
      <span aria-hidden="true">⠿</span>
    </button>

    <div class="shop-card__content">
      <header>
        <span class="shop-card__number">{{ shop.number }}</span>
        <h4>{{ shop.name }}</h4>
      </header>

      <ul
        v-if="shop.items.length > 0"
        class="shop-card__items"
        aria-label="商品列表"
      >
        <li
          v-for="item in shop.items"
          :key="item"
        >
          {{ item }}
        </li>
      </ul>
      <p
        v-else
        class="shop-card__items-empty"
      >
        未填写商品
      </p>

      <p
        v-if="shop.note.length > 0"
        class="shop-card__note"
      >
        {{ shop.note }}
      </p>
    </div>

    <footer>
      <button
        type="button"
        :aria-label="`编辑店铺 ${shop.number} ${shop.name}`"
        @click="editShop"
      >
        编辑
      </button>
      <button
        class="shop-card__remove"
        type="button"
        :aria-label="`删除店铺 ${shop.number} ${shop.name}`"
        @click="removeShop"
      >
        删除
      </button>
    </footer>
  </article>
</template>

<style scoped>
.shop-card {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: start;
  gap: 0.5rem;
  padding: 0.625rem;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 0.625rem;
}

.shop-card__drag-handle {
  padding: 0.125rem;
  color: var(--text-muted);
  cursor: grab;
  font-size: 1.125rem;
  line-height: 1;
  touch-action: none;
  user-select: none;
}

.shop-card__drag-handle:active {
  cursor: grabbing;
}

.shop-card__content {
  min-width: 0;
}

.shop-card__content header {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0.5rem;
}

.shop-card h4,
.shop-card p {
  margin: 0;
}

.shop-card h4 {
  overflow-wrap: anywhere;
  font-size: 0.875rem;
}

.shop-card__number {
  color: var(--mint-700);
  font-size: 0.8125rem;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
}

.shop-card__items {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
  margin: 0.375rem 0 0;
  padding: 0;
  list-style: none;
}

.shop-card__items li {
  padding: 0.1875rem 0.5rem;
  color: var(--text-muted);
  background: var(--surface-soft);
  border-radius: 999px;
  font-size: 0.75rem;
}

.shop-card__items-empty,
.shop-card__note {
  color: var(--text-muted);
  font-size: 0.8125rem;
  line-height: 1.55;
  overflow-wrap: anywhere;
}

.shop-card .shop-card__items-empty {
  margin-top: 0.375rem;
}

.shop-card .shop-card__note {
  margin-top: 0.375rem;
}

.shop-card footer {
  display: flex;
  gap: 0.25rem;
}

.shop-card footer button {
  padding: 0.375rem 0.5rem;
  color: var(--text-muted);
  background: transparent;
  border-color: transparent;
  font-size: 0.8125rem;
}

.shop-card footer button:hover {
  color: var(--text);
  background: var(--surface-soft);
  border-color: var(--border);
}

.shop-card footer .shop-card__remove {
  color: var(--danger);
}

@media (max-width: 34rem) {
  .shop-card {
    grid-template-columns: auto minmax(0, 1fr);
  }

  .shop-card footer {
    grid-column: 2;
  }
}
</style>
