# TASKLY — PLAN.md
## Skill Applied: skill-project-startup.md
## Planned By: Claude (Anthropic) — Senior Engineering Advisor
## Developer: Cedrick Masalunga Luna
## Status: Pre-Development — Architecture Complete
## Version: 1.0

---

Read this file completely before writing AGENTS.md or any skill file.
This is the single source of truth for all planning decisions.
Every architectural choice in this plan is final and deliberate.

---

## QUICK REFERENCE

```
App Name     : Taskly
Type         : Real-time multi-project task manager
Stack        : HTML, CSS, Vanilla JavaScript + Firebase
Database     : Firebase Firestore (Spark free plan)
Auth         : Firebase Authentication — Google Sign-In
Push Notifs  : Firebase Cloud Messaging
Hosting      : Vercel (free tier)
Font         : DM Sans (Google Fonts)
Accent Color : #7c3aed (violet)
Sidebar      : #1e1b4b (deep indigo)
Skills       : 17 skill files
Sessions     : 17 build sessions
```

---

## 1. PROBLEM IDENTIFICATION

### The Real-World Problem
Managing tasks across multiple areas of life — school deadlines,
project work, personal errands, thesis milestones — requires
a system. Without one, tasks are forgotten, deadlines are
missed, and the only reminder that something exists is a
notification saying it was due today. By then, it is too late.

This is not a hypothetical problem. It is the developer's
personal experience as a Computer Engineering student managing
thesis work, coursework, and multiple self-directed software
projects simultaneously.

### Inefficiencies In Current Approaches
- Mental task tracking — relies on memory, fails under load
- Notes apps — no due dates, no priority, no reminders
- localStorage todo lists — data lost when browser clears
- Expensive productivity apps — features locked behind paywalls
- Apps that are too complex — more time managing the tool
  than actually getting work done

### Pain Points
- Forgetting tasks that have no visible urgency yet
- No cross-device access to personal task lists
- No smart surfacing of what actually needs attention today
- Reactive work — only acting when overdue, not before

### Why This System Needs To Exist
A lightweight, free, real-time task manager that genuinely
surfaces urgent work before it becomes overdue — available
on any device, working even offline — does not exist at the
quality level this project targets.

### What Happens Without It
Students miss deadlines. Developers lose track of feature work.
Personal goals get buried under urgent tasks that appear
without warning. The system this project replaces is either
nothing at all, or a note on a phone that never gets checked.

---

## 2. PROJECT VISION

### What Taskly Should Become
A lightweight productivity platform for individual users.
Not the next Jira. Not another overbuilt project management
tool. A fast, clean, genuinely useful task manager that
people actually open daily.

### References
Taskly should feel like the intersection of:
- Todoist — clean task management, due date focus
- Notion — organized, structured, multiple contexts
- Linear — clean productivity UX, high information density

### What Taskly Should NOT Feel Like
- A tutorial project or student CRUD assignment
- A localStorage todo list demo
- A feature-heavy enterprise tool
- Anything that requires a manual to use

### Identity
- Dashboard-first — the app surfaces what matters, not a list
- Reliable — data persists across devices, offline, and reloads
- Clean — every element earns its place on the screen
- Fast — zero loading friction, real-time updates everywhere
- Honest — errors are communicated clearly, never silently

### Design Philosophy
Users think: "What needs my attention today?"
NOT: "Which project contains the task I am looking for?"

The dashboard is the answer to that question — not navigation.

---

## 3. OBJECTIVES AND GOALS

### Core Goals — MVP Must Achieve All
- Implement Google Sign-In with Firebase Authentication
- Build full CRUD operations for projects and tasks in Firestore
- Achieve real-time synchronization via onSnapshot listeners
- Surface tasks by urgency on an aggregated dashboard view
- Implement browser notifications for overdue tasks
- Enable offline task management via Firestore persistence
- Build a genuinely usable app — not a demo
- Deploy publicly on Vercel

### Secondary Goals — Polish After Core
- Smooth loading states — skeleton cards, no blank screens
- Friendly empty states — guidance when no data exists
- Confirmation modals on all destructive actions
- Quick Add FAB — task creation from any view
- Settings page — profile, notifications, account

### Learning Goals
- Understand Firebase ecosystem (Auth + Firestore + FCM)
- Learn real-time database architecture and event-driven UI
- Build multi-view routing without a framework
- Practice user data isolation via Firestore security rules
- Develop structured AI-assisted development workflow skills

### Success Indicators
Taskly v1.0 is complete when:
1. Any user signs in with Google and immediately uses the app
2. Multiple named projects are created and managed independently
3. Tasks are created, edited, completed, deleted without data loss
4. Task changes appear on all open devices without page refresh
5. Tasks are accessible and editable without internet connection
6. Offline changes sync automatically when connection returns
7. The dashboard surfaces overdue, today, upcoming tasks clearly
8. Browser notifications fire when tasks become overdue
9. The app installs as a PWA on desktop and Android devices

---

## 4. TARGET USERS

### Primary — University Students
Use cases: assignment deadlines, thesis milestones,
group project coordination, exam preparation tracking.
Key needs: due date visibility, overdue alerts,
category separation (School vs Personal).

### Primary — Solo Developers
Use cases: feature tracking, bug lists, learning goals,
deployment checklists, project task management.
Key needs: multiple projects, Dev category, priority levels.

