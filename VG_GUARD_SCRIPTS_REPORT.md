# VG(Visual Guardian) 가드 통과를 위한 스크립트 정리 보고서

## 1. VG(Visual Guardian)란?

- **역할**: UI 레이아웃 깨짐(오버플로우)을 실시간으로 감지·시각화하는 개발용 컴포넌트
- **위치**: `src/components/dev/VisualGuardian.tsx`
- **감지 내용**:
  - 텍스트가 박스를 뚫고 나가는 경우 (`scrollHeight > clientHeight`)
  - 가로 스크롤이 의도치 않게 생기는 경우 (`scrollWidth > clientWidth`)
- **표시**: 감지된 요소에 빨간 점선 테두리 + `data-vg-overflow="true"` 속성
- **제외**: `data-vg-ignore="true"` 또는 `.debug-panel-overlay` 등은 검사 제외

---

## 2. VG 가드 통과용 스크립트 요약

| 스크립트 | 용도 | npm 스크립트 |
|----------|------|----------------|
| **check-layout-standalone.js** | VG 강제 활성화 후 여러 페이지/뷰포트에서 오버플로우 검사 (가드 통과 여부 판정) | `check:layout`, `check:layout:deep` |
| **run-layout-check-with-server.js** | 개발 서버가 없으면 기동한 뒤 위 레이아웃 검사 실행 (CI용) | `check:layout:with-server`, `check:layout:deep:with-server` |
| **analyze-layout-overflow.js** | VG 오버플로우 전수 수집 → 페이지별·path별 집계, `reports/layout-overflow-report.json` 생성 (원인 분석용) | `check:layout:analyze` |

---

## 3. 스크립트 상세

### 3.1 `scripts/check-layout-standalone.js` (핵심 가드 통과 스크립트)

- **목적**: VG 가드 **통과 여부** 판정. 실패 시 `process.exit(1)`.
- **동작**:
  - `window.__ENABLE_VISUAL_GUARDIAN__ = true`, `__VG_INTENSIVE_MODE__ = true` 로 VG 강제 활성화
  - 뷰포트: 기본 3종(Pixel 5, iPhone SE, Desktop 1280) / **`--all-viewports`** 시 8종(소형~데스크톱), **4개씩 병렬** 실행으로 시간 단축
  - 페이지: 홈, 키보드 포커스, 디버그 패널, 토스트, My Page, Roadmap, Ranking, Level Select, Notifications, Shop(내 배낭 탭) 등
  - 각 페이지에서:
    1. 초기 렌더링 후 오버플로우 검사
    2. 정의된 액션(클릭/탭 등) 실행 후 다시 검사
    3. `--deep` 옵션 시: Deep Scan(버튼/클릭 가능 요소 클릭 후 검사), 뷰포트 -1px 스트레스 테스트
  - 오버플로우 판정: `document.body.dataset.layoutError === 'true'` 또는 `window.__LAYOUT_ERRORS__`
- **사전 조건**: 개발 서버가 `VITE_URL` 또는 `localhost:5173/5174/3000` 에서 떠 있어야 함

**실행 예시**

```bash
# 기본 (서버는 미리 실행)
npm run check:layout

# Deep Scan + 스트레스 테스트 포함
npm run check:layout:deep

# 다양한 기기 뷰포트에서 검사 (테스트 다양성)
npm run check:layout:all-viewports

# 마이페이지만, 20종 뷰포트에서 검사
npm run check:layout:my-page:all-viewports
```

**뷰포트 종류 (`--all-viewports`, 8종·4개 병렬)**

| 구간 | 뷰포트 |
|------|--------|
| 소형 폰 | Small 320×568, iPhone SE 375×667 |
| 중형 폰 | Pixel 5 393×851, Landscape 844×390 |
| 태블릿 | iPad 768×1024 |
| 데스크톱 | 1280×800, 1440×900, 1920×1080 |

---

### 3.2 `scripts/run-layout-check-with-server.js` (CI용 래퍼)

