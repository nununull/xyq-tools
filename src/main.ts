import { createPinia } from 'pinia'
import { createApp } from 'vue'
import App from './App.vue'
import { router } from './router'
import './styles/base.css'
import { usePersistenceStore } from './stores/usePersistenceStore'

const app = createApp(App)
const pinia = createPinia()
app.use(pinia)
app.use(router)
await usePersistenceStore(pinia).initialize()
app.mount('#app')
