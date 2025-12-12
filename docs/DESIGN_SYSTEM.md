# 디자인 시스템 가이드

이 문서는 Solve Climb 프로젝트의 CSS 변수 시스템 사용 가이드입니다.

## 목차

1. [개요](#개요)
2. [변수 카테고리](#변수-카테고리)
3. [사용 가이드](#사용-가이드)
4. [컴포넌트 템플릿](#컴포넌트-템플릿)
5. [코드 리뷰 체크리스트](#코드-리뷰-체크리스트)
6. [하드코딩 검사](#하드코딩-검사)
7. [FAQ](#faq)

---

## 개요

### CSS 변수 시스템이란?

모든 디자인 토큰(색상, 간격, border-radius 등)을 `src/index.css`에 중앙 집중식으로 정의하고, 컴포넌트에서는 변수를 참조하여 사용하는 시스템입니다.

### 왜 사용하나요?

1. **중앙 관리**: 한 곳에서 수정하면 전체에 반영
2. **일관성**: 실수로 다른 값 사용 방지
3. **유지보수성**: 변경 시 영향 범위 파악 쉬움
4. **확장성**: 테마 전환 등 고급 기능 구현 가능

### 기본 원칙

- ✅ **항상 변수 사용**: 색상, 간격, border-radius는 변수 사용 필수
- ❌ **하드코딩 금지**: `#ffffff`, `20px`, `12px` 같은 직접 값 사용 금지
- ⚠️ **예외 허용**: 그래픽 요소, 브랜드 색상만 하드코딩 허용

---

## 변수 카테고리

### 1. 색상 변수

#### 배경 색상

```css
--color-bg-primary: #1e1e1e;    /* 주요 배경 (카드, 모달) */
--color-bg-secondary: #2c2c2c;  /* 보조 배경 (입력 필드) */
--color-bg-tertiary: #3c3c3c;    /* 3차 배경 (호버, 경계선) */
```

**사용 예시:**
```css
.card {
  background-color: var(--color-bg-primary);
}

.input-field {
  background-color: var(--color-bg-secondary);
}

.button:hover {
  background-color: var(--color-bg-tertiary);
}
```

#### 텍스트 색상

```css
--color-text-primary: #ffffff;   /* 주요 텍스트 */
--color-text-secondary: #aaa;    /* 보조 텍스트 */
```

**사용 예시:**
```css
.title {
  color: var(--color-text-primary);
}

.description {
  color: var(--color-text-secondary);
}
```

#### Primary 색상 (버튼, 링크)

```css
--color-blue-400: #00BFA5;  /* 기본 상태 */
--color-blue-500: #00a693;  /* hover 상태 */
--color-blue-700: #00897a;  /* active 상태 */
```

**사용 예시:**
```css
.button {
  background-color: var(--color-blue-400);
}

.button:hover {
  background-color: var(--color-blue-500);
}

.button:active {
  background-color: var(--color-blue-700);
}
```

#### 에러/경고 색상

```css
--color-toss-red: #f04452;      /* 토스 빨간색 */
--color-red-500: #ef4444;       /* 일반 빨간색 */
--color-red-600: #dc2626;       /* 위험 버튼 hover */
--color-error: #D91A2A;         /* 에러 메시지 */
```

**사용 예시:**
```css
.error-message {
  color: var(--color-toss-red);
}

.danger-button:hover {
  background-color: var(--color-red-600);
}
```

#### Gray 색상 팔레트

```css
--color-gray-100: #ffffff;
--color-gray-200: #fafafc;
--color-gray-300: #e2e2e2;
--color-gray-350: #d1d6db;  /* 아이콘 색상 */
--color-gray-400: #bebec0;
--color-gray-450: #4c4c4c;  /* active 상태 배경 */
--color-gray-500: #9b9b9b;
--color-gray-550: #8e94a0;  /* hover 아이콘 */
--color-gray-600: #3c3c3c;
--color-gray-650: #636870;  /* 링크 hover */
--color-gray-700: #303030;
--color-gray-750: #4a4e57;  /* 링크 active */
--color-gray-800: #181818;
--color-gray-900: #121212;
```

#### 특수 색상

```css
--color-gray-toggle-bg: #e5e8eb;  /* 토글 스위치 배경 */
--color-logout-hover: #3c2c2c;     /* 로그아웃 버튼 hover */
--color-logout-active: #4c2c2c;   /* 로그아웃 버튼 active */
--color-overlay: rgba(0, 0, 0, 0.7);  /* 모달 배경 오버레이 */
```

---

### 2. 간격 변수 (Spacing)

#### 기본 간격

```css
--spacing-xs: 4px;
--spacing-sm: 8px;
--spacing-md: 12px;
--spacing-lg: 16px;
--spacing-xl: 20px;
--spacing-2xl: 24px;
--spacing-3xl: 32px;
--spacing-4xl: 40px;
```

#### 특수 간격

```css
--spacing-tiny: 6px;           /* 작은 간격 */
--spacing-small-alt: 10px;    /* 중간-작은 간격 */
--spacing-medium-alt: 14px;   /* 중간 간격 */
```

**사용 예시:**
```css
.card {
  padding: var(--spacing-xl);        /* 20px */
  margin-bottom: var(--spacing-lg);  /* 16px */
  gap: var(--spacing-md);            /* 12px */
}

.modal {
  padding: var(--spacing-4xl);       /* 40px */
}
```

---

### 3. Border Radius 변수

#### 기본 Border Radius

```css
--rounded-xs: 6px;
--rounded-sm: 12px;
--rounded-md: 20px;
--rounded-lg: 32px;
```

#### 특수 Border Radius

```css
--rounded-card: 16px;          /* 카드용 */
--rounded-button: 12px;        /* 버튼용 */
--rounded-toggle: 28px;        /* 토글 스위치 */
--rounded-large-card: 24px;    /* 큰 카드 */
--rounded-tiny: 2px;           /* 매우 작은 요소 */
--rounded-micro: 3px;         /* 미세한 요소 */
--rounded-small-alt: 6px;     /* 작은 요소 대체 */
```

**사용 예시:**
```css
.modal {
  border-radius: var(--rounded-md);  /* 20px */
}

.card {
  border-radius: var(--rounded-card);  /* 16px */
}

.button {
  border-radius: var(--rounded-button);  /* 12px */
}

.toggle-switch {
  border-radius: var(--rounded-toggle);  /* 28px */
}
```

---

### 4. Shadow 변수

```css
--shadow-modal: 0 8px 32px rgba(0, 0, 0, 0.5);
--shadow-card: 0 4px 12px rgba(0, 0, 0, 0.3);
```

**사용 예시:**
```css
.modal {
  box-shadow: var(--shadow-modal);
}

.card {
  box-shadow: var(--shadow-card);
}
```

---

### 5. 반응형 레이아웃 변수

#### Header/Footer 높이

```css
--header-height-portrait: 56px;
--header-height-landscape: 48px;
--footer-height-portrait: 64px;
--footer-height-landscape: 56px;
```

**사용 예시:**
```css
.page-container {
  padding-top: var(--header-height-portrait);
  padding-bottom: var(--footer-height-portrait);
}

@media (orientation: landscape) {
  .page-container {
    padding-top: var(--header-height-landscape);
    padding-bottom: var(--footer-height-landscape);
  }
}
```

#### Modal 너비

```css
--modal-width-portrait: 400px;
--modal-width-landscape-small: 600px;
--modal-width-landscape-medium: 700px;
--modal-width-landscape-large: 900px;
```

**사용 예시:**
```css
.modal {
  max-width: var(--modal-width-portrait);
}

@media (orientation: landscape) {
  .modal {
    max-width: var(--modal-width-landscape-small);
  }
}
```

---

## 사용 가이드

### 올바른 사용법

```css
/* ✅ 올바른 예시 */
.my-component {
  /* 배경 */
  background-color: var(--color-bg-primary);
  
  /* 간격 */
  padding: var(--spacing-xl);
  margin-bottom: var(--spacing-lg);
  gap: var(--spacing-md);
  
  /* Border Radius */
  border-radius: var(--rounded-card);
  
  /* Shadow */
  box-shadow: var(--shadow-card);
  
  /* 텍스트 */
  color: var(--color-text-primary);
}

.my-component-button {
  background-color: var(--color-blue-400);
  padding: var(--spacing-md) var(--spacing-lg);
  border-radius: var(--rounded-button);
}

.my-component-button:hover {
  background-color: var(--color-blue-500);
}

.my-component-button:active {
  background-color: var(--color-blue-700);
}
```

### 잘못된 사용법

```css
/* ❌ 잘못된 예시 */
.my-component {
  background-color: #1e1e1e;  /* 하드코딩 금지 */
  padding: 20px;              /* 하드코딩 금지 */
  margin-bottom: 16px;        /* 하드코딩 금지 */
  border-radius: 16px;        /* 하드코딩 금지 */
  color: #ffffff;            /* 하드코딩 금지 */
}
```

### 예외 사항

다음 경우는 하드코딩이 허용됩니다:

1. **그래픽/아트워크 요소**
```css
/* ✅ 허용됨 */
.graphic-gradient {
  background: linear-gradient(180deg, #00BFA5 0%, #5BA3FF 100%);
}
```

2. **브랜드 색상**
```css
/* ✅ 허용됨 */
.google-button {
  background-color: #4285F4;  /* Google 브랜드 색상 */
}
```

3. **변수 정의 자체**
```css
/* ✅ 허용됨 - index.css에서만 */
:root {
  --color-blue-400: #00BFA5;  /* 변수 정의는 하드코딩 필요 */
}
```

---

## 컴포넌트 템플릿

### 표준 컴포넌트 CSS 템플릿

```css
/* ComponentName.css */

.component-name {
  /* 배경 */
  background-color: var(--color-bg-primary);
  
  /* 간격 */
  padding: var(--spacing-xl);
  margin-bottom: var(--spacing-lg);
  gap: var(--spacing-md);
  
  /* Border Radius */
  border-radius: var(--rounded-card);
  
  /* Shadow */
  box-shadow: var(--shadow-card);
  
  /* 텍스트 */
  color: var(--color-text-primary);
}

.component-name-title {
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-md);
  font-size: 1.25rem;
  font-weight: 600;
}

.component-name-description {
  color: var(--color-text-secondary);
  margin-bottom: var(--spacing-lg);
  font-size: 0.875rem;
}

.component-name-button {
  background-color: var(--color-blue-400);
  color: var(--color-text-primary);
  padding: var(--spacing-md) var(--spacing-lg);
  border-radius: var(--rounded-button);
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.component-name-button:hover {
  background-color: var(--color-blue-500);
}

.component-name-button:active {
  background-color: var(--color-blue-700);
  transform: scale(0.98);
}
```

### 모달 컴포넌트 템플릿

```css
/* ModalName.css */

.modal-name-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--color-overlay);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: var(--spacing-xl);
}

.modal-name {
  background-color: var(--color-bg-primary);
  border-radius: var(--rounded-md);
  width: 100%;
  max-width: var(--modal-width-portrait);
  padding: var(--spacing-2xl);
  box-shadow: var(--shadow-modal);
}

@media (orientation: landscape) {
  .modal-name {
    max-width: var(--modal-width-landscape-small);
  }
}
```

---

## 코드 리뷰 체크리스트

### PR 리뷰 시 확인 사항

```markdown
## CSS 코드 리뷰 체크리스트

### 색상
- [ ] 하드코딩된 색상 (#ffffff, #1e1e1e 등) 없음
- [ ] 적절한 변수 사용 (--color-*)
- [ ] 예외 사항 (그래픽, 브랜드)만 하드코딩 허용

### 간격
- [ ] 하드코딩된 padding/margin (20px, 16px 등) 없음
- [ ] 적절한 spacing 변수 사용 (--spacing-*)

### Border Radius
- [ ] 하드코딩된 border-radius (12px, 20px 등) 없음
- [ ] 적절한 rounded 변수 사용 (--rounded-*)

### Shadow
- [ ] 하드코딩된 box-shadow 없음
- [ ] 적절한 shadow 변수 사용 (--shadow-*)

### 새 변수 추가
- [ ] 새 변수 추가 시 index.css에 정의됨
- [ ] 변수명이 일관성 있게 명명됨
- [ ] 주석으로 용도 설명됨
```

---

## 하드코딩 검사

### 수동 검사 명령어

정기적으로 다음 명령어를 실행하여 하드코딩 값을 검사하세요:

```bash
# 하드코딩된 색상 검색 (변수 정의 제외)
grep -r "#[0-9a-fA-F]\{6\}" src --include="*.css" | grep -v "var(--" | grep -v "index.css"

# 하드코딩된 padding/margin 검색
grep -r "padding:\s*[0-9]\+px\|margin:\s*[0-9]\+px" src --include="*.css" | grep -v "var(--"

# 하드코딩된 border-radius 검색
grep -r "border-radius:\s*[0-9]\+px" src --include="*.css" | grep -v "var(--"
```

### 검사 결과 해석

**허용되는 하드코딩:**
- `index.css`의 변수 정의 (#00BFA5 등)
- 그래픽 요소의 그라데이션
- 브랜드 색상 (Google 등)

**수정 필요한 하드코딩:**
- 컴포넌트 CSS의 직접 색상 값
- padding/margin의 px 값
- border-radius의 px 값

### 자동화 스크립트

`scripts/check-hardcoded-values.js` 파일을 참고하세요. (생성 예정)

---

## FAQ

### Q1: 필요한 변수가 없을 때는 어떻게 하나요?

**A:** 먼저 기존 변수로 대체 가능한지 확인하세요. 정말 새로운 변수가 필요하면 `src/index.css`에 추가하고 문서화하세요.

```css
/* index.css에 추가 */
:root {
  --color-new-feature: #ff5733; /* 새 기능 전용 색상 */
}

/* 컴포넌트에서 사용 */
.my-component {
  background-color: var(--color-new-feature);
}
```

### Q2: 특수한 값이 필요한 경우는?

**A:** 특수한 값이 필요하면:
1. 기존 변수로 대체 가능한지 확인
2. 불가능하면 새 변수 추가
3. 그래픽/아트워크 요소는 하드코딩 허용

### Q3: 변수명 규칙은?

**A:** 
- 색상: `--color-{용도}-{상태}` 또는 `--color-{색상}-{번호}`
- 간격: `--spacing-{크기}`
- Border Radius: `--rounded-{크기}` 또는 `--rounded-{용도}`

### Q4: 기존 코드를 리팩토링할 때는?

**A:** 점진적으로 리팩토링하세요:
1. 새 기능 개발 시 변수 사용
2. 기존 코드 수정 시 변수로 전환
3. 정기적으로 하드코딩 검사 및 수정

---

## 참고 자료

- [CSS Custom Properties (MDN)](https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties)
- [Design Tokens (W3C)](https://www.w3.org/community/design-tokens/)
- 프로젝트 변수 정의: `src/index.css`

---

**마지막 업데이트:** 2024년

