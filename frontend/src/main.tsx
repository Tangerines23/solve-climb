// src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css'; // (v3.0 9단계) CSS 파일 임포트

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {/* (v3.0 14단계) TDSProvider 래퍼 제거 */}
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);