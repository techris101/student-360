# Student 360 — Product Spec (V1)

## One line
Every opportunity open to Rwandan university students, checked against your profile, with an advisor that tells you the truth about your chances of being eligible and what to fix.

## Who it is for
University students in Rwanda only: University of Rwanda (all colleges and campuses), UGHE, AUCA, Mount Kigali University, ALU Rwanda, INES-Ruhengeri, Kibogora Polytechnic, UNILAK, ULK, Carnegie Mellon University Africa, Kepler, PIASS, Catholic University of Rwanda, University of Kigali, Rwanda Polytechnic colleges, and others (free-text "Other").
Most use Android phones on mobile data. Design mobile-first, light pages, fast on 3G.

## Product principles
1. **Truth over hype.** We never show numbers we cannot back. Unknown is shown as unknown.
2. **Official sources only.** Every opportunity links to the organisation's own page.
3. **Relevance first.** A student should see what they can actually apply for, ranked by fit and deadline.
4. **Calm and serious.** This is a career tool. It should feel like a good university careers office.
5. **Private by default.** A CV is sensitive. We collect the minimum and explain why.

## Navigation
Mobile: bottom tab bar with five tabs. Desktop: left sidebar with the same five.
1. **Opportunities** (home when signed in)
2. **Advisor**
3. **Cohorts**
4. **News**
5. **Progress**
Profile and Settings open from the avatar menu.

(The owner first placed the tracker in Settings. It is a primary tab instead: it is the thing that brings users back. See D7.)

---

