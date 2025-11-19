프로젝트 '솔브 클라임' - 메인 화면(Home) 상세 개발 명세서 (v1.0)

1. 화면 개요 (Screen Overview)

화면 ID: Home (파일: index.html)

목적:

앱의 메인 랜딩 페이지.

사용자의 핵심 성과(랭킹)를 요약하여 동기를 부여한다.

'오늘의 챌린지'로 즉각적인 플레이를 유도한다.

모든 '카테고리(산)'로 진입하는 메인 내비게이션 역할을 수행한다.

UI/UX 컨셉: 토스(Toss) 앱 벤치마크. 다크 모드(Dark Mode)를 기본으로 하며, 명확한 '카드(Card)' 기반 레이아웃을 사용한다.

2. UI 컴포넌트 상세 명세 (Component Specification)

2.1. 상단 헤더 (Header)

UI 형태: 화면 상단에 고정된 바.

구성 요소:

로고/타이틀 (좌측): 텍스트 "Solve Climb".

아이콘 그룹 (우측): 알림(종) 아이콘, 설정(톱니바퀴) 아이콘.

작동(Logic):

알림 아이콘 클릭 시: Notification.html (알림 목록) 페이지로 이동.

설정 아이콘 클릭 시: Settings.html (설정) 페이지로 이동.

2.2. 나의 현황 카드 (My Status Card)

UI 형태: 토스뱅크 통장 카드 형태의 둥근(rounded-2xl) 카드. 첫 번째로 노출.

구성 요소:

소제목: "나의 랭킹" (회색, 작은 텍스트)

핵심 지표: "종합 1,234위" (크고 굵은 텍스트)

부가 정보: "상위 15% ? 어제보다 50계단 올랐어요!" (회색, 작은 텍스트)

링크: 자세히 > (우측 상단, 파란색 텍스트)

작동(Logic):

자세히 > 링크 클릭 시: MyPage.html (마이페이지) 또는 RankingDetail.html (랭킹 상세)로 이동.

데이터: 이 카드는 fetchUserData()를 통해 사용자의 totalRank, rankPercent, rankChange 데이터를 비동기적으로 로드하여 렌더링해야 함.

