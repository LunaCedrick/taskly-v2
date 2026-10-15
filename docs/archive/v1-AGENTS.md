# AGENTS.md — Taskly
## Developer: Cedrick Masalunga Luna
## Project: Taskly — Real-Time Multi-Project Task Manager
## Planned By: Claude (Anthropic)
## Version: 1.0
## Status: Active Development

---

Read this file completely before writing any code.
This is the single source of truth for the entire project.
Every session starts here. No exceptions.

---

## 1. PROJECT OVERVIEW

Taskly is a real-time, multi-project task manager for
general public use. Users sign in with Google, create
projects, and manage tasks across all projects from any
device. All data syncs instantly via Firebase Firestore.
Tasks work offline — changes sync when connectivity returns.

Core UX principle — users think:
"What needs my attention today?"
NOT: "Which project contains my task?"

The dashboard answers that question by aggregating tasks
from ALL projects into one view — overdue, today, upcoming.
Projects are organizational containers, not the entry point.

This is a standalone project with its own design identity.
Do not reference the portfolio or weather dashboard styles.
Start from zero.

Standard: Taskly must feel like Todoist + Notion + Linear.
It must NOT feel like a tutorial CRUD app or student project.

---

## 2. DESIGN SYSTEM

### Identity
Style    : Clean, productive, minimal SaaS aesthetic
Layout   : Deep indigo sidebar + light content area
Feel     : Fast, reliable, information-dense, professional

### Color System
```css
/* Core backgrounds */
--color-sidebar      : #1e1b4b;   /* deep indigo sidebar */
--color-bg           : #f5f4ff;   /* very light lavender-white */
--color-card         : #ffffff;   /* task cards, modals */
--color-border       : #e5e7eb;   /* subtle dividers */

/* Accent */
--color-accent       : #7c3aed;   /* violet — buttons, active */
--color-accent-hover : #6d28d9;   /* darker violet on hover */

/* Text */
--color-text-primary : #1a1a2e;   /* main text */
--color-text-muted   : #6b7280;   /* labels, metadata */
--color-text-light   : #9ca3af;   /* placeholders, timestamps */
--color-sidebar-text : rgba(255, 255, 255, 0.7);
--color-sidebar-active: #ffffff;

/* Urgency states */
--color-overdue-bg   : #fee2e2;   /* light red */
--color-overdue-text : #991b1b;
--color-today-bg     : #fef3c7;   /* light amber */
--color-today-text   : #92400e;
--color-done-text    : #6b7280;   /* muted when complete */

/* Priority dots */
--color-priority-high  : #dc2626; /* red */
--color-priority-med   : #d97706; /* amber */
--color-priority-low   : #059669; /* green */
--color-priority-none  : #9ca3af; /* grey */

/* Status colors */
--color-status-done    : #059669; /* green */
--color-status-progress: #7c3aed; /* violet */
--color-status-todo    : #6b7280; /* grey */

/* Notifications */
--color-notif-badge  : #dc2626;   /* red unread count */
```

### Typography
```
Font family    : DM Sans (Google Fonts)
Weights needed : 400, 500, 600, 700

Google Fonts import:
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">

Usage:
- Page titles       : 700, 20–24px
- Section headers   : 600, 16–18px
- Task titles       : 500, 14px
- Body / labels     : 400, 13px
- Metadata          : 400, 12px
- Stats numbers     : 700, 28–32px
```

### Spacing and Shape
```
Card border-radius  : 12px
Tag border-radius   : 8px
Pill border-radius  : 20px
Button border-radius: 8px
Card shadow         : 0 1px 3px rgba(0, 0, 0, 0.08)
Modal shadow        : 0 20px 60px rgba(0, 0, 0, 0.15)
Card padding        : 16px desktop, 12px mobile
Section gap         : 20px
Sidebar width       : 220px (fixed)
Topbar height       : 56px (fixed)
FAB position        : fixed, bottom 24px, right 24px
All transitions     : 0.15s ease
```

### Component Styles

Sidebar nav item — inactive:
```css
color: rgba(255, 255, 255, 0.6);
padding: 8px 16px;
border-radius: 8px;
```

Sidebar nav item — active:
```css
background: rgba(124, 58, 237, 0.3);
color: #ffffff;
border-right: 3px solid #7c3aed;
```

Task card:
```css
background: #ffffff;
border: 1px solid #e5e7eb;
border-radius: 12px;
padding: 14px 16px;
box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
transition: box-shadow 0.15s ease;
```

Task card hover:
```css
box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
```

Task card — overdue:
```css
background: #fee2e2;
border-color: #fca5a5;
```

Task card — today:
```css
background: #fef3c7;
border-color: #fcd34d;
```