### Primary — Professionals
Use cases: daily work tasks, personal productivity,
household responsibilities.
Key needs: fast task creation, filter by priority,
cross-device access.

### Secondary — Recruiters and Technical Reviewers
They evaluate the project as a portfolio piece.
They test edge cases, read the code, and judge quality.
The app must work correctly under technical scrutiny.

### User Technical Level
Non-technical users must be able to use the app without
reading any documentation. Onboarding is Google Sign-In
and a visible empty state with a clear call to action.

---

## 5. SCOPE DEFINITION

### What Taskly WILL Do — MVP
- Google Sign-In authentication
- Create, rename, delete projects
- Create, edit, delete, complete tasks
- Task fields: title, description, due date, priority,
  category, status, created at, updated at
- Real-time sync across devices via Firestore onSnapshot
- Aggregated dashboard — tasks from all projects
- Overdue, Today, Upcoming, Recent Activity sections
- Stats cards — total, completed, in progress, overdue
- Search across title, description, and category
- Filter by status, priority, category
- In-app alert banners for overdue and today's tasks
- Browser push notifications when tasks become overdue
- Notification bell with unread count and notification panel
- Offline task viewing, creating, editing, deleting
- Automatic sync when connectivity returns
- Offline banner display when disconnected
- Loading skeleton states while data loads
- Empty states with guidance messages
- Confirmation modals on all destructive actions
- Quick Add FAB — always visible task creation button
- Project progress tracking per project
- Settings page — profile, notifications, account

### What Taskly WILL NOT Do — V1
- Team collaboration or shared projects
- Task assignment to other users
- Email or SMS notifications
- AI-powered features
- React rewrite
- Recurring tasks
- Calendar view
- Drag and drop reordering
- Dark mode (v2)
- Scheduled 8AM push notifications (requires Blaze plan)

### Feature Priority
```
MUST HAVE  : Auth, CRUD, real-time, dashboard, offline,
             notifications, search, filter
SHOULD HAVE: Loading states, empty states, confirmation
             modals, quick add, progress tracking
NICE TO HAVE: Settings page, activity feed polish
```

---

## 6. FEATURE PLANNING

---

### FEATURE 1 — Authentication

Purpose: Identity and data isolation.
Every piece of data belongs to exactly one user.

Input: Google account selection in popup
Output: User session created, profile saved to Firestore,
        router redirects to dashboard

Workflow:
```
App loads → router.js checks Firebase auth state
  → Not signed in: show login view
  → User clicks Sign in with Google
  → Firebase Auth opens Google popup
  → On success: save profile to Firestore
  → Check if first login
  → If first login: request notification permission
  → Router redirects to dashboard view
  → Auth state persists — user stays signed in on return
```

Dependencies: Firebase Auth, router.js, db.js
Edge cases:
- Popup blocked → show "Google login popup blocked" message
- Network failure → show "Connection lost" message
- User closes popup → no error, return to login view

---

### FEATURE 2 — Multi-Project Management

Purpose: Organize tasks into named contexts.

Input: Project name string
Output: New project document in Firestore under user's UID

Workflow:
```
User clicks New Project
→ Input prompt or modal appears
→ User types project name
→ Validation: not empty, not duplicate name
→ db.js creates project document in Firestore
→ Firestore onSnapshot triggers sidebar re-render
→ New project appears in sidebar immediately
→ App switches to new project view
```

Fields: name, createdAt, taskCount
Progress tracking: completed / total tasks = percentage
Dependencies: db.js, ui.js, app.js

Destructive action: Delete Project
→ Confirmation modal: "Delete [name]? All tasks will also
  be permanently deleted. This cannot be undone."
→ On confirm: delete all tasks subcollection first,
  then delete project document

---

### FEATURE 3 — Task CRUD

Purpose: Core utility of the application.

Task Fields:
```
title       : string (required)
description : string (optional)
dueDate     : timestamp (optional)
priority    : string (high/medium/low/none)
category    : string (Work/Personal/School/Dev/Urgent/custom)
status      : string (todo/inprogress/done)
createdAt   : timestamp (auto)
updatedAt   : timestamp (auto-updated on edit)
```

Create Workflow:
```
User clicks Add Task or FAB
→ Add Task modal opens
→ User fills title (required) + optional fields
→ Validation: title not empty
→ db.js writes task document to Firestore
→ onSnapshot triggers task list re-render
→ New task appears — sorted by due date
```

Edit Workflow:
```
User clicks task edit icon
→ Edit modal opens pre-filled with current values
→ User modifies any field
→ db.js updates document with updatedAt timestamp
→ onSnapshot triggers re-render
```

Complete Workflow:
```
User clicks task checkbox
→ Status toggles between todo and done
→ db.js updates status field
→ Task visually marked complete
→ Stats update in real time
```

Delete Workflow:
```
User clicks delete icon
→ Confirmation modal: "Delete this task?"
→ On confirm: db.js deletes document
→ onSnapshot triggers re-render
→ Task disappears from list
```

Sorting rule:
Tasks with due dates sorted ascending (soonest first).
Tasks with no due date appear at the bottom.
Overdue tasks: highlighted red background.
Today's tasks: highlighted amber background.

---

### FEATURE 4 — Dashboard View

Purpose: Answer "What needs my attention today?"
without navigating into individual projects.

