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

    if(!idExists) this.state.playlistTracks.push(track);
  }

  removeTrack(track){
    let itemToRemove = this.state.playlistTracks.find(function(element) {
      return track.id === element.id;
    });

    let index = this.state.playlistTracks.indexOf(itemToRemove);
    if (index > -1){
      this.state.playlistTracks.splice(index, 1);
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
    this.setState({searchResults: Spotify.search(term)});
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