Primary button (Add Task, Save):
```css
background: #7c3aed;
color: #ffffff;
border: none;
border-radius: 8px;
padding: 8px 16px;
font-weight: 600;
font-size: 13px;
transition: background 0.15s ease;
```
Primary button hover: background #6d28d9

Danger button (Delete):
```css
background: #dc2626;
color: #ffffff;
```

Ghost button (Cancel):
```css
background: transparent;
border: 1px solid #e5e7eb;
color: #6b7280;
```

Stat card:
```css
background: #ffffff;
border: 1px solid #e5e7eb;
border-radius: 12px;
padding: 16px;
```

FAB (Floating Action Button):
```css
background: #7c3aed;
color: #ffffff;
width: 52px;
height: 52px;
border-radius: 50%;
box-shadow: 0 4px 12px rgba(124, 58, 237, 0.4);
position: fixed;
bottom: 24px;
right: 24px;
font-size: 24px;
```

Progress bar:
```css
background: rgba(255, 255, 255, 0.15); /* track */
height: 4px;
border-radius: 2px;
/* fill color: #7c3aed */
```

---

## 3. TECH STACK

```
Frontend  : HTML5, CSS3, Vanilla JavaScript (ES6+)
SDK Style    : Firebase compat CDN — no bundler, no ES module imports
Auth      : Firebase Authentication — Google Sign-In
Database  : Firebase Firestore — real-time, offline
Push      : Firebase Cloud Messaging (FCM)
Font      : Google Fonts — DM Sans
Hosting   : Vercel (free tier)
Repo      : GitHub — github.com/LunaCedrick/Taskly
Editor    : VS Code + Codex (builder)
Planner   : Claude / Anthropic (architecture + skills)
```

Firebase Plan: Spark (free)
NO frameworks — no React, Vue, Bootstrap, Tailwind, jQuery.
NO build tools — no Webpack, Vite, or bundler of any kind.

### config.example.js — Style Requirement

config.example.js MUST match config.js's syntax exactly —
plain `const firebaseConfig = {...}`, no `export` keyword.
This is a template file copied directly to create config.js;
any ES module syntax here is misleading and inconsistent with
the compat CDN SDK Style declared in §3.

---

## 4. FILE STRUCTURE

```
taskly/
├── index.html          ← Single page, all views inside
├── style.css           ← All styles — no inline styles ever
├── js/
│   ├── config.js       ← Firebase config + constants (gitignored)
│   ├── auth.js         ← Google Sign-In, session, FCM permission
│   ├── router.js       ← View switching, auth state listener
│   ├── db.js           ← All Firestore operations, listeners
│   ├── ui.js           ← All DOM rendering, shared components
│   └── app.js          ← Orchestrator, state, event listeners
├── .agents/
│   ├── ALIGNMENT_FIXES.md ← Active cross-session fix ledger
│   └── skills/
│       ├── setup/SKILL.md
│       ├── auth/SKILL.md
│       ├── router/SKILL.md
│       ├── db/SKILL.md
│       ├── ui/SKILL.md
│       ├── dashboard/SKILL.md
│       ├── projects/SKILL.md
│       ├── tasks/SKILL.md
│       ├── search-filter/SKILL.md
│       ├── notifications/SKILL.md
│       ├── offline/SKILL.md
│       ├── settings/SKILL.md
│       ├── app/SKILL.md
│       ├── review/SKILL.md
│       ├── responsive/SKILL.md
│       ├── accessibility/SKILL.md
│       ├── performance/SKILL.md
│       ├── alignment-fix/SKILL.md ← Maintenance skill, not a session
│       └── SESSION_TEMPLATE.md ← Authoring template only, not a session
├── AGENTS.md           ← This file — read every session
├── PLAN.md             ← Full architecture plan
├── DOCUMENTATION.md    ← Product documentation
├── config.example.js   ← Safe template — committed to GitHub
├── .gitignore          ← config.js must be listed here
└── README.md
```

Script loading order in index.html — mandatory:
```html
<!-- Firebase SDK scripts load in <head>, after Google Fonts and before style.css -->
<script src="https://www.gstatic.com/firebasejs/12.4.0/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/12.4.0/firebase-auth-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/12.4.0/firebase-messaging-compat.js"></script>

<!-- Application scripts load at the bottom of <body> in this order -->
<script src="js/config.js"></script>
<script src="js/auth.js"></script>
<script src="js/router.js"></script>
<script src="js/db.js"></script>
<script src="js/ui.js"></script>
<script src="js/app.js"></script>
```

---

## 5. MODULE ARCHITECTURE

### Strict Separation of Concerns
Each module has one job. This is non-negotiable.
Modules never cross into each other's responsibilities.

