## Proposed Changes

### [Frontend] Login Flow Optimization
Unify the login experience by implementing an automatic fallback mechanism.

#### [MODIFY] [MyPage.tsx](file:///c:/Users/ghkdd/gemini-projects/solve-climb/src/pages/MyPage.tsx)
- Catch "Toss App Only" error in `handleLogin`.
- Trigger `handleGoogleLogin()` automatically when Toss is unavailable.
- For Vercel environment, simplify the mock login attempt to prioritize speed.

## Verification Plan
### Manual Verification
- Test in a non-Toss browser (e.g., Chrome) to see if clicking "Experience Start" or "3-second start" automatically opens Google Login.
- Verify the toast message informs the user of the redirection.
