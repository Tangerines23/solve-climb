import { defineConfig } from '@apps-in-toss/web-framework/config';

export default defineConfig({
  // appName: 'solve-climb-edu',
  appName: 'solve-climb',
  brand: {
    // displayName: 'solve-climb-edu',
    displayName: '솔브 클라임',
    primaryColor: '#00BFA5', // 화면에 노출될 앱의 기본 색상으로 바꿔주세요.
    icon: 'public/SolveClimb.png', // 화면에 노출될 앱의 아이콘 이미지 주소로 바꿔주세요.
    bridgeColorMode: 'inverted',
  },
  web: {
    host: process.env.DEV_HOST || 'localhost',
    port: parseInt(process.env.DEV_PORT || '5173', 10),
    commands: {
      dev: 'vite --host',
      build: 'vite build',
    },
  },
  webViewProps: {
    type: 'game',
    overScrollMode: 'never',
  },
  permissions: [],
  outdir: 'dist',
});
