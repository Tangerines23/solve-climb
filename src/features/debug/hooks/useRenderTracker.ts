import { useEffect, useRef } from 'react';

/**
 * 컴포넌트의 리렌더링을 추적하고 원인을 콘솔에 출력하는 개발 도구 훅
 * @param componentName 추적할 컴포넌트 이름
 * @param props 현재 컴포넌트의 props (추적하고 싶은 값들을 객체로 전달)
 */
export function useRenderTracker(componentName: string, props: Record<string, any> = {}) {
  const renderCount = useRef(0);
  const prevProps = useRef(props);

  // 렌더링 횟수 증가 (렌더링 도중 실행)
  renderCount.current += 1;

  useEffect(() => {
    // 개발 모드에서만 동작
    if (import.meta.env.MODE !== 'development') return;

    const changedProps: string[] = [];
    Object.keys(props).forEach((key) => {
      if (prevProps.current[key] !== props[key]) {
        changedProps.push(key);
      }
    });

    const isInitialMount = renderCount.current === 1;

    if (isInitialMount) {
      console.log(
        `%c[Render] %c${componentName}%c Initial Mount`,
        'color: #9e9e9e; font-weight: bold',
        'color: #2196f3; font-weight: bold',
        'color: #4caf50; font-weight: bold'
      );
    } else {
      console.log(
        `%c[Render] %c${componentName}%c #${renderCount.current}%c ${
          changedProps.length > 0
            ? `Changed: [${changedProps.join(', ')}]`
            : 'Re-rendered (State, Context or Parent)'
        }`,
        'color: #9e9e9e; font-weight: bold',
        'color: #2196f3; font-weight: bold',
        'color: #4caf50; font-weight: bold',
        'color: #ff9800'
      );

      // 구체적으로 어떤 값이 어떻게 변했는지 출력 (상세 분석용)
      if (changedProps.length > 0) {
        changedProps.forEach((key) => {
          console.groupCollapsed(`  → Details for [${key}]`);
          console.log('Before:', prevProps.current[key]);
          console.log('After: ', props[key]);
          console.groupEnd();
        });
      }
    }

    prevProps.current = props;
  });
}