Sections in order:
```
1. Stats Cards (real-time, cross-project)
2. Overdue — all overdue tasks from all projects
3. Today — all tasks due today from all projects
4. Upcoming — tomorrow, this week, later
5. Recent Activity — latest events across all projects
```

Implementation note:
Dashboard requires querying tasks across ALL projects —
not just the active one. This means collection group queries
or aggregating from individual project listeners.
Decision: Use collection group queries (tasks subcollection
across all projects for the current user).

Dependencies: db.js (cross-project queries), ui.js, app.js

---

### FEATURE 5 — Real-Time Synchronization

Purpose: All changes appear everywhere instantly.

Implementation:
- Firestore onSnapshot listeners on:
  - users/{uid}/projects (project list changes)
  - users/{uid}/projects/{id}/tasks (task changes per project)
  - Dashboard uses collection group snapshot on tasks
- When snapshot fires: ui.js re-renders affected component
- No manual refresh ever required

Optimization rules:
- Never attach one listener per task
- Attach one listener per collection
- Use local state cache to avoid unnecessary re-renders
- Detach listeners when user signs out or view changes

---

### FEATURE 6 — Search and Filtering

Purpose: Find specific tasks quickly in large lists.

Search:
- Real-time — filters as user types
- Searches: title, description, category
- Client-side only — no API calls, no Firestore reads
- Filters the currently rendered task list in memory

Filters:
- Status: All / To Do / In Progress / Done
- Priority: High / Medium / Low / None
- Category: All / individual categories
- Filters and search can be combined

State: Search query and active filters held in app.js state.
Re-render triggered on every keypress (search) or
filter tab click.

---

### FEATURE 7 — Notification System

Purpose: Surface urgency before it becomes a crisis.

In-App Alert Banners:
- Appear at top of dashboard on load
- "You have X tasks due today"
- "X tasks are overdue"
- Dismissible — stays dismissed until next session

Browser Push Notifications:
- Permission requested on first login
- Triggered when a task becomes overdue while app is active
- FCM token saved to Firestore user profile on permission grant
- If permission denied: no repeat requests, in-app alerts only

Notification Bell:
- In top navigation bar
- Shows unread count badge
- Click opens notification panel
- Panel lists all alerts with timestamps
- Mark as read / Clear all — both with confirmation

---

### FEATURE 8 — Offline Support

Purpose: Taskly works regardless of connectivity.

Implementation:
- enableIndexedDbPersistence() called in config.js on init
- Firestore caches all read data to IndexedDB automatically
- Write operations queue while offline, sync on reconnect

Offline Banner:
- Network status listener in app.js
- Online → offline: banner appears "Offline Mode —
  Changes will sync automatically"
- Offline → online: banner disappears, sync completes

User capabilities while offline:
- View all projects and tasks (from cache)
- Create new tasks (queued to Firestore)
- Edit existing tasks (queued)
- Delete tasks (queued)
- Complete tasks (queued)

---

### FEATURE 9 — Error Handling

Purpose: Never fail silently. Every error communicated clearly.

Error Scenarios and Messages:
```
Network failure      → "Connection lost. Check your internet."
Firebase failure     → "Unable to load data. Try again."
Popup blocked        → "Google login popup was blocked.
                        Allow popups for this site."
Permission denied    → "Notifications disabled. Enable in
                        browser settings to receive alerts."
Missing project      → "This project no longer exists."
Empty task title     → "Please enter a task title."
Auth failure         → "Sign-in failed. Please try again."
Unknown error        → "Something went wrong. Try again."
```

Rules:
- Errors shown in context — never in the browser console only
- Error messages replace loading/empty states — never stack
- All errors are dismissible
- No raw Firebase error codes ever shown to users

---

### FEATURE 10 — Loading and Empty States

Loading States:
- Skeleton cards rendered while Firestore data loads
- Dashboard, project list, task list all have skeletons
- Transition from skeleton to real content is smooth
- Never show blank white areas while data is in flight

Empty States:
- No projects: "Create your first project to get started" + button
- No tasks: "No tasks yet. Create your first task" + button
- Nothing overdue: "Great job! You have no overdue tasks" ✓
- No tasks today: "Nothing due today. Enjoy your day" ✓
- No search results: "No tasks match your search"

---

### FEATURE 11 — Settings Page

Sections:
- Profile: display name, email, photo from Google account
- Notifications: browser permission status, enable/disable
- Theme: placeholder for dark mode (v2)
- Account: sign out button with confirmation modal

---

## 7. SYSTEM ARCHITECTURE

### Architecture Type
Single Page Application (SPA).
No traditional server. No page reloads.
Firebase handles all backend concerns.
Vercel serves static files.

