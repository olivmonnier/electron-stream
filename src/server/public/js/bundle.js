(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

var serverConnection = void 0;
var remoted = false;
var peerConnection = void 0;
var uuid = void 0;

var generateUuid = require('../../../utils/uuid');
var iceServers = require('../../../utils/iceServersAdress');
var setMediaBitrates = require('../../../utils/limitBandwidth');

var offerOptions = {
  offerToReceiveAudio: 1,
  offerToReceiveVideo: 1
};
var peerConnectionConfig = {
  'iceServers': iceServers
};

pageReady();

window.onbeforeunload = function () {
  if (peerConnection) peerConnection.close();
  if (serverConnection) serverConnection.close();
};

function pageReady() {
  uuid = generateUuid();
  remoteVideo = document.getElementById('remoteVideo');

  serverConnection = new WebSocket('wss://' + window.location.host);
  serverConnection.onmessage = gotMessageFromServer;
}

function start() {
  peerConnection = new RTCPeerConnection(peerConnectionConfig);
  peerConnection.onicecandidate = gotIceCandidate;
  peerConnection.onaddstream = gotRemoteStream;
}

function gotMessageFromServer(message) {
  console.log('message', message);
  if (!peerConnection) start();

  var signal = JSON.parse(message.data);
  var state = peerConnection.signalingState;

  // Ignore messages from ourself
  if (signal.uuid == uuid) return;

  if (signal.sdp && state !== 'have-remote-offer') {
    peerConnection.setRemoteDescription(signal.sdp).then(function () {
      // Only create answers in response to offers
      if (signal.sdp.type == 'offer') {
        console.log('offer');
        peerConnection.createAnswer(offerOptions).then(createdDescription).catch(errorHandler);
      }
    }).catch(errorHandler);
  } else if (signal.ice) {
    peerConnection.addIceCandidate(new RTCIceCandidate(signal.ice)).catch(errorHandler);
  }
}

function gotIceCandidate(event) {
  console.log('ice');
  if (event.candidate != null) {
    console.log('candidate');
    serverConnection.send(JSON.stringify({ 'ice': event.candidate, 'uuid': uuid }));
  }
}

function createdDescription(description) {
  console.log('got description');

  peerConnection.setLocalDescription(description).then(function () {
    peerConnection.localDescription.sdp = setMediaBitrates(peerConnection.localDescription.sdp);
    serverConnection.send(JSON.stringify({ 'sdp': peerConnection.localDescription, 'uuid': uuid }));
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

},{"../../../utils/iceServersAdress":2,"../../../utils/limitBandwidth":3,"../../../utils/uuid":4}],2:[function(require,module,exports){
'use strict';

module.exports = [{ 'urls': 'stun:stun.services.mozilla.com' }, { 'urls': 'stun:stun.l.google.com:19302' }];

/*
{ 'urls': 'stun:stun1.l.google.com:19302' },
{ 'urls': 'stun:stun2.l.google.com:19302' },
{ 'urls': 'stun:stun3.l.google.com:19302' },
{ 'urls': 'stun:stun4.l.google.com:19302' },
{ 'urls': 'stun:stunserver.org' }
*/

},{}],3:[function(require,module,exports){
"use strict";

/**
 * Limit bandwidth sdp
 *  
 */
function setMediaBitrates(sdp) {
  return setMediaBitrate(setMediaBitrate(sdp, "video", 500), "audio", 50);
}

function setMediaBitrate(sdp, media, bitrate) {
  var lines = sdp.split("\n");
  var line = -1;
  for (var i = 0; i < lines.length; i++) {
    if (lines[i].indexOf("m=" + media) === 0) {
      line = i;
      break;
    }
  }
  if (line === -1) {
    console.debug("Could not find the m line for", media);
    return sdp;
  }
  console.debug("Found the m line for", media, "at line", line);

  // Pass the m line
  line++;

  // Skip i and c lines
  while (lines[line].indexOf("i=") === 0 || lines[line].indexOf("c=") === 0) {
    line++;
  }

  // If we're on a b line, replace it
  if (lines[line].indexOf("b") === 0) {
    console.debug("Replaced b line at line", line);
    lines[line] = "b=AS:" + bitrate;
    return lines.join("\n");
  }

  // Add a new b line
  console.debug("Adding new b line before line", line);
  var newLines = lines.slice(0, line);
  newLines.push("b=AS:" + bitrate);
  newLines = newLines.concat(lines.slice(line, lines.length));
  return newLines.join("\n");
}

module.exports = setMediaBitrates;

},{}],4:[function(require,module,exports){
'use strict';

function s4() {
  return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
}

module.exports = function () {
  return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
};

},{}]},{},[1]);
