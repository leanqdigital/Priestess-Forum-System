function playAudio(id) {
  const player = document.querySelector(`[data-audio-player="${id}"]`);
  if (!player) {
    console.error(`Audio player with id "${id}" not found.`);
    return;
  }

  const audio = player.querySelector(".audio");
  const playPauseBtn = player.querySelector(".play-pause");
  const volumeBtn = player.querySelector(".volume");
  const rewindBtn = player.querySelector(".rewind");
  const forwardBtn = player.querySelector(".forward");
  const progressBar = player.querySelector(".progress");
  const currentTimeDisplay = player.querySelector(".current-time");
  const totalTimeDisplay = player.querySelector(".total-time");

  // Helper to format seconds as "minutes:seconds"
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  // Set up duration display and progress updates
  setupAudioDuration(
    audio,
    currentTimeDisplay,
    totalTimeDisplay,
    progressBar,
    formatTime
  );

  // Set up the control event listeners
  setupAudioEventListeners(
    audio,
    playPauseBtn,
    volumeBtn,
    rewindBtn,
    forwardBtn,
    progressBar
  );

  // When the audio ends, reset the seeker and update icons to play state
  audio.addEventListener("ended", () => {
    audio.currentTime = 0;
    progressBar.value = 0;
    currentTimeDisplay.textContent = formatTime(0);
    totalTimeDisplay.textContent = "-" + formatTime(audio.duration);
    playPauseBtn.querySelector(".pausedIcon").classList.add("hidden");
    playPauseBtn.querySelector(".playedIcon").classList.remove("hidden");
  });
}

/**
 * Attaches listeners related to duration and progress display.
 */
function setupAudioDuration(
  audio,
  currentTimeDisplay,
  totalTimeDisplay,
  progressBar,
  formatTime
) {
  audio.addEventListener("loadedmetadata", () => {
    // If the browser reports an infinite or NaN duration, force a refresh.
    if (!isFinite(audio.duration) || isNaN(audio.duration)) {
      // Hack: set currentTime to a large value to force the browser to recalc the duration.
      audio.currentTime = 1e101;
      audio.ontimeupdate = () => {
        // Once a time update occurs, reset to 0 and update the display.
        audio.ontimeupdate = null;
        audio.currentTime = 0;
        totalTimeDisplay.textContent = "-" + formatTime(audio.duration);
      };
    } else {
      totalTimeDisplay.textContent = "-" + formatTime(audio.duration);
    }
  });

  audio.addEventListener("timeupdate", () => {
    const progressPercent = (audio.currentTime / audio.duration) * 100;
    progressBar.value = progressPercent;
    currentTimeDisplay.textContent = formatTime(audio.currentTime);
    totalTimeDisplay.textContent =
      "-" + formatTime(audio.duration - audio.currentTime);
  });
}

/**
 * Attaches control event listeners (play/pause, volume toggle, rewind, forward, and seeking).
 */
function setupAudioEventListeners(
  audio,
  playPauseBtn,
  volumeBtn,
  rewindBtn,
  forwardBtn,
  progressBar
) {
  playPauseBtn.addEventListener("click", () => {
    if (audio.paused) {
      audio.play();
      playPauseBtn.querySelector(".pausedIcon").classList.remove("hidden");
      playPauseBtn.querySelector(".playedIcon").classList.add("hidden");
    } else {
      audio.pause();
      playPauseBtn.querySelector(".pausedIcon").classList.add("hidden");
      playPauseBtn.querySelector(".playedIcon").classList.remove("hidden");
    }
  });

  volumeBtn.addEventListener("click", () => {
    audio.muted = !audio.muted;
    if (audio.muted) {
      volumeBtn.querySelector(".muted").classList.remove("hidden");
      volumeBtn.querySelector(".unmuted").classList.add("hidden");
    } else {
      volumeBtn.querySelector(".muted").classList.add("hidden");
      volumeBtn.querySelector(".unmuted").classList.remove("hidden");
    }
  });

  rewindBtn.addEventListener("click", () => {
    audio.currentTime = Math.max(audio.currentTime - 10, 0);
  });

  forwardBtn.addEventListener("click", () => {
    audio.currentTime = Math.min(audio.currentTime + 10, audio.duration);
  });

  progressBar.addEventListener("input", () => {
    audio.currentTime = (progressBar.value / 100) * audio.duration;
  });
}