- **목적**: 서버가 없을 때 자동으로 `npm run dev` 로 서버 기동 후 레이아웃 검사 실행. **CI(e2e-visual-layout)에서 사용**.
- **동작**:
  - `http://localhost:5173` 에 서버 있는지 확인
  - 없으면 `npm run dev` 로 기동, 최대 2분 대기 후 `check-layout-standalone.js` 실행
  - 인자 `--deep` 전달 가능

**실행 예시**

```bash
npm run check:layout:with-server
npm run check:layout:deep:with-server   # CI의 "Layout Precision Audit" 단계와 동일
```

---

### 3.3 `scripts/analyze-layout-overflow.js` (분석용)

- **목적**: VG 가드 **실패 원인 분석**. 통과/실패 판정이 아니라 **어디서 몇 건** 오버플로우가 나는지 수집·집계.
- **결과**:
  - 콘솔: 페이지별 건수, path별 감지 횟수(상위 40개)
  - 파일: `reports/layout-overflow-report.json` (전체 엔트리, byPage, pathCount 등)

**실행 예시**

```bash
# 개발 서버 선행 실행 필요
npm run check:layout:analyze
```

---

## 4. E2E 테스트에서의 VG 검증

- **유틸**: `tests/e2e/utils/overflow.ts` → `expectNoOverflow(page)`
  - `[data-vg-overflow="true"]` 요소가 있으면 에러 throw (가드 실패)
- **사용처**:
  - `tests/e2e/smoke.spec.ts`: 홈, 기타 스모크 시나리오 후 `expectNoOverflow` 호출
  - `tests/e2e/monkey-test.spec.ts`: 카오스 루프 종료 후 Visual Guardian 오버플로우 검사

E2E에서 VG를 쓰려면 해당 페이지 로드 전/후에 `__ENABLE_VISUAL_GUARDIAN__ = true` 가 설정되어 있어야 하며, monkey-test에서는 이미 `addInitScript`로 설정함.

### 4.1 몽키 테스트와 같이 돌아가는 스크립트

**`scripts/ci-local-all.sh`** 가 CI와 동일한 순서로 로컬 검증을 돌리는 스크립트이며, **몽키(카오스) 테스트**와 **레이아웃 검사**가 둘 다 포함되어 있습니다.

| 단계 | 내용 |
|------|------|
| **6. e2e-stability** | `npm run test:chaos` (몽키 테스트), `npm run test:stress:deep` |
| **7b. e2e-visual-layout** | `npm run test:e2e:visual`, `npm run test:a11y`, **`npm run check:layout:deep:with-server`** |

**실행**

```bash
bash scripts/ci-local-all.sh
```

**일부만 돌리기**

- 몽키만: `npm run test:chaos` (서버는 `run-playwright-with-port.js`가 처리)
- **몽키 + 레이아웃만**: `npm run test:chaos:and:layout` (카오스 테스트 통과 후 레이아웃 딥 검사)
- 스킵 옵션: `CI_SKIP_E2E_STABILITY=1` (6단계 생략), `CI_SKIP_E2E_VISUAL=1` (7b 생략)

---

## 5. CI에서의 VG 가드

- **워크플로**: `.github/workflows/ci.yml` → Job `e2e-visual-layout`
- **순서**:
  1. E2E Visual & A11y: `npm run test:e2e:visual`, `npm run test:a11y`
  2. **Layout Precision Audit**: `npm run check:layout:deep:with-server`
- **의미**: VG 가드 통과는 **Layout Precision Audit** 단계에서 `check-layout-standalone.js --deep` 가 성공하는 것으로 확인됨.

---

## 6. VG 가드 통과를 위한 실행 체크리스트

1. **로컬에서 가드 통과 확인**
   - 터미널 1: `npm run dev`
   - 터미널 2: `npm run check:layout` 또는 `npm run check:layout:deep`
   - 종료 코드 0 이면 통과

