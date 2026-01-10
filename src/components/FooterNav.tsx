import { useNavigate, useLocation } from 'react-router-dom';
import { APP_CONFIG } from '../config/app';
import './FooterNav.css';

type NavItem = 'home' | 'ranking' | 'roadmap' | 'my';

interface NavItemConfig {
  id: NavItem;
  label: string;
  icon: string;
  route: string;
}

const navItems: NavItemConfig[] = [
  { id: 'home', label: '홈', icon: '🏠', route: APP_CONFIG.ROUTES.HOME },
  { id: 'ranking', label: '랭킹', icon: '🏆', route: APP_CONFIG.ROUTES.RANKING },
  { id: 'roadmap', label: '일지', icon: '📝', route: APP_CONFIG.ROUTES.HISTORY },
  { id: 'my', label: '마이', icon: '👤', route: APP_CONFIG.ROUTES.MY_PAGE },
];

export function FooterNav() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavClick = (item: NavItemConfig) => {
    if (item.id === 'home') {
      // 홈 클릭 시 최상단으로 스크롤
      window.scrollTo({ top: 0, behavior: 'smooth' });
      if (location.pathname !== APP_CONFIG.ROUTES.HOME) {
        navigate(APP_CONFIG.ROUTES.HOME);
      }
    } else {
      // 일반 네비게이션: 해당 라우트로 이동
      navigate(item.route);
    }
  };

  const isActive = (item: NavItemConfig): boolean => {
    if (item.id === 'home') {
      return location.pathname === APP_CONFIG.ROUTES.HOME;
    }
    return location.pathname === item.route;
  };

  return (
    <nav className="footer-nav">
      {navItems.map((item) => (
        <button
          key={item.id}
          className={`footer-nav-item ${isActive(item) ? 'active' : ''}`}
          onClick={() => handleNavClick(item)}
        >
          <span className="footer-nav-icon">{item.icon}</span>
          <span className="footer-nav-label">{item.label}</span>
        </button>
      ))}
    </nav>
  );
}