2.3. 오늘의 챌린지 카드 (Today's Challenge Card)

UI 형태: 두 번째 둥근 카드. 사용자의 즉각적인 행동(Play)을 유도.

구성 요소:

아이콘 및 제목: ?? 오늘의 챌린지 (시각적 강조)

설명: "사칙연산 스피드런!" (오늘의 챌린지 내용)

소셜 프루프: "현재 946,822명 참여 중" (참여 유도)

버튼 (Button):

형태: [도전하기] (파란색 Primary 버튼, toss-button-primary 스타일, 카드 너비를 꽉 채움)

작동(Logic):

클릭 시, '오늘의 챌린지'로 지정된 특정 게임 모드(예: '수학-사칙연산-Level 5')로 즉시 이동해야 함.

window.location.href = "/game.html?challenge=today&mode=time_attack"와 같이 게임 화면(game.html)으로 직접 파라미터를 전달하여 실행.

2.4. 카테고리 선택 (Category List)

UI 형태: "등반할 산 선택하기"라는 작은 제목 아래에, 각 카테고리가 개별 카드로 나열됨 (수직 리스트).

구성 요소 (반복되는 카드):

아이콘 (좌측): 각 카테고리를 상징하는 아이콘 (예: 수학 ?, 언어 あ)

텍스트 (중앙): "수학의 산" (제목), "정복한 레벨: 12 / 20" (부제목)

버튼 (Button):

형태: [등반하기] (회색 Secondary 버튼, toss-button-secondary 스타일, 카드 우측에 배치)

작동(Logic):

핵심 내비게이션 기능.

'수학의 산'의 [등반하기] 클릭 시: 하위 카테고리 선택 화면(subcategory.html)으로 이동.

반드시 파라미터를 전달해야 함. (예: window.location.href = "/subcategory.html?category=math")

'언어의 산'의 [등반하기] 클릭 시: window.location.href = "/subcategory.html?category=language"

2.5. 하단 고정 내비게이션 바 (Footer Nav Bar)

UI 형태: 화면 하단에 고정(fixed)되어 항상 노출되는 탭 바.

구성 요소: 4개의 아이콘 + 텍스트 탭

[홈] (활성화 상태)

[랭킹]

[챌린지]

[마이]

작동(Logic):

[홈] 클릭: (현재 페이지) index.html로 새로고침 또는 최상단으로 스크롤.

[랭킹] 클릭: Ranking.html (전체 랭킹) 페이지로 이동.

[챌린지] 클릭: index.html의 '오늘의 챌린지 카드'(#2.3) 위치로 스크롤(Anchor)하거나, 별도의 ChallengeList.html로 이동.

[마이] 클릭: MyPage.html (마이페이지)로 이동.

3. 유지보수 원칙 (Maintenance Principles)

index.html과 main.js 개발 시 다음 원칙을 반드시 준수하여 유지보수성을 극대화한다.

1. 데이터와 뷰의 분리 (하드코딩 금지)

대상: 카테고리 리스트 (2.4), 오늘의 챌린지 정보 (2.3), 나의 현황 (2.2)

원칙: index.html이나 main.js에 "수학의 산", "1,234위" 같은 텍스트나 데이터를 절대 하드코딩하지 않는다.

구현:

index.html에는 데이터를 표시할 빈 껍데기(Container)만 둔다.

(예: <div id="category-list-container"></div>)

모든 데이터(카테고리 목록, 아이콘 경로, 챌린지 내용)는 config.js 또는 API 응답(common.js에서 호출)에서 가져온다.

main.js는 이 데이터를 받아 HTML을 동적으로 생성(Render)하는 역할만 수행한다.

유지보수 이점: "논리의 산"을 "추리의 산"으로 이름을 변경하거나 "상식의 산" 카테고리를 새로 추가할 때, config.js 파일 하나만 수정하면 되며 index.html이나 main.js 코드는 변경할 필요가 없다.

2. 동적 렌더링 및 이벤트 위임 (Event Delegation)

대상: 카테고리 리스트 (2.4)의 [등반하기] 버튼.

원칙: 동적으로 생성된 여러 개의 버튼에 개별적으로 addEventListener를 할당하지 않는다.

구현:

데이터를 기반으로 각 카테고리 카드를 렌더링할 때, [등반하기] 버튼에 data-* 속성을 사용해 고유 ID를 부여한다.

(예: <button ... data-category-id="math">등반하기</button>)

부모 컨테이너인 <div id="category-list-container">에 단 하나의 클릭 이벤트 리스너를 등록한다.

이벤트 핸들러 내에서 event.target.closest('button')을 확인하고, button.dataset.categoryId 값을 읽어와 subcategory.html?category=math처럼 페이지를 이동시킨다.

유지보수 이점: 카테고리가 3개에서 10개로 늘어나도 main.js의 이벤트 리스너 코드는 단 한 줄도 변경되지 않는다.

3. 상태(State) 기반 UI 관리

대상: '나의 현황 카드' (2.2) 또는 비동기 데이터를 로드하는 모든 컴포넌트.

원칙: 데이터 로딩 중(Loading), 성공(Success), 실패(Error) 3가지 상태를 명확히 정의하고, CSS 클래스로 UI를 제어한다.

구현:

fetchUserData() 호출 시작 시: <div id="status-card">에 .is-loading 클래스 추가 (내부에 스켈레톤 UI나 스피너 노출).

데이터 성공 시: .is-loading 클래스 제거, 데이터를 렌더링.

데이터 실패 시: .is-loading 클래스 제거, .has-error 클래스 추가 (내부에 "정보를 불러올 수 없습니다" 메시지 노출).

유지보수 이점: 로직과 뷰가 분리되어, 로딩/에러 시의 디자인을 CSS 수정만으로 쉽게 변경할 수 있다.

4. 설정(Config)의 중앙 관리

대상: API 엔드포인트 URL, '오늘의 챌린지' ID, 앱 버전 등.

원칙: 여러 JS 파일에서 사용될 수 있는 상수(Constants)는 한곳에서 관리한다.

구현: config.js 파일에 상수로 정의하고, 필요한 파일에서 import하여 사용한다.

(예: export const API_BASE_URL = "https://api.solveclimb.com"; / import { API_BASE_URL } from './config.js';)

유지보수 이점: 개발 서버에서 실제 운영 서버로 API 주소를 변경할 때, config.js 파일의 API_BASE_URL 변수 하나만 수정하면 앱 전체에 반영된다.