// granite.config.js
// 배포용 설정 파일 - import 없이 순수 JavaScript로 작성
// 이 파일은 프로젝트 루트에 위치해야 합니다.
module.exports = {
  appName: 'solve-climb',
  brand: {
    displayName: 'solve-climb',
    primaryColor: '#00BFA5',
    icon: 'SolveClimb.png',
    bridgeColorMode: 'basic',
  },
  web: {
    host: 'localhost',
    port: 5173,
    commands: {
      dev: 'vite --host',
      build: 'vite build',
    },
  },
  permissions: [],
  outdir: 'dist',
};

