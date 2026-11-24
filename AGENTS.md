# Project architecture

MARKET ANALYZER PRO is a React/Vite single-page analytics frontend and Express Netlify Server backend. Static output is `dist`; `netlify/server/index.mjs` handles only `/api/*`. Node 24+ is required. Do not add a catch-all rewrite that shadows server routes.

- `src/main.jsx`: dashboard, navigation, SVG chart, scanner table, tick history, export, methodology, and account UI.
- `src/useMarkets.js`: public Deriv WebSocket lifecycle, catalog discovery, history ingestion, live subscriptions, bounded data and reconnect backoff.
- `src/analytics.js`: descriptive statistics and Wilson intervals. Preserve explicit denominators and quote precision.
- `src/styles.css`: charcoal/lime design system and responsive Android layout.
- `netlify/server/index.mjs`: PKCE start/callback, session status and CSRF-protected local logout. No trading endpoints.
- `netlify.toml`: static publish settings, server route and security headers.

Use functional React components and native SVG charts. Never show invented prices or predictions, never automatically execute trades, and never expose OAuth tokens to JavaScript, URLs, logs or exports. Public market App ID is intentionally public; OAuth client configuration and SESSION_SECRET stay server-side. Session cookies are AES-256-GCM encrypted and HttpOnly/Secure; no process-memory session store is used. UI sample confidence describes only sample size; outcome risk stays high. Tick state is transient and is not persistent user storage. If adding saved records later, use Netlify Database.

Use separate matching callback configuration for preview/custom domains. Keep third-party requests restricted to documented Deriv endpoints. Do not add Netlify Identity: the external Deriv authorization grant does not create a separate application login. No refresh tokens are assumed. Check Deriv's current OAuth documentation before changing scopes or endpoints.

The deployment pipeline runs the build. Avoid generating build artifacts or running local build/start/test commands during automated edits. Review edited source directly and document any unverified live integration.
