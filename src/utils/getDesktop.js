module.exports = function() {
  return navigator.mediaDevices.getUserMedia({
    audio: false,
    video: {
      mandatory: {
        chromeMediaSource: 'desktop'
      }
    }
  })
}

/*
audio: {
  mandatory: {
    chromeMediaSource: 'desktop'
  }
}
*/