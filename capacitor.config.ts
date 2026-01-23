import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.solveclimb.app',
  appName: 'solve-climb',
  webDir: 'dist',
  // AdMob App ID: ca-app-pub-6410061165772335~9825031776
  // iOS/Android 네이티브 설정(Info.plist, strings.xml)에도 반영이 필요합니다.
};

export default config;
