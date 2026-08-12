<script setup lang="ts">
/* global KeyboardEvent */
import type { Shop } from '@/types/domain'

const props = defineProps<{
  shop: Shop
  categoryTitle: string
  showName?: boolean
  canMoveUp: boolean
  canMoveDown: boolean
}>()

const emit = defineEmits<{
  edit: [id: string]
  remove: [id: string]
  move: [id: string, direction: 'up' | 'down']
}>()

/** 请求编辑当前编号对应的店铺资料。 */
function editShop(): void {
  emit('edit', props.shop.id)
}

/** 请求删除当前编号对应的店铺资料。 */
function removeShop(): void {
  emit('remove', props.shop.id)
}

/** 用上下方向键请求移动店铺，边界方向保持当前顺序。 */
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
  <div class="shop-number-pill">
    <button
      class="shop-number-pill__drag shop-card__drag-handle"
      type="button"
      :aria-label="`调整${categoryTitle}店铺 ${shop.number} 顺序，按上、下方向键移动`"
      aria-keyshortcuts="ArrowUp ArrowDown"
      :aria-disabled="!canMoveUp && !canMoveDown"
      @keydown="handleSortKey"
    >
      <span aria-hidden="true">⠿</span>
    </button>
    <button
      class="shop-number-pill__number"
      type="button"
      :aria-label="`编辑${categoryTitle}店铺 ${shop.number} ${shop.name}`"
      :title="`编辑店铺 ${shop.number}`"
      @click="editShop"
    >
      {{ showName ? `${shop.number}-${shop.name}` : shop.number }}
    </button>
    <button
      class="shop-number-pill__remove"
      type="button"
      :aria-label="`删除${categoryTitle}店铺 ${shop.number} ${shop.name}`"
      title="删除店铺"
      @click="removeShop"
    >
      ×
    </button>
  </div>
</template>

<style scoped>
.shop-number-pill {
  display: inline-flex;
  align-items: stretch;
  min-width: 0;
  overflow: hidden;
  background: var(--surface);
  border: 1px solid var(--border-strong);
  border-radius: 999px;
}

.shop-number-pill .shop-number-pill__drag {
  width: 1.75rem;
  min-width: 1.75rem;
  height: 1.875rem;
  min-height: 1.875rem;
  color: var(--text-muted) !important;
  background: transparent;
  border: 0;
  border-right: 1px solid var(--border);
  border-radius: 0;
  cursor: grab;
  font-size: 0.75rem;
}

.shop-number-pill__number,
.shop-number-pill__remove {
  min-height: 1.875rem;
  padding: 0.25rem 0.5rem;
  border: 0;
  border-radius: 0;
  font-size: 0.8125rem;
}

.shop-number-pill__number {
  min-width: 2.5rem;
  max-width: 16rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--mint-800);
  background: transparent;
  font-weight: 850;
  font-variant-numeric: tabular-nums;
}

.shop-number-pill__number:hover {
  color: var(--surface-raised);
  background: var(--mint-700);
}

.shop-number-pill__remove {
  padding-inline: 0.4rem 0.5rem;
  color: var(--danger);
  background: transparent;
  border-left: 1px solid var(--border);
}

.shop-number-pill__remove:hover {
  color: var(--surface-raised);
  background: var(--danger);
}
</style>
