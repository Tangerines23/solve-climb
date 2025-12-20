import React from 'react';

/**
 * @toss/tds-mobile의 ThemeProvider Mock
 * Vercel 환경에서 실제 테마 로직 대신 자식 요소를 그대로 렌더링합니다.
 */
export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
    return <>{children}</>;
};

// 필요한 경우 다른 TDS 컴포넌트들도 이곳에 추가할 수 있습니다.
export const Button = (props: any) => <button {...props} />;
export const Input = (props: any) => <input {...props} />;
