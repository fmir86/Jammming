# Jammming

A React app that searches the Spotify catalog and saves a custom playlist to your Spotify account. Originally built as a Codecademy project with Create React App.

## Requirements

- Node.js 20 or newer (tested with Node 20) and npm
- A Spotify account and a Spotify app (free to create) for its Client ID

## Spotify setup

1. Go to the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard) and create an app. Select "Web API".
2. Add this Redirect URI to the app: `http://127.0.0.1:3000/`
   Spotify no longer accepts `localhost` in redirect URIs, so use `127.0.0.1`.
3. Copy the app's Client ID.
4. In the project folder, copy `.env.example` to `.env` and set:

   ```
   REACT_APP_SPOTIFY_CLIENT_ID=your-client-id
   REACT_APP_SPOTIFY_REDIRECT_URI=http://127.0.0.1:3000/
   ```

No client secret is needed. The app signs in with the Authorization Code flow with PKCE, which runs entirely in the browser. Apps in Spotify's development mode only work for the app owner and users added under "User Management" in the dashboard.

Without a Client ID the app still starts and renders, and shows a banner saying Spotify is not configured. Search and save do nothing in that case.

## Install

```
npm install
```

## Run

```
npm start
```

Then open http://127.0.0.1:3000 (not `localhost`, so the address matches the redirect URI). Typing in the search box sends you to Spotify to log in the first time, then back to the app. Search again after logging in.

## Build

```
npm run build
```

The production bundle is written to `build/`. To serve it locally: `npx serve -s build`. When you deploy it, register the deployed URL (with a trailing `/`) as a Redirect URI and set `REACT_APP_SPOTIFY_REDIRECT_URI` to it at build time.

## Test

```
npm test
```

Runs a smoke test that renders the app. Use `CI=true npm test` to run it once without watch mode.
