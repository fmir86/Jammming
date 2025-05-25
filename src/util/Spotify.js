let accessToken;
let expiresIn;
const CLIENT_ID = process.env.REACT_APP_SPOTIFY_CLIENT_ID;
const REDIRECT_URI = process.env.REACT_APP_SPOTIFY_REDIRECT_URI;


const Spotify = {

  getAccessToken() {
    if (!accessToken){
      accessToken = window.location.href.match(/access_token=([^&]*)/);
      expiresIn = window.location.href.match(/expires_in=([^&]*)/);

      if(accessToken && expiresIn){
        accessToken = accessToken[1];
        expiresIn = expiresIn[1];
        window.setTimeout(() => accessToken = '', expiresIn * 1000);
        window.history.pushState('Access Token', null, '/');
      }else{
        window.location.href = "https://accounts.spotify.com/authorize?client_id=" + CLIENT_ID + "&response_type=token&scope=playlist-modify-public&redirect_uri=" + REDIRECT_URI;
      }
    }
    return accessToken
  },

  search(term){
    return fetch('https://api.spotify.com/v1/search?type=track&q=' + term, {headers: {'Authorization': 'Bearer ' + this.getAccessToken()}})
    .then(
      function(response){
        if (response.ok) {
          return response.json();
        } else {
          console.error(`Error searching tracks: ${response.status} ${response.statusText}`);
          return []; // Maintain current behavior of returning empty on error
        }
      }
    ).then(
      function(jsonResponse){
        if (jsonResponse.tracks){
          let tracksList = jsonResponse.tracks.items.map(
            function(track){
              return{
                id: track.id,
                name: track.name,
                uri: track.uri,
                album: track.album.name,
                artist: track.artists[0].name
              }
            }
          )
          return tracksList;
        }else{
          return [];
        }
      }
    )
  },

  savePlaylist(playlistName, trackURIs){
    if(!(playlistName && trackURIs && trackURIs.length > 0)) { // Added check for non-empty trackURIs
        console.log("Playlist name or tracks are missing. Not saving."); // Or handle as an error
        return Promise.resolve(); // Return a resolved promise if not saving
    }

    let headers = {'Authorization': 'Bearer ' + this.getAccessToken()};
    let userID;
    // let playlistID; // playlistID is defined in the scope it's used

    return fetch('https://api.spotify.com/v1/me', {headers: headers}).then(
      function(response){
        if(response.ok){
          return response.json();
        } else {
          console.error(`Error fetching user ID: ${response.status} ${response.statusText}`);
          throw new Error('Failed to fetch user ID');
        }
      }
    ).then(
      function(jsonResponse){
        userID = jsonResponse.id;
        return fetch("https://api.spotify.com/v1/users/" + userID + "/playlists", {
          headers: headers,
          method: "POST",
          body: JSON.stringify({name: playlistName})
        }).then(
          function(response){
            if(response.ok) {
              return response.json();
            } else {
              console.error(`Error creating playlist: ${response.status} ${response.statusText}`);
              throw new Error('Failed to create playlist');
            }
          }
        ).then(
          function(jsonResponse){
            const playlistID = jsonResponse.id; // Defined playlistID here
            return fetch('https://api.spotify.com/v1/users/' + userID + '/playlists/' + playlistID + '/tracks', {
              headers: headers,
              method: 'POST',
              body: JSON.stringify({uris: trackURIs})
            }).then(
              function(response){
                if(response.ok){
                  console.log("Playlist saved successfully!");
                  return response.json(); // Good practice to return the response
                } else {
                  console.error(`Error adding tracks to playlist: ${response.status} ${response.statusText}`);
                  throw new Error('Failed to add tracks to playlist');
                }
              }
            )
          }
        )
      }
    ).catch(
      function(error) {
        console.error("Failed to save playlist:", error.message);
        // Optionally, re-throw the error or handle it further if needed by the caller
        // For example, if the UI needs to react to this error: throw error;
      }
    )
  }

}

export default Spotify;