```
config.js
  ✅ Firebase app initialization
  ✅ Firestore instance
  ✅ Auth instance
  ✅ FCM messaging instance
  ✅ Named constants (DEFAULT_PRIORITY, STATUS values)
  ❌ No functions
  ❌ No DOM access
  ❌ No fetch or Firestore calls
  ❌ No top-level variable named auth
     Use firebaseAuth for the Firebase Auth instance so
     window.auth remains reserved for the custom auth module

auth.js
  ✅ initAuthListener(onSignIn, onSignOut)
  ✅ signInWithGoogle()
  ✅ signOut()
  ✅ onAuthStateChanged listener (exposes auth-state callback)
  ✅ requestNotificationPermission() — first login only
  ✅ saveFcmToken(userId, token) via db.js when FCM is granted
  ❌ No DOM manipulation
  ❌ No Firestore reads beyond saving FCM token
  ❌ No application state management

router.js
  ✅ showLoginView()
  ✅ showAppView()
  ✅ Listens to auth state → calls correct show function
  ✅ Calls app.js init on auth success
  ❌ No Firebase calls beyond reading auth state
  ❌ No business logic
  ❌ No Firestore operations

db.js
  ✅ createProject(userId, name)
  ✅ listenToProjects(userId, callback) — returns onSnapshot unsubscribe
  ✅ updateProject(userId, projectId, data)
  ✅ deleteProject(userId, projectId)
  ✅ createTask(userId, projectId, taskData)
  ✅ listenToTasks(userId, projectId, callback) — returns onSnapshot unsubscribe
  ✅ listenToDashboardTasks(userId, callback) — collection group listener
  ✅ updateTask(userId, projectId, taskId, data)
  ✅ deleteTask(userId, projectId, taskId)
  ✅ writeActivityLog(userId, event)
  ✅ saveUserProfile(userId, profileData)
  ✅ saveFcmToken(userId, token)
  ❌ No DOM access — never touches HTML
  ❌ No UI rendering
  ❌ No application state management

ui.js
  ✅ renderSidebar(projects, activeProjectId)
  ✅ renderSidebarUser(user)
  ✅ renderProjectList(projects)
  ✅ renderTaskList(tasks, filters, searchQuery)
  ✅ renderTaskCard(task)
  ✅ renderDashboard(data)
  ✅ renderStats(stats)
  ✅ renderSkeletonCards(count)
  ✅ renderEmptyState(type)
  ✅ renderErrorBanner(message)
  ✅ renderNotificationPanel(notifications)
  ✅ renderActivityFeed(activities)
  ✅ renderSettingsView(user, notificationStatus)
  ✅ renderTaskModalValidation(message)
  ✅ clearTaskModalValidation()
  ✅ renderProjectModalValidation(message)
  ✅ clearProjectModalValidation()
  ✅ showAddTaskModal()
  ✅ showEditTaskModal(task)
  ✅ showConfirmModal(message, onConfirm)
  ✅ showOfflineBanner()
  ✅ hideOfflineBanner()
  ✅ updateNotificationBadge(count)
  ❌ No Firebase calls of any kind
  ❌ No fetch calls
  ❌ No application state management
  ❌ Never uses innerHTML for user/Firestore data

app.js
  ✅ Application state object (single source of truth)
  ✅ init() — called on auth success by router.js
  ✅ All event listeners (search, filter, FAB, nav, modals)
  ✅ Connects db.js output to ui.js input
  ✅ Manages Firestore listener references for cleanup
  ✅ handleSearch(query)
  ✅ handleFilter(type, value)
  ✅ handleProjectSwitch(projectId)
  ✅ handleSignOut() — detaches listeners, clears state
  ✅ Network status listener (online/offline events)
  ❌ No direct Firestore calls — always via db.js
  ❌ No user-visible DOM writes when a ui.js helper exists
```

### UI Write Boundary

app.js owns event handling, event target reads, form value reads,
and orchestration decisions. User-visible DOM writes belong in
ui.js when a helper exists.

Required ui.js helper contracts for app.js:

- `renderSidebarUser(user)` updates `#user-photo` and `#user-name`.
- `renderTaskModalValidation(message)` shows task modal inline validation.
- `clearTaskModalValidation()` clears task modal inline validation.
- `renderProjectModalValidation(message)` shows project modal inline validation.
- `clearProjectModalValidation()` clears project modal inline validation.

app.js may read DOM event targets and form values directly because
it owns event listeners. It must call these helpers for the user-visible
writes above once they exist.

### Settings Navigation Contract

Settings must have a visible navigation entry using
`data-view="settings"`. The entry lives in the existing sidebar
navigation unless a later source-of-truth update deliberately chooses
another accessible location.

Settings owns the UI/navigation contract and required HTML target.
app.js owns event handling for the `settings` navigation target.

### Settings Notification Contract

Settings v1 displays notification permission status and concise help.
It must not imply a working enable-notifications toggle unless a public
auth/app permission request contract exists.

