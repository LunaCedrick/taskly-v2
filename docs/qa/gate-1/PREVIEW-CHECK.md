# Owner preview checks

Stable branch alias: https://taskly-v2-git-gate-1-auth-lunacedricks-projects.vercel.app/

1. Open that root URL in your Vercel-authenticated browser. Sign out of Taskly first if needed.
   Record browser/device; set DevTools Network to Slow 4G and CPU to 4x. Enable Preserve log.
2. Paste `preview-timing.js` into the DevTools console, click Continue with Google, and choose
   an account. Repeat three times, signing out and repasting between runs. Pass: every
   `closeToDashboardMs` is <3000. Record all three, their median, and each separate `popupOpenMs`.
3. Refresh while signed in. Pass: Dashboard returns with the session retained and no sign-in-form flash.
4. Sign out using the desktop sidebar; repeat using the phone drawer. Pass: sign-in appears,
   protected content disappears, and a refresh/protected visit still requires sign-in.
5. While signed out, visit `/projects/project-1?sort=due#task-2`, then sign in. Pass: that exact
   pathname, query, and hash return, with the Thesis project visible. Run timings from the root
   URL, separately from this deep-link check, so the measured heading is Dashboard.

The console-only snippet restores `window.open` after the next popup and changes no app source.
It uses the actual `header h1` Dashboard headings in Shell.tsx, ignores the hidden phone/desktop
counterpart, and reports UTC timestamps. Closure is observed via 20 ms polling plus window focus;
visibility is observed via DOM changes/polling. Browser scheduling/background throttling limits
precision. A zero delay means Dashboard was already visible when closure was detected.
`popupOpenMs` is the separate account-selection interval (including provider-page loading).
Record blocked/cancelled attempts separately. A missing Dashboard after 10 seconds is a failed
measurement; record that failure rather than silently replacing it with a faster run.

Owner results received 2026-10-19: **PASS** for real Google sign-in, refresh persistence,
sidebar/drawer sign-out, and deep-link return. Throttled sign-in runs: 198.1 / 43.4 / 101.1 ms;
median 101.1 ms. Separate popup-open intervals: 15,896.2 / 6,069.8 / 6,021.3 ms.
Environment, measurement limits, and owner-attributed console diagnostics are recorded in
`preview.json` and `REVIEW.md`. All required G1 targets have passing evidence in TRACKER.md.