### Module Map — Strict Separation
```
config.js
  Purpose : Firebase initialization and constants
  Reads   : Nothing
  Writes  : Nothing
  Talks to: Nothing — imported by all other modules

auth.js
  Purpose : Google Sign-In, session, sign-out,
            notification permission request
  Reads   : Firebase Auth state
  Writes  : Firestore user profile on first login
  Talks to: router.js (auth state change)
            db.js (save FCM token)
  NEVER   : Touches DOM directly
            Makes Firestore read queries

router.js
  Purpose : View switching between login and dashboard
  Reads   : Firebase Auth state via auth.js
  Writes  : DOM (shows/hides views)
  Talks to: ui.js (trigger renders on view change)
  NEVER   : Makes Firebase calls directly

db.js
  Purpose : ALL Firestore operations
  Reads   : Firestore collections and documents
  Writes  : Firestore collections and documents
  Talks to: Returns data/snapshots to app.js
  NEVER   : Touches DOM
            Contains UI rendering logic
            Manages application state

ui.js
  Purpose : ALL DOM rendering
  Reads   : Data passed as parameters
  Writes  : DOM elements
  Talks to: app.js passes data in, ui.js renders out
  NEVER   : Makes Firebase calls
            Manages application state
            Contains business logic

app.js
  Purpose : Orchestrator — connects all modules
  Reads   : Application state object
  Writes  : Application state object
  Talks to: auth.js, router.js, db.js, ui.js
  Holds   : All event listeners
            Application state
            Firestore listener references for cleanup
```

### Application State Object
Lives exclusively in app.js.
Single source of truth.

```javascript
const state = {
  user: null,              // Firebase Auth user object
  currentProjectId: null,  // Active project ID
  currentUnit: null,       // Future: theme preference
  filters: {
    status: 'all',         // all/todo/inprogress/done
    priority: 'all',       // all/high/medium/low/none
    category: 'all',       // all/[category name]
  },
  searchQuery: '',          // Current search string
  projects: [],             // Cached project array
  tasks: [],                // Cached task array for active project
  listeners: [],            // Firestore listener references
  notifications: [],        // Unread notification objects
};
```

### Data Flow Diagram
```
USER ACTION
    ↓
app.js  (event listener fires)
    ↓
auth.js or db.js  (Firebase operation)
    ↓
Firebase  (Auth / Firestore / FCM)
    ↓
Firestore onSnapshot fires
    ↓
app.js updates state
    ↓
ui.js re-renders affected component
    ↓
User sees updated UI — no page refresh
```

### View Structure
```
index.html
├── #view-login         ← shown when not authenticated
│   └── Google Sign-In button
│
└── #view-app           ← shown when authenticated
    ├── .sidebar
    │   ├── logo + app name
    │   ├── nav links (Dashboard, My Tasks, Schedule, Analytics)
    │   ├── project list with progress bars
    │   └── user profile + sign out
    │
    └── .main
        ├── .topbar (search, quick add, notification bell)
        └── .content
            ├── #view-dashboard
            ├── #view-project
            └── #view-settings
```

### Authentication Flow
```
1. App loads
2. router.js attaches onAuthStateChanged listener
3. No user → show #view-login
4. User clicks Google Sign-In
5. Firebase Auth popup opens
6. User selects Google account
7. Auth success → onAuthStateChanged fires with user
8. db.js saves/updates user profile in Firestore
9. Check localStorage for firstLogin flag
10. If first login: request notification permission
11. FCM token saved to Firestore if permission granted
12. router.js shows #view-app
13. app.js attaches Firestore listeners
14. Dashboard renders with real data
```

---

## 8. TECH STACK DECISION

| Layer | Technology | Reason |
|---|---|---|
| Frontend | HTML5, CSS3, Vanilla JS | No framework needed for this scale. Proves fundamentals. |
| Auth | Firebase Authentication | Native Google Sign-In. Free. Session persistence built in. |
| Database | Firebase Firestore | Real-time listeners. Free Spark plan. Per-user isolation. |
| Push Notifs | Firebase Cloud Messaging | Same ecosystem. FCM token management in Firestore. |
| Hosting | Vercel | Free. Auto-deploy from GitHub. Fast CDN. |
| Font | DM Sans (Google Fonts) | Clean, geometric, readable numerals for stats. |
| Version Ctrl | GitHub | Public repo for portfolio visibility. |
| Editor | VS Code + Codex | AI-assisted building guided by AGENTS.md. |
| Planner | Claude (Anthropic) | Architecture, AGENTS.md, skill files, session planning. |

### Why Firebase Over Other Options
- Firestore real-time listeners are native — no polling
- Auth + Firestore + FCM are one SDK — no integration overhead
- Spark free plan supports all MVP features
- Offline persistence built in to Firestore
- Security rules prevent cross-user data access at database level

### Why Vanilla JavaScript
- Proves frontend fundamentals to interviewers
- No build tool, no bundler, no compilation step
- Direct DOM knowledge is required for junior interviews
- React comes in Project 5 — this is the stepping stone

### Firebase Spark Plan Limits
```
Firestore reads  : 50,000/day
Firestore writes : 20,000/day
Firestore deletes: 20,000/day
Storage          : 1 GiB
Cloud Functions  : NOT available (requires Blaze)
FCM              : Free unlimited
Auth             : Free unlimited
```

Scheduled push notifications (8AM reminder) explicitly
removed from MVP because Cloud Functions require Blaze plan.

---

## 9. DATABASE PLANNING

### Firestore Structure
```
firestore/
└── users/
    └── {userId}/
        ├── profile
        │   ├── name         : string
        │   ├── email        : string
        │   ├── photoURL     : string
        │   ├── fcmToken     : string
        │   └── createdAt    : timestamp
        │
        └── projects/
            └── {projectId}/
                ├── name         : string
                ├── createdAt    : timestamp
                │
                └── tasks/
                    └── {taskId}/
                        ├── title        : string
                        ├── description  : string (optional)
                        ├── dueDate      : timestamp (optional)
                        ├── priority     : string
                        │                 (high/medium/low/none)
                        ├── category     : string
                        ├── status       : string
                        │                 (todo/inprogress/done)
                        ├── createdAt    : timestamp
                        └── updatedAt    : timestamp
```

