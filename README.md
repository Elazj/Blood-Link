# BloodLink Gambia (React + Vite)

Hospital-to-volunteer blood donor coordination. Volunteers sign up (valid email code, 9-digit phone, optional live location),
hospital staff create blood requests, see ranked donors, tick volunteers and notify them, schedule and record donations, and track inventory.

## Stack
React 19, Vite, React Router 7, plain JavaScript, Vitest (tests).

## Run it
Requires Node.js 20+ (https://nodejs.org).

    npm install
    npm run dev        # http://localhost:5173
    npm test           # runs the full workflow test
    npm run build      # production build in dist/
    npm run preview    # serve the production build locally

## Structure
    src/
      main.jsx, App.jsx        entry, routes, header, toast, splash
      pages/                   Auth (login, signup, verify), Hospital, Donor
      components/              Logo.jsx, Splash.jsx (welcome screen), ui.jsx
      lib/config.js            settings: phone prefixes, score weights, stock thresholds, hospitals, areas
      lib/matching.js          Haversine distance, donor-contact ranking, request status
      lib/store.js             state, persistence, all actions (replace deliver() with real email/SMS)
      lib/util.js              validation and formatting helpers
    tests/flow.test.js         end-to-end workflow test

## Important limits
- Data and accounts live in this browser only (localStorage). Nothing is shared across devices.
- Confirmation codes and SMS/email alerts are simulated (queued, and the code is shown on screen).
- Not ready for real patient or donor data. Real use needs a backend (database, real login, email/SMS provider,
  hospital approval) and a privacy and data-protection review.
- The match score prioritizes who to contact. It is not a medical eligibility score.
- Confirm the 9-digit phone rule and prefixes with the operators (`CARRIERS` in config.js).

## Branding
`public/` holds the logo (`logo.svg`, `logo-512.png`) and favicons. Edit the splash bottom text in `src/components/Splash.jsx`.
