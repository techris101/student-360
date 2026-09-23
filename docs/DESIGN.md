# Student 360 — Design System

## Direction
A serious career tool for university students. The reference feeling is a well-run careers office and a good hospital chart: calm, dense with useful information, nothing decorative. It must look like something a scholarship officer would respect.
Colour carries meaning, never decoration: **teal = met / primary action**, **amber = act soon / partial**, **red = urgent / not met**, grey = unknown or secondary.
Spend boldness in one place: the **requirement check** on the opportunity page. Everything else stays quiet.

## Colour tokens
Define as CSS variables on `:root` and `.dark`, mapped into Tailwind. No other colours in the codebase.

| Token | Light | Dark | Use |
|---|---|---|---|
| `--bg` | #F6F6F4 | #17191C | Page background |
| `--surface` | #FFFFFF | #1F2226 | Panels, lists, inputs |
| `--surface-2` | #F0EFEA | #262A2F | Hover rows, table stripes, selected nav |
| `--ink` | #1A1A1A | #ECEAE4 | Primary text |
| `--ink-2` | #4E4D49 | #B9B6AE | Secondary text |
| `--muted` | #8A8880 | #8E8B84 | Metadata, placeholders |
| `--line` | #E2E0D8 | #33373D | Borders, dividers |
| `--line-strong` | #D3D1C7 | #444950 | Input borders, table headers |
| `--teal` | #0F6E56 | #4DB594 | Primary buttons, links, met state, focus ring |
| `--teal-subtle` | #E1F5EE | #16352C | Met background, selected chip |
| `--amber` | #7A4A0A | #E0A95A | Deadline soon, partial |
| `--amber-subtle` | #FAEEDA | #3A2C16 | Amber background |
| `--red` | #A32D2D | #E27272 | Urgent, not met, destructive |
| `--red-subtle` | #FCEBEB | #3B1D1D | Red background |

Contrast: all text pairs meet WCAG AA. Check `--muted` on `--bg`; use it only for text 13px+ that is not essential.

## Typography
One family: **IBM Plex Sans** via `next/font/google` (weights 400, 500, 600). Enable tabular numerals for dates, counts, deadlines (`font-variant-numeric: tabular-nums`).
Fallback: `system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`.

| Role | Size / line height | Weight |
|---|---|---|
| Display (landing headline only) | 36/44 mobile, 48/56 desktop | 600 |
| Page title | 24/32 | 600 |
| Section title | 18/26 | 600 |
| Row title | 16/24 | 500 |
| Body | 16/26 | 400 |
| Small / metadata | 14/20 | 400 |
| Micro (chips, table heads) | 13/18 | 500 |

Rules: sentence case everywhere. No all-caps labels. No italics for emphasis. Bold only for the key phrase, never whole sentences. Body line length under 72 characters.

## Space, shape, depth
- Spacing scale (px): 4, 8, 12, 16, 24, 32, 48, 64. Page gutters 16 mobile, 32 desktop.
- Radius: 6px inputs and buttons, 8px panels and dialogs, 4px status chips. Nothing rounder. No pills except the avatar.
- Borders do the structural work: 1px `--line`.
- Shadows: none on panels or rows. One subtle shadow only for floating layers (menus, popovers, dialogs, toasts).
- Motion: 150 ms ease-out for state changes a user triggered (expand, open, status change). No entrance animations, no scroll effects, no hover lifts. Respect `prefers-reduced-motion`.

## Layout
### App shell
```
Desktop (≥1024px)
┌──────────┬───────────────────────────────┬──────────────┐
│ Sidebar  │ Main column (max 760px)       │ Right rail   │
│ 232px    │                               │ 300px        │
│ logo     │ Page title + filters          │ Due this week│
│ nav x5   │ List                          │ Profile gaps │
│          │                               │              │
│ avatar   │                               │              │
└──────────┴───────────────────────────────┴──────────────┘
Tablet: sidebar collapses to icons, no right rail.
Mobile (<768px): top bar (title, notifications, avatar), content, bottom tab bar (5 tabs, 56px, labels always visible).
```
Everything left-aligned. Centre alignment only on empty states and the sign-in screen.

### Opportunity row (the feed is a list, not a card grid)
```
┌──────────────────────────────────────────────────────────────┐
│ Mastercard Foundation Scholars Program            Closes     │
│ University of Edinburgh                           14 Oct     │
│ [Scholarship] [Full funding] Abroad               21 days    │
│ ✓ Eligible                                                   │
└──────────────────────────────────────────────────────────────┘
```
Rows separated by 1px lines, 16px vertical padding, whole row is the link, `--surface-2` on hover. Deadline column right-aligned with tabular numerals; "21 days" turns amber under 7 days, red under 48 hours. Metadata uses chips or separate words, never "A · B · C" strings.

