# Next Session Todo (Saath Circle)

## ✅ Current Status & Achieved Today
- **Virtual Chai / Nudge Feature:**
  - Built full-stack Nudge functionality (API route, front-end Dialog).
  - Designed custom HTML email notification via Nodemailer and styled "Virtual Chai" theme.
  - Added `lastNudgedAt` to the `Loan` database schema to persist a 24-hour pulsing/glowing Chai icon state.
- **Dashboard Layout & Polish (2026 Theme):**
  - Updated terminology ("Start a Handshake", "Support Extended", "Support Received", "Your Active Bonds").
  - Restructured the Search Bar and Filter Tabs into a smart, responsive layout (perfect left-edge alignment to handle varying device sizes).
  - Refined hover states for "Sign Out" to exactly match the deep brown secondary buttons.
- **Infrastructure:**
  - Diagnosed and fixed the Vercel 500 server exception by adding `prisma db push` to the build script to easily automate schema changes on Neon.
  - Wiped dummy data in the live Neon DB to reset the app state.

## ⏳ Highest Priority Next / Open Items
1. **Relationship Summary - The "Circle Visualizer"**
   - *Requirement:* Implement a soft, glowing ring graphic in the dashboard stats section that shifts color (Sage Green to Terracotta) based on which way the support is flowing (Net Balance).
2. **Contact Us Page**
   - *Requirement:* Create a dummy "Contact Us" page that says Under Construction or something graceful.
3. **Production Validation**
   - Final end-to-end verification of the Nodemailer SMTP live in Vercel.

## Nice To Revisit After V1
- Notification preferences toggle.
- Categories/notes on transactions.
- Export/shareable CSV summaries.

## Important Context
- Remember that `npx prisma studio` connects to whatever database is in your local `.env`. 
- Vercel deployments will now automatically apply Prisma Schema changes during `npm run build`.
