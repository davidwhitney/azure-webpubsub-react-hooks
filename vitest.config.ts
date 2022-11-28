import { mergeConfig } from 'vite'
import { defineConfig } from 'vitest/config'
import viteConfig from './vite.config'

export default mergeConfig(viteConfig, defineConfig({ 
  root: "src",
  test: {
    globals: true, 
    environment: 'jsdom', 
  },
}));