2. **CI와 동일한 조건으로 확인**
   - `npm run check:layout:deep:with-server` (서버 없어도 이 명령 하나로 검사 가능)

3. **실패 시 원인 분석**
   - `npm run check:layout:analyze` → `reports/layout-overflow-report.json` 및 콘솔 요약 확인
   - 해당 셀렉터/페이지에서 CSS 수정 또는 (의도적 허용 시) `data-vg-ignore="true"` 적용

4. **의도적 오버플로우**
   - 수정하지 않고 VG 알림만 끄려면 해당 요소(또는 조상)에 `data-vg-ignore="true"` 추가

5. **다양한 기기에서 검사 (시간 단축)**
   - `npm run check:layout:all-viewports` → 8종 뷰포트, **4개씩 병렬** 실행
   - 특정 페이지만: `npm run check:layout:my-page:all-viewports`

---

## 7. 테스트 다양성 & 플렉시블 UI

### 7.1 테스트 다양성

- **기본**: 3개 뷰포트만 사용 → CI/일상용으로 빠르게 돌리기 좋음.
- **`--all-viewports`**: 8종 뷰포트에서 동일 시나리오 실행(4개씩 병렬) → **다양한 기기** 커버하면서 **실행 시간** 부담을 줄임.
- **권장**: PR 전에 `check:layout:all-viewports` 또는 `check:layout:my-page:all-viewports`로 한 번 돌리면, 특정 해상도에서만 나오는 오버플로우를 미리 잡기 쉽다.

### 7.2 버튼 상호작용 검사 (클릭 후 VG 잡기)

**지금 검사되는 것**

1. **페이지별 `actions`**  
   각 페이지마다 정의된 동작(버튼 클릭, 탭 전환 등)을 한 뒤 **한 번** VG 검사합니다.  
   예: 마이페이지 익명 로그인, Shop "내 배낭" 탭, 홈에서 ESC·Tab, 디버그 패널 열기 등.

2. **Deep Scan (`--deep` 있을 때만)**  
   페이지에서 **버튼·`[role="button"]`·탭·cursor:pointer** 등을 찾아서 **여러 개 클릭**하고, **클릭할 때마다** 800ms 대기 후 VG 검사합니다.  
   → “버튼 누르니까 VG 뜨는” 경우는 **`npm run check:layout:deep`** 또는 **`check:layout:deep:with-server`** 를 돌려야 스크립트가 잡을 수 있습니다.

**정리**

- `check:layout` / `check:layout:all-viewports` 만 쓰면 → **페이지별 actions 1번 + 초기 화면**만 검사.  
- **버튼 클릭 후에만 나오는 VG**를 스크립트로 잡으려면 → **`check:layout:deep`** 또는 **`check:layout:deep:with-server`** 를 실행해야 합니다.

**직접 버튼 눌렀을 때 VG가 뜨는 경우**

1. 개발자 도구 콘솔에서 `[Visual Guardian]` 로그와 **빨간 점선**으로 둘러싸인 요소(태그·class)를 확인합니다.  
2. 그 **요소 경로(또는 class 이름)**를 알려주시면, 해당 컴포넌트 CSS 수정 또는 `data-vg-ignore` 적용 방법을 제안할 수 있습니다.

---

### 7.3 UI를 플렉시블하게 만들 때 (VG와 맞추기)

- **폭 제한**: `max-width: 100%`, `min-width: 0`(flex 자식에서 넘침 방지), `box-sizing: border-box`로 패딩이 밖으로 나가지 않게.
- **텍스트**: 긴 문장은 `overflow: hidden`, `text-overflow: ellipsis`, `white-space: nowrap` 또는 `overflow-wrap: break-word`로 한 줄/줄바꿈 제어.
- **숫자/큰 폰트**: `min-height`로 영역을 넉넉히 두거나, `line-height`를 1.1~1.3 정도로 고정해 서브픽셀 넘침을 줄인다.
- **레이아웃**: flex/grid 사용 시 자식에 `min-width: 0` / `min-height: 0`을 주어 내용이 컨테이너를 밀어내지 않게 한다.
- **의도한 스크롤**: `overflow: auto` / `overflow: scroll` 영역은 VG가 자동 제외하므로, 스크롤 가능한 영역은 그대로 두면 된다.

