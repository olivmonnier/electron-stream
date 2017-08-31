const setMediaBitrates = require('./limitBandwidth');

function createOffer(pc, successSignal, offerOptions) {
  pc.createOffer(offerOptions)
    .then((desc) => {
      onCreateOfferSuccess(pc, desc, successSignal)
    }).catch(errorHandler)
}

function onCreateOfferSuccess (pc, description, signal) {
  console.log('got description');

  pc.setLocalDescription(description).then(function () {
    pc.localDescription.sdp = setMediaBitrates(pc.localDescription.sdp);
    signal();
  }).catch(errorHandler);
}

function onIceCandidate(event, cb) {
  console.log('ice')
  if (event.candidate) {
    console.log('candidate');
    cb()
  }
}

function errorHandler(error) {
  console.log(error);
}

module.exports = {
  createOffer,
  onCreateOfferSuccess,
  onIceCandidate
}