## F0 — Accounts and onboarding
- Sign in with Google or an email magic link.
- Onboarding, three short steps, skippable after step 1:
  1. **Studies:** university, college/school, programme, level (diploma, bachelor, master), year of study, expected graduation.
  2. **CV:** upload a PDF (max 5 MB). We extract text, the model proposes profile fields, the student confirms or edits each one. Optional but encouraged.
  3. **Goals:** opportunity types wanted, fields of interest, goals (e.g. master's abroad, local job, start a business, research), preferred study destinations.
- Consent screen before storing a CV: what we store, why, how to delete it.
- Optional sensitive fields (gender, date of birth) each carry one line: "Some opportunities target women or have age limits. We only use this to check eligibility."
- **Profile strength**, shown as a plain sentence, never a badge: "Add your GPA to check 14 more requirements."

## F1 — Opportunities
### Types
Scholarship, fellowship, internship, course, competition, conference/symposium, grant, exchange programme, research programme.

### Feed
- List layout (rows, not cards). Each row: title, organisation, type, location or "Online", funding (full, partial, none, unknown), deadline, and eligibility status.
- Eligibility status per row: **Eligible**, **6 of 7 met**, **Not eligible** (hidden by default, toggle to show), or **Check requirements** when data is missing.
- Default sort: eligible first, then closest deadline. Other sorts: newest, deadline.
- Filters: type, field, funding, location (Rwanda, Africa, abroad, online), deadline window, "Plan ahead" only.
- Saved searches are out of scope for V1.
- Deadline urgency: amber under 7 days, red under 48 hours. Rolling deadlines say "Rolling".

### Opportunity detail
- Title, organisation, type, dates, location, funding, official link ("Apply on the official site").
- **Short summary** written by us (max 80 words) and **key facts** list. Never the full original text.
- **Requirement check** — the centrepiece of the product. Every requirement is one line with a state:
  - Met (teal)
  - Not met (red) with what would change it, if anything can
  - Unknown (grey) with what profile field would resolve it, or "Check on the official page"
  Header line: "You meet 6 of 7 requirements."
- **Status control:** Save, Applying, Submitted, Interview, Accepted, Rejected, Withdrawn.
- "Last checked on [date]" and the source name.
- Link to the cohort for this opportunity (F3) once the student marks Applying.

### Plan ahead (future scholarships)
- A filter and a section for master's and PhD scholarships that undergraduates should prepare for now (e.g. Chevening, Mastercard Foundation Scholars, DAAD, Commonwealth, Erasmus Mundus, MEXT, Fulbright).
- Each has a "Start now" list derived from its real requirements: GPA threshold, language tests, work experience, leadership evidence, references, and when the cycle usually opens (only if the official page states it).
- These pages are generated from fetched official pages and show "Last verified" dates. Never written from model memory.

### What we deliberately do not show
**No success rate or acceptance probability.** The data (applicant pools, admitted profiles) is not published by most programmes, so any percentage would be invented. We show eligibility matching. Once students report outcomes on Student 360, we will have real data for V2 (e.g. "12 Student 360 users applied last cycle, 3 were accepted").

## F2 — Advisor (AI)
- A chat for career and study questions. It knows the student's profile, applications, and the opportunities in our database.
- It can: recommend which opportunities to prioritise and why, explain requirements, flag weak spots in a profile, help structure a motivation letter or CV section (guidance and critique, not ghost-writing whole essays), plan a timeline to a deadline, and answer student-life questions linked to career (time management, study habits, balancing placements and applications).
- It must not: invent opportunities or deadlines, give acceptance percentages, act as a therapist, give medical, legal, or financial-investment advice.
- Free for students. Runs on our API key with a cheap model and a daily cap per user (default 30 messages). The remaining count is visible: "18 messages left today."
- Full behaviour and prompt: `docs/AI_ADVISOR.md`.

## F3 — Cohorts
- When a student marks an opportunity **Applying** or **Submitted**, they join that opportunity's cohort automatically (they can leave).
- A cohort is a group chat for everyone on Student 360 applying to the same opportunity.
- The chat opens once a cohort has two or more members. Before that: "You're the first here. We'll notify you when others join."
- Members see each other's first name, university, and programme only. No emails, no phone numbers, no DMs in V1.
- Text only, max 1,000 characters per message, 10 messages per minute per user.
- First join shows short community rules; the student accepts once.
- Report a message, block a user, leave a cohort. Three reports on a message hide it pending admin review.
- Cohorts close for posting 30 days after the opportunity's deadline and stay readable.

## F4 — News
- A separate tab. Headlines relevant to university students in Rwanda: university announcements, higher-education policy and reforms (HEC, MINEDUC), student loans and bursaries, graduate employment, and major education news in Rwanda.
- Each item: headline, source, date, our summary (max 50 words), link to the original.
- Categories: Universities, Policy, Funding, Careers.
- Only items from the last 30 days in the main list.

## F5 — Progress
- Counts: saved, applied, interviews, accepted, rejected.
- Applications grouped by status (board on desktop, grouped list on mobile). Status changes are one tap.
- Upcoming deadlines for saved and applying items.
- **Advisor review:** a button generates an honest review of the student's activity and next steps. Available once every 7 days. Stored with its date.
- Outcomes (accepted, rejected) feed the V2 outcome data. We ask one optional question on outcome: "Did you get an interview?"

## F6 — Notifications
- In-app notifications: new eligible opportunities (batched, max once a day), deadline reminders (7 days and 1 day before, for Saved and Applying), cohort activity (batched).
- Email (only if Resend is configured and the student opts in): deadline reminders and a weekly Monday digest.

## F7 — Admin (owner only, emails in `ADMIN_EMAILS`)
- Review queue for low-confidence opportunities and news: approve, edit, reject.
- Sources: list, enable/disable, last run, failure count.
- Moderation: reported messages, hide/restore, suspend a user.
- Pipeline runs log.
- Basic counts: users, active users (7 days), applications by status.

## Voice and copy
Plain English, sentence case, short sentences, no exclamation marks. Buttons say what happens ("Save opportunity", "Mark as submitted"). Errors say what went wrong and how to fix it. Empty screens tell the student what to do next.
V1 is English only.

## Out of scope for V1
Mobile apps, payments, direct messages, image or file sharing in chat, recruiter accounts, saved searches, Kinyarwanda/French UI, success-rate statistics, social feed or likes.
