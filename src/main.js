// main.js
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

// 🔇 Ignore le warning ResizeObserver en dev
const ignoreResizeObserverWarning = () => {
  const originalError = window.console.error
  window.console.error = (...args) => {
    if (typeof args[0] === 'string' && args[0].includes('ResizeObserver loop')) return
    originalError(...args)
  }
}
ignoreResizeObserverWarning()

createApp(App).use(router).mount('#app')