Settings and app code must not call private auth-module internals. If
permission is denied, show exactly:
`Notifications disabled. You can enable them in browser settings.`

### Application State — Lives Only In app.js
```javascript
const state = {
  user: null,
  currentProjectId: null,
  projects: [],
  tasks: [],
  dashboardData: {
    overdue: [],
    today: [],
    upcoming: [],
    activity: []
  },
  filters: {
    status: 'all',
    priority: 'all',
    category: 'all'
  },
  searchQuery: '',
  notifications: [],
  unreadCount: 0,
  listeners: [],         // Firestore unsubscribe functions
  isOffline: false
};
```

### Listener Cleanup Pattern — Critical
```javascript
// Store every onSnapshot reference
const unsubProjects = db.listenToProjects(userId, callback);
state.listeners.push(unsubProjects);

// On sign out — detach all
state.listeners.forEach(unsub => unsub());
state.listeners = [];
```

Failure to detach listeners causes memory leaks
and Firestore errors on re-login. Always use this pattern.

### Listener Resilience — Dashboard Collection Group Query

CONFIRMED BEHAVIOR (Session 4 manual test):
When db.deleteProject() runs its batch delete (removes a task
document AND its parent project document in the same batch),
any live listener from listenToDashboardTasks() may fire its
error callback once with a transient "permission-denied" error
— even though the delete succeeds and Firestore data is correct.

This is a known Firestore SDK quirk with collection-group
listeners reacting to batched deletes that remove an entire
path branch at once. db.js is not at fault — its error mapping
is working as designed (AGENTS.md §7).

IMPACT: Once onSnapshot's error callback fires, Firestore stops
delivering further updates on that listener. Left unhandled,
the dashboard would silently stop receiving live updates after
any project deletion.

REQUIRED HANDLING — Session 13 (app.js):
- When listenToDashboardTasks()'s error callback fires with
  "Unable to load data. Please try again.", app.js must re-subscribe:
  call db.listenToDashboardTasks() again, replace the stored
  unsubscribe function in state.listeners, and continue.
- Do not surface this specific transient error to the user as
  a persistent error banner — it self-resolves on re-subscribe.

REQUIRED HANDLING — Session 6 (dashboard view):
- If a brief "reconnecting" state is shown during re-subscribe,
  it must follow the loading/skeleton pattern (AGENTS.md §10),
  not the error banner pattern — this is not a user-facing error.

---

## 6. FIREBASE ARCHITECTURE

### Firestore Data Structure
```
firestore/
└── users/
    └── {userId}/
        ├── profile
        │   ├── name        : string
        │   ├── email       : string
        │   ├── photoURL    : string
        │   ├── fcmToken    : string
        │   └── createdAt   : timestamp
        │
        └── projects/
            └── {projectId}/
                ├── name        : string
                ├── createdAt   : timestamp
                │
                └── tasks/
                    └── {taskId}/
                        ├── userId      : string  ← REQUIRED
                        ├── title       : string
                        ├── description : string
                        ├── dueDate     : timestamp|null
                        ├── priority    : string
                        │               (high/medium/low/none)
                        ├── category    : string
                        ├── status      : string
                        │               (todo/inprogress/done)
                        ├── createdAt   : timestamp
                        └── updatedAt   : timestamp
```

### CRITICAL — userId Field On Tasks
Every task document MUST include a userId field.
This is required for the collection group query used
by the dashboard to aggregate tasks across all projects.
Without it, the cross-project dashboard query cannot
filter by user and will fail or return wrong data.

### Firestore Security Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null
                         && request.auth.uid == userId;
    }
  }
}
```

### Dashboard Collection Group Query
```javascript
// Requires composite index in Firebase console:
// Collection group: tasks
// Fields: userId (Ascending), dueDate (Ascending)
firebase.firestore()
  .collectionGroup('tasks')
  .where('userId', '==', currentUserId)
  .orderBy('dueDate', 'asc')
  .onSnapshot(callback);
```

### Firestore Optimization Rules — Critical for Spark Plan
- ONE listener per collection — never per document
- Cache results in app.js state — do not re-query for
  data already in memory
- Detach ALL listeners on sign-out via state.listeners
- Use collection group queries for dashboard only —
  not for project-specific views
- Batch writes when creating multiple documents
- Use FieldValue.increment() for counters — never read
  then write

### Offline Persistence
This project uses the Firebase compat SDK via CDN — no bundler.
Use compat-style persistence only. Never use modular imports.
 
Enable in config.js immediately after Firebase init:
```javascript
// Compat style — correct for CDN/no-bundler projects.
// Call this once, right after firebase.initializeApp().
db_firestore.enablePersistence({ synchronizeTabs: false })
  .catch((err) => {
    if (err.code === 'failed-precondition') {
      // Multiple tabs open — persistence works in one tab only.
      console.warn('Offline persistence: multiple tabs open');
    } else if (err.code === 'unimplemented') {
      // Browser does not support IndexedDB.
      console.warn('Offline persistence not supported');
    }
  });
