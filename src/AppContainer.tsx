// src/AppContainer.tsx
import { BrowserRouter } from 'react-router-dom';
import App from './App'; // <-- (신규) App.tsx를 임포트합니다.

function AppContainer() {
  (window as any).diagnosis?.('AppContainer Initializing...');
  return (
    <BrowserRouter>
      {/* 이제 AppContainer는 라우터 '컨텍스트'만 제공하고,
        실제 라우트 정의(Routes, Route)는 App.tsx가 담당합니다.
      */}
      <App />
    </BrowserRouter>
  );
}

export default AppContainer;
