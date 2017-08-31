let localStream;
let remoteVideo;
let peerConnection;
let uuid;

const { ipcRenderer } = require('electron');
const { showSources, showVideoQualities, changeSelect } = require('./ui');
const { getStream } = require('../utils/capture');
const iceServers = require('../utils/iceServersAdress');
const generateUuid = require('../utils/uuid');
const { createOffer, onIceCandidate } = require('../utils/peerConnection');
const peerConnectionConfig = {
  'iceServers': iceServers
};
const offerOptions = {
  offerToReceiveAudio: 1,
  offerToReceiveVideo: 1
};

pageReady();

ipcRenderer.on('connection', start);
ipcRenderer.on('message', gotMessageFromServer);

document.querySelector('#sources').addEventListener('change', onChangeSelect);
document.querySelector('#videoQuality').addEventListener('change', onChangeSelect);

function onChangeSelect() {
  changeSelect(peerConnection, localStream);
}

function pageReady() {
  uuid = generateUuid();

  showSources();
  showVideoQualities();
  getStream().then(gotStream);
}

function start() {
  console.log('start');
  peerConnection = new RTCPeerConnection(peerConnectionConfig);
  peerConnection.addStream(localStream);  
  peerConnection.onnegotiationneeded = function() {
    createOffer(peerConnection, () => {
      ipcRenderer.send('localDescription', JSON.stringify({ 'sdp': peerConnection.localDescription, 'uuid': uuid }))
    }, offerOptions)
  }
  peerConnection.onicecandidate = (event) => {
    onIceCandidate(event, () => {
      ipcRenderer.send('iceCandidate', JSON.stringify({ 'ice': event.candidate, 'uuid': uuid }))
    });
  }
}

function gotMessageFromServer(event, message) {
  const signal = JSON.parse(message);
  const state = peerConnection.signalingState;

  if (signal.uuid == uuid) return;

  if (signal.sdp) {
    if (signal.sdp.type == 'answer') {
      peerConnection.setRemoteDescription(signal.sdp).catch(errorHandler);
    }
  } else if (signal.ice) {
    peerConnection.addIceCandidate(new RTCIceCandidate(signal.ice)).catch(errorHandler);
  }
}

function gotStream(stream) {
  const video = document.querySelector('video');

  if (localStream) {
    localStream.getVideoTracks()[0].stop();
    localStream = null;
  }
  localStream = stream;
  video.src = URL.createObjectURL(stream);
}

function errorHandler(error) {
  console.log(error);
}