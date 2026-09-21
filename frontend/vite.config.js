import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Three's DRACOLoader declares bundled fallback decoder URLs at module scope.
// This portfolio always supplies the two reviewed glTF decoder files from
// public/draco, so rewriting those defaults prevents Vite from emitting five
// unused duplicate decoder assets into dist/assets.
function reviewedPublicDracoAssets() {
  return {
    name: 'use-reviewed-public-draco-assets',
    enforce: 'pre',
    transform(code, id) {
      if (!id.replaceAll('\\', '/').endsWith('/three/examples/jsm/loaders/DRACOLoader.js')) return null;
      const transformed = code
        .replace("new URL( '../libs/draco/draco_decoder.wasm', import.meta.url ).toString()", "'/draco/draco_decoder.wasm'")
        .replace("new URL( '../libs/draco/draco_wasm_wrapper.js', import.meta.url ).toString()", "'/draco/draco_wasm_wrapper.js'")
        .replace("new URL( '../libs/draco/draco_decoder.js', import.meta.url ).toString()", 'null')
        .replace("new URL( '../libs/draco/gltf/draco_wasm_wrapper.js', import.meta.url ).toString()", "'/draco/draco_wasm_wrapper.js'")
        .replace("new URL( '../libs/draco/gltf/draco_decoder.wasm', import.meta.url ).toString()", "'/draco/draco_decoder.wasm'");
      return { code: transformed, map: null };
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [reviewedPublicDracoAssets(), react()],
})
