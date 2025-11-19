import React, { useState, useEffect } from 'react';
import { Header } from '../components/Header';
import { FooterNav } from '../components/FooterNav';
import { AlertModal } from '../components/AlertModal';
import { useProfileStore } from '../stores/useProfileStore';
import { APP_CONFIG } from '../config/app';
import { openLeaderboard } from '../utils/gameCenter';
import './RankingPage.css';

interface RankingUser {
  rank: number;
  nickname: string;
  avatar?: string;
  score: number;
  isMe?: boolean;
  isFriend?: boolean;
}

type RankingPeriod = 'today' | 'week' | 'month' | 'all';

export function RankingPage() {
  const { profile } = useProfileStore();
  const [period, setPeriod] = useState<RankingPeriod>('today');
  const [rankings, setRankings] = useState<RankingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [myRank, setMyRank] = useState<number | null>(null);
  const [showAlert, setShowAlert] = useState(false);

  useEffect(() => {
    fetchRankings();
  }, [period]);

  const fetchRankings = async () => {
    try {
      setLoading(true);
      // TODO: 실제 API 호출로 대체
      // const response = await fetch(`${APP_CONFIG.API_BASE_URL}/ranking?period=${period}`);
      // const data = await response.json();

      // 임시 데이터
      await new Promise(resolve => setTimeout(resolve, 500));
      const mockRankings: RankingUser[] = [
        { rank: 1, nickname: '토스마스터', score: 12500, isFriend: true },
        { rank: 2, nickname: '수학천재', score: 11800 },
        { rank: 3, nickname: '퀴즈킹', score: 11200, isFriend: true },
        { rank: 4, nickname: '두뇌풀가동', score: 10800 },
        { rank: 5, nickname: '문제해결왕', score: 10500 },
        { rank: 6, nickname: '지식탐험가', score: 10200 },
        { rank: 7, nickname: '학습마니아', score: 9800 },
        { rank: 8, nickname: '뇌섹시대', score: 9500 },
        { rank: 9, nickname: '지식인', score: 9200 },
        { rank: 10, nickname: '공부러버', score: 9000 },
      ];

      // 내 프로필이 있으면 내 랭킹 추가
      if (profile) {
        const myRanking: RankingUser = {
          rank: 1234,
          nickname: profile.nickname,
          avatar: profile.avatar,
          score: 8500,
          isMe: true,
        };
        setMyRank(1234);
        // 내 랭킹이 상위 10위 안에 없으면 리스트에 추가
        if (myRanking.rank > 10) {
          mockRankings.push(myRanking);
        } else {
          // 상위 10위 안에 있으면 해당 위치에 삽입
          const index = mockRankings.findIndex(r => r.rank > myRanking.rank);
          if (index === -1) {
            mockRankings.push(myRanking);
          } else {
            mockRankings.splice(index, 0, myRanking);
          }
        }
      }

      setRankings(mockRankings);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch rankings:', error);
      setLoading(false);
    }
  };

  const handleShareScore = (user: RankingUser) => {
    // 점수 공유 기능 (추후 구현)
    if (navigator.share) {
      navigator.share({
        title: `${user.nickname}님의 점수`,
        text: `${user.nickname}님의 점수는 ${user.score.toLocaleString()}점이에요!`,
      });
    }
  };

  const handleAddFriend = (user: RankingUser) => {
    // 친구 추가 기능 (추후 구현)
    console.log('친구 추가:', user.nickname);
  };

  const handleOpenTossLeaderboard = async () => {
    const success = await openLeaderboard();
    if (!success) {
      setShowAlert(true);
    }
  };

  const periodLabels: Record<RankingPeriod, string> = {
    today: '오늘',
    week: '이번 주',
    month: '이번 달',
    all: '전체',
  };

  return (
    <div className="ranking-page">
      <Header />
      <main className="ranking-main">
        <div className="ranking-content">
          <h1 className="ranking-title">리더보드</h1>

          {/* 토스 리더보드 열기 버튼 */}
          <button 
            className="toss-leaderboard-button"
            onClick={handleOpenTossLeaderboard}
          >
            🏆 토스 게임 센터 리더보드 보기
          </button>

          {/* 기간 선택 */}
          <div className="period-selector">
            {(['today', 'week', 'month', 'all'] as RankingPeriod[]).map((p) => (
              <button
                key={p}
                className={`period-button ${period === p ? 'active' : ''}`}
                onClick={() => setPeriod(p)}
              >
                {periodLabels[p]}
              </button>
            ))}
          </div>

          {/* 내 랭킹 카드 */}
          {myRank && (
            <div className="my-ranking-card">
              <div className="my-ranking-header">
                <span className="my-ranking-label">나의 순위</span>
                <button className="share-button" onClick={() => handleShareScore({ rank: myRank, nickname: profile?.nickname || '', score: 8500, isMe: true })}>
                  공유하기
                </button>
              </div>
              <div className="my-ranking-info">
                <span className="my-ranking-rank">{myRank.toLocaleString()}위</span>
                <span className="my-ranking-score">8,500점</span>
              </div>
            </div>
          )}

          {/* 랭킹 리스트 */}
          {loading ? (
            <div className="ranking-loading">
              <p>랭킹을 불러오는 중...</p>
            </div>
          ) : (
            <div className="ranking-list">
              {rankings.map((user, index) => (
                <div
                  key={index}
                  className={`ranking-item ${user.isMe ? 'my-ranking' : ''} ${user.isFriend ? 'friend' : ''}`}
                >
                  <div className="ranking-item-left">
                    <span className="ranking-number">{user.rank}</span>
                    <div className="ranking-user-info">
                      <div className="ranking-avatar">
                        {user.avatar ? (
                          <img src={user.avatar} alt={user.nickname} />
                        ) : (
                          <span className="avatar-placeholder">
                            {user.nickname.charAt(0)}
                          </span>
                        )}
                      </div>
                      <div className="ranking-user-details">
                        <span className="ranking-nickname">
                          {user.nickname}
                          {user.isMe && <span className="me-badge">나</span>}
                          {user.isFriend && <span className="friend-badge">친구</span>}
                        </span>
                        <span className="ranking-score">{user.score.toLocaleString()}점</span>
                      </div>
                    </div>
                  </div>
                  <div className="ranking-item-right">
                    {!user.isMe && (
                      <>
                        <button
                          className="ranking-action-button"
                          onClick={() => handleShareScore(user)}
                          aria-label="점수 공유"
                        >
                          📤
                        </button>
                        {!user.isFriend && (
                          <button
                            className="ranking-action-button"
                            onClick={() => handleAddFriend(user)}
                            aria-label="친구 추가"
                          >
                            ➕
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <FooterNav />
      <AlertModal
        isOpen={showAlert}
        title="알림"
        message="리더보드를 열 수 없습니다. 토스앱에서 실행 중인지 확인해주세요."
        onClose={() => setShowAlert(false)}
      />
    </div>
  );
}

