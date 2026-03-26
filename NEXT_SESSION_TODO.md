# Next Session Todo

## Current Status (V1 Shipped & Polished)
- **Successfully deployed the V1 production app to Vercel!**
- Connected to live production Neon database and pushed Prisma schema.
- **UI & UX Polish Completed Today:**
  - Upgraded the unauthenticated landing page to modern 2026 design standards.
  - Implemented dynamic entrance and breathing glow animations using `framer-motion`.
  - Removed redundant "SAATH CIRCLE" branding and recentered landing page items.
  - Fixed the dashboard search bar width so it perfectly left-aligns with the filter pills on desktop.
- **Email Refinements:**
  - Standardized the app name to "Saath Circle" across all email templates and subjects.
  - Added a helper function to automatically Title Case names (e.g., "Dilip Mistry") in all outgoing emails.
- **Smoke Testing:**
  - Successfully ran full production smoke tests.
  - Cleaned up dummy testing data directly via the live Neon SQL Editor.

## Highest Priority Next
- Continue monitoring the V1 production release!
- Make any necessary hotfixes or layout tweaks based on initial live usage.
- The app is currently fully functional for users to create, acknowledge, and settle shared balances.

## Nice To Revisit After V1 (Fast Follows)
- Filter chip counter styling polish.
- Subtle tinted summary cards.
- Stronger completed/archive dashboard treatment.
- In-app push notifications.
- Notification preferences toggle.
- Categories/notes on transactions.
- Export/shareable CSV summaries.

## Important Context
- Remember that `npx prisma studio` connects to whatever database is in your local `.env`. 
- To delete records or manipulate live data safely, either use `npx prisma studio` pointed at the production variable, or run direct queries in the Neon Tech SQL Editor.

## Retrieval
- Reopen this file next session:
  - `NEXT_SESSION_TODO.md`
- Or simply ask:
  - `What should we work on next?`
