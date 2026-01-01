import { useNavigate } from 'react-router-dom';
import { APP_CONFIG } from '../config/app';
import './SubCategoryHeader.css';

interface SubCategoryHeaderProps {
  categoryId: string | null;
}

export function SubCategoryHeader({ categoryId }: SubCategoryHeaderProps) {
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
    <header className="subcategory-header">
      <div className="subcategory-header-content">
        <button className="subcategory-back-button" onClick={handleBack} aria-label="뒤로 가기">
          ←
        </button>
        <h1 className="subcategory-header-title">{getCategoryName(categoryId)}</h1>
        <div className="subcategory-header-spacer"></div>
      </div>
    </header>
  );
}