### Opportunity detail
```
Title (24/600)
Organisation, type, location
[Apply on the official site]   [Status: Save ▾]
─────────────────────────────────────────────
Requirement check                     ← the one bold element
You meet 6 of 7 requirements.
 ✓ Open to Rwandan nationals
 ✓ Bachelor's students in year 2 or above
 ✓ Field: Health sciences
 ✗ Minimum GPA 3.5/4.0 — yours is 3.2/4.0
 ? IELTS 6.5 — add your English test to check
 ? "Demonstrated leadership" — check on the official page
─────────────────────────────────────────────
Summary (max 80 words)
Key facts (definition list: Deadline, Funding, Duration, Location, Starts)
Last checked 3 Oct from Imbuto Foundation
Cohort: 14 students applying — [Open cohort]
```
Requirement check styling: a panel with a 3px left border in `--teal` (or `--amber` if any not met, `--red` if hard fail). Each line: 20px state icon (check, x, question mark in lucide) coloured by state, label in `--ink`, fix hint in `--ink-2` on the same or next line. This panel is the signature of the product; make it precise and beautiful through spacing and type, not decoration.

### Advisor
Standard chat layout. Assistant messages are plain text on the page background (no bubble). User messages in a `--surface-2` block aligned right, max 80% width. Opportunity references render as compact inline rows linking to the detail page. Messages-left counter under the input in `--muted`.

### Cohorts
List of cohorts with opportunity title, member count, last message time, unread count. Chat: messages grouped by author, first name + university in `--ink-2` 14px, timestamps on hover (desktop) or tap (mobile). Report and block in a message menu.

### News
Single column list: headline (16/500), source and date (14 `--ink-2`), summary (15 `--ink-2`, max 3 lines). Category filter as a segmented control.

### Progress
Top: five numbers in a single row (tabular, 28/600) with labels under them, no boxes around each. Then applications by status (desktop: columns; mobile: grouped list with section headers). Then upcoming deadlines. Then the latest advisor review as plain text with its date and a "Get a new review" button (disabled with the next available date when inside 7 days).

### Landing page (signed out)
Opens with the most characteristic thing in this world: real opportunities. Headline (36/48, 600): "Every opportunity open to Rwandan university students, checked against your profile." One line of supporting text. One primary button "Create your profile". Below: a live list of 5 real published opportunities with deadlines, rendered in the same row component as the app. Then three short plain sections: how matching works (the requirement check shown as a real example), the advisor, cohorts. Footer with privacy, terms, contact. No hero image, no testimonials, no logos wall, no stats band.

## Components (restyle shadcn/ui to these)
- **Button:** primary (`--teal` fill, white text), secondary (`--surface` with `--line-strong` border), ghost, destructive (`--red`). Height 40px (44px on touch). Label says the action. No arrows or emoji in labels.
- **Input/Select/Textarea:** 40px, `--line-strong` border, 2px `--teal` focus ring with 2px offset. Label above, help text below in `--ink-2`, error text in `--red` with an icon.
- **Chip:** 13px/500, 4px radius, 2px 8px padding, `--surface-2` background; status variants use subtle backgrounds with matching text colour.
- **Tabs/segmented control:** underline style for page tabs; segmented control with `--surface-2` track for filters.
- **Dialog/Sheet:** sheets from bottom on mobile, dialogs on desktop.
- **Toast:** bottom-centre mobile, bottom-right desktop, text states the result ("Marked as submitted").
- **Empty state:** one sentence of what this is, one action. No illustration.
- **Skeletons:** match final layout geometry, `--surface-2`, no shimmer.
- **Icons:** lucide, 1.5 stroke, 16px inline, 20px in nav. Never decorative.

## Logo
Wordmark only: "Student 360" in IBM Plex Sans 600, `--ink`, with "360" in `--teal`. No symbol in V1. Favicon: "S" in white on a `--teal` 6px-radius square.

## Copy rules
- Sentence case. Plain verbs. No exclamation marks.
- Banned words: unlock, empower, elevate, journey, supercharge, seamless, revolutionise, dream, game-changer.
- Buttons name the result: "Save opportunity", "Mark as submitted", "Leave cohort".
- An action keeps its name through the flow: "Submit" button → "Submitted" toast.
- Errors: what happened + how to fix. Never "Oops" or "Something went wrong" alone.
- Dates: "14 Oct 2026". Relative only for under 7 days ("in 3 days").

## Banned
Gradients of any kind. Purple, pink, violet, magenta, neon. Glassmorphism, blur backgrounds. Emoji in UI. Illustrations, blobs, 3D art, stock photos. Card grids with shadows for lists. Hover lift or scale effects. Entrance animations. ALL-CAPS eyebrow labels. Arrows appended to link or button text. "A · B · C" meta strings. Numbered markers (01, 02) unless the content is a real sequence. Monospace for data labels. Animated counters. Confetti. Cartoon placeholder avatars (use initials on `--surface-2`). Lorem ipsum.

## Quality floor (check every page)
- 390px and 1280px, light and dark, screenshot reviewed.
- Keyboard: every control reachable, visible focus ring.
- Tap targets ≥ 44px on mobile.
- Colour is never the only signal: every state also has an icon or word.
- Works with 200% text zoom without horizontal scroll.
- Before marking a page done, ask: "Could this screen appear in a generic AI template?" If yes, remove something.
