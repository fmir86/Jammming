// Spotify Web API client.
//
// Auth uses the Authorization Code flow with PKCE, which runs entirely in the
// browser and needs no client secret. Spotify removed the Implicit Grant flow
// (response_type=token) that this project originally used.

const CLIENT_ID = process.env.REACT_APP_SPOTIFY_CLIENT_ID;
const REDIRECT_URI =
  process.env.REACT_APP_SPOTIFY_REDIRECT_URI || window.location.origin + '/';
const SCOPES = 'playlist-modify-public';
const VERIFIER_KEY = 'spotify_code_verifier';

let accessToken = null;
let tokenExpiresAt = 0;
let pendingExchange = null;

function randomString(length) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const values = window.crypto.getRandomValues(new Uint8Array(length));
  return Array.from(values, (v) => chars[v % chars.length]).join('');
}

async function codeChallengeFor(verifier) {
  const data = new TextEncoder().encode(verifier);
  const digest = await window.crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

async function redirectToAuthorize() {
  const verifier = randomString(64);
  window.sessionStorage.setItem(VERIFIER_KEY, verifier);
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: 'code',
    redirect_uri: REDIRECT_URI,
    scope: SCOPES,
    code_challenge_method: 'S256',
    code_challenge: await codeChallengeFor(verifier),
  });
  window.location.assign('https://accounts.spotify.com/authorize?' + params.toString());
}

async function exchangeCode(code) {
  const verifier = window.sessionStorage.getItem(VERIFIER_KEY);
  window.sessionStorage.removeItem(VERIFIER_KEY);
  // Drop ?code=... from the address bar so a reload does not reuse it.
  window.history.replaceState(null, '', window.location.pathname);

  if (!verifier) {
    console.error('Spotify login: missing PKCE verifier, please try again.');
    return null;
  }

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      grant_type: 'authorization_code',
      code,
      redirect_uri: REDIRECT_URI,
      code_verifier: verifier,
    }),
  });

  if (!response.ok) {
    console.error(`Spotify token exchange failed: ${response.status} ${response.statusText}`);
    return null;
  }

  const json = await response.json();
  accessToken = json.access_token;
  tokenExpiresAt = Date.now() + json.expires_in * 1000;
  return accessToken;
}

const Spotify = {

  isConfigured() {
    return Boolean(CLIENT_ID);
  },

  // Called once on app start so the ?code= returned by Spotify is exchanged
  // right away, before the user types anything.
  handleRedirect() {
    if (!this.isConfigured()) return Promise.resolve(null);
    const params = new URLSearchParams(window.location.search);
    if (params.get('error')) {
      console.error('Spotify login was cancelled or failed: ' + params.get('error'));
      window.history.replaceState(null, '', window.location.pathname);
      return Promise.resolve(null);
    }
    const code = params.get('code');
    if (code && !pendingExchange) {
      pendingExchange = exchangeCode(code).finally(() => { pendingExchange = null; });
    }
    return pendingExchange || Promise.resolve(accessToken);
  },

  async getAccessToken() {
    if (!this.isConfigured()) {
      console.warn('REACT_APP_SPOTIFY_CLIENT_ID is not set. See README.md.');
      return null;
    }
    if (accessToken && Date.now() < tokenExpiresAt) {
      return accessToken;
    }
    const token = await this.handleRedirect();
    if (token && Date.now() < tokenExpiresAt) {
      return token;
    }
    await redirectToAuthorize();
    return null;
  },

  async search(term) {
    if (!term) return [];
    const token = await this.getAccessToken();
    if (!token) return [];

    const response = await fetch(
      'https://api.spotify.com/v1/search?type=track&limit=10&q=' + encodeURIComponent(term),
      { headers: { Authorization: 'Bearer ' + token } }
    );
    if (!response.ok) {
      console.error(`Error searching tracks: ${response.status} ${response.statusText}`);
      return [];
    }
    const jsonResponse = await response.json();
    if (!jsonResponse.tracks) return [];
    return jsonResponse.tracks.items.map((track) => ({
      id: track.id,
      name: track.name,
      uri: track.uri,
      album: track.album.name,
      artist: track.artists[0].name,
    }));
  },

  async savePlaylist(playlistName, trackURIs) {
    if (!(playlistName && trackURIs && trackURIs.length > 0)) {
      console.log('Playlist name or tracks are missing. Not saving.');
      return;
    }

    const token = await this.getAccessToken();
    if (!token) return;
    const headers = {
      Authorization: 'Bearer ' + token,
      'Content-Type': 'application/json',
    };

    try {
      const playlistResponse = await fetch('https://api.spotify.com/v1/me/playlists', {
        headers,
        method: 'POST',
        body: JSON.stringify({ name: playlistName }),
      });
      if (!playlistResponse.ok) {
        throw new Error(`Failed to create playlist: ${playlistResponse.status} ${playlistResponse.statusText}`);
      }
      const playlist = await playlistResponse.json();

      const itemsResponse = await fetch(`https://api.spotify.com/v1/playlists/${playlist.id}/items`, {
        headers,
        method: 'POST',
        body: JSON.stringify({ uris: trackURIs }),
      });
      if (!itemsResponse.ok) {
        throw new Error(`Failed to add tracks to playlist: ${itemsResponse.status} ${itemsResponse.statusText}`);
      }
      console.log('Playlist saved successfully!');
      return itemsResponse.json();
    } catch (error) {
      console.error('Failed to save playlist:', error.message);
    }
  }

};

export default Spotify;
