const io = require('socket.io-client');
const SimpleWebRTC = require('simplewebrtc');
const { showSources, showVideoQualities, changeSelect } = require('./ui');
const { getSources, formatScreenId, videoQualities } = require('../utils/capture');

let webrtc;
let videoQuality = videoQualities['low'];
let videoConfig = {
  chromeMediaSource: 'desktop',
  minWidth: videoQuality[0],
  maxWidth: videoQuality[0],
  minHeight: videoQuality[1],
  maxHeight: videoQuality[1],
  minFrameRate: 15,
  maxFrameRate: 25
}

let mediaConfig = {
  audio: {
    mandatory: {
      chromeMediaSource: 'desktop'
    }
  },
  video: {
    mandatory: videoConfig
  }
}

pageReady();

document.querySelector('#copyAdress').addEventListener('click', onClickCopy);
document.querySelector('#sources').addEventListener('change', onChangeSelect);
document.querySelector('#videoQuality').addEventListener('change', onChangeSelect);

$('.ui.dropdown').dropdown();

function onClickCopy() {
  const input = document.querySelector('#connectionPath');
  
  input.select();
  document.execCommand('copy');
}

function onChangeSelect() {
  let sourceId = document.querySelector('#sources').value;
  const sourceName = document.querySelector('#sources option:checked').textContent;
  const quality = document.querySelector('#videoQuality').value;

  sourceId = sourceId.replace(/window|screen/g, (match) => match + ':');

  onChangeVideoSource(sourceId, sourceName, quality);
}

function onChangeVideoSource(sourceId, sourceName, quality) {
  const peers = webrtc.getPeers();

  videoQuality = videoQualities[quality];

  videoConfig['minWidth'] = videoQuality[0];
  videoConfig['maxWidth'] = videoQuality[0];
  videoConfig['minHeight'] = videoQuality[1];
  videoConfig['maxHeight'] = videoQuality[1];
  videoConfig['chromeMediaSourceId'] = formatScreenId(sourceId, sourceName);

  webrtc.stopLocalVideo();

  webrtc.config.media = mediaConfig;

  webrtc.startLocalVideo();
}

function pageReady() {
  showSources()
  showVideoQualities();
  getSources().then(sources => {
    webrtc = new SimpleWebRTC({
      url: 'https://webrtc-stream-server.herokuapp.com/',
      socketio: io,
      localVideoEl: 'localVideo',
      debug: true,
      autoRemoveVideos: true,
      autoRequestMedia: true,
      media: mediaConfig
    });
    webrtc.on('connectionReady', (sessionId) => {
      const input = document.querySelector('#connectionPath');

      input.value = 'https://webrtc-stream-server.herokuapp.com/?room=' + sessionId;
      webrtc.createRoom(sessionId);
    });
  })
} 