```


### FCM — No Scheduled Push in MVP
Scheduled 8AM push notifications are NOT in MVP.
They require Firebase Cloud Functions which need Blaze plan.
In MVP: only browser notifications triggered by app events.
Notification permission is requested on first login.
FCM token is saved to Firestore user profile.

---

## 7. ERROR HANDLING

Every error must produce a human-readable message.
Never show raw Firebase error codes to users.
Never fail silently — every error must be visible.

```
Network failure        → "Connection lost. Check your internet."
Firebase failure       → "Unable to load data. Please try again."
Google popup blocked   → "Google login popup was blocked.
                          Allow popups for this site."
Notif permission denied→ "Notifications disabled. You can enable
                          them in browser settings."
Missing project        → "This project no longer exists."
Empty task title       → "Please enter a task title."
Auth failure           → "Sign-in failed. Please try again."
Offline write queued   → (no error — Firestore handles silently)
Unknown error          → "Something went wrong. Please try again."
```

Error display rules:
- Shown in context — never only in browser console
- Errors replace loading or empty states — never stack
- All error banners are dismissible
- Modals show inline validation errors below input fields

---

## 8. NAMING CONVENTIONS

### CSS — kebab-case, BEM structure
```
Block     : .task-card
Element   : .task-card__title
Modifier  : .task-card--overdue
            .task-card--done
            .nav-item--active
```

### JavaScript — camelCase
```
Variables : currentProjectId, taskDueDate, searchQuery
Functions : createTask, renderDashboard, handleSearch
            signInWithGoogle, listenToDashboardTasks
Constants : DEFAULT_PRIORITY, STATUS_TODO, STATUS_DONE
State keys: user, currentProjectId, filters, listeners
```

### File names — lowercase
```
index.html, style.css, config.js, auth.js,
router.js, db.js, ui.js, app.js
```

### IDs — kebab-case, unique per page
```
#view-login, #view-app
#sidebar, #main-content, #topbar
#search-input, #notification-bell, #notif-count
#task-list, #sidebar-project-list
#add-task-modal, #edit-task-modal, #confirm-modal
#view-dashboard, #view-project, #view-settings
#fab-add-task
#offline-banner
```

`#notif-count` is the only canonical notification badge ID.
Do not add or preserve `#notification-count` in new code.

---

## 9. CODE STANDARDS

### HTML
- Semantic tags — header, nav, main, section, aside, footer
- No inline styles — ever
- No JS logic in HTML — event listeners always in app.js
- All images have descriptive alt attributes
- All modals have role="dialog" and aria-modal="true"
- All interactive elements have aria-label
- Script tags at bottom of body in correct order

### CSS
- All styles in style.css — no inline styles, no style tags
- CSS custom properties for all design tokens
- No frameworks — no Bootstrap, Tailwind, or any other
- Mobile-first — base styles target 375px
- Animations use transform and opacity only — never
  animate width, height, top, or left
- All transitions: 0.15s ease
- Always use CSS variables for colors — never hardcode hex
  values directly in rules (use var(--color-accent))

### JavaScript
- ES6+ throughout — const, let, arrow functions, async/await
- No var — ever
- No jQuery, no external JS libraries of any kind
- textContent for all user-supplied or Firestore data
  — NEVER innerHTML
- try/catch around every async Firebase operation
- Every function has JSDoc comment block
- No console.log in committed code
- Max function length ~25 lines — split if longer
- Named async functions — no anonymous async callbacks
  in Firestore calls

### JSDoc Format — Every Function
```javascript
/**
 * Creates a new task in Firestore under the given project.
 * @param {string} userId - Firebase Auth UID
 * @param {string} projectId - Parent project document ID
 * @param {Object} taskData - Task fields to write
 * @returns {Promise<string>} New task document ID
 */
async function createTask(userId, projectId, taskData) { ... }
```

### Comment Standards
- Every file has a header comment stating its purpose
- Every function has JSDoc above it
- Every complex logic block has an inline comment
- Every Firestore security rule has a comment explaining it
- Every CSS section has a comment header

---

## 10. RESPONSIVE RULES

Mobile-first. Base styles target 375px.
Media queries expand for larger screens.

```
375px  → mobile base (default)
768px  → tablet
1024px → desktop
1440px → wide desktop
```

Sidebar behavior:
- Mobile (< 768px): hidden, accessible via hamburger menu
- Tablet (768px–1023px): collapsible icon bar
- Desktop (1024px+): always visible at 220px width

Task cards: full width on all screen sizes.

Modals: full screen on mobile, centered 500px on desktop.

