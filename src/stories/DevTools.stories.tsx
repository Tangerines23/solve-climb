import type { Meta, StoryObj } from '@storybook/react-vite';
import { DailyRewardDebugSection } from '@/components/debug/DailyRewardDebugSection';
import { StaticUISection } from '@/components/debug/StaticUISection';
import { NotificationPlayground } from '@/components/debug/NotificationPlayground';

const meta = {
  title: 'Tools/DevTools',
  tags: ['autodocs'],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

// 1. 일일 보상 디버그
export const DailyReward: Story = {
  render: () => <DailyRewardDebugSection />,
};

// 2. 정적 UI 모음
export const StaticUI: Story = {
  render: () => <StaticUISection />,
};

// 3. 알림 테스트
export const Notifications: Story = {
  render: () => <NotificationPlayground />,
};
