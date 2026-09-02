# Solve-Climb 프로젝트 전역 AI 어시스턴트 룰 (Global Rules)

## 🐕 1. 5분 콘솔/백그라운드 와치도그 프로토콜 (5-Minute Watchdog Protocol)

콘솔 작업, 빌드, 테스트, 배포 등 백그라운드 프로세스가 인증 프롬프트 대기, 무한 루프, 네트워크 정체 등으로 인해 멈추는 현상을 방지하기 위해 다음 와치도그 규칙을 엄격히 준수합니다.

### 📋 핵심 수칙
1. **무응답 5분(300초) 한도**:
   - 백그라운드 태스크(`run_command`) 실행 후 **5분 동안 새로운 콘솔 출력이나 로그 파일 갱신이 없으면 정체(Hang) 상태로 간주**합니다.
2. **스케줄 와치도그 등록**:
   - 백그라운드 작업이 1~2분 내에 종료되지 않고 길어질 가능성이 있는 경우, `schedule` 도구를 사용하여 5분 타이머(`DurationSeconds=300`, `TimerCondition=<task-id>`)를 설정합니다.
3. **정체 감지 시 즉각 조치**:
   - 5분 타이머가 발동되었거나 로그 갱신이 멈춘 것이 감지되면:
     1. `manage_task(Action='status')` 및 해당 태스크의 로그 파일을 즉시 조회하여 마지막 진행 상황을 확인합니다.
     2. 프로세스가 입력 대기나 정체 상태에 빠졌다면 즉시 `manage_task(Action='kill')`로 종료합니다.
     3. 침묵하지 않고 즉시 채팅을 활성화하여 사용자에게 구체적인 정체 원인(예: Git 인증 대기, 네트워크 차단 등)과 해결 방안을 보고합니다.
4. **와치도그 모니터 스크립트 활용 (`scripts/watchdog-task-monitor.cjs`)**:
   - 정체 위험이 있는 단독 CLI 명령어는 와치도그 모니터를 통해 실행할 수 있습니다:
     ```bash
     node scripts/watchdog-task-monitor.cjs --cmd "<실행할 명령어>" --timeout 300
     ```

---

## 🔒 2. Git & 배포 프로토콜
1. **`main` 브랜치 직접 푸시 금지**:
   - 저장소의 브랜치 보호 규칙에 따라 `main`으로의 직접 푸시(`git push origin main`)는 거부됩니다.
   - 작업 브랜치 생성 $\rightarrow$ `push_files` (GitHub API) $\rightarrow$ PR 생성 $\rightarrow$ GitHub Actions CI 3개 검사 통과 후 Merge 방식을 사용합니다.
2. **로컬 커밋 우선 및 무결성 검증**:
   - 커밋 전 반드시 `npm run check:fast` 또는 `npm run validate`를 통해 100% 무결성을 검증합니다.
