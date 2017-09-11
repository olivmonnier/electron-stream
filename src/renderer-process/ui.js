const { getStream, getSources, videoQualities, formatScreenId } = require('../utils/capture');

const $sources = document.querySelector('#sources');
const $videoQuality = document.querySelector('#videoQuality');

function showSources() { 
  getSources().then(sources => {
    $sources.innerHTML = '';

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
  const { id, name, thumbnail } = source;
  const select = $sources;
  const option = document.createElement('option');

  formatId = formatScreenId(id, name);

  option.value = formatId.replace(':', '');
  option.textContent = name;

  select.appendChild(option);
}

function addVideoQuality(quality) {
  const select = $videoQuality;
  const option = document.createElement('option');

  option.value = quality;
  option.textContent = quality;

  select.appendChild(option);
}

module.exports = {
  showSources,
  showVideoQualities
}