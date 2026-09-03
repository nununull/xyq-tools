import { createRouter, createWebHashHistory } from 'vue-router'

export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@/views/HomeView.vue'),
    },
    {
      path: '/sect-mission',
      name: 'sect-mission',
      component: () => import('@/views/SectMissionView.vue'),
    },
    {
      path: '/adventure-guides',
      name: 'adventure-guides',
      component: () => import('@/views/AdventureGuidesView.vue'),
    },
    {
      path: '/artifact-helper',
      name: 'artifact-helper',
      component: () => import('@/views/ArtifactHelperView.vue'),
    },
    {
      path: '/currency-converter',
      name: 'currency-converter',
      component: () => import('@/views/CurrencyConverterView.vue'),
    },
    {
      path: '/synthesis-calculator',
      name: 'synthesis-calculator',
      component: () => import('@/views/SynthesisCalculatorView.vue'),
    },
  ],
})
