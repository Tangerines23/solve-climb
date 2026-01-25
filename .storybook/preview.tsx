import type { Preview } from '@storybook/react-vite';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import React from 'react';
import '../src/index.css';

const preview: Preview = {
  parameters: {
    // 배경색을 실제 앱과 유사하게 설정 (Slate-50 등)
    backgrounds: {
      default: 'light',
      values: [
        { name: 'light', value: '#f8fafc' }, // slate-50
        { name: 'dark', value: '#0f172a' }, // slate-900
      ],
    },
    // 컴포넌트가 중앙에 끼지 않도록 패딩 부여
    layout: 'padded',
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
  // 라우터 등 필수 컨텍스트 제공
  decorators: [
    (Story) => (
      <BrowserRouter>
        <div style={{ padding: '20px', minHeight: '100vh' }}>
          <Story />
        </div>
      </BrowserRouter>
    ),
  ],
};

export default preview;
