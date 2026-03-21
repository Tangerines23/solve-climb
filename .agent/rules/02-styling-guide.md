---
description: CSS 변수 및 디자인 시스템 필수 규칙
globs: ['**/*.css', 'src/**/*.tsx']
alwaysApply: false
---

# CSS 스타일링 규칙

> **핵심 원칙**: 모든 CSS는 `src/index.css`에 정의된 변수를 사용해야 합니다.
>
> 📌 **참조 파일**: @src/index.css (모든 CSS 변수 정의)

## 색상 변수

### 배경 색상

| 변수명                      | 용도      |
| --------------------------- | --------- |
| `var(--color-bg-primary)`   | 주요 배경 |
| `var(--color-bg-secondary)` | 보조 배경 |
| `var(--color-bg-tertiary)`  | 3차 배경  |

### 텍스트 색상

| 변수명                        | 용도        |
| ----------------------------- | ----------- |
| `var(--color-text-primary)`   | 주요 텍스트 |
| `var(--color-text-secondary)` | 보조 텍스트 |

### Primary 색상 (버튼, 링크)

| 변수명                  | 상태   |
| ----------------------- | ------ |
| `var(--color-blue-400)` | 기본   |
| `var(--color-blue-500)` | hover  |
| `var(--color-blue-700)` | active |

### 에러/경고 색상

- `var(--color-toss-red)` - 토스 빨간색

## 간격 변수

- `var(--spacing-xs)` (4px) ~ `var(--spacing-4xl)` (40px)
- 자주 사용: `--spacing-sm`(8px), `--spacing-md`(12px), `--spacing-lg`(16px), `--spacing-xl`(20px)

## Border Radius 변수

- `var(--rounded-card)` (16px) - 카드용
- `var(--rounded-button)` (12px) - 버튼용
- `var(--rounded-toggle)` (28px) - 토글 스위치

## Shadow 변수

- `var(--shadow-modal)` - 모달용
- `var(--shadow-card)` - 카드용

## 올바른 예시

```css
.my-component {
  background-color: var(--color-bg-primary);
  padding: var(--spacing-xl);
  border-radius: var(--rounded-card);
  box-shadow: var(--shadow-card);
}
```

## ❌ 금지 사항

- `#ffffff`, `#1e1e1e` 같은 직접 색상 값
- `20px`, `16px` 같은 직접 간격/radius 값
- `rgba()` 직접 사용 (변수 사용)

## 예외 사항 (하드코딩 허용)

- 그라데이션 색상
- 브랜드 색상 (Google `#4285F4` 등)
- `index.css`의 `:root` 내부 변수 정의
