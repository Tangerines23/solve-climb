import React from 'react';
import './tds-theme.css';

/**
 * @toss/tds-mobile의 개별 컴포넌트 Mock (ThemeProvider 제외)
 * Vercel/일반 브라우저 환경에서 실제 토스 앱 연동 없이 UI를 렌더링하기 위함입니다.
 */

// 필요한 경우 다른 TDS 컴포넌트들도 이곳에 추가할 수 있습니다.
export const Button = (props: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button {...props} />
);
export const Input = (props: React.InputHTMLAttributes<HTMLInputElement>) => <input {...props} />;
