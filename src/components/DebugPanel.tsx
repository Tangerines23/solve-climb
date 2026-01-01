import { useDebugStore } from '../stores/useDebugStore';
import { QuickActionsSection } from './debug/QuickActionsSection';
import { TierSystemSection } from './debug/TierSystemSection';
import { BadgeSystemSection } from './debug/BadgeSystemSection';
import { GameFlowSection } from './debug/GameFlowSection';
import { ItemSystemSection } from './debug/ItemSystemSection';
import { DataResetSection } from './debug/DataResetSection';
import { ErrorLogSection } from './debug/ErrorLogSection';
import { BoundaryTestSection } from './debug/BoundaryTestSection';
import './DebugPanel.css';

function DebugPanel() {
  const { isDebugPanelOpen, activeTab, toggleDebugPanel, setActiveTab } = useDebugStore();
  
  if (!isDebugPanelOpen) return null;
  
  const tabs = [
    { id: 'quick', label: '빠른 조작' },
    { id: 'tier', label: '티어' },
    { id: 'badge', label: '뱃지' },
    { id: 'game', label: '게임' },
    { id: 'item', label: '아이템' },
    { id: 'data', label: '데이터' },
    { id: 'errors', label: '에러 로그' },
    { id: 'boundary', label: '경계값 테스트' },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'quick':
        return <QuickActionsSection />;
      case 'tier':
        return <TierSystemSection />;
      case 'badge':
        return <BadgeSystemSection />;
      case 'game':
        return <GameFlowSection />;
      case 'item':
        return <ItemSystemSection />;
      case 'data':
        return <DataResetSection />;
      case 'errors':
        return <ErrorLogSection />;
      case 'boundary':
        return <BoundaryTestSection />;
      default:
        return <QuickActionsSection />;
    }
  };
  
  return (
    <div 
      className="debug-panel-overlay"
      onClick={(e) => {
        // 패널 외부 클릭 시 닫기
        if (e.target === e.currentTarget) {
          toggleDebugPanel();
        }
      }}
    >
      <div 
        className={`debug-panel ${isDebugPanelOpen ? 'open' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="debug-panel-header">
          <h2>🐛 디버그 패널</h2>
          <button onClick={toggleDebugPanel} aria-label="닫기">X</button>
        </div>
        
        <div className="debug-panel-tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`debug-panel-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
        
        <div className="debug-panel-content">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
}

export default DebugPanel;
