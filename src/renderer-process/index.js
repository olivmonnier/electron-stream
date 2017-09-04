const { ipcRenderer } = require('electron');
const io = require('socket.io-client');

let serverConnection;
let localStream;
let remoteVideo;
let peerConnection;
let uuid;

const { showSources, showVideoQualities, changeSelect } = require('./ui');
const { getStream } = require('../utils/capture');
const iceServers = require('../utils/iceServersAdress');
const generateUuid = require('../utils/uuid');
const { createOffer, iceCandidate } = require('../utils/peerConnection');
const peerConnectionConfig = {
  'iceServers': iceServers
};

pageReady();

document.querySelector('#sources').addEventListener('change', onChangeSelect);
document.querySelector('#videoQuality').addEventListener('change', onChangeSelect);

function onChangeSelect() {
  let source = document.querySelector('#sources').value;
  const quality = document.querySelector('#videoQuality').value;

  source = source.replace(/window|screen/g, (match) => match + ':');

  getStream(source, quality).then((stream) => {
    if (peerConnection) {
      peerConnection.removeStream(localStream);
      peerConnection.addStream(stream);
    }
    gotStream(stream);
  });
}

function pageReady() {
  uuid = generateUuid();

  serverConnection = io.connect('https://webrtc-stream-server.herokuapp.com/'); 

  serverConnection.on('connect', () => console.log(serverConnection.id));
  serverConnection.on('newUser', start);
  serverConnection.on('message', onMessageFromServer);

  showSources();
  showVideoQualities();
  getStream().then(gotStream);
}

function start() {
  console.log('start');
  peerConnection = new RTCPeerConnection(peerConnectionConfig);
  peerConnection.addStream(localStream);  
  peerConnection.onnegotiationneeded = onNegotiationnNeeded;
  peerConnection.onicecandidate = onIceCandidate;
  peerConnection.onconnectionstatechange = function(event) {
    console.log(event, peerConnection.connectionState)
  }
  peerConnection.oniceconnectionstatechange = function(event) {
    console.log(event, peerConnection.iceConnectionState)
  }
}

function onNegotiationnNeeded() {
  createOffer(peerConnection, () => {
    serverConnection.emit('message', JSON.stringify({ 'sdp': peerConnection.localDescription, 'uuid': uuid }))
  })
}

function onIceCandidate(event) {
  iceCandidate(event, () => 
    serverConnection.emit('message', JSON.stringify({ 'ice': event.candidate, 'uuid': uuid }))
  )
}

function onMessageFromServer(message) {
  const signal = JSON.parse(message);
  const signalState = peerConnection.signalingState;
  const iceState = peerConnection.iceConnectionState;

  if (signal.uuid == uuid) return;

  if (signal.sdp) {
    if (signal.sdp.type == 'answer') {
      peerConnection.setRemoteDescription(signal.sdp).catch(errorHandler);
    }
  } else if (signal.ice && iceState !== 'completed') {
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