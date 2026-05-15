---
description: Global rules and verification protocols for solve-climb
globs: ['**/*']
alwaysApply: true
---

# Global Rules for solve-climb

This file serves as the **Master Protocol**. Detailed standards are defined in `.agent/rules/00` ~ `.agent/rules/05`.

## 1. 🚨 Verification Protocol (MANDATORY)

- **Pre-Commit**: Always run `npm run validate:fast` before verifying a task.
- **Deep Changes**: Use `npm run validate:full` if modifying architecture or DB schemas.
- **Reference**: See `.agent/rules/04-testing-guide.md` for detailed testing strategies.

## 2. 🎨 Coding & Styling Standards

- **Source of Truth**: strictly follow `.agent/rules/01-tech-stack.md` and `.agent/rules/02-styling-guide.md`.
- **CSS Variables**: Use `var(--color-...)` and `var(--spacing-...)` variables. **NO hardcoded styles**.
- **Imports**: 피처 내부는 **상대 경로**, 피처 외부 및 전역 참조는 **절대 경로 별칭(@/)**을 사용합니다. (`01-tech-stack.md` 참조)

## 3. 🧠 Workflow & Behavior

- **Task Tracking**: Keep `task.md` up-to-date with every major step.
- **Ambiguity**: If a user request is vague, **STOP** and ask for clarification.
- **Documentation**: Read the specific `.md` file relevant to your task (e.g., read `05-ci-cd...` if touching CI).
