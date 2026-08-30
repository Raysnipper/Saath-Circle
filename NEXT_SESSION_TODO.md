# Next Session Todo (Saath Circle)

## ✅ Accomplished in This Session
- **Indian Number Formatting & Conditional Decimals:**
  - Standardized currency formatting across the app via `src/lib/money.ts` using `en-IN` locale (`₹10,90,000`, `₹0`).
  - Conditional decimals: whole rupee numbers display cleanly without decimals, displaying decimals only when fractions (paise/cents) exist.
  - Synchronized across dashboard cards, repayment dialog, timeline details, and outgoing email templates.
- **Zero Mobile Overflow on Metric Cards:**
  - Updated "The Mutual Standing", "Support Sent", and "Support Received" cards with responsive typography (`min-w-0`, `truncate`, `max-w-full`) to guarantee zero text overflow on narrow mobile screens.
- **Inline Mobile Search Bar:**
  - Styled the search bar and "SEARCH" button to sit snugly side-by-side on the exact same row on mobile devices (`flex-nowrap`, `flex-1 min-w-0`).
- **Collapsible Compact Cards (~75px):**
  - Eliminated endless mobile scrolling by making bond cards compact by default (~75px height, showing 5–6 records per screen).
  - Implemented smooth tap-to-expand animation (`framer-motion`) revealing timeline dates, financial breakdown progress bar, nudge button, and action controls.
- **"By Circle" (People Grouped View):**
  - Built a segmented view switcher (`Records` vs `By Circle`).
  - Implemented `PersonCircleCard` grouping shared bonds by contact, displaying total net balance (`+₹40,000 Owes You` / `-₹10,000 You Owe` / `₹0 Settled`), aggregate extended/received metrics, and nested expandable bond history.
- **Production Git & Data Safety:**
  - Resolved `git push` rejection cleanly by rebasing on `origin/main` without losing any live production features or database records.

---

## ⏳ Prioritized Backlog for Next Session
1. **WhatsApp / Text Shareable Summary:**
   - Add a "Share to WhatsApp" / "Copy Summary" button on active and settled bonds to generate a friendly summary text snippet for messaging.
2. **Repayment Notes & UTR / Transaction Reference:**
   - Allow an optional note/reference field (e.g. *"GPay Ref: 4829..."*, *"Rent split"*) when submitting a repayment.
3. **Download Settlement Receipt (PDF/CSV):**
   - Provide a downloadable, branded PDF or CSV settlement receipt when a bond completes.
4. **Relationship Summary Aura / Circle Visualizer:**
   - Ambient glowing ring in the dashboard stats section that gently shifts tone (Sage Green to Warm Terracotta) based on net balance.
5. **Contact Us / About Page:**
   - Create a clean, warm "Contact Us" page for user feedback and support.

---

## 💡 Important Context
- All changes were achieved on the frontend / calculation layer with **zero database schema modifications**, keeping live Neon database data 100% safe.
- Repository is clean and synced with `origin/main`. Run `git push` to deploy local commits to Vercel production.

