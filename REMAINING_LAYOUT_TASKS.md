# Layout Audit & Fixes (2026-01-29)

## Current Status
- [x] **VisualGuardian Refinement**: Now ignores Debug Panel & supports `data-vg-ignore`.
- [x] **CI/CD Integration**: `npm run check:layout:deep` is now running in GitHub Actions.
- [x] **Core Layout Fixes**:
  - [x] FooterNav label/icon vertical clipping (Fixed with line-height)
  - [x] Header status items (Minerals, Stamina) clipping (Fixed with Fluid Safety + line-height)
  - [x] Header emoji vertical clipping (Fixed with status-icon standardization)
  - [x] MyPage mastery value Desktop overflow (Fixed with line-height: 1.3)
- [x] **Verification**: All core screens verified clean via high-precision deep scan across Mobile/iPhoneSE/Desktop viewports.
