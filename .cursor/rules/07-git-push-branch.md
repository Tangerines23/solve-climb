---
description: Push할 때 main이 아닌 브랜치로만 push하기 (Git 워크플로우)
globs: ['**/*']
alwaysApply: true
---

# Git Push 규칙 — 브랜치로만 Push

## 핵심 규칙

- **main(또는 master)에는 직접 push하지 않는다.**
- 사용자가 "push해줘", "푸시해줘"라고 하면:
  1. **현재 브랜치가 main이면** → 먼저 작업용 브랜치를 만들거나 체크아웃한 뒤, **그 브랜치만** push한다.
  2. **이미 다른 브랜치에 있으면** → 그 브랜치만 push한다.
- push할 때 사용하는 명령은 **현재 브랜치를 원격으로 올리는 것**만 한다.  
  예: `git push origin <현재-브랜치-이름>`  
  **절대** `git push origin main` 으로 main을 직접 올리지 않는다.

## 사용자 요청 시 동작

- "push해줘" / "푸시해줘":
  - 현재 브랜치 확인 → main이면 브랜치 생성 또는 체크아웃 후, **그 브랜치만** push.
  - MCP(git_push)를 쓸 때도, **main이 아닌 브랜치**에서만 push하도록 안내하거나 실행한다.

## 참고

- 작업용 브랜치 이름 예: `feature/기능이름`, `fix/버그이름`, `docs/문서이름` 등.
- main 반영은 PR(Pull Request) 머지로만 한다. (문서: `docs/git-workflow-branch-and-push.md`)
