import type { Meta, StoryObj } from '@storybook/react-vite';
import '@/components/LevelListCard.css';
import '@/components/MyRecordCard.css';

// Mock Level List Item for Storybook (Pure UI)
const MockLevelListItem = ({
  level,
  name,
  status,
  bestScore,
  isDev = false,
}: {
  level: number;
  name: string;
  status: 'cleared' | 'next' | 'locked';
  bestScore: number | null;
  isDev?: boolean;
}) => {
  const isDisabled = status === 'locked';

  return (
    <div
      className={`level-list-item ${status} ${isDisabled ? 'disabled' : ''} ${isDev ? 'under-development' : ''}`}
      style={isDisabled ? { cursor: 'pointer' } : undefined}
    >
      <div className="level-list-item-left">
        <div className="level-list-item-header">
          <span className="level-list-item-number">Level {level}</span>
          {isDev && <span className="level-list-status under-dev">개발중</span>}
          {!isDev && status === 'cleared' && (
            <span className="level-list-status cleared">클리어 ✓</span>
          )}
          {!isDev && status === 'locked' && (
            <span className="level-list-status locked">잠김 🔒</span>
          )}
        </div>
        <div className="level-list-item-name">{name}</div>
        {!isDev && bestScore !== null && (
          <div className="level-list-item-best">최고: {bestScore.toLocaleString()}m</div>
        )}
      </div>
      <div className="level-list-item-right">
        {isDev ? (
          <button className="level-list-button level-list-button-under-dev">개발중</button>
        ) : status === 'next' ? (
          <button className="level-list-button level-list-button-primary">도전하기 &gt;</button>
        ) : status === 'cleared' ? (
          <button className="level-list-button level-list-button-secondary">다시하기 &gt;</button>
        ) : (
          <button
            className="level-list-button level-list-button-disabled"
            disabled
            style={{ opacity: 0.5, cursor: 'not-allowed' }}
          >
            잠김
          </button>
        )}
      </div>
    </div>
  );
};

// Mock Level List Card
const MockLevelListCard = () => {
  return (
    <div className="level-list-card" style={{ maxWidth: '400px', margin: '0 auto' }}>
      <div className="level-list-header">
        <h3 className="level-list-title">레벨 목록 (Preview)</h3>
      </div>
      <div className="level-list-content">
        <MockLevelListItem level={1} name="구구단 언덕" status="cleared" bestScore={150} />
        <MockLevelListItem level={2} name="덧셈의 숲" status="cleared" bestScore={320} />
        <MockLevelListItem level={3} name="나눗셈 절벽" status="next" bestScore={null} />
        <MockLevelListItem level={4} name="함수의 동굴" status="locked" bestScore={null} />
        <MockLevelListItem
          level={5}
          name="미적분 정상"
          status="locked"
          bestScore={null}
          isDev={true}
        />
      </div>
    </div>
  );
};

const meta = {
  title: 'UI/Cards',
  component: MockLevelListCard,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
} satisfies Meta<typeof MockLevelListCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const LevelList: Story = {};

export const MyRecord: Story = {
  render: () => (
    <div className="my-record-card" style={{ maxWidth: '400px', margin: '0 auto' }}>
      <h3 className="my-record-card-title">수학 산 최고 기록</h3>
      <div className="my-record-card-content">
        <div className="my-record-item">
          <span className="my-record-icon">⏱️</span>
          <span className="my-record-label">타임 어택:</span>
          <span className="my-record-value">1,250m</span>
        </div>
        <div className="my-record-item">
          <span className="my-record-icon">♾️</span>
          <span className="my-record-label">서바이벌:</span>
          <span className="my-record-value">890m</span>
        </div>
      </div>
    </div>
  ),
};

export const MyRecordLoading: Story = {
  render: () => (
    <div className="my-record-card" style={{ maxWidth: '400px', margin: '0 auto' }}>
      <div className="my-record-card-skeleton">
        <div
          className="skeleton-title"
          style={{
            height: '20px',
            width: '60%',
            backgroundColor: '#334155',
            borderRadius: '4px',
            marginBottom: '10px',
          }}
        ></div>
        <div
          className="skeleton-item"
          style={{
            height: '16px',
            width: '80%',
            backgroundColor: '#334155',
            borderRadius: '4px',
            marginBottom: '8px',
          }}
        ></div>
        <div
          className="skeleton-item"
          style={{ height: '16px', width: '80%', backgroundColor: '#334155', borderRadius: '4px' }}
        ></div>
      </div>
    </div>
  ),
};
