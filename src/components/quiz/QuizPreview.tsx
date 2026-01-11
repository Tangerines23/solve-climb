import { useState, useMemo, useEffect, useCallback, FormEvent } from 'react';
import { NavigateFunction } from 'react-router-dom';
import { CustomKeypad } from '../CustomKeypad';
import { QwertyKeypad } from '../QwertyKeypad';
import { APP_CONFIG } from '../../config/app';


interface QuizPreviewProps {
    categoryParam: string | null;
    subParam: string | null;
    levelParam: number | null;
    category: string | null;
    topic: string | null;
    keyboardType: 'custom' | 'qwerty';
    navigate: NavigateFunction;
    useSystemKeyboard: boolean;
}

export function QuizPreview({
    categoryParam,
    subParam,
    levelParam,
    category,
    topic,
    keyboardType,
    navigate,
    useSystemKeyboard,
}: QuizPreviewProps) {
    const [previewKeyboardType, setPreviewKeyboardType] = useState<'custom' | 'qwerty'>(
        () => keyboardType
    );

    // Preview 모드용 변수들
    const isJapaneseQuizPreview = categoryParam === 'language' && subParam === 'japanese';
    const isEquationQuizPreview = categoryParam === 'math' && subParam === 'equations';
    const isCalculusQuizPreview = categoryParam === 'math' && subParam === 'calculus';
    const allowNegativePreview = isEquationQuizPreview || isCalculusQuizPreview;

    // displayCategory와 displayTopic 계산
    const displayCategoryPreview = useMemo(() => {
        return categoryParam
            ? APP_CONFIG.CATEGORY_MAP[categoryParam as keyof typeof APP_CONFIG.CATEGORY_MAP] ||
            category ||
            ''
            : category || '';
    }, [categoryParam, category]);

    const displayTopicPreview = useMemo(() => {
        if (!categoryParam || !subParam) return topic || '';

        if (subParam === 'arithmetic' && levelParam !== null) {
            const level = levelParam;
            const topicMap: Record<number, string> = {
                1: '덧셈', 2: '뺄셈', 3: '덧셈', 4: '뺄셈', 5: '곱셈',
                6: '나눗셈', 7: '혼합 연산', 8: '곱셈', 9: '나눗셈', 10: '종합 연산',
            };
            return topicMap[level] || '덧셈';
        } else if (subParam === 'calculus' && levelParam !== null) {
            const level = levelParam;
            const topicMap: Record<number, string> = {
                1: '기초 미분', 2: '상수배 미분', 3: '합과 차의 미분', 4: '곱의 미분', 5: '몫의 미분',
                6: '합성함수 미분', 7: '삼각함수 미분', 8: '지수·로그 미분', 9: '고급 미분', 10: '미분 종합',
            };
            return topicMap[level] || '미적분';
        } else {
            const subTopics = APP_CONFIG.SUB_TOPICS[categoryParam as keyof typeof APP_CONFIG.SUB_TOPICS];
            const subTopicInfo = subTopics?.find((t) => t.id === subParam);
            return subTopicInfo?.name || subParam;
        }
    }, [categoryParam, subParam, levelParam, topic]);

    // 키보드 타입 동기화
    useEffect(() => {
        setPreviewKeyboardType(keyboardType);
    }, [keyboardType]);

    const handlePrevKeyboard = useCallback(() => {
        setPreviewKeyboardType((prev) => (prev === 'custom' ? 'qwerty' : 'custom'));
    }, []);

    const handleNextKeyboard = useCallback(() => {
        setPreviewKeyboardType((prev) => (prev === 'custom' ? 'qwerty' : 'custom'));
    }, []);

    // Handlers for preview (console logs)
    const handlePreviewKeyPress = useCallback((key: string) => { console.log('Preview key:', key); }, []);
    const handlePreviewClear = useCallback(() => { console.log('Preview clear'); }, []);
    const handlePreviewBackspace = useCallback(() => { console.log('Preview backspace'); }, []);
    const handlePreviewSubmit = useCallback((e: FormEvent) => { e.preventDefault(); console.log('Preview submit'); }, []);

    const canSwitchKeyboard = !isJapaneseQuizPreview;
    const currentPreviewType = isJapaneseQuizPreview ? 'qwerty' : previewKeyboardType;

    return (
        <div className="quiz-page">
            <header className="quiz-header">
                <button
                    className="quiz-back-button"
                    onClick={() => navigate('/my-page')}
                    aria-label="뒤로 가기"
                >
                    ←
                </button>
                <div
                    className="quiz-timer-container"
                    style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}
                >
                    {canSwitchKeyboard && (
                        <button
                            onClick={handlePrevKeyboard}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: 'var(--color-text-primary)',
                                fontSize: '1.5rem',
                                cursor: 'pointer',
                                padding: 'var(--spacing-xs)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                minWidth: '32px',
                                minHeight: '32px',
                                borderRadius: 'var(--rounded-sm)',
                                transition: 'background-color 0.2s',
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                            aria-label="이전 키보드"
                        >
                            ‹
                        </button>
                    )}
                    <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--color-text-primary)' }}>
                        {currentPreviewType === 'custom' ? '커스텀 키패드' : '쿼티 키보드'}
                    </h2>
                    {canSwitchKeyboard && (
                        <button
                            onClick={handleNextKeyboard}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: 'var(--color-text-primary)',
                                fontSize: '1.5rem',
                                cursor: 'pointer',
                                padding: 'var(--spacing-xs)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                minWidth: '32px',
                                minHeight: '32px',
                                borderRadius: 'var(--rounded-sm)',
                                transition: 'background-color 0.2s',
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                            aria-label="다음 키보드"
                        >
                            ›
                        </button>
                    )}
                </div>
                <div className="quiz-header-spacer"></div>
            </header>

            <div className="quiz-content">
                <div className="quiz-card">
                    <div className="category-label">
                        {displayCategoryPreview} - {displayTopicPreview}
                    </div>
                    <form onSubmit={handlePreviewSubmit} style={{ display: 'contents' }}>
                        <div>
                            <h2 className="problem-text">미리보기</h2>
                        </div>
                        {!useSystemKeyboard && (
                            <div className="answer-input-wrapper">
                                <div className="answer-display">
                                    <span className="answer-caret"></span>
                                </div>
                            </div>
                        )}
                    </form>
                </div>

                {!useSystemKeyboard && (
                    <>
                        {isJapaneseQuizPreview ? (
                            <QwertyKeypad
                                onKeyPress={handlePreviewKeyPress}
                                onClear={handlePreviewClear}
                                onBackspace={handlePreviewBackspace}
                                onSubmit={handlePreviewSubmit}
                                disabled={false}
                                mode="text"
                            />
                        ) : currentPreviewType === 'qwerty' ? (
                            <QwertyKeypad
                                onKeyPress={handlePreviewKeyPress}
                                onClear={handlePreviewClear}
                                onBackspace={handlePreviewBackspace}
                                onSubmit={handlePreviewSubmit}
                                disabled={false}
                                mode="number"
                                allowNegative={allowNegativePreview}
                            />
                        ) : (
                            <CustomKeypad
                                onNumberClick={handlePreviewKeyPress}
                                onClear={handlePreviewClear}
                                onBackspace={handlePreviewBackspace}
                                onSubmit={handlePreviewSubmit}
                                disabled={false}
                                showNegative={allowNegativePreview}
                            />
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
