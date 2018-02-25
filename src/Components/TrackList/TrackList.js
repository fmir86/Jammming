import React from 'react';
import './TrackList.css';
import Track from "../Track/Track.js";


class TrackList extends React.Component {

  render(){
    return(
      <div className="TrackList">{
        this.props.tracks.map(function(track){
          return <Track key={track.id} track={track} onRemove={this.props.onRemove} onAdd={this.props.onAdd} shouldAdd={this.props.shouldAdd}/>
        })
      }</div>
    )
  }
}

export default TrackList;
