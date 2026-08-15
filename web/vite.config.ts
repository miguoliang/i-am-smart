import { defineConfig } from 'vite'

const assetBase = process.env.VITE_ASSET_BASE || '/'

export default defineConfig({
  base: assetBase.endsWith('/') ? assetBase : `${assetBase}/`,
  server: {
    host: true,
  },
})
