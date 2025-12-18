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
    type: 'basic',
    overScrollMode: 'never',
  },
  permissions: [],
  outdir: 'dist',
});
