---
description: Hook Bridge 패턴 및 계층 분리 가이드
globs: ['src/features/**/*.tsx', 'src/features/**/hooks/*.ts']
alwaysApply: false
---

# Hook Bridge 패턴 (UI-Logic Separation)

## 핵심 개념

UI 컴포넌트(View)는 어떻게 데이터를 가져오거나 저장하는지 몰라야 합니다. 모든 데이터 바인딩과 액션 핸들링은 **브릿지 훅(Bridge Hook)**을 통해 이루어집니다.

- **Dumb Component**: Props로 전달받은 데이터와 함수만 사용하여 렌더링합니다.
- **Bridge Hook**: 전역 상태(`Zustand`), 서버 상태(`React Query`), API 호출 로직을 조합하여 UI에 필요한 최소한의 인터페이스만 노출합니다.

## 구현 규칙

1. **직접 호출 금지**: UI 컴포넌트 내부에서 `useUserStore`, `useGameStore`, `supabase.from(...)` 등을 직접 호출하지 마십시오.
2. **명명 규칙**: 브릿지 훅의 이름은 반드시 `use[FeatureName]Bridge` 형태여야 합니다.
3. **인터페이스 최소화**: 브릿지 훅은 UI가 화면을 그리는 데 필요한 `state`와 수행할 `actions`만 객체 형태로 반환합니다.

## 코드 예시

### ✅ 올바른 패턴 (Hook Bridge)

```typescript
// 1. 브릿지 훅 (src/features/quiz/hooks/useQuizBridge.ts)
export function useQuizBridge() {
  const { score, addScore } = useQuizStore();
  const { data: profile } = useQuery(...);

  const handleLevelComplete = async (nextLevel: number) => {
    // 비즈니스 로직 및 API 처리
    await updateProgress(nextLevel);
    addScore(100);
  };

  return {
    score,
    userName: profile?.display_name,
    actions: {
      onLevelComplete: handleLevelComplete
    }
  };
}

// 2. UI 컴포넌트 (src/features/quiz/components/QuizView.tsx)
export function QuizView() {
  const { score, userName, actions } = useQuizBridge(); // ⬅️ 브릿지 훅 사용

  return (
    <div>
      <h1>{userName}님, 현재 점수: {score}</h1>
      <button onClick={() => actions.onLevelComplete(2)}>레벨 완료</button>
    </div>
  );
}
```

## ❌ 금지 패턴

```typescript
// ❌ 컴포넌트가 직접 스토어나 API를 만지는 경우
export function QuizView() {
  const { score } = useQuizStore(); // ❌ 금지
  const { data } = useQuery(...); // ❌ 금지
  
  const handleSave = () => {
    supabase.from('logs').insert(...); // ❌ 금지
  };
}
```
