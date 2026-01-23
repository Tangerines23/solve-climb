# 광고 구현 가이드 (Ad Implementation Guide)

이 문서는 `solve-climb` 프로젝트의 광고 수익화 전략과 구현 방식을 정리한 최종 가이드입니다. 토스(Toss) 앱 환경과 일반 웹(Vercel 등) 환경을 모두 지원하기 위한 설계 지침을 포함합니다.

---

## 1. 플랫폼별 광고 유형 비교

| 구분 | 토스 (Toss In-App Ads) | 구글 웹 (Google H5 Games) |
| :--- | :--- | :--- |
| **주요 광고 형태** | 리워드형, 전면형 | 리워드형, 전면형 |
| **연동 방식** | 전용 SDK (`@apps-in-toss/web-framework`) | Ad Placement API (`adsbygoogle.js`) |
| **호출 스타일** | Async/Await 기반 API 호출 | 전역 객체(`adBreak`) 호출 및 콜백 |
| **환경 제한** | 토스 앱 내 WebView에서만 작동 | 공개된 모든 웹 도메인 (승인 필요) |

---

## 2. 통합 아키텍처 (추상화 계층)

환경에 따라 적절한 광고 라이브러리를 호출할 수 있도록 추상화 계층을 사용합니다.

```typescript
// src/utils/adService.ts (구현 예시)
export const requestAd = async (type: 'rewarded' | 'interstitial') => {
  if (window.ReactNativeWebView) {
    // 1. 토스 환경
    return await handleTossAd(type);
  } else if (isGoogleAdApprovedDomain()) {
    // 2. 구글 웹 환경
    return await handleGoogleWebAd(type);
  } else {
    // 3. 테스트/개발 환경 (Simulation)
    console.log(`[AdSim] Showing ${type} ad simulation...`);
    return new Promise(resolve => setTimeout(() => resolve({ success: true }), 3000));
  }
};
```

---

## 3. 주요 고려 사항

### 3.1 햅틱 피드백 (Haptic Feedback)
토스 환경에서는 광고 시청 완료나 아이템 지급 시 햅틱 피드백을 주는 것이 프리미엄 경험을 제공합니다.
- SDK: `@apps-in-toss/web-framework`의 `generateHapticFeedback` 사용.

### 3.2 구글 웹 광고 승인 절차 (Site Approval)
일반 웹(Vercel 등)에서 구글 광고를 띄우려면 다음이 필수입니다.
1.  **커스텀 도메인**: `.vercel.app`은 승인이 어렵습니다.
2.  **ads.txt**: 사이트 루트에 광고 매체 인증 파일을 배치해야 합니다.
3.  **H5 Games Ads 신청**: 애드샌스에서 별도의 게임용 광고 신청이 필요합니다.

---

## 4. 정책 및 준수 사항

- **테스트 ID 사용**: 개발 단계에서는 반드시 테스트용 광고 ID(`ait-ad-test-...`)를 사용하십시오.
- **보상 설계**: 광고 시청 완료 콜백 시에만 서버(Supabase) 데이터를 업데이트하도록 보안을 강화하십시오.
- **사용자 경험**: 가급적 사용자의 흐름을 끊지 않는 '보상형(Rewarded)' 광고를 권장합니다.

---

**업데이트 일자**: 2026-01-23
**작성자**: Antigravity AI Assistant
