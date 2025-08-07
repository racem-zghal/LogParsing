// vue.config.js
const { defineConfig } = require('@vue/cli-service')

module.exports = defineConfig({
  transpileDependencies: true,

  devServer: {
    client: {
      overlay: {
        warnings: false, // ← masque les warnings comme ResizeObserver
        errors: true     // ← affiche toujours les vraies erreurs
      }
    }
  }
})