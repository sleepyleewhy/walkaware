import tailwindcss from "@tailwindcss/vite"
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from "path"

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    sourcemap: true
  },
  resolve: {
    alias: {
      "@" : path.resolve(__dirname, "src")
    },
  },
  server: {
    allowedHosts: true,
    // https: {
    //   key: './cert.key',
    //   cert: './cert.crt',
    // },
    // host: '0.0.0.0',
    // port: 5173
  },
  define: {
    'process.env' : process.env
  }
})
