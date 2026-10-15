# SCREENS.md: screen reference

Design canvas: https://claude.ai/artifact/PP55jo2pbr3tPSzjh16dSB (frame names below match the canvas).
Exported images live in `docs/design/` (see its README). Tokens and component rules: `docs/DESIGN.md`.
Text here wins when an image is ambiguous. Build every screen at 1280 px and 390 px wide.
Build only what is described here and in `docs/PLAN.md` sections 3 and 4. Build a component only when a screen uses it.

## Routes
`/sign-in`, `/` (dashboard), `/tasks` (My Tasks), `/projects/:id`. Dialogs, popovers, sheets, the alerts panel, and the drawer are overlays, not routes.

## Screen index
| Screen | Route | Canvas frames | Gate |
|---|---|---|---|
| Sign in | /sign-in | Sign in | G1 |
| Dashboard | / | Dashboard, Dashboard on phone | G0 shell, G4 content |
| Project view | /projects/:id | Project view, Project view on phone | G2 list, G3 actions, G5 filters |
| My Tasks | /tasks | My Tasks with search and filter | G2 list, G5 search and filters |
| Task form | overlay | Task form (edit), Task form on phone (bottom sheet) | G3 |
| Dialogs | overlay | Dialogs: project name and confirmations | G3 |
| Quick Add | overlay | Quick add (desktop), Quick add on phone | G3 |
| Pickers and menus | overlay | Pickers and menus | G3 |
| Toasts | overlay | Toasts and feedback | G3 |
| Alerts panel | overlay | Alerts panel | G5 |
| Menu drawer | overlay (phone) | Menu drawer on phone | G0 |
| Search and filters (phone) | overlay (phone) | Search and filters on phone, Filter sheet on phone | G5 |
| States | inside screens | States: loading, empty, error, alerts; States: session check and not found | G1, G2, G5, G6 |
| Components and states | reference | Components and states | from G0 |

## Behavior

### Sign in
Two columns on desktop (form left, three value points on sand at right). Phone: form only. One action, "Continue with Google". Errors appear above the button in a `role="alert"` box. Signed-in users never see this route. The session check screen shows while the auth state resolves.

### Dashboard
Topbar: date line, "Dashboard", search, bell with count, "Add task" (opens the full form). Overdue banner (dismissible, `role="status"`) when the overdue count is above zero. Four stat cards. Sections Overdue, Today, Upcoming, each a list card with a count pill. Right column: Recent activity (4 shown, 20 kept). Checking a task completes it in place. Phone: stat cards in two columns, bottom tab bar.

### Project view
Header: name, progress bar and percent, edit and delete project. Status segmented control with counts, Priority and Category filters, Sort menu (due date, priority, newest). Rows: status pill, project chip, due pill, priority. Hovered row reveals edit and delete. Last row: "Add a task to {project}". Overdue rows use the tinted color. Phone: status chips scroll horizontally, the status moves into the meta line.

### My Tasks
All projects in one list with the same filters, plus a Project filter. Search matches title, description, category; matched text in the title is highlighted. Active filters show as removable chips with "Clear filters" and a result count. Phone: search icon opens a full-width search bar with a filter button and count; the filter sheet has Status, Priority, Project, Category, Sort by, "Clear all", and "Show N results".

### Quick Add
A round floating button (56 px, bottom-right on desktop and phone) is on every screen. It opens a popover (desktop) or a sheet above the keyboard (phone) with one title field and optional chips: Due, Project, Priority. Enter adds, Escape closes. Defaults: due none, priority none, project is the current project, otherwise the last used one. If there are no projects, open the New project dialog first. After adding: the task appears at once, a toast says "Task added to {project}", the field clears and stays focused. "More options" opens the full form with the title kept. Lists keep bottom padding so the button never covers a row. The topbar "Add task" button opens the full form.

### Task form
Fields: Title (required), Description, Due date with optional time, Project, Priority (None, Low, Medium, High), Category (free text with suggestions), Status (To do, In progress, Done). Add mode: "Add task", empty, project preselected from the current project. Edit mode: "Edit task" with "Delete task" at the left of the footer. Errors appear under the field in brick red. Desktop: centered modal 560 px. Phone: bottom sheet. Focus is trapped, Escape closes, focus returns to the trigger.
Due date: quick chips (Today, Tomorrow, Next week, No date) plus the browser's native date input and an optional native time input, styled with tokens. The custom calendar in the Pickers frame is a later visual target, not v0.1. No time means due at the end of that day.

### Dialogs
New project and Rename project share one dialog (duplicate or empty names show an error). Delete task and Delete project use a confirmation with a tinted icon, the item name, and the number of tasks affected. The destructive button is brick red. Project colors are assigned automatically in the order of the palette in `docs/DESIGN.md`.

### Alerts panel
Opens from the bell. Groups: Overdue, Due today. Each item shows title, project, and when. "Dismiss all". Footer note: alerts update while the app is open. Empty state: "You are all caught up".

### Toasts
Added, Deleted, Save failed. Desktop bottom-left, phone above the tab bar and the floating button. One at a time, up to 3 queued, gone after 5 s, paused on hover and focus. `role="status"`; errors use `role="alert"` and stay until dismissed. No Undo in v0.1.

### Menu drawer (phone)
Left drawer 300 px: logo, Dashboard, My Tasks, projects with progress bars, New project, user and Sign out. The scrim closes it.

### States
Loading skeleton rows (never a spinner alone). First run: "Nothing here yet" with "Create your first project". Empty project: "No tasks in {project}" with "Add a task". No results: "No tasks match “{query}”" with "Clear filters". Load error: message and "Try again". Alerts all clear. Sign-in error. Session check at app start. Project not found with "Back to dashboard".

### Formatting rules
Dates: "Today, 5:00 PM", "Yesterday", "2 days overdue", "Fri, Oct 16". Long titles: one line with an ellipsis in rows, two lines on phone, full text in the form. No priority: the label is hidden. Completed tasks: struck through and faded, kept at the bottom of the project view. Browser tab titles: "Dashboard | Taskly", "{project} | Taskly".

## Not designed (derive from the nearest frame and say so in your report)
Phone sign-in, phone My Tasks, phone alerts sheet, rename project, hover and focus beyond `docs/DESIGN.md`, settings (release 0.2), dark mode, offline banner (release 0.2).
