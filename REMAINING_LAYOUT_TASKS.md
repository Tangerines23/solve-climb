# Zero-Tolerance Layout Audit: Remaining Tasks

## 1. Final Verification High-Precision Scan
- [ ] Run `npm run check:layout:deep` one final time to ensure the last batch of fixes (FooterNav 2px overflow, Header emoji vertical clipping) are 100% resolved under the 0.5px sensor.
- [ ] Verify that the renamed `stamina-gauge-icon-wrapper-hardened` class is correctly applied and reporting "Clean".

## 2. CI/CD Integration
- [ ] Add `npm run check:layout:deep` to the GitHub Actions pipeline (as a non-blocking or blocking check depending on stability).
- [ ] Ensure the CI environment has sufficient resources to run the Playwright headless browser for segmented scrolling.

## 3. Production Hardening
- [ ] Ensure `VisualGuardian.tsx` is strictly excluded from the production bundle (via conditional loading in `App.tsx`).
- [ ] Refine the `VisualGuardian` auto-detection logic to ignore the `DebugPanel` itself (to prevent circular reports).

## 4. UI Polish & Standardization
- [ ] Apply the "Fluid Safety" pattern (padding instead of fixed dimensions for shadowed elements) to any newly created components.
- [ ] Audit new SVG icons for `drop-shadow` effects that might exceed their bounding boxes.
