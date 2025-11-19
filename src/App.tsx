// src/App.tsx
import { Routes, Route } from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import { SubCategoryPage } from './pages/SubCategoryPage';
import { LanguageDetailPage } from './pages/LanguageDetailPage';
import { CategorySelectPage } from './pages/CategorySelectPage';
import { LevelSelectPage } from './pages/LevelSelectPage';
import { MathQuizPage } from './pages/MathQuizPage';
import { ResultPage } from './pages/ResultPage';
import { RankingPage } from './pages/RankingPage';
import { MyPage } from './pages/MyPage';
import { NotificationPage } from './pages/NotificationPage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/subcategory" element={<SubCategoryPage />} />
      <Route path="/language-detail" element={<LanguageDetailPage />} />
      <Route path="/category-select" element={<CategorySelectPage />} />
      <Route path="/level-select" element={<LevelSelectPage />} />
      <Route path="/math-quiz" element={<MathQuizPage />} />
      <Route path="/result" element={<ResultPage />} />
      <Route path="/ranking" element={<RankingPage />} />
      <Route path="/my-page" element={<MyPage />} />
      <Route path="/notifications" element={<NotificationPage />} />
    </Routes>
  );
}

export default App;