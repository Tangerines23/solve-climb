import { useNavigate } from 'react-router-dom';
import './TopicHeader.css';

interface TopicHeaderProps {
  title: string;
  onBack?: () => void;
}

export function TopicHeader({ title, onBack }: TopicHeaderProps) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1); // 이전 페이지로 돌아가기
    }
  };

  return (
    <header className="topic-header">
      <div className="topic-header-content">
        <button className="topic-back-button" onClick={handleBack} aria-label="뒤로 가기">
          ←
        </button>
        <h1 className="topic-header-title">{title}</h1>
        <div className="topic-header-spacer"></div>
      </div>
    </header>
  );
}
