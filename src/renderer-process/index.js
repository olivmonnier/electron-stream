let localStream;
let remoteVideo;
let peerConnection;
let uuid;

const { ipcRenderer } = require('electron');
const getDesktop = require('../utils/getDesktop');
const video = document.querySelector('video');
const peerConnectionConfig = {
  'iceServers': [
    { 'urls': 'stun:stun.services.mozilla.com' },
    { 'urls': 'stun:stun.l.google.com:19302' },
  ]
};
const offerOptions = {
  offerToReceiveAudio: 1,
  offerToReceiveVideo: 1
};

pageReady();

function pageReady() {
  uuid = uid();

  getDesktop().then(gotStream);
}

ipcRenderer.on('connection', start);
ipcRenderer.on('message', gotMessageFromServer);

function gotMessageFromServer(event, message) {
  const signal = JSON.parse(message);

  if (signal.uuid == uuid) return;  

  if (signal.sdp) {
    peerConnection.setRemoteDescription(new RTCSessionDescription(signal.sdp)).then(function () {
      // Only create answers in response to offers
      if (signal.sdp.type == 'offer') {
        console.log('offer')
        peerConnection.createAnswer().then(createdDescription).catch(errorHandler);
      }
    }).catch(errorHandler);
  } else if (signal.ice) {
    peerConnection.addIceCandidate(new RTCIceCandidate(signal.ice)).catch(errorHandler);
  }
}

function gotStream(stream) {
  localStream = stream;
  video.src = URL.createObjectURL(stream); 
}

function start() {
  console.log('start');
  peerConnection = new RTCPeerConnection(peerConnectionConfig);
  peerConnection.onicecandidate = gotIceCandidate;
  peerConnection.addStream(localStream);  
  peerConnection.createOffer(onCreateOfferSuccess, errorHandler, offerOptions);
}

function gotIceCandidate(event) {
  console.log('ice')
  if (event.candidate != null) {
    console.log('candidate');
    ipcRenderer.send('iceCandidate', JSON.stringify({ 'ice': event.candidate, 'uuid': uuid }));
  }
}

function onCreateOfferSuccess(description) {
  console.log('got description');

  peerConnection.setLocalDescription(description).then(function () {
    ipcRenderer.send('localDescription', JSON.stringify({ 'sdp': peerConnection.localDescription, 'uuid': uuid }));
  }).catch(errorHandler);
}

function errorHandler(error) {
  console.log(error);
}

function uid() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
  }

  return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
}