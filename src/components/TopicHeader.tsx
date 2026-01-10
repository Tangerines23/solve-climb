import { useNavigate } from 'react-router-dom';
import { APP_CONFIG } from '../config/app';
import './TopicHeader.css';

interface TopicHeaderProps {
  categoryId: string | null;
}

export function TopicHeader({ categoryId }: TopicHeaderProps) {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate('/');
  };

  // 카테고리 ID로 카테고리 이름 가져오기
  const getCategoryName = (id: string | null): string => {
    if (!id) return '주제 선택';
    const category = APP_CONFIG.CATEGORIES.find((cat) => cat.id === id);
    return category ? category.name : '주제 선택';
  };

  return (
    <header className="topic-header">
      <div className="topic-header-content">
        <button className="topic-back-button" onClick={handleBack} aria-label="뒤로 가기">
          ←
        </button>
        <h1 className="topic-header-title">{getCategoryName(categoryId)}</h1>
        <div className="topic-header-spacer"></div>
      </div>
    </header>
  );
}
