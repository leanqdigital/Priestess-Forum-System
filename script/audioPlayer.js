function playAudio(id) {
  let player = document.querySelector(`[data-audio-player="${id}"]`);
  const audio = player.querySelector(`.audio`);
  const playPauseBtn = player.querySelector(`#play-pause`);
  const rewindBtn = player.querySelector(`#rewind`);
  const forwardBtn = player.querySelector(`#forward`);
  const progressBar = player.querySelector(`#progress`);
  const currentTimeDisplay = player.querySelector(`#current-time`);
  const totalTimeDisplay = player.querySelector(`#total-time`);

  if (audio.paused) {
    audio.play();
    playPauseBtn.querySelector(".pausedIcon").classList.remove("hidden");
    playPauseBtn.querySelector(".playedIcon").classList.add("hidden");
  } else {
    audio.pause();
    playPauseBtn.querySelector(".pausedIcon").classList.add("hidden");
    playPauseBtn.querySelector(".playedIcon").classList.remove("hidden");
  }

  rewindBtn.addEventListener(`click`, () => {
    audio.currentTime -= 10;
  });

  forwardBtn.addEventListener(`click`, () => {
    audio.currentTime += 10;
  });

  audio.addEventListener(`timeupdate`, () => {
    progressBar.value = (audio.currentTime / audio.duration) * 100;
    currentTimeDisplay.textContent = formatTime(audio.currentTime);
    totalTimeDisplay.textContent =
      `-` + formatTime(audio.duration - audio.currentTime);
  });

  progressBar.addEventListener(`input`, () => {
    audio.currentTime = (progressBar.value / 100) * audio.duration;
  });

  function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? "0" : ``}${secs}`;
  }

  audio.addEventListener(`loadedmetadata`, () => {
    totalTimeDisplay.textContent = "-" + formatTime(audio.duration);
  });
}

function playAudioComment(id) {
  let player = document.querySelector(`[data-comment-audio-player="${id}"]`);
  const audio = player.querySelector(`.audio`);
  const playPauseBtn = player.querySelector(`#play-pause`);
  const rewindBtn = player.querySelector(`#rewind`);
  const forwardBtn = player.querySelector(`#forward`);
  const progressBar = player.querySelector(`#progress`);
  const currentTimeDisplay = player.querySelector(`#current-time`);
  const totalTimeDisplay = player.querySelector(`#total-time`);

  if (audio.paused) {
    audio.play();
    playPauseBtn.querySelector(".pausedIcon").classList.remove("hidden");
    playPauseBtn.querySelector(".playedIcon").classList.add("hidden");
  } else {
    audio.pause();
    playPauseBtn.querySelector(".pausedIcon").classList.add("hidden");
    playPauseBtn.querySelector(".playedIcon").classList.remove("hidden");
  }

  rewindBtn.addEventListener(`click`, () => {
    audio.currentTime -= 10;
  });

  forwardBtn.addEventListener(`click`, () => {
    audio.currentTime += 10;
  });

  audio.addEventListener(`timeupdate`, () => {
    progressBar.value = (audio.currentTime / audio.duration) * 100;
    currentTimeDisplay.textContent = formatTime(audio.currentTime);
    totalTimeDisplay.textContent =
      `-` + formatTime(audio.duration - audio.currentTime);
  });

  progressBar.addEventListener(`input`, () => {
    audio.currentTime = (progressBar.value / 100) * audio.duration;
  });

  function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? "0" : ``}${secs}`;
  }

  audio.addEventListener(`loadedmetadata`, () => {
    totalTimeDisplay.textContent = "-" + formatTime(audio.duration);
  });
}
