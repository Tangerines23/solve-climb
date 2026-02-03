// @apps-in-toss/web-framework 제거 시: defineConfig 대신 plain export
// 패키지 복구 시 아래 주석 해제 후 사용
// import { defineConfig } from '@apps-in-toss/web-framework/config';
// export default defineConfig({ ... });

export default {
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
    type: 'game',
    overScrollMode: 'never',
  },
  permissions: [],
  outdir: 'dist',
};
