import { defineConfig } from 'vite';
import basicSsl from '@vitejs/plugin-basic-ssl';

export default defineConfig({
  plugins: [basicSsl()],
  server: {
    host: true,
    watch: {
      ignored: ['**/originals/**', '**/*.{m4a,mp4,MP4,mov,MOV,avi,AVI,ply,glb,jpg,JPG,png,PNG}'],
    },
  },
});