---

## 8. "마이페이지 들어가자마자 VG 경고"가 스크립트에서 안 잡히는 이유

- **스크립트가 보는 상태**: 레이아웃 검사는 **비로그인(또는 익명)** 상태로 마이페이지를 연다. 게스트 → 익명 프로필 클릭 후 프로필 섹션만 기다린다. **실제 로그인 세션·DB 통계는 사용하지 않는다.**
- **본인이 보는 상태**: 이미 **로그인된** 상태로 마이페이지에 들어가면, 닉네임·통계·티어·오늘의 챌린지 등이 비동기로 로드된 뒤 그려진다. 이때 생기는 오버플로우는 “로그인 + 데이터 로드 후” DOM에서만 발생할 수 있다.
- **타이밍**: 스크립트는 로드 직후·액션 후 2초만 기다렸기 때문에, 통계/티어가 늦게 그려지는 경우 검사 시점에는 아직 해당 영역이 없거나 비어 있어서 VG가 감지하지 못할 수 있다.

**적용한 개선**

- 마이페이지 전용으로 **로드 후 5초**(`waitAfterLoad`), **액션 후 5초**(`waitAfterActions`) 대기를 넣었다. 익명 프로필이라도 비동기 렌더가 끝난 뒤에 가깝게 검사해서, 스크립트 환경에서 나오는 오버플로우는 더 잘 잡히도록 했다.

**그래도 로그인 상태에서만 보이는 VG 경고를 고치려면**

1. **어디서 나는지 확인**: 브라우저에서 마이페이지 접속 후 VG 경고가 뜨면, 빨간 점선으로 표시된 요소와 콘솔의 `[Visual Guardian]` 로그를 본다. 해당 요소의 클래스/태그를 확인한다.
2. **CSS 수정**: 해당 영역에 `overflow: hidden` + `text-overflow: ellipsis`, 또는 적절한 `min-width`/`max-width`로 넘침을 막는다. (이미 `MyPage.css`에 overflow 관련 수정이 여러 개 있음.)
3. **의도된 스크롤/레이아웃이면**: 그 영역만 VG에서 제외하려면 해당 요소(또는 조상)에 `data-vg-ignore="true"`를 준다.
4. **원인 집계**: `npm run check:layout:analyze`를 **개발 서버 띄운 뒤**, 브라우저에서 직접 로그인한 상태로 마이페이지를 여러 번 열어 둔 다음(또는 가능하면 그 탭을 그대로 두고) analyze를 돌리면, 같은 환경에서 수집된 오버플로우가 `reports/layout-overflow-report.json`에 실릴 수 있다. (analyze 스크립트는 별도 브라우저 컨텍스트로 열어서 로그인 상태를 공유하지는 않지만, 마이페이지 대기 시간을 늘려 두면 익명 프로필 기준으로는 더 많은 오버플로우를 수집할 수 있다.)

---

## 9. 관련 파일 빠른 참조

| 구분 | 경로 |
|------|------|
| VG 컴포넌트 | `src/components/dev/VisualGuardian.tsx` |
| 가드 통과 스크립트 | `scripts/check-layout-standalone.js` |
| 서버 래퍼 (CI용) | `scripts/run-layout-check-with-server.js` |
| 오버플로우 분석 | `scripts/analyze-layout-overflow.js` |
| E2E 오버플로우 검사 | `tests/e2e/utils/overflow.ts` |
| CI 레이아웃 단계 | `.github/workflows/ci.yml` (e2e-visual-layout → Layout Precision Audit) |
| 마이페이지 레이아웃 | `src/pages/MyPage.tsx`, `src/pages/MyPage.css` |