### Security Rules
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

No user can read or write another user's data.
Rule covers all sub-collections automatically.

### Firestore Optimization Rules
Critical for staying within Spark plan limits:

1. ONE listener per collection — never one per document
2. Cache results in app.js state — do not re-query for
   data already in memory
3. Use collection group queries for dashboard cross-project
   task aggregation
4. Detach all listeners on sign-out via stored references
5. Batch related writes — do not loop individual writes
6. Never read documents just to update a counter —
   use increment operations

### Dashboard Query Strategy
The dashboard shows tasks from ALL projects simultaneously.
This requires a Firestore collection group query:

```javascript
// Query all tasks subcollections under the current user
// Firestore requires a collection group index for this
collectionGroup('tasks')
  .where('userId', '==', currentUserId)
  .onSnapshot(callback)
```

Note: Each task document must include a userId field
to enable this query. Add userId when creating tasks.

Updated task document to include:
```
userId : string  ← matches the user's Firebase UID
```

---

## 10. UI/UX PLANNING

### Design System
```
Sidebar bg      : #1e1b4b  (deep indigo)
App background  : #f5f4ff  (very light lavender-white)
Card background : #ffffff
Accent          : #7c3aed  (violet)
Text primary    : #1a1a2e
Text muted      : #6b7280
Border          : #e5e7eb

Overdue bg      : #fee2e2  (light red)
Overdue text    : #991b1b
Today bg        : #fef3c7  (light amber)
Today text      : #92400e

Priority high   : #dc2626  (red dot)
Priority medium : #d97706  (amber dot)
Priority low    : #059669  (green dot)
Priority none   : #9ca3af  (grey dot)

Status done     : #059669  (green)
Status progress : #7c3aed  (violet)
Status todo     : #6b7280  (grey)

Font            : DM Sans (400, 500, 600, 700)
Border radius   : 12px cards, 8px tags, 20px pills
Card shadow     : 0 1px 3px rgba(0,0,0,0.08)
Transition      : 0.15s ease (all interactions)
```

### Navigation Structure
```
Sidebar (always visible — desktop)
├── Logo: Taskly
├── Dashboard
├── My Tasks
├── Schedule (placeholder — future)
├── Analytics (placeholder — future)
├── ── Projects ──
├── [Project 1] with progress bar
├── [Project 2] with progress bar
├── + New Project
└── [User avatar + name + sign out]

Topbar (always visible)
├── Page title
├── Search bar
├── + Add Task button
└── Notification bell [count]
```

### User Flow
```
First Visit
→ Login screen
→ Google Sign-In
→ Notification permission request
→ Dashboard (empty state — create first project CTA)

Returning Visit
→ Auth state persists → Dashboard
→ Last viewed project loads
→ Firestore listeners attach
→ Real-time data populates

Create Task
→ Click Add Task (topbar) OR FAB (bottom right)
→ Modal opens
→ Fill title (required) + any optional fields
→ Save → modal closes → task appears in list

Complete Task
→ Click checkbox
→ Task gets done styling
→ Stats update in real time

Search
→ Type in search bar
→ Task list filters instantly
→ Clear search → full list returns
```

### Responsive Layout
```
Desktop (1024px+)
  Sidebar visible — 200px fixed width
  Main content fills remaining width

Tablet (768px–1023px)
  Sidebar collapsible — icon bar or hamburger
  Main content full width when sidebar collapsed

Mobile (375px–767px)
  Sidebar hidden — accessible via hamburger menu
  Bottom navigation bar for primary actions
  FAB visible above bottom nav
  Task cards full width
```

---

## 11. WORKFLOW AND USER FLOWS

### Full User Journey — New User
```
Landing → Login → Permission request → Dashboard (empty)
→ Create project → Project view (empty)
→ Create task → Task appears
→ Add due date → Task sorted by date
→ Mark complete → Stats update
→ Close browser → Come back later
→ Auth persists → Data still there
→ Different device → Same data in real time
```

### Offline Workflow
```
User opens app → Firestore cache loads from IndexedDB
Network drops → Offline banner appears
User creates task → Queued in IndexedDB
User edits task → Queued in IndexedDB
Network returns → Banner disappears
Firestore syncs queued changes automatically
Other devices receive updates in real time
```

### Notification Workflow
```
User is on dashboard
Task due date passes
Firestore listener detects overdue status change
In-app alert banner updates
Browser push notification fires
Bell icon badge count increments
User clicks bell → panel opens
User reads notification → mark as read
```

---

## 12. SECURITY PLANNING

### Authentication Security
- Firebase Auth manages tokens — not stored by the app
- Sessions persist via Firebase SDK — not localStorage
- Sign-out clears all auth state and detaches listeners

### Data Isolation
- Firestore security rules lock all data to owner's UID
- Collection group queries include userId field filter
- No cross-user queries possible — rules reject them

### Input Security
- All user input trimmed before Firestore writes
- All displayed data uses textContent — never innerHTML
- No eval(), no dynamic script injection anywhere
- Category and priority values validated against allowed sets
  before writing to Firestore

