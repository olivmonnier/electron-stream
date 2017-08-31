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

function changeSelect(pc, localStream) {
  let source = document.querySelector('#sources').value;
  const quality = document.querySelector('#videoQuality').value;

  source = source.replace(/window|screen/g, (match) => match + ':');

  getStream(source, quality).then((stream) => {
    if (pc) {
      pc.removeStream(localStream);
      pc.addStream(stream);
    }
    gotStream(stream);
  });
}

module.exports = {
  showSources,
  showVideoQualities,
  changeSelect
}