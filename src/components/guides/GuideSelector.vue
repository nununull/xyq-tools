<script setup lang="ts">
import type { AdventureGuide } from '@/types/adventureGuide'

defineProps<{
  guides: readonly AdventureGuide[]
  modelValue: string
}>()

defineEmits<{
  'update:modelValue': [guideId: string]
}>()
</script>

<template>
  <div
    class="guide-selector"
    role="tablist"
    aria-label="选择奇遇攻略"
  >
    <button
      v-for="guide in guides"
      :id="`guide-tab-${guide.id}`"
      :key="guide.id"
      class="guide-selector__item"
      :class="{ 'guide-selector__item--active': guide.id === modelValue }"
      type="button"
      role="tab"
      :aria-selected="guide.id === modelValue"
      :aria-controls="`guide-panel-${guide.id}`"
      @click="$emit('update:modelValue', guide.id)"
    >
      {{ guide.title }}
    </button>
  </div>
</template>

<style scoped>
.guide-selector {
  display: flex;
  flex-wrap: wrap;
  gap: 0.625rem;
  min-width: 0;
}

.guide-selector__item {
  min-height: 2.5rem;
  padding: 0.625rem 1rem;
  color: var(--text-muted);
  background: var(--surface-raised);
  border-color: var(--border);
  transition: color 160ms ease, background-color 160ms ease, border-color 160ms ease;
}

.guide-selector__item:hover {
  color: var(--text);
  background: var(--surface-soft);
  border-color: var(--border-strong);
}

.guide-selector__item--active,
.guide-selector__item--active:hover {
  color: var(--mint-700);
  background: var(--guide-accent-soft, #fbf4eb);
  border-color: color-mix(in srgb, var(--guide-accent, #b67832) 58%, var(--border));
  box-shadow: inset 0 0 0 1px var(--guide-accent, #b67832);
}
</style>
