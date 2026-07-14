import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.solveclimb.app',
  appName: 'solve-climb',
  webDir: 'dist',
  plugins: {
    GoogleSignIn: {
      clientId: '422673840720-etmtujb3lrt4966pv2j212sqf39votil.apps.googleusercontent.com',
      serverClientId: '422673840720-etmtujb3lrt4966pv2j212sqf39votil.apps.googleusercontent.com',
    },
  },
};

export default config;
