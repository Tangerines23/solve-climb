import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { MathQuizPage } from './pages/MathQuizPage';

function AppContainer() {
  return (
    <BrowserRouter>
      <Routes>
        {/* (지시서 4-4항) MathQuizPage 경로 설정 */}
        <Route path="/math-quiz" element={<MathQuizPage />} />

        {/* (임시) 현재는 math-quiz 페이지만 존재하므로, 
            기본 경로('/')로 접근 시에도 math-quiz로 이동시킵니다. */}
        <Route path="/" element={<MathQuizPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default AppContainer;