FAB: always visible, fixed bottom-right.

Touch targets: minimum 44px height on all interactive
elements on mobile.

Never allow horizontal scrolling at any breakpoint.

---

## 11. ACCESSIBILITY STANDARDS

- One h1 per page only
- Logical heading hierarchy: h1 → h2 → h3
- All modals: role="dialog", aria-modal="true",
  aria-labelledby pointing to modal title
- Focus trap inside open modals — Tab cycles within modal
- Escape key closes all modals
- All form inputs have associated labels
- All icon buttons have aria-label
- Notification bell: aria-label="Notifications",
  aria-live="polite" on count badge
- Notification badge ID: `#notif-count` only; `#notification-count`
  is stale and must not be used
- Search input: aria-label="Search tasks"
- Offline banner: role="alert" for immediate announcement
- Error messages: role="alert"
- Empty states: aria-live="polite"
- Full keyboard navigation — no mouse-only interactions
- Focus returns to trigger element when modal closes
- Color is never the only way information is conveyed
  (priority dots always include text label too)

---

## 12. SECURITY RULES

- Firebase config in config.js — listed in .gitignore
- config.example.js shows structure — safe to commit
- Vercel environment variables hold production config
- Firebase API key restricted to Vercel domain
- textContent everywhere — never innerHTML on external data
- All user input trimmed before Firestore writes
- Priority and status values validated against allowed
  sets before writing
- Category validated — trim and sanitize before write
- FCM token stored in user's own Firestore document only
- External links: rel="noopener noreferrer"

---

## 13. GIT WORKFLOW

### Branches
```
main     → Production — deployed to Vercel automatically
dev      → Active development — all sessions work here
feature/ → Individual features branched from dev
```

### Commit Convention
```
feat: add Google Sign-In with session persistence
feat: implement Firestore project CRUD operations
feat: render aggregated dashboard with overdue section
fix: detach Firestore listeners on sign-out
fix: handle Firebase popup blocked error gracefully
style: add skeleton loading cards to task list
refactor: extract filter logic into dedicated function
docs: update README with Vercel deployment URL
```

### Rules
- Never commit directly to main
- Never commit config.js — it contains Firebase keys
- Never commit with console.log statements
- Run .agents/skills/review/SKILL.md before every push to dev
- Merge dev → main only after full QA (Session 14)
- Tag production release: git tag v1.0.0

---

## 14. SKILL FILES DIRECTORY

All 17 skills. One session per skill. Review runs after every session.

Reusable authoring template:
`.agents/skills/SESSION_TEMPLATE.md`

This template is only for drafting Sessions 6–17 consistently.
It is not a build session and must not be treated as Session 18.

```
Session  1 : .agents/skills/setup/SKILL.md
             Folder structure, base HTML shell, CSS tokens,
             DM Sans link, Firebase SDK links, module stubs

Session  2 : .agents/skills/auth/SKILL.md
             auth.js — Google Sign-In, session persistence,
             sign-out, FCM permission request on first login

Session  3 : .agents/skills/router/SKILL.md
             router.js — view switching, onAuthStateChanged,
             shows login or app view, calls app.init()

Session  4 : .agents/skills/db/SKILL.md
             db.js — ALL Firestore CRUD, onSnapshot listeners,
             offline persistence, activity log writes,
             collection group query for dashboard

Session  5 : .agents/skills/ui/SKILL.md
             ui.js — all shared render functions, skeleton
             cards, empty states, error banners, modals,
             notification panel, offline banner

Session  6 : .agents/skills/dashboard/SKILL.md
             Dashboard view — aggregated stats, overdue,
             today, upcoming, recent activity sections

Session  7 : .agents/skills/projects/SKILL.md
             Project CRUD, sidebar project list, progress
             bars, project switching, delete confirmation

Session  8 : .agents/skills/tasks/SKILL.md
             Task CRUD, add/edit modal forms, complete
             toggle, due date sorting, overdue/today
             highlighting, FAB entry point

Session  9 : .agents/skills/search-filter/SKILL.md
             Real-time search (title+desc+category),
             filter tabs (status/priority/category),
             combined filter + search logic, debounce

Session 10 : .agents/skills/notifications/SKILL.md
             In-app alert banners, notification bell,
             panel, mark as read, browser push via FCM,
             event-triggered notifications

Session 11 : .agents/skills/offline/SKILL.md
             Offline banner, network status listener,
             offline persistence verification, sync on
             reconnect behavior

Session 12 : .agents/skills/settings/SKILL.md
             Settings view — profile display, notification
             status/help, theme placeholder, sign-out with
             confirmation modal

Session 13 : .agents/skills/app/SKILL.md
             app.js — full orchestration, state object,
             all event listeners, listener cleanup,
             search/filter wiring, network status handling

Session 14 : .agents/skills/review/SKILL.md
             Full QA pass — all modules reviewed
             Run after EVERY session, not just Session 14

Session 15 : .agents/skills/responsive/SKILL.md
             Full mobile and tablet pass — all breakpoints,
             sidebar collapse, modal sizing, touch targets

Session 16 : .agents/skills/accessibility/SKILL.md
             ARIA on modals, focus traps, keyboard nav,
             contrast verification, screen reader testing

Session 17 : .agents/skills/performance/SKILL.md
             Listener cleanup audit, unused CSS removal,
             no console.logs, PWA manifest prep,
             Vercel deployment final steps

Maintenance: .agents/skills/alignment-fix/SKILL.md
             Cross-session contract alignment before code fixes.
             Reads .agents/ALIGNMENT_FIXES.md, patches AGENTS.md
             and affected skills first, then hands off to the
             relevant build skill. This is not Session 18.
```

