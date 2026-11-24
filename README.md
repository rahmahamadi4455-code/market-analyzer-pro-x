# MARKET ANALYZER PRO

A responsive, analysis-only dashboard for Deriv synthetic markets. Uses real public WebSocket tick history and subscriptions, without login or simulated market data. Includes four contract analysis modes, automatic scanning, rolling 50–1,000 tick windows, historical frequencies with Wilson intervals, digit distributions, price charts, tick history, and CSV export.

## Technology and local development

React 19, Vite, native SVG charts, Lucide icons, and an Express backend on Netlify Server. Node 24+ is required. Install with `npm install`, then run `netlify dev --port 8889`. Use HTTPS for OAuth because session cookies are Secure. The Netlify build command is `npm run build` and the publish directory is `dist`.

## Deriv configuration

Public analysis uses Deriv's public WebSocket endpoint with the demonstration public App ID 1089. Register your own public API application with Deriv and set `DERIV_PUBLIC_APP_ID` for production ownership and limits. This ID is public and intentionally returned to the browser.

For optional account connection, register an OAuth 2.0 client at Deriv using the authorization code flow with PKCE. A legacy WebSocket App ID is not necessarily an OAuth client ID. Register this exact redirect URL:

`https://market-analyzer-pro.netlify.app/api/auth/callback`

Configure the following server-only environment variables in Netlify:

- `DERIV_CLIENT_ID`: the registered OAuth client ID.
- `DERIV_REDIRECT_URI`: optional; defaults to the current Netlify deployment URL plus `/api/auth/callback`, falling back to the production callback above. Override for a custom domain. The origin must match the site initiating authorization.
- `SESSION_SECRET`: a cryptographically random secret of at least 32 characters, used to derive the AES-256-GCM session encryption key. Generate and configure it securely; never commit or expose it.

Redeploy after changing environment configuration. Preview deployments need their exact preview callback registered with Deriv (or a separate client configured for that context); do not redirect preview OAuth to production because its state cookie is scoped to a different host. Public analysis works without OAuth configuration. No Deriv password is requested or stored. Only `application_read` is requested; no trade or payment scopes are requested. OAuth access tokens remain inside encrypted Secure, HttpOnly, SameSite=Lax cookies with a maximum one-hour lifetime. Disconnect clears the local session; revoke the application grant from Deriv to revoke authorization at the provider. The app never calls a trade execution endpoint. Account authorization is a connection indicator; account balances and portfolio management are outside this project.

## Statistical interpretation

All estimates describe received historical observations. They are not calibrated forecasts. Even/Odd counts parity; Over/Under counts strict inequalities with the barrier digit in neither outcome; Matches/Differs reports Differs; Rise/Fall counts strict consecutive price movement with ties in neither outcome. Outcome frequencies use all observations (or all adjacent price pairs), including barrier hits and ties in the denominator. The stronger observed side is displayed except Differs, which is fixed by contract selection. The 95% Wilson interval assumes independent observations and is descriptive, especially because displayed tendencies are selected from the sample. Sample confidence labels describe sample size only; all outcome risk is high. Volatility is the population standard deviation of percentage tick returns, not annualized. Trend measures first-to-last change in the selected tick window.

The scanner subscribes to the selected market plus the first seven available synthetic markets returned in alphabetical order. Selecting another market adds it to the active scan. Pausing stops other subscriptions while keeping the selected market live. Previously observed rows can remain visible as historical observations. Tick history is transient in browser memory, capped at 1,000 ticks per observed symbol; this app does not promise saved history or saved preferences. The backend uses authenticated encrypted cookies rather than a server session store. No database is required.

The WebSocket feed reconnects with exponential backoff and resubscribes after disconnection. Connection and delayed-feed states are visible; failures do not generate substitute data. Digit extraction respects the quote's pip precision, including trailing zeroes. CSV downloads contain actual sampled ticks in UTC.

## Verification

Source files were reviewed for routing, precision handling, statistical denominators, responsive layout, and cookie protection. Build and runtime validation are performed by the deployment pipeline. Live connectivity and a complete OAuth round trip require Deriv access and a registered client.


## Private password access

The dashboard includes a server-verified password screen. Before deploying to Netlify, set these environment variables in **Site configuration → Environment variables**:

- `APP_PASSWORD`: choose the private access password for the dashboard.
- `SESSION_SECRET`: a random secret with at least 32 characters. Keep it private.

The password is checked by the Netlify server function and is not embedded in the browser JavaScript. Do not commit `.env` files or share these values. Existing optional Deriv OAuth also uses `DERIV_CLIENT_ID`, `DERIV_REDIRECT_URI`, and `DERIV_PUBLIC_APP_ID` as described below.
