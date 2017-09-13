
const Promise = require('bluebird');
const { desktopCapturer } = require('electron');

const videoQualities = {
  low: [640, 480],
  medium: [1280, 720],
  high: [1920, 1080]
}

const getSources = (types = ['window', 'screen']) => {
  return new Promise((resolve, reject) => {
    desktopCapturer.getSources({ types }, (error, sources) => {
      if (error) return reject(error);
      resolve(sources);
    })
  });
}

const formatScreenId = (id, name) => {
  if (name && name.indexOf('Screen ') > -1) {
    nScreen = parseInt(name.replace('Screen ', ''), 10) - 1;

    return 'screen:' + nScreen + ':0';
  } else {
    return id;
  }
}

module.exports = {
  videoQualities,
  getSources,
  formatScreenId
}