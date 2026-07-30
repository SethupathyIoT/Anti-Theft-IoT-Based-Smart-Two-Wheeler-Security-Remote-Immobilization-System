import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // three must resolve to a single copy: postprocessing and three-stdlib both pull it in,
  // and duplicate instances break instanceof checks inside the render pipeline.
  resolve: {
    dedupe: ['three'],
  },
  optimizeDeps: {
    include: ['three', '@react-three/fiber', '@react-three/drei', '@react-three/postprocessing', 'postprocessing'],
  },
  server: {
    port: 3000,
    host: true
  }
});
