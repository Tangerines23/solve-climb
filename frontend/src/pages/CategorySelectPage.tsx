// 카테고리 선택 페이지 (기존 HomePage 기능 분리)
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuizStore } from '../stores/useQuizStore';
import { CategorySelector } from '../components/CategorySelector';
import { TimeSelector } from '../components/TimeSelector';
import { Category, Topic } from '../types/quiz';
import { TimeLimit } from '../stores/useQuizStore';
import { APP_CONFIG } from '../config/app';
import './CategorySelectPage.css';

type SelectionStep = 'category' | 'time';

export function CategorySelectPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setCategoryTopic, setTimeLimit } = useQuizStore();
  const [step, setStep] = useState<SelectionStep>('category');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);

  // URL 파라미터에서 카테고리와 토픽(sub) 읽기
  useEffect(() => {
    const categoryParam = searchParams.get('category');
    const topicParam = searchParams.get('topic');
    const subParam = searchParams.get('sub');
    
    if (categoryParam) {
      // category 파라미터로 카테고리 이름 가져오기
      const categoryName = APP_CONFIG.CATEGORY_MAP[categoryParam as keyof typeof APP_CONFIG.CATEGORY_MAP] as Category;
      
      if (categoryName) {
        setSelectedCategory(categoryName);
        
        // sub 파라미터가 있으면 SUB_TOPICS에서 찾아서 매핑
        if (subParam) {
          const topics = APP_CONFIG.SUB_TOPICS[categoryParam as keyof typeof APP_CONFIG.SUB_TOPICS];
          const selectedSubTopic = topics?.find(t => t.id === subParam);
          
          if (selectedSubTopic) {
            // sub topic을 실제 Topic 타입으로 매핑
            // 예: 'arithmetic' -> '덧셈' (임시로 sub id를 그대로 사용)
            const topic = selectedSubTopic.id as any as Topic;
            setSelectedTopic(topic);
            setCategoryTopic(categoryName, topic);
            setStep('time');
          }
        } else if (topicParam) {
          // 기존 topic 파라미터 처리
          const topic = decodeURIComponent(topicParam) as Topic;
          setSelectedTopic(topic);
          setCategoryTopic(categoryName, topic);
          setStep('time');
        }
      }
    }
  }, [searchParams, setCategoryTopic]);

  const handleCategoryTopicSelect = (category: Category, topic: Topic) => {
    setSelectedCategory(category);
    setSelectedTopic(topic);
    setCategoryTopic(category, topic);
    setStep('time');
  };

  const handleTimeSelect = (time: TimeLimit) => {
    setTimeLimit(time);
    // 모든 선택이 완료되면 퀴즈 페이지로 이동
    navigate('/math-quiz');
  };

  const handleBack = () => {
    if (step === 'time') {
      setStep('category');
    } else {
      navigate('/');
    }
  };

  return (
    <div className="page-container category-select-container">
      <button className="back-button" onClick={handleBack}>
        ← 뒤로
      </button>
      {step === 'category' ? (
        <CategorySelector onSelect={handleCategoryTopicSelect} />
      ) : (
        <>
          <div className="selected-info">
            <p className="selected-text">
              {selectedCategory} - {selectedTopic}
            </p>
          </div>
          <TimeSelector onSelect={handleTimeSelect} />
        </>
      )}
    </div>
  );
}

