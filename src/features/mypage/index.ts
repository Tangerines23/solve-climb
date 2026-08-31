/**
 * @domain 마이페이지 및 프로필 관리 (MyPage & Profile)
 * @summary 유저 프로필 조회/수정, 등반 통계, 뱃지 현황 확인
 */

export { MyPage } from './pages/MyPage';
export { useHistoryData, type HistoryStats } from './hooks/useHistoryData';
export {
  useMyPageStats,
  type MyPageStats,
  type UseMyPageStatsResult,
} from './hooks/useMyPageStats';
export { MyPageTipPreview } from './components/MyPageTipPreview';
