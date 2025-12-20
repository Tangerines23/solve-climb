import { defineConfig } from '@apps-in-toss/web-framework/config';

export default defineConfig({
  appName: 'solve-climb-edu',
  brand: {
    displayName: 'solve-climb-edu',
    primaryColor: '#00BFA5',
    icon: 'public/SolveClimb.png',
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
    type: 'game', // 게임 미니앱으로 설정 (공통 내비게이션 바 자동 적용)
    overScrollMode: 'never',
  },
  permissions: [],
  outdir: 'dist',
});
