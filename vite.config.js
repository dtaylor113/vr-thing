import { defineConfig } from 'vite';
import basicSsl from '@vitejs/plugin-basic-ssl';

export default defineConfig({
  plugins: [basicSsl()],
  server: {
    host: true,
    watch: {
      ignored: ['**/originals/**', '**/*.{m4a,mp3,MP3,mp4,MP4,mov,MOV,avi,AVI,ply,glb,GLB,jpg,JPG,jpeg,JPEG,png,PNG,gif,GIF,tif,TIF,bmp,BMP}'],
    },
  },
  build: {
    rollupOptions: {
      external: ['react-native-fs'],
    },
  },
});
