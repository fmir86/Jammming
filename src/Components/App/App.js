import React from 'react';
import './App.css';
import SearchBar from '../SearchBar/SearchBar.js';
import SearchResults from '../SearchResults/SearchResults.js';
import PlayList from '../PlayList/PlayList.js';
import Spotify from '../../util/Spotify.js';

class App extends React.Component {
  constructor(props){
    super(props);

    this.state = {
      searchResults: [],
      playlistName: "New Playlist",
      playlistTracks: []
    };

    //BINDING
    this.addTrack = this.addTrack.bind(this);
    this.removeTrack = this.removeTrack.bind(this);
    this.updatePlaylistName = this.updatePlaylistName.bind(this);
    this.savePlaylist = this.savePlaylist.bind(this);
    this.search = this.search.bind(this);
  }

  addTrack(track){
    let idExists = this.state.playlistTracks.some(function(element) {
      return track.id === element.id;
    });

    if(!idExists){
      let newPlaylistState = this.state.playlistTracks;
      newPlaylistState.push(track);

      this.setState(
        {playlistTracks: newPlaylistState}
      );
     }
  }

  removeTrack(track){
    let newPlaylistState = this.state.playlistTracks;
    let itemToRemove = newPlaylistState.find(function(element) {
      return track.id === element.id;
    });

    let index = newPlaylistState.indexOf(itemToRemove);

    if (index > -1){
      newPlaylistState.splice(index, 1);
      this.setState({playlistTracks: newPlaylistState});
    }
  }

  updatePlaylistName(name){
    this.setState({playlistName: name});
  }

  savePlaylist(){
    let trackURIs = this.state.playlistTracks.map(function(elem){
      return elem.uri;
    });

    Spotify.savePlaylist(this.state.playlistName, trackURIs);
  }

  search(term){
      Spotify.search(term).then(
        function(response){
          // Sometimes, some old promises were accomplished even after the last ones. Causing the input being empty
          // but search results showing tracks based on those old promises.
          // This was the only thing worked for me, probbably there as better, more elegant way to di this? To maybe cancel old promises based on some condition?
          if(document.getElementById('searchBar').value.length > 0){
            this.setState({searchResults: response});
          }else{
            this.setState({searchResults: []});
          }
        }.bind(this)
      );
  }

  render() {
    return (
      <div>
        <h1>Ja<span className="highlight">mmm</span>ing</h1>
        <div className="App">
          <SearchBar onSearch={this.search}/>
          <div className="App-playlist">
            <SearchResults searchResults={this.state.searchResults} onAdd={this.addTrack}/>
            <PlayList title={this.state.playlistName} tracks={this.state.playlistTracks} onRemove={this.removeTrack} onNameChange={this.updatePlaylistName} onSave={this.savePlaylist}/>
          </div>
        </div>
      </div>
    );
  }
}

export default App;