### Skill Usage Rules
- Always feed AGENTS.md first, then the relevant skill
- If .agents/ALIGNMENT_FIXES.md has active items, use
  alignment-fix before rerunning any affected build skill
- Never feed two build skills in the same session
- skill-review can be combined with any build skill
- If Codex generates something not in the skill scope:
  flag it, do not proceed, consult PLAN.md

---

## 15. BUILD PROMPTS

Copy these exactly when starting each session.
Always attach AGENTS.md and the named skill file from `.agents/skills/`.

---

### PROMPT: build-setup
```
Read AGENTS.md and .agents/skills/setup/SKILL.md completely.
Build the project setup exactly as specified.
Create all files and folders defined in AGENTS.md.
Write CSS custom properties for the full design system.
Write empty module stubs with file header comments.
Link all scripts in correct order in index.html.
Do not build any features — setup only.
Comment every file and every section.
After building, run .agents/skills/review/SKILL.md.
Report everything created and flag any issues.
```

### PROMPT: build-auth
```
Read AGENTS.md and .agents/skills/auth/SKILL.md completely.
Project setup exists — do not recreate it.
Build auth.js exactly as specified.
Implement Google Sign-In, session persistence,
sign-out, and FCM permission request for first login.
Comment every function with JSDoc format.
After building, run .agents/skills/review/SKILL.md.
Report what was built and flag any issues.
```

### PROMPT: build-router
```
Read AGENTS.md and .agents/skills/router/SKILL.md completely.
auth.js exists — do not modify it.
Build router.js exactly as specified.
Implement auth state listener, showLoginView(),
showAppView(), and app.js init trigger.
Comment every function with JSDoc format.
After building, run .agents/skills/review/SKILL.md.
Report what was built and flag any issues.
```

### PROMPT: build-db
```
Read AGENTS.md and .agents/skills/db/SKILL.md completely.
Auth and router modules exist — do not modify them.
Build db.js exactly as specified.
Implement all Firestore CRUD functions, onSnapshot
listeners, offline persistence, activity log writes,
and collection group query for the dashboard.
Every task write must include the userId field.
Comment every function with JSDoc format.
After building, run .agents/skills/review/SKILL.md.
Report what was built and flag any issues.
```

### PROMPT: build-ui
```
Read AGENTS.md and .agents/skills/ui/SKILL.md completely.
All prior modules exist — do not modify them.
Build all render functions in ui.js exactly as specified.
Use textContent for all user and Firestore data — never innerHTML.
Build skeleton cards, empty states, error banners,
modals, notification panel, and offline banner.
Comment every function with JSDoc format.
After building, run .agents/skills/review/SKILL.md.
Report what was built and flag any issues.
```

### PROMPT: build-dashboard
```
Read AGENTS.md and .agents/skills/dashboard/SKILL.md completely.
All prior modules exist — do not modify them.
Build the dashboard view exactly as specified.
Render stats, overdue, today, upcoming, and
recent activity sections using data from db.js.
Use ui.js render functions — no direct DOM manipulation.
Comment every section.
After building, run .agents/skills/review/SKILL.md.
Report what was built and flag any issues.
```

### PROMPT: build-projects
```
Read AGENTS.md and .agents/skills/projects/SKILL.md completely.
All prior modules exist — do not modify them.
Build project CRUD, sidebar project list, progress
tracking bars, project switching, and delete
confirmation modal exactly as specified.
Comment every function with JSDoc format.
After building, run .agents/skills/review/SKILL.md.
Report what was built and flag any issues.
```

### PROMPT: build-tasks
```
Read AGENTS.md and .agents/skills/tasks/SKILL.md completely.
All prior modules exist — do not modify them.
Build task CRUD, add/edit modal forms, complete toggle,
due date sorting, overdue/today highlighting, and FAB
exactly as specified.
Every new task must include the userId field.
Comment every function with JSDoc format.
After building, run .agents/skills/review/SKILL.md.
Report what was built and flag any issues.
```

