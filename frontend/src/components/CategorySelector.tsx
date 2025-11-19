import React, { useState } from 'react';
import { Category, Topic } from '../types/quiz';
import './CategorySelector.css';

interface CategorySelectorProps {
  onSelect: (category: Category, topic: Topic) => void;
}

// 카테고리별 분야 정의
const CATEGORY_TOPICS: Record<Category, Topic[]> = {
  수학: ['덧셈', '뺄셈', '곱셈', '나눗셈'],
  언어: ['맞춤법', '어휘', '속담'],
  논리: ['수열', '패턴'],
  상식: ['역사', '과학', '지리'],
};

export function CategorySelector({ onSelect }: CategorySelectorProps) {
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  const handleCategoryClick = (category: Category) => {
    setSelectedCategory(category);
  };

  const handleTopicClick = (topic: Topic) => {
    if (selectedCategory) {
      onSelect(selectedCategory, topic);
    }
  };

  const handleBack = () => {
    setSelectedCategory(null);
  };

  // 분야 선택 화면
  if (selectedCategory) {
    const topics = CATEGORY_TOPICS[selectedCategory];
    return (
      <div className="category-selector-container">
        <button className="back-button" onClick={handleBack}>
          ← 뒤로
        </button>
        <h1 className="selector-title">{selectedCategory}</h1>
        <div className="topics-grid">
          {topics.map((topic) => (
            <div
              key={topic}
              className="topic-card"
              onClick={() => handleTopicClick(topic)}
            >
              <h2>{topic}</h2>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 카테고리 선택 화면
  return (
    <div className="category-selector-container">
      <h1 className="selector-title">카테고리를 선택하세요</h1>
      <div className="categories-grid">
        {Object.keys(CATEGORY_TOPICS).map((category) => (
          <div
            key={category}
            className="category-card"
            onClick={() => handleCategoryClick(category as Category)}
          >
            <h2>{category}</h2>
            <p>{CATEGORY_TOPICS[category as Category].length}개 분야</p>
          </div>
        ))}
      </div>
    </div>
  );
}

