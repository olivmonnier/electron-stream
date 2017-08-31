
const io = require('socket.io-client');

let serverConnection;
let remoted = false;
let peerConnection;
let uuid;

const generateUuid = require('../../../utils/uuid');
const iceServers = require('../../../utils/iceServersAdress');
const setMediaBitrates = require('../../../utils/limitBandwidth');

const offerOptions = {
  offerToReceiveAudio: 1,
  offerToReceiveVideo: 1
};
const peerConnectionConfig = {
  'iceServers': iceServers
};

pageReady(); 

window.onbeforeunload = function () {
  if (peerConnection) peerConnection.close();
  if (serverConnection) serverConnection.close();
}

function pageReady() {
  uuid = generateUuid(); 
  remoteVideo = document.getElementById('remoteVideo');

  serverConnection = io.connect(window.location.protocol + "//" + window.location.host);
  serverConnection.on('message', gotMessageFromServer);
}

function start() {
  peerConnection = new RTCPeerConnection(peerConnectionConfig);
  peerConnection.onicecandidate = gotIceCandidate;
  peerConnection.onaddstream = gotRemoteStream;
}

function gotMessageFromServer(message) {
  console.log('message', message)
  if (!peerConnection) start();

  const signal = JSON.parse(message);
  const state = peerConnection.signalingState;

  // Ignore messages from ourself
  if (signal.uuid == uuid) return;

  if (signal.sdp && state !== 'have-remote-offer') {
    peerConnection.setRemoteDescription(signal.sdp).then(function () {
      // Only create answers in response to offers
      if (signal.sdp.type == 'offer') {
        console.log('offer')
        peerConnection.createAnswer(offerOptions).then(createdDescription).catch(errorHandler);
      }
    }).catch(errorHandler);
  } else if (signal.ice) {
    peerConnection.addIceCandidate(new RTCIceCandidate(signal.ice)).catch(errorHandler);
  }
}

function gotIceCandidate(event) {
  console.log('ice')
  if (event.candidate != null) {
    console.log('candidate')
    serverConnection.emit('message', JSON.stringify({ 'ice': event.candidate, 'uuid': uuid }));
  }
}

function createdDescription(description) {
  console.log('got description');

  peerConnection.setLocalDescription(description).then(function () {
    peerConnection.localDescription.sdp = setMediaBitrates(peerConnection.localDescription.sdp);
    serverConnection.emit('message', JSON.stringify({ 'sdp': peerConnection.localDescription, 'uuid': uuid }));
  }).catch(errorHandler);
}

function gotRemoteStream(event) {
  console.log('got remote stream');
  remoteVideo.src = window.URL.createObjectURL(event.stream);
  remoteVideo.play();
}

function errorHandler(error) {
  console.log('error', error);
}