### PROMPT: build-search-filter
```
Read AGENTS.md and .agents/skills/search-filter/SKILL.md completely.
All prior modules exist — do not modify them.
Build real-time search across title, description, and
category. Build filter tabs for status, priority,
and category. Implement combined filter logic.
All filtering is client-side — no Firestore reads.
Debounce search input at 150ms.
Comment every function with JSDoc format.
After building, run .agents/skills/review/SKILL.md.
Report what was built and flag any issues.
```

### PROMPT: build-notifications
```
Read AGENTS.md and .agents/skills/notifications/SKILL.md completely.
All prior modules exist — do not modify them.
Build in-app alert banners, notification bell with
unread count, notification panel, mark as read,
and browser push notifications via FCM exactly as
specified. Do NOT implement scheduled 8AM reminders.
Browser notifications are triggered by app events only.
Comment every function with JSDoc format.
After building, run .agents/skills/review/SKILL.md.
Report what was built and flag any issues.
```

### PROMPT: build-offline
```
Read AGENTS.md and .agents/skills/offline/SKILL.md completely.
All prior modules exist — do not modify them.
Verify offline persistence is correctly enabled.
Build offline banner, network status listener,
and sync-on-reconnect behavior exactly as specified.
Comment every section.
After building, run .agents/skills/review/SKILL.md.
Report what was built and flag any issues.
```

### PROMPT: build-settings
```
Read AGENTS.md and .agents/skills/settings/SKILL.md completely.
All prior modules exist — do not modify them.
Build settings view — profile display, notification
status/help, visible settings navigation, theme placeholder, and sign-out with
confirmation modal exactly as specified.
Comment every function with JSDoc format.
After building, run .agents/skills/review/SKILL.md.
Report what was built and flag any issues.
```

### PROMPT: build-app
```
Read AGENTS.md and .agents/skills/app/SKILL.md completely.
All other modules are complete — do not modify them.
Build app.js — the full orchestration layer.
Implement the state object, init(), all event listeners,
Firestore listener cleanup on sign-out, search/filter
wiring, network status handling, and project switching.
All Firebase calls go through db.js.
All user-visible DOM updates go through ui.js when helpers exist.
Comment every function with JSDoc format.
After building, run .agents/skills/review/SKILL.md.
Report what was built and flag any issues.
```

### PROMPT: run-review
```
Read AGENTS.md and .agents/skills/review/SKILL.md completely.
Review the code I am about to paste.
Output a full audit report:
  ✅ PASS — done correctly
  ⚠️  WARN — minor issues, fix suggested
  ❌ FAIL — must fix, provide corrected code
Fix all FAIL items before marking ready.
State: READY TO PROCEED yes/no.
```

### PROMPT: run-responsive
```
Read AGENTS.md and .agents/skills/responsive/SKILL.md completely.
All features are complete — do not add new functionality.
Audit and fix the full project for responsive behavior
at: 375px, 768px, 1024px, 1440px.
Fix all issues found.
Run .agents/skills/review/SKILL.md after.
Report every change made.
```

### PROMPT: run-accessibility
```
Read AGENTS.md and .agents/skills/accessibility/SKILL.md completely.
All features and responsive behavior are complete.
Audit and fix the full project for accessibility.
Fix all issues found.
Run .agents/skills/review/SKILL.md after.
Report every change made.
```

### PROMPT: run-performance
```
Read AGENTS.md and .agents/skills/performance/SKILL.md completely.
This is the final pass before deployment.
Audit for unused code, console.logs, listener leaks,
missing PWA files, and deployment requirements.
Fix all issues. Do not change any functionality.
Report every change made.
```

---

## 16. RULES OF THE ROAD

Non-negotiable. These apply to every session without exception.

- Read AGENTS.md before writing any code — every session
- Never modify a module outside its skill's assigned scope
- Never add CSS frameworks, JS libraries, or dependencies
- Never use innerHTML for user-supplied or Firestore data
- Never hardcode hex colors — always use CSS custom properties
- Never make Firestore calls from ui.js
- Never manipulate the DOM from db.js or auth.js
- Never manage application state outside of app.js
- Never write a Firestore listener without storing the
  unsubscribe function in state.listeners
- Never create a task without including the userId field
- Never implement scheduled push notifications — MVP uses
  event-triggered browser notifications only
- Never commit config.js — it is gitignored for a reason
- Never commit console.log statements
- Never skip the review skill before committing
- Never work on two build skills in the same session
- Always comment every function with JSDoc before ending a session
- Always push to GitHub after each session
- Always detach all Firestore listeners on sign-out
- If something conflicts with this file — stop and re-read
  PLAN.md before proceeding
- If Codex generates code outside the current skill scope
  — flag it and do not include it in the build
