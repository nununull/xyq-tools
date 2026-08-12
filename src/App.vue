<template>
  <AppLayout />
  <AuthModal
    :open="authModalOpen"
    @close="authModalOpen = false"
  />
  <ConfirmDialog />
  <ToastHost />
</template>

<script setup lang="ts">
import ConfirmDialog from './components/common/ConfirmDialog.vue'
import ToastHost from './components/common/ToastHost.vue'
import AppLayout from './layouts/AppLayout.vue'
import AuthModal from './components/auth/AuthModal.vue'
import { provide, ref } from 'vue'

const authModalOpen = ref(false)
/** 向桌面与移动账户入口提供唯一弹窗开启函数。 */
function openAuthModal(): void { authModalOpen.value = true }
provide('openAuthModal', openAuthModal)
</script>
