import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { FooterNav } from '@/components/FooterNav';
import './PrivacyPolicyPage.css';

export function PrivacyPolicyPage() {
  const navigate = useNavigate();

  return (
    <div className="privacy-policy-page">
      <Header />
      <main className="privacy-policy-main">
        <div className="privacy-policy-container">
          <div className="privacy-policy-header">
            <button className="back-button" onClick={() => navigate(-1)} aria-label="뒤로 가기">
              <span className="back-icon">←</span>
            </button>
            <h1>개인정보처리방침</h1>
          </div>

          <div className="privacy-policy-content">
            <p className="last-updated">최종 수정일: 2026.01.23</p>

            <p>
              "Solve Climb" (이하 "서비스")는 사용자의 개인정보를 소중하게 생각하며, 대한민국의
              개인정보보호법 및 관련 법령과 스토어(Google Play, App Store) 가이드를 준수합니다.
            </p>

            <section>
              <h2>1. 수집하는 개인정보 항목 및 수집 방법</h2>
              <p>서비스는 원활한 서비스 제공을 위해 최소한의 개인정보를 수집합니다.</p>
              <ul>
                <li>
                  <strong>수집 항목:</strong>
                  <ul>
                    <li>인증 정보: 토스(Toss) 계정 식별자 (로그인 시 사용)</li>
                    <li>게임 데이터: 닉네임, 미네랄, 스태미나, 아이템 보유 현황, 게임 진행 단계</li>
                    <li>
                      기기 정보: 기기 모델명, OS 버전, 광고 식별자 (AdID/IDFA - 광고 제공 시 사용)
                    </li>
                  </ul>
                </li>
                <li>
                  <strong>수집 방법:</strong>
                  <ul>
                    <li>앱 내 서비스 이용 과정에서 자동으로 생성 및 수집</li>
                    <li>토스(Toss) 등 외부 플랫폼과의 연동을 통한 수집</li>
                  </ul>
                </li>
              </ul>
            </section>

            <section>
              <h2>2. 개인정보의 이용 목적</h2>
              <p>수집한 개인정보를 다음의 목적으로 활용합니다.</p>
              <ul>
                <li>사용자 식별 및 서비스 이용 권한 확인</li>
                <li>게임 데이터 저장 및 동기화 (기기 변경 시 복구 등)</li>
                <li>광고 서비스 제공 (보상형 광고 제공 및 성과 측정)</li>
                <li>부정 이용 방지 및 서비스 개선</li>
              </ul>
            </section>

            <section>
              <h2>3. 개인정보의 보유 및 이용 기간</h2>
              <p>
                사용자의 개인정보는 <strong>회원 탈퇴(계정 삭제) 시까지</strong> 보유하며, 탈퇴 즉시
                파기됩니다.
              </p>
              <ul>
                <li>
                  단, 관계 법령의 규정에 의하여 보존할 필요가 있는 경우 해당 법령에서 정한 기간 동안
                  보관합니다.
                </li>
              </ul>
            </section>

            <section>
              <h2>4. 개인정보의 파기 절차 및 방법</h2>
              <ul>
                <li>
                  <strong>파기 절차:</strong> 사용자가 앱 내 '계정 탈퇴' 기능을 사용하면,
                  서버(Supabase)에 저장된 사용자 프로필 및 모든 관련 데이터가 즉시 삭제됩니다.
                </li>
                <li>
                  <strong>파기 방법:</strong> 전자적 파일 형태의 정보는 기록을 재생할 수 없는 기술적
                  방법을 사용하여 삭제합니다.
                </li>
              </ul>
            </section>

            <section>
              <h2>5. 제3자 제공 및 위탁</h2>
              <p>
                서비스는 사용자의 동의 없이 개인정보를 외부에 제공하지 않습니다. 단, 광고 제공 및
                분석을 위해 다음의 외부 SDK를 활용할 수 있습니다.
              </p>
              <ul>
                <li>
                  <strong>Google AdMob (Google LLC):</strong> 광고 제공 및 성과 측정
                </li>
                <li>
                  <strong>Toss Ads (Viva Republica):</strong> 토스 인앱 광고 제공
                </li>
              </ul>
            </section>

            <section>
              <h2>6. 사용자의 권리</h2>
              <p>
                사용자는 언제든지 자신의 개인정보를 열람, 수정할 수 있으며, 앱 내 설정을 통해 즉시
                계정 탈퇴 및 개인정보 삭제를 요청할 수 있습니다.
              </p>
            </section>

            <section>
              <h2>7. 고객 서비스 및 문의</h2>
              <p>본 방침에 대한 문의사항은 개발자에게 연락해 주시기 바랍니다.</p>
              <ul>
                <li>
                  <strong>개발자 연락처:</strong>{' '}
                  <a href="mailto:support@solveclimb.com">support@solveclimb.com</a>
                </li>
              </ul>
            </section>
          </div>
        </div>
      </main>
      <FooterNav />
    </div>
  );
}