### API Key Security
- Firebase config in config.js — gitignored locally
- Vercel environment variables for deployed config
- Firebase config restricted to Vercel domain in Firebase console
- config.example.js committed — shows structure without keys

### FCM Token Security
- FCM token stored in user's own Firestore document
- Covered by security rules — token not publicly accessible
- Token refreshed by Firebase SDK automatically

---

## 13. PERFORMANCE PLANNING

### Firestore Listener Strategy
```javascript
// Attach listeners — store references
const unsubscribeProjects = db.collection(...)
  .onSnapshot(callback);

// Detach on sign-out — prevent memory leaks
state.listeners.forEach(unsub => unsub());
state.listeners = [];
```

All onSnapshot references stored in state.listeners array.
On sign-out: detach all, clear array.
This prevents memory leaks and stale data on re-login.

### Rendering Efficiency
- Batch DOM updates — never update one element per loop
- Use DocumentFragment for list rendering
- Only re-render components that received new data
- Skeleton cards prevent layout shift on data load

### Asset Optimization
- DM Sans loaded with display=swap — no render blocking
- No heavy libraries — zero external JS dependencies
- CSS uses custom properties — single source for all values
- Only transform and opacity animated — GPU-accelerated

### Search Performance
- Debounce search input: 150ms delay before filtering
- Filter operates on in-memory task array — no Firestore reads
- Combined filters (search + status + priority + category)
  computed in single array pass — not chained separately

---

## 14. SCALABILITY PLANNING

### Current Scale
Single user, client-side SPA. No scaling concerns for MVP.
Firestore handles concurrent connections natively.

### Architecture Scales Because
- Module separation allows feature additions without rewrites
- Firestore structure allows additional fields without migration
- Security rules can be extended without data restructuring
- Skill file system allows new features to be added cleanly

### If Taskly Grows
```
Bottleneck 1: Dashboard cross-project queries at high task count
  Solution: Add Firestore indexes + pagination

Bottleneck 2: FCM token management at scale
  Solution: Server-side FCM via Cloud Functions (Blaze plan)

Bottleneck 3: Scheduled notifications
  Solution: Firebase Cloud Functions scheduler (Blaze plan)
  — This is the first post-MVP upgrade when on Blaze

Bottleneck 4: Team collaboration
  Solution: New Firestore collection structure for shared
  workspaces — separate from per-user structure
```

---

## 15. MAINTAINABILITY

### Naming Conventions
```
CSS     : kebab-case only
          .task-card, .task-card__title, .task-card--done
JS vars : camelCase
          currentProjectId, taskDueDate
JS funcs: camelCase, verb-first
          createTask, renderDashboard, handleSearch
JS const: SCREAMING_SNAKE_CASE
          API_KEY, DEFAULT_PRIORITY
Files   : lowercase-with-hyphens
          task-card.js, search-filter.js
IDs     : kebab-case, unique per page
          #task-list, #search-input, #notification-bell
```

### Code Standards
- ES6+ throughout — const, let, arrow functions, async/await
- No var — ever
- No jQuery, no external JS libraries
- textContent for all user/Firestore data — never innerHTML
- try/catch around every async Firebase operation
- Every function has JSDoc comment
- No console.log in committed code
- Max function length ~25 lines — split if longer

### Comment Standards
```javascript
/**
 * Creates a new task document in Firestore.
 * @param {string} projectId - The parent project document ID
 * @param {Object} taskData - Task fields to write
 * @returns {Promise<string>} The new task document ID
 */
async function createTask(projectId, taskData) { ... }
```

### Folder Cleanliness
- No files in root except: index.html, style.css, AGENTS.md,
  PLAN.md, DOCUMENTATION.md, README.md, .gitignore
- All JS in /js
- All skills in /skills/{name}/SKILL.md
- No temp files, no commented-out code in production

---

## 16. DEVELOPMENT WORKFLOW

### Build Philosophy
Plan first. Architect before building.
One module per session. Review before committing.
Never skip the review skill.

### AI Workflow
```
Claude (Anthropic) — Planning, architecture, AGENTS.md,
                     skill files, session design, code review
Codex (OpenAI)     — Code generation guided by AGENTS.md
                     and skill files
```

Every session:
1. Open AGENTS.md + relevant skill file
2. Paste build prompt from AGENTS.md
3. Codex generates code for that session's scope
4. Run skill-review immediately after
5. Fix all FAIL items before closing session
6. Commit to GitHub with correct commit message
7. Move to next session

### Session Map — 17 Sessions

