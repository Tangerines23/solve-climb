// src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { ThemeProvider } from '@toss/tds-mobile';

import AppContainer from './AppContainer';
import './index.css';

// Button이 theme.colors.backgroundColor를 정상 참조할 수 있도록 customTheme 객체를 생성합니다.
const customTheme = {
  colors: {
    backgroundColor: '#FFFFFF', // 흰색 배경
  },
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider theme={customTheme}>
      <AppContainer />
    </ThemeProvider>
  </React.StrictMode>
);