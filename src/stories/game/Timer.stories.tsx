import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';
import { TimerCircle } from '@/components/TimerCircle';

// Timer Container
const TimerContainer = (Story: React.ComponentType) => (
  <div
    style={{
      width: '100%',
      height: '100px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'var(--color-bg-primary)',
      padding: 'var(--spacing-lg)',
      borderRadius: 'var(--rounded-card)',
    }}
  >
    <Story />
  </div>
);

const meta = {
  title: 'Game Components/Timer',
  component: TimerCircle,
  tags: ['autodocs'],
  decorators: [TimerContainer],
  argTypes: {
    duration: { control: { type: 'range', min: 10, max: 300, step: 10 } },
    isPaused: { control: 'boolean' },
    enableFastForward: { control: 'boolean' },
    triggerPenalty: { control: 'number' },
    penaltyAmount: { control: 'number' },
  },
  args: {
    duration: 60,
    onComplete: () => {},
    isPaused: false,
    enableFastForward: false,
    penaltyAmount: 5,
  },
} satisfies Meta<typeof TimerCircle>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    duration: 60,
  },
};

export const RunningLow: Story = {
  args: {
    duration: 15,
  },
  parameters: {
    docs: {
      description: {
        story: '시간이 얼마 남지 않으면(25% 미만) 붉은색으로 변합니다.',
      },
    },
  },
};

export const Paused: Story = {
  args: {
    isPaused: true,
    duration: 120,
  },
};

export const FastForwardEnabled: Story = {
  args: {
    enableFastForward: true,
    duration: 300,
  },
  parameters: {
    docs: {
      description: {
        story: '3초 이상 길게 누르면 빠르게 시간이 흐르는 모드(디버그용)입니다.',
      },
    },
  },
};
