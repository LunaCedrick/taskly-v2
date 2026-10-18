# DESIGN.md: calm warm

Mockups: https://claude.ai/artifact/PP55jo2pbr3tPSzjh16dSB (dashboard, project view, phone).
Rule: components use tokens only. Never hard-code a color, size, or font.

## tokens.css (create this file in Gate 0)
```css
:root {
  --bg:#FAF9F5; --surface:#FFFFFF; --sand:#F3F1EA; --line:#E6E2D6;
  --ink:#2B2924; --muted:#6F6B60;
  --accent:#B5522F; --accent-tint:#F6E3DA;
  --overdue:#A63A2A; --overdue-tint:#F3DAD3; --overdue-row:#FCF3F0;
  --today:#8A5A0B; --today-tint:#F6E7C8;
  --done:#4F6339; --done-tint:#E3E9D8;
  --prio-high:#A63A2A; --prio-med:#B07A1E; --prio-low:#68794F;
  --radius-sm:8px; --radius-md:10px; --radius-lg:14px;
  --space-1:4px; --space-2:8px; --space-3:12px; --space-4:16px; --space-5:24px; --space-6:32px;
  --font-ui:'Instrument Sans',system-ui,sans-serif;
  --font-display:'Newsreader',Georgia,serif;
  --dur-1:120ms; --dur-2:200ms; --ease:cubic-bezier(.2,.7,.2,1);
}
@media (prefers-reduced-motion:reduce){:root{--dur-1:0ms;--dur-2:0ms}}
```

## Type
Headings and big numbers: Newsreader 500 to 600. Interface: Instrument Sans 400 to 600, body 14 px, small 12 to 13 px.
Page title 34 px, section title 20 px, stat number 32 px.

## Layout
Desktop: sidebar 232 px (sand background, right border), main area padding 28 px by 36 px.
Dashboard: main column plus a 300 px activity column. Phone (under 820 px): top bar, content, floating add button (56 px), bottom tab bar (Dashboard, Tasks, Projects).

Gate 0 decisions (owner approved):
- The interim initial-JavaScript target is 100 KB gzipped, leaving room for Firebase in later gates.
- The 820 px breakpoint is an approved exception to the token-only size rule. Keep its media condition in one place, `src/styles/tokens.css`, because CSS custom properties cannot be used in media query conditions.
- The phone Projects tab opens the project drawer (the existing menu drawer), because G0 has no `/projects` index route.

## Components
- Button: primary (accent, white text), secondary (surface, line border), icon (40 px square, 44 px on phones).
- TaskRow: 22 px checkbox, title, project chip, due pill, priority label with dot. Min height 52 px (60 px on phones). Overdue rows use `--overdue-row`.
- Due pill: overdue (brick on tint), today (amber on tint), later (muted), done (sage on tint).
- StatCard: label, big number (display font), small note. Overdue number uses `--overdue`.
- Banner (`role="status"`): overdue alert, dismissible, with a Review action.
- ProjectItem: dot, name, count, 4 px progress bar.
- SegmentedControl for status filters. Selects as buttons with "Label: value".
- Modal: focus trap, Escape closes, focus returns to the trigger.
- Skeleton, EmptyState (short message plus one action).

## Rules
- Never show status by color alone. Overdue, today, priority, and status also use text.
- Text contrast at least 4.5:1. Touch targets at least 44 px. Visible focus ring on every control.
- Motion: opacity and transform only, 120 to 200 ms. Respect reduced motion.
- No heavy shadows. Thin borders. Radii 8 to 14 px.

## Additions (approved 2026-10-13)
- Floating Quick Add button: 56 px circle, `--accent`, plus icon, bottom 32 px and right 32 px on desktop, above the tab bar on phone. It turns into a close icon while the popover is open.
- Quick Add popover: 430 px, one title field with an accent focus ring, chips Due, Project, Priority, "More options" link, Add button, hint "Enter to add, Esc to close".
- Pickers: the project select, priority menu, and category suggestions are menus styled with tokens. Due date uses quick chips plus native date and time inputs in v0.1.
- Toasts: dark ink background, white text, radius 12 px, dismiss button. Errors use `--overdue` background.
- Project colors, assigned in this order: `#B5522F`, `#4F6339`, `#8A5A0B`, `#3F6B6E`, `#7A4A68`, `#55607A`. Color is decorative; the name is always shown.
- Component states (see the canvas frame): hover, focus (3 px accent ring), disabled (45 percent opacity), loading (spinner and label), error (brick border and message).
- Build a component only when a screen in `docs/SCREENS.md` uses it. Success and info banners are not used in v0.1.
