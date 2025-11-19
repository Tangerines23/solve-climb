import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { LanguageType, LanguageSubTopic } from '../types/quiz';
import './LanguageDetailPage.css';

const LANGUAGE_SUB_TOPICS: { id: LanguageSubTopic; name: string; description: string }[] = [
  { id: '글자', name: '글자', description: '히라가나, 한자, 알파벳 등' },
  { id: '문자', name: '문자', description: '단어, 어휘' },
  { id: '문장', name: '문장', description: '문장 이해 및 구성' },
];

const LANGUAGE_ICONS: Record<LanguageType, string> = {
  한글: '한',
  일본어: 'あ',
  영어: 'A',
};

export function LanguageDetailPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const languageParam = searchParams.get('language') as LanguageType | null;

  const handleBack = () => {
    navigate(-1);
  };

  const handleSubTopicSelect = (subTopic: LanguageSubTopic) => {
    if (!languageParam) return;
    // 언어 타입과 세부 분야를 조합하여 topic 생성
    const topic = `${languageParam}-${subTopic}` as any;
    navigate(`/category-select?category=언어&topic=${encodeURIComponent(topic)}`);
  };

  if (!languageParam || !['한글', '일본어', '영어'].includes(languageParam)) {
    return (
      <div className="page-container">
        <div className="error-message">
          <p>언어를 찾을 수 없습니다.</p>
          <button onClick={handleBack} className="back-button">뒤로 가기</button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container language-detail-container">
      <button className="back-button" onClick={handleBack}>
        ← 뒤로
      </button>
      <div className="language-header">
        <span className="language-icon">{LANGUAGE_ICONS[languageParam]}</span>
        <h1 className="language-title">{languageParam}</h1>
      </div>
      <div className="subtopic-grid">
        {LANGUAGE_SUB_TOPICS.map((subTopic) => (
          <div
            key={subTopic.id}
            className="subtopic-card"
            onClick={() => handleSubTopicSelect(subTopic.id)}
          >
            <h3 className="subtopic-name">{subTopic.name}</h3>
            <p className="subtopic-description">{subTopic.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

