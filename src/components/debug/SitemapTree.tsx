import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDebugStore } from '../../stores/useDebugStore';
import { APP_CONFIG } from '../../config/app';

interface SiteNode {
  name: string;
  path?: string; // 이동할 경로가 있으면 설정
  children?: SiteNode[];
  isOpen?: boolean; // 초기 펼침 상태
}

// APP_CONFIG 데이터를 기반으로 트리 구조를 동적으로 생성
const generateSiteStructure = (): SiteNode => {
  const mathWorlds = APP_CONFIG.WORLDS.filter((w) => w.mountainId === 'math');
  const mathCategories = APP_CONFIG.CATEGORIES.filter((c) => c.mountainId === 'math');

  return {
    name: '🏠 홈 (Home)',
    path: '/',
    isOpen: true,
    children: [
      {
        name: '⛰️ 수학의 산 (Mathematics)',
        path: '/category-select?mountain=math',
        isOpen: true,
        children: mathCategories.map((cat) => ({
          name: `${cat.icon} ${cat.name}`,
          isOpen: cat.id === '기초', // 기초 분야만 기본으로 열어둠
          children: mathWorlds.map((world) => {
            // 해당 월드/카테고리에 레벨 데이터가 있는지 확인
            const hasLevels =
              (
                APP_CONFIG.LEVELS[world.id as keyof typeof APP_CONFIG.LEVELS] as Record<
                  string,
                  unknown[]
                >
              )?.[cat.id]?.length > 0;

            return {
              name: `🌍 ${world.name} (${world.id})${hasLevels ? '' : ' (준비중)'}`,
              path: `/level-select?mountain=math&world=${world.id}&category=${cat.id}`,
            };
          }),
        })),
      },
      {
        name: '🏆 랭킹 (Ranking)',
        path: '/ranking',
      },
      {
        name: '📝 학습 일지 (Roadmap)',
        path: '/roadmap',
      },
      {
        name: '👤 마이페이지 (MyPage)',
        path: '/my-page',
        children: [
          { name: '🔧 디버그 룸 (Debug)', path: '/debug' },
          { name: '🔔 알림 (Notifications)', path: '/notifications' },
          { name: '👤 프로필 수정', path: '/my-page?showProfileForm=true' },
        ],
      },
      {
        name: '🎒 상점 (Shop)',
        path: '/shop',
      },
      {
        name: '⚠️ 레거시 (Legacy - 미사용)',
        children: [{ name: '🗾 언어의 산 (Language)', path: '/category-select?mountain=language' }],
      },
    ],
  };
};

const SITE_STRUCTURE = generateSiteStructure();

const TreeNode = ({
  node,
  depth = 0,
  ancestorPaths = [],
}: {
  node: SiteNode;
  depth?: number;
  ancestorPaths?: string[];
}) => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(node.isOpen || false);
  const hasChildren = node.children && node.children.length > 0;

  // 현재 노드의 경로가 있으면 계보(Lineage)에 추가
  const currentLineage = node.path ? [...ancestorPaths, node.path] : ancestorPaths;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasChildren) {
      setIsOpen(!isOpen);
    }
  };

  const handleLinkClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (node.path) {
      useDebugStore.getState().setShowReturnFloater(true);
      navigate(node.path);
    }
  };

  const handleMacroClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentLineage.length === 0) return;

    console.log(
      `%c[Macro] 🏁 Full Trace Started: ${node.name}`,
      'color: rgb(59, 130, 246); font-weight: bold; font-size: 14px;'
    );

    // 중복 제거된 순차 경로 생성 (예: 홈 -> 수학 -> 레벨)
    const sequence = Array.from(new Set(currentLineage));
    const reverseSequence = [...sequence].reverse().slice(1);
    const fullTour = [...sequence, ...reverseSequence];

    let delay = 0;
    const STEP_TIME = 1500; // 각 페이지 머무는 시간 (1.5초)

    fullTour.forEach((path, index) => {
      setTimeout(() => {
        const isReturning = index >= sequence.length;
        const emoji = isReturning ? '↩️' : '🚀';
        console.log(
          `%c[Macro] ${emoji} Step ${index + 1}/${fullTour.length}: ${path}`,
          'color: rgb(16, 185, 129)'
        );

        if (path !== '/') {
          useDebugStore.getState().setShowReturnFloater(true);
        }
        navigate(path);

        if (index === fullTour.length - 1) {
          console.log(
            `%c[Macro] ✅ Full Trace Completed!`,
            'color: rgb(16, 185, 129); font-weight: bold'
          );
        }
      }, delay);
      delay += STEP_TIME;
    });
  };

  return (
    <div style={{ marginLeft: depth * 20, marginTop: 'var(--spacing-xs)' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--spacing-sm)',
          padding: 'var(--spacing-sm)',
          borderRadius: 'var(--rounded-xs)',
          backgroundColor: 'var(--color-bg-secondary)',
          border: '1px solid var(--color-bg-tertiary)',
          cursor: hasChildren ? 'pointer' : 'default',
          transition: 'background-color 0.2s',
          position: 'relative',
          overflow: 'hidden',
        }}
        onClick={handleClick}
      >
        {/* 화살표 아이콘 */}
        <span
          style={{
            display: 'inline-block',
            width: '20px',
            textAlign: 'center',
            transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s',
            cursor: 'pointer',
            visibility: hasChildren ? 'visible' : 'hidden',
          }}
        >
          ▶
        </span>

        {/* 노드 이름 */}
        <span style={{ fontWeight: 500, color: 'white', flex: 1 }}>{node.name}</span>

        {/* 제어 버튼 영역 */}
        <div style={{ display: 'flex', gap: 'var(--spacing-xs)', marginLeft: 'auto' }}>
          {node.path && (
            <button
              onClick={handleLinkClick}
              style={{
                padding: 'var(--spacing-xs) var(--spacing-sm)',
                backgroundColor: 'var(--color-blue-500)',
                border: 'none',
                borderRadius: 'var(--rounded-xs)',
                color: 'white',
                fontSize: '11px',
                fontWeight: 'bold',
                cursor: 'pointer',
              }}
            >
              Go 🚀
            </button>
          )}
          {currentLineage.length > 0 && (
            <button
              onClick={handleMacroClick}
              style={{
                padding: 'var(--spacing-xs) var(--spacing-sm)',
                backgroundColor: 'var(--color-blue-400)',
                border: 'none',
                borderRadius: 'var(--rounded-xs)',
                color: 'white',
                fontSize: '11px',
                fontWeight: 'bold',
                cursor: 'pointer',
              }}
              title="계보 따라가기 (Full Trace Mode)"
            >
              Trace 🔍
            </button>
          )}
        </div>
      </div>

      {/* 자식 노드 렌더링 */}
      {hasChildren && isOpen && (
        <div
          style={{
            borderLeft: '1px dashed var(--color-bg-tertiary)',
            marginLeft: 'var(--spacing-small-alt)',
          }}
        >
          {node.children!.map((child, index) => (
            <TreeNode key={index} node={child} depth={depth + 1} ancestorPaths={currentLineage} />
          ))}
        </div>
      )}
    </div>
  );
};

export function SitemapTree() {
  return (
    <div
      className="sitemap-tree"
      style={{
        padding: 'var(--spacing-lg)',
        backgroundColor: 'var(--color-bg-primary)',
        borderRadius: 'var(--rounded-card)',
        overflowX: 'auto',
        minWidth: '300px',
      }}
    >
      <TreeNode node={SITE_STRUCTURE} />
    </div>
  );
}
