const { getStream, getSources, videoQualities, formatScreenId } = require('../utils/capture');

function showSources() {
  getSources().then(sources => {
    for (let source of sources) {
      addSource(source);
    }
  });
}

function showVideoQualities() {
  for (let quality in videoQualities) {
    addVideoQuality(quality);
  }
}

function addSource(source) {
  let formatId;
  const { id, name } = source;
  const select = document.querySelector('#sources');
  const option = document.createElement('option');

  formatId = formatScreenId(id, name);

  option.value = formatId.replace(':', '');
  option.textContent = name;

  select.appendChild(option);
}

function addVideoQuality(quality) {
  const select = document.querySelector('#videoQuality');
  const option = document.createElement('option');

  option.value = quality;
  option.textContent = quality;

  select.appendChild(option);
}

module.exports = {
  showSources,
  showVideoQualities
}