| Session | Skill | What Gets Built | Implementation Order |
|---|---|---|---|
| 1 | skill-setup | Folder structure, base HTML, CSS reset, design tokens, Firebase SDK links, module stubs | Step 0 |
| 2 | skill-auth | auth.js — Google Sign-In, session, sign-out, FCM permission | Step 1 |
| 3 | skill-router | router.js — view switching, auth state listener | Step 1 |
| 4 | skill-db | db.js — all Firestore CRUD, listeners, offline persistence | Steps 2–4 |
| 5 | skill-ui | ui.js — all shared render functions, skeleton cards, empty states, error display | Steps 10–12 |
| 6 | skill-dashboard | Dashboard view — aggregated stats, overdue, today, upcoming, recent activity | Step 5 |
| 7 | skill-projects | Project CRUD, sidebar project list, progress tracking, confirmation modal | Step 2 |
| 8 | skill-tasks | Task CRUD, add/edit modal, complete toggle, sorting, highlighting, FAB | Step 3 |
| 9 | skill-search-filter | Search across title/desc/category, filter tabs, combined filter logic | Step 6 |
| 10 | skill-notifications | In-app alerts, notification bell, panel, browser push, FCM wiring | Steps 7–8 |
| 11 | skill-offline | Offline persistence verification, offline banner, network listener | Step 9 |
| 12 | skill-settings | Settings view — profile, notifications, account, sign-out | Step 15 |
| 13 | skill-app | app.js — full orchestration, state wiring, all event listeners, listener cleanup | All wired |
| 14 | skill-review | Full codebase QA pass — all modules reviewed against AGENTS.md | QA |
| 15 | skill-responsive | Full mobile and tablet pass — all breakpoints | QA |
| 16 | skill-accessibility | ARIA, focus traps, keyboard nav, contrast, screen readers | QA |
| 17 | skill-performance | Cleanup, optimization, PWA prep, deploy to Vercel | Deploy |

### Milestone Gates
```
Milestone 1 — Auth works        (Sessions 1–3)
Milestone 2 — Data flows        (Session 4)
Milestone 3 — UI renders        (Session 5)
Milestone 4 — Features complete (Sessions 6–12)
Milestone 5 — App wired         (Session 13)
Milestone 6 — QA passed         (Sessions 14–16)
Milestone 7 — Deployed          (Session 17)
```

---

## 17. VERSION CONTROL

### Branches
```
main     → Production — deployed to Vercel automatically
dev      → Active development — all sessions work here
feature/ → Individual features branched from dev
```

### Commit Convention
```
feat: add Google Sign-In with session persistence
feat: implement Firestore project CRUD
feat: render aggregated dashboard with overdue section
fix: detach Firestore listeners on sign-out
fix: handle Firestore permission denied gracefully
style: add skeleton loading cards to dashboard
refactor: extract filter logic from app.js to separate util
docs: update README with Vercel deployment link
```

### Rules
- Never commit directly to main
- Never commit config.js (API keys — gitignored)
- Never commit console.log statements
- Run skill-review before every push to dev
- Merge dev → main only after full QA pass (Session 14)
- Tag the release: git tag v1.0.0 when deployed

---

## 18. TESTING STRATEGY

### Manual Test Cases — Auth
- Sign in with Google → dashboard loads
- Close tab → reopen → still signed in
- Click sign out → login view shown
- Popup blocked → friendly error shown
- Sign in on second device → same data appears

### Auth Smoke Test Notes
- Firebase/Auth wiring was smoke-tested in Chrome with a temporary script.
- Confirmed: Firebase initializes, `window.auth.signInWithGoogle()` is callable, and the Firebase/Google sign-in popup opens.
- Not yet confirmed: completing an actual Google account login and writing the profile to Firestore, because `db.js` is still a Session 4 stub.

### Manual Test Cases — CRUD
- Create task with all fields → appears in list
- Create task with title only → appears in list
- Create task with no title → rejected with message
- Edit task → changes saved, updatedAt updated
- Complete task → checkbox checked, stats update
- Delete task → confirmation shown, deleted on confirm
- Create project → appears in sidebar
- Delete project → all tasks also deleted, confirmation shown

### Manual Test Cases — Real-Time
- Open app in two tabs → create task in tab 1
- Task appears in tab 2 without refresh → ✅
- Open app on two devices → complete task on device 1
- Task updates on device 2 without refresh → ✅

### Manual Test Cases — Search and Filter
- Search "thesis" → only tasks with "thesis" in title/desc/cat
- Filter status "done" → only completed tasks shown
- Combine search + filter → intersection result shown
- Clear search → all tasks return

### Manual Test Cases — Offline
- Load app → disconnect internet
- Offline banner appears → ✅
- Create task while offline → appears in list
- Reconnect → task synced to Firestore → ✅
- Task appears on second device after reconnect → ✅

### Manual Test Cases — Error Handling
- Disconnect before sign-in → connection error shown
- Search nonexistent city (N/A for this app)
- Delete task → cancel confirmation → task still exists
- Close add task modal without saving → no task created

### Responsive Testing Breakpoints
- 375px — smallest mobile
- 768px — tablet
- 1024px — desktop
- 1440px — wide desktop

---

## 19. DEPLOYMENT STRATEGY

### Platform: Vercel
- Free tier — sufficient for portfolio project
- Auto-deploys from GitHub main branch on every push
- Environment variables for Firebase config
- Custom domain optional

### Environment Variables in Vercel
```
FIREBASE_API_KEY
FIREBASE_AUTH_DOMAIN
FIREBASE_PROJECT_ID
FIREBASE_STORAGE_BUCKET
FIREBASE_MESSAGING_SENDER_ID
FIREBASE_APP_ID
FIREBASE_VAPID_KEY  ← for FCM push notifications
```

### Deployment Steps
1. Create Firebase project at console.firebase.google.com
2. Enable Google Sign-In under Authentication
3. Create Firestore database in production mode
4. Apply security rules from Section 9 of this plan
5. Enable Cloud Messaging — get VAPID key
6. Add Vercel domain to Firebase authorized domains
7. Connect GitHub repo to Vercel
8. Add Firebase config as Vercel environment variables
9. Deploy from main branch
10. Verify live URL loads and all features work
11. Add live URL to portfolio projects section
12. Update README with live URL and screenshot

