const io = require('socket.io-client');
const SimpleWebRTC = require('simplewebrtc');
const { getSources, formatScreenId, videoQualities } = require('../utils/capture');

let isWin = /^win/.test(process.platform);
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
let audioConfig = isWin ? { mandatory: { chromeMediaSource: 'desktop' } } : true;
let mediaConfig = {
  audio: audioConfig,
  video: {
    mandatory: videoConfig
  }
}

pageReady();

function handledClickCopy() {
  const input = document.querySelector('#connectionPath');
  
  input.select();
  document.execCommand('copy');
} 
 
function handledChangeSource(val, text) {
  let sourceId = val;
  const sourceName = text;
  const quality = $('#qualities').dropdown('get value');

  changeSettings(sourceId, sourceName, quality);
}

function handledChangeQuality(val) {
  let sourceId = $('#sources').dropdown('get value');
  const sourceName = $('#sources').dropdown('get text');
  const quality = val;

  changeSettings(sourceId, sourceName, quality);
}

function changeSettings(sourceId, sourceName, quality) {
  if (sourceId && sourceName && quality) {
    const formatSourceId = sourceId.replace(/window|screen/g, (match) => match + ':');

    videoQuality = videoQualities[quality];

    videoConfig['minWidth'] = videoQuality[0];
    videoConfig['maxWidth'] = videoQuality[0];
    videoConfig['minHeight'] = videoQuality[1];
    videoConfig['maxHeight'] = videoQuality[1];
    videoConfig['chromeMediaSourceId'] = formatScreenId(formatSourceId, sourceName);

    webrtc.stopLocalVideo();

    webrtc.config.media = mediaConfig;

    webrtc.startLocalVideo();
  } 
} 

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

function pageReady() {
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

  getSources().then(sources => {
    $('#sources.dropdown').dropdown({
      values: sources.map((source, i) => {
        const { id, name } = source;
        const sourceId = formatScreenId(id, name);

        return { name, value: sourceId.replace(':', ''), selected: (i == 0) }
      }),
      onChange: handledChangeSource
    })
  });
  $('#qualities.dropdown').dropdown({
    values: Object.keys(videoQualities).map((quality, i) => {
      return { name: capitalize(quality), value: quality, selected: (i == 0) }
    }),
    onChange: handledChangeQuality
  })
  $('.video').dimmer({ on: 'hover' });
  $('#copyAdress').on('click', handledClickCopy);
}