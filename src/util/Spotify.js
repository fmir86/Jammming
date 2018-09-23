let accessToken;
let expiresIn;
const CLIENT_ID = 'f4adebf0984449ffa1f7d0c4766c5dc1';
const REDIRECT_URI = 'http://localhost:3000/';


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
        return (response.ok) ? response.json() : [];
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
    if(!(playlistName && trackURIs)) return;

    let headers = {'Authorization': 'Bearer ' + this.getAccessToken()};
    let userID;
    let playlistID;

    fetch('https://api.spotify.com/v1/me', {headers: headers}).then(
      function(response){
        if(response.ok){
          return response.json();
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
            if(response.ok) return response.json();
          }
        ).then(
          function(jsonResponse){
            playlistID = jsonResponse.id;
            return fetch('https://api.spotify.com/v1/users/' + userID + '/playlists/' + playlistID + '/tracks', {
              headers: headers,
              method: 'POST',
              body: JSON.stringify({uris: trackURIs})
            }).then(
              function(response){
                if(response.ok){
                  console.log("Playlist Status: " + response.statusText);
                }
              }
            )
          }
        )
      }
    )
  }

}

export default Spotify;