### Firestore Indexes Required
Collection group query for dashboard requires a composite index:
```
Collection group: tasks
Fields: userId (Ascending), dueDate (Ascending)
```
Create in Firebase console → Firestore → Indexes → Composite.

### Post-Deployment
- Restrict Firebase API key to Vercel domain
- Test all features on live URL — not localhost
- Test push notifications on live URL (requires HTTPS)
- Test PWA install prompt on Chrome desktop and Android

---

## 20. DOCUMENTATION

### Files To Maintain
```
PLAN.md           ← this file — architecture and decisions
AGENTS.md         ← Codex global context — updated each session
DOCUMENTATION.md  ← full product documentation for portfolio
README.md         ← public-facing — setup, live URL, screenshot
```

### README Must Include
- App name and one-sentence description
- Live URL (Vercel link)
- Screenshot of dashboard
- Features list (short)
- Tech stack
- How to run locally — step by step
- Firebase setup instructions
- .env / config.js setup
- Known limitations

---

## 21. RISKS AND LIMITATIONS

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Firebase config committed to GitHub | Medium | High | config.js in .gitignore from day one |
| Firestore Spark plan limits exceeded | Very Low | Medium | Optimize listeners, use local cache |
| Collection group query needs Firestore index | High | Low | Create index in Firebase console before testing dashboard |
| Push notifications fail on iOS Safari | High | Low | Document limitation — browser push not fully supported |
| Offline banner stays visible incorrectly | Medium | Low | Test network listener on multiple browsers |
| Listener memory leak on sign-out | Medium | Medium | Always detach via stored references on sign-out |
| textContent missed, innerHTML used | Medium | High | skill-review checklist enforces this every session |
| FCM VAPID key not set up | Medium | Medium | Document FCM setup steps clearly in README |
| Cross-project dashboard query too slow | Low | Medium | Add Firestore composite index before dashboard session |
| User deletes project with many tasks | Low | Low | Batch delete tasks before deleting project document |

---

## 22. FUTURE IMPROVEMENTS

### Version 2 — Near Term (Post-MVP)
- Dark mode — full CSS variable swap, toggle in settings
- Native mobile app — React Native, same Firebase backend
- Custom reminder times per task — "remind me 1 hour before"
- Drag and drop task reordering within a project
- Subtasks — nested task items within a parent task
- Scheduled daily push notifications — 8AM reminder
  (requires Firebase Blaze plan upgrade)

### Long Term
- Analytics dashboard — completion rate, productivity trends
- AI-powered task suggestions based on past patterns
- Recurring tasks — daily, weekly, monthly
- Team collaboration — shared workspaces (major architecture change)
- Calendar view — monthly and weekly task layout

---

## 23. PRE-DEVELOPMENT CHECKLIST

Before writing AGENTS.md or any skill file, confirm:

- [ ] Firebase project created at console.firebase.google.com
- [ ] Google Sign-In enabled under Authentication
- [ ] Firestore database created in production mode
- [ ] Security rules applied (Section 9 of this plan)
- [ ] Cloud Messaging enabled — VAPID key saved
- [ ] GitHub repo created: github.com/LunaCedrick/Taskly
- [ ] Local folder structure created
- [ ] config.js added to .gitignore before first commit
- [ ] config.example.js created and committed
- [ ] Vercel account connected to GitHub repo
- [ ] Firestore composite index created for dashboard queries
- [ ] This PLAN.md reviewed and understood completely
- [ ] AGENTS.md written and reviewed
- [ ] All 17 skill files written
- [ ] Visual mockup referenced for design system verification

---

## ARCHITECTURE DECISION LOG

| # | Decision | Reasoning |
|---|---|---|
| 1 | Vanilla JS only | Proves fundamentals; React comes in Project 5 |
| 2 | Firebase Spark plan | Free; supports all MVP features |
| 3 | Google Sign-In only | Simplest auth; no password management |
| 4 | Dashboard-first UX | Users ask "what today?" not "which project?" |
| 5 | Offline support in MVP | Firebase makes it one line; critical for students |
| 6 | No 8AM push in MVP | Cloud Functions require Blaze plan |
| 7 | Collection group for dashboard | Only way to query cross-project tasks |
| 8 | userId field on tasks | Required for collection group security |
| 9 | textContent everywhere | XSS prevention — non-negotiable |
| 10 | DM Sans font | Clean numerals for stats; friendly but professional |
| 11 | One listener per collection | Firestore optimization for Spark plan limits |
| 12 | Store listener refs in state | Enables clean detach on sign-out |
| 13 | Confirmation on all destructive actions | Data loss protection |
| 14 | Search debounce 150ms | Performance — avoids filter on every keystroke |
| 15 | Skeleton cards over spinners | Perceived performance — user sees layout form |
| 16 | 17 skill files | Each technical concern isolated for focused Codex sessions |
| 17 | Claude plans, Codex builds | Best tools for each job; mirrors industry AI workflow |
| 18 | Firebase compat SDK pinned to 12.4.0 | Aligns runtime scripts with the auth session requirement |
| 19 | Firebase SDK scripts load in head | Ensures Firebase globals exist before `js/config.js` and app modules run |
| 20 | Firebase Auth instance named firebaseAuth | Avoids shadowing the custom `window.auth` module |
