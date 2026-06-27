// 애니메이션 상태 관리 로직을 관리하는 커스텀 훅
import { useState } from 'react';

export function useQuizAnimations() {
  const [cardAnimation, setCardAnimation] = useState('');
  const [inputAnimation, setInputAnimation] = useState('');
  const [questionAnimation, setQuestionAnimation] = useState('fade-in');
  const [showFlash, setShowFlash] = useState(false);
  const [isError, setIsError] = useState(false);
  const [showSlideToast, setShowSlideToast] = useState(false);
  const [damagePosition, setDamagePosition] = useState<{ left: string; top: string }>({
    left: '50%',
    top: '50%',
  });

  return {
    cardAnimation,
    inputAnimation,
    questionAnimation,
    showFlash,
    isError,
    showSlideToast,
    damagePosition,
    setCardAnimation,
    setInputAnimation,
    setQuestionAnimation,
    setShowFlash,
    setIsError,
    setShowSlideToast,
    setDamagePosition,
  };
}
