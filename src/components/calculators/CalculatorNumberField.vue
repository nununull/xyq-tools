<script setup lang="ts">
const value = defineModel<string>({ required: true })
defineProps<{
  id: string
  label: string
  suffix?: string
  placeholder?: string
  error?: string
  large?: boolean
}>()
</script>

<template>
  <div
    class="calc-field"
    :class="{ 'calc-field--large': large }"
  >
    <label :for="id">{{ label }}</label>
    <div
      class="calc-field__control"
      :class="{ 'calc-field__control--invalid': error }"
    >
      <input
        :id="id"
        v-model="value"
        type="text"
        inputmode="decimal"
        autocomplete="off"
        :maxlength="32"
        :placeholder="placeholder ?? '请输入'"
        :aria-invalid="Boolean(error)"
        :aria-describedby="error ? `${id}-error` : undefined"
      >
      <slot name="suffix">
        <span v-if="suffix">{{ suffix }}</span>
      </slot>
    </div>
    <p
      v-if="error"
      :id="`${id}-error`"
      class="calc-error"
      role="alert"
    >
      {{ error }}
    </p>
  </div>
</template>
