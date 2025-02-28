// Initialize when DOM is ready
document.addEventListener("DOMContentLoaded", () => MentionManager.init());

//Create Post Part start
//-----------------------------------------------------------------
//-----------------------------------------------------------------
//-----------------------------------------------------------------
//-----------------------------------------------------------------
let currentFileType = null;
let currentRecordedAudioFile = null;
let mediaRecorder = null;
let recordedChunks = [];
let recordingTimerInterval = null;
let recordingStartTime = null;
let audioCtx, analyser, dataArray, bufferLength, animationId;

// Helper to format time (mm:ss)
// Helper to format seconds as mm:ss
function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? "0" + secs : secs}`;
}

// Simple play/pause toggle function for the custom audio player
function togglePlayPause(audioId, button) {
  const audioElem = document.getElementById(audioId);
  if (audioElem.paused) {
    audioElem.play();
    button.querySelector(".playedIcon").classList.add("hidden");
    button.querySelector(".pausedIcon").classList.remove("hidden");
  } else {
    audioElem.pause();
    button.querySelector(".pausedIcon").classList.add("hidden");
    button.querySelector(".playedIcon").classList.remove("hidden");
  }
}

function resetPostModal() {
  // Clear editor content
  document.getElementById("post-editor").innerHTML = "";
  // Clear file inputs (this removes the selected uploaded file)
  document.getElementById("post-image-upload").value = "";
  document.getElementById("post-audio-upload").value = "";
  document.getElementById("post-video-upload").value = "";
  // Clear all preview wrappers
  document.getElementById("image-preview-wrapper").innerHTML = "";
  document.getElementById("audio-preview-wrapper").innerHTML = "";
  document.getElementById("video-preview-wrapper").innerHTML = "";
  // Hide preview containers and file controls
  document.getElementById("audio-preview-wrapper").classList.add("hidden");
  document.getElementById("file-controls").classList.add("hidden");
  // Reset recording state
  resetRecordingState();
  // Restore the original upload buttons/options
  document.getElementById("upload-image-button").classList.remove("hidden");
  document.getElementById("audioOptionsWrapper").classList.remove("hidden");
  document.getElementById("upload-video-button").classList.remove("hidden");
}

// Trigger file inputs when the corresponding button is clicked
document.getElementById("upload-image-button").addEventListener("click", () => {
  document.getElementById("post-image-upload").click();
});
document.getElementById("upload-audio-button").addEventListener("click", () => {
  document.getElementById("post-audio-upload").click();
});
document.getElementById("upload-video-button").addEventListener("click", () => {
  document.getElementById("post-video-upload").click();
});

/**
 * Helper: Shows the refresh and clear controls and hides the three upload buttons.
 * @param {string} fileType - "image", "audio", or "video"
 */
function showFileControls(fileType) {
  currentFileType = fileType;
  document.getElementById("upload-image-button").classList.add("hidden");
  document.getElementById("audioOptionsWrapper").classList.add("hidden");
  document.getElementById("upload-video-button").classList.add("hidden");
  document.getElementById("file-controls").classList.remove("hidden");
}

function startAudioRecording() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    console.error("getUserMedia not supported");
    return;
  }
  navigator.mediaDevices
    .getUserMedia({ audio: true })
    .then((stream) => {
      let options = { mimeType: "audio/webm;codecs=opus" };
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        options = { mimeType: "audio/webm" };
      }
      mediaRecorder = new MediaRecorder(stream, options);
      recordedChunks = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          recordedChunks.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        // Stop the timer that was tracking recording duration.
        clearInterval(recordingTimerInterval);
        // Calculate the recording duration manually.
        const recordingDuration = (Date.now() - recordingStartTime) / 1000;

        // Create the recorded audio file and URL.
        const audioBlob = new Blob(recordedChunks, { type: options.mimeType });
        const audioFile = new File([audioBlob], "recorded_audio.webm", {
          type: options.mimeType,
        });
        const audioURL = URL.createObjectURL(audioFile);
        const wrapper = document.getElementById("audio-preview-wrapper");

        // Build the custom audio preview HTML.
        wrapper.innerHTML = `
          <div class="post-audio-wrapper mb-4">
              <div class="audio-player p-5 rounded-[12px] w-full text-center" id="audio-recorded" data-audio-player="recorded">
                  <!-- Audio header -->
                  <div class="audio-header flex items-center gap-[10px]">
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path
                              d="M8.24421 9.66634C9.64153 9.66634 10.774 8.54729 10.774 7.16634V3.83301C10.774 2.45206 9.64153 1.33301 8.24421 1.33301C6.84689 1.33301 5.71445 2.45206 5.71445 3.83301V7.16634C5.71445 8.54729 6.84689 9.66634 8.24421 9.66634ZM13.1549 7.13658C13.1549 7.0711 13.1014 7.01753 13.0359 7.01753H12.143C12.0775 7.01753 12.024 7.0711 12.024 7.13658C12.024 9.22438 10.332 10.9163 8.24421 10.9163C6.15641 10.9163 4.46445 9.22438 4.46445 7.13658C4.46445 7.0711 4.41088 7.01753 4.3454 7.01753H3.45254C3.38707 7.01753 3.3335 7.0711 3.3335 7.13658C3.3335 9.647 5.21742 11.7184 7.64897 12.0116V13.5354H5.48677C5.2829 13.5354 5.11921 13.7482 5.11921 14.0116V14.5473C5.11921 14.6128 5.16088 14.6663 5.21147 14.6663H11.2769C11.3275 14.6663 11.3692 14.6128 11.3692 14.5473V14.0116C11.3692 13.7482 11.2055 13.5354 11.0017 13.5354H8.77992V12.019C11.2397 11.7512 13.1549 9.66783 13.1549 7.13658Z"
                              fill="#C29D68" />
                      </svg>
                  </div>
                  <!-- Audio element -->
                  <audio id="custom-audio" class="audio">
                      <source src="${audioURL}" type="${audioFile.type}">
                  </audio>
                  <!-- Controls -->
                  <div class="controls flex justify-center gap-[15px] my-[15px]">
                      <button class="bg-transparent border-none text-[#D4AF7A] cursor-pointer" id="rewind">
                          <svg width="17" height="16" viewBox="0 0 17 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path
                                  d="M15.1668 8.15293C15.167 9.77081 14.53 11.3237 13.3937 12.4754C12.2575 13.6271 10.7134 14.285 9.09568 14.3068H9.01299C7.44135 14.3107 5.92856 13.7092 4.78863 12.6273C4.73968 12.581 4.70033 12.5255 4.67282 12.464C4.64531 12.4025 4.63019 12.3362 4.62832 12.2688C4.62644 12.2015 4.63785 12.1344 4.66189 12.0715C4.68594 12.0085 4.72214 11.9509 4.76844 11.902C4.81474 11.853 4.87023 11.8137 4.93173 11.7862C4.99324 11.7587 5.05956 11.7435 5.12692 11.7417C5.19427 11.7398 5.26133 11.7512 5.32427 11.7752C5.38722 11.7993 5.44481 11.8355 5.49376 11.8818C6.22696 12.5732 7.14766 13.0333 8.14083 13.2046C9.134 13.3758 10.1556 13.2506 11.078 12.8447C12.0005 12.4387 12.7828 11.7699 13.3274 10.9218C13.8719 10.0738 14.1545 9.08408 14.1399 8.07636C14.1252 7.06864 13.8139 6.08758 13.2449 5.25573C12.676 4.42389 11.8745 3.77814 10.9406 3.39915C10.0068 3.02017 8.98194 2.92475 7.99417 3.12482C7.0064 3.32489 6.09948 3.81158 5.38671 4.52409C5.38148 4.52976 5.37591 4.53511 5.37004 4.54011L4.6944 5.1587L5.78414 6.24845C5.85694 6.31988 5.90678 6.41139 5.9273 6.51129C5.94782 6.61119 5.93809 6.71494 5.89935 6.80928C5.86061 6.90362 5.79461 6.98427 5.70981 7.04091C5.625 7.09756 5.52523 7.12763 5.42325 7.12729H2.34632C2.21032 7.12729 2.07988 7.07326 1.98371 6.97709C1.88753 6.88092 1.8335 6.75048 1.8335 6.61447V3.53755C1.83291 3.43585 1.86258 3.33626 1.91873 3.25146C1.97487 3.16666 2.05497 3.10047 2.14883 3.0613C2.24269 3.02214 2.34608 3.01177 2.44585 3.03151C2.54562 3.05125 2.63727 3.10021 2.70915 3.17217L3.96876 4.43499L4.67004 3.79396C5.53157 2.93578 6.62803 2.35208 7.82102 2.11655C9.01401 1.88101 10.25 2.0042 11.3731 2.47056C12.4961 2.93691 13.4558 3.72554 14.131 4.73687C14.8062 5.74821 15.1666 6.93691 15.1668 8.15293Z"
                              fill="#C29D68" />
                          </svg>
                      </button>
                      <div class="cursor-pointer" id="play-pause" data-audio-button="recorded"
                          onclick="togglePlayPause('custom-audio', this)">
                          <svg class="audioStateIcon playedIcon" width="33" height="32" viewBox="0 0 33 32" fill="none"
                              xmlns="http://www.w3.org/2000/svg">
                              <rect x="0.5" width="32" height="32" rx="16" fill="#C29D68" />
                              <path
                                  d="M22.448 15.9997C22.4484 16.1738 22.4038 16.345 22.3184 16.4968C22.2331 16.6485 22.1099 16.7756 21.9609 16.8657L12.7254 22.5154C12.5697 22.6107 12.3914 22.6628 12.2088 22.6662C12.0263 22.6695 11.8461 22.6241 11.687 22.5346C11.5294 22.4465 11.3981 22.318 11.3066 22.1623C11.2151 22.0066 11.1668 21.8293 11.1665 21.6488V10.3506C11.1668 10.17 11.2151 9.99276 11.3066 9.83707C11.3981 9.68137 11.5294 9.55286 11.687 9.46473C11.8461 9.37522 12.0263 9.3298 12.2088 9.33318C12.3914 9.33656 12.5697 9.38862 12.7254 9.48396L21.9609 15.1337C22.1099 15.2237 22.2331 15.3508 22.3184 15.5026C22.4038 15.6543 22.4484 15.8256 22.448 15.9997Z"
                              fill="#022327" />
                          </svg>
                          <svg class="audioStateIcon pausedIcon hidden" width="32" height="32" viewBox="0 0 32 32" fill="none"
                              xmlns="http://www.w3.org/2000/svg">
                              <rect width="32" height="32" rx="16" fill="#C29D68" />
                              <path
                                  d="M22.2222 10.4441V21.5552C22.2222 21.8499 22.1052 22.1325 21.8968 22.3409C21.6884 22.5493 21.4058 22.6663 21.1111 22.6663H18.3333C18.0386 22.6663 17.756 22.5493 17.5477 22.3409C17.3393 22.1325 17.2222 21.8499 17.2222 21.5552V10.4441C17.2222 10.1494 17.3393 9.86682 17.5477 9.65844C17.756 9.45007 18.0386 9.33301 18.3333 9.33301H21.1111C21.4058 9.33301 21.6884 9.45007 21.8968 9.65844C22.1052 9.86682 22.2222 10.1494 22.2222 10.4441ZM13.8889 9.33301H11.1111C10.8164 9.33301 10.5338 9.45007 10.3254 9.65844C10.1171 9.86682 10 10.1494 10 10.4441V21.5552C10 21.8499 10.1171 22.1325 10.3254 22.3409C10.5338 22.5493 10.8164 22.6663 11.1111 22.6663H13.8889C14.1836 22.6663 14.4662 22.5493 14.6746 22.3409C14.8829 22.1325 15 21.8499 15 21.5552V10.4441C15 10.1494 14.8829 9.86682 14.6746 9.65844C14.4662 9.45007 14.1836 9.33301 13.8889 9.33301Z"
                                  fill="#022327" />
                          </svg>
                      </div>
                      <button class="bg-transparent border-none text-[#D4AF7A] cursor-pointer" id="forward">
                          <svg width="17" height="16" viewBox="0 0 17 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path
                                  d="M15.1668 3.53784V6.61469C15.1668 6.75069 15.1128 6.88113 15.0166 6.9773C14.9205 7.07347 14.79 7.12749 14.654 7.12749H11.5772C11.4757 7.12757 11.3765 7.09754 11.2921 7.0412C11.2077 6.98486 11.1419 6.90474 11.103 6.81099C11.0642 6.71723 11.054 6.61406 11.0738 6.51453C11.0937 6.415 11.1426 6.3236 11.2144 6.25188L12.3041 5.16216L11.6278 4.54359L11.6118 4.5282C10.899 3.81572 9.99213 3.32904 9.00439 3.12897C8.01664 2.92891 6.99185 3.02432 6.05801 3.4033C5.12418 3.78227 4.32272 4.428 3.75375 5.25983C3.18477 6.09165 2.87351 7.07269 2.85885 8.08038C2.84419 9.08808 3.12677 10.0778 3.67131 10.9258C4.21584 11.7738 4.99818 12.4426 5.92059 12.8486C6.843 13.2545 7.86459 13.3797 8.85774 13.2085C9.85088 13.0372 10.7716 12.5772 11.5047 11.8857C11.5537 11.8394 11.6113 11.8032 11.6742 11.7792C11.7372 11.7551 11.8042 11.7437 11.8716 11.7456C11.9389 11.7475 12.0052 11.7626 12.0667 11.7901C12.1283 11.8176 12.1837 11.8569 12.23 11.9059C12.2763 11.9548 12.3125 12.0124 12.3366 12.0754C12.3606 12.1383 12.372 12.2054 12.3702 12.2727C12.3683 12.3401 12.3532 12.4064 12.3257 12.4679C12.2981 12.5294 12.2588 12.5849 12.2098 12.6312C11.0696 13.7109 9.55785 14.3109 7.98752 14.3068H7.90291C6.89507 14.293 5.90606 14.0318 5.02279 13.5463C4.13952 13.0607 3.38904 12.3657 2.83731 11.5222C2.28558 10.6786 1.94949 9.71253 1.85858 8.70871C1.76767 7.70489 1.92473 6.6941 2.31594 5.7652C2.70716 4.83629 3.32056 4.0177 4.10223 3.38137C4.8839 2.74504 5.80991 2.31046 6.79887 2.11583C7.78782 1.92119 8.80945 1.97245 9.77396 2.26511C10.7385 2.55777 11.6163 3.08287 12.3304 3.79425L13.031 4.43526L14.2912 3.17247C14.3631 3.10051 14.4547 3.05155 14.5545 3.03181C14.6543 3.01207 14.7576 3.02245 14.8515 3.06161C14.9454 3.10078 15.0255 3.16697 15.0816 3.25176C15.1377 3.33656 15.1674 3.43614 15.1668 3.53784Z"
                                  fill="#C29D68" />
                          </svg>
                      </button>
                  </div>
                  <!-- Progress and volume controls -->
                  <div class="progress-container flex items-center gap-[10px]">
                      <span id="current-time" class="page-text text-nowrap">0:00</span>
                      <input class="flex-grow-1 appearance-none bg-grey-200 h-[3px] w-full" type="range" id="progress" value="0"
                          min="0" step="0.1">
                      <span id="total-time" class="page-text text-nowrap">${formatTime(
                        recordingDuration
                      )}</span>
                      <button id="volume">
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path
                                  d="M14.4123 3.70994V20.2114C14.4144 20.3348 14.3844 20.4568 14.3254 20.5652C14.2663 20.6737 14.1801 20.765 14.0752 20.8302C13.9561 20.9011 13.8183 20.9344 13.6799 20.9258C13.5415 20.9172 13.4089 20.8671 13.2995 20.782L7.64758 16.386C7.6066 16.3536 7.57352 16.3123 7.55082 16.2653C7.52813 16.2183 7.51641 16.1667 7.51656 16.1144V7.81202C7.51672 7.75958 7.52883 7.70787 7.55199 7.66082C7.57514 7.61377 7.60872 7.57262 7.65017 7.5405L13.3021 3.14449C13.4259 3.04851 13.5788 2.99758 13.7355 3.00009C13.8921 3.0026 14.0433 3.05839 14.164 3.15828C14.2433 3.22641 14.3067 3.31114 14.3496 3.40647C14.3925 3.50181 14.4139 3.60541 14.4123 3.70994ZM5.79264 7.82581H3.37914C3.01337 7.82581 2.66258 7.97111 2.40394 8.22975C2.1453 8.48839 2 8.83918 2 9.20495V14.7215C2 15.0873 2.1453 15.4381 2.40394 15.6967C2.66258 15.9554 3.01337 16.1007 3.37914 16.1007H5.79264C5.88408 16.1007 5.97178 16.0643 6.03644 15.9997C6.1011 15.935 6.13742 15.8473 6.13742 15.7559V8.1706C6.13742 8.07915 6.1011 7.99146 6.03644 7.9268C5.97178 7.86214 5.88408 7.82581 5.79264 7.82581ZM16.7197 9.62214C16.6516 9.68198 16.596 9.75466 16.556 9.83602C16.5161 9.91738 16.4925 10.0058 16.4868 10.0963C16.481 10.1868 16.4931 10.2775 16.5224 10.3632C16.5518 10.449 16.5977 10.5282 16.6577 10.5962C16.9903 10.9739 17.1738 11.4599 17.1738 11.9632C17.1738 12.4665 16.9903 12.9526 16.6577 13.3303C16.5961 13.398 16.5486 13.4772 16.518 13.5634C16.4873 13.6495 16.4741 13.741 16.4791 13.8323C16.4842 13.9236 16.5073 14.013 16.5472 14.0953C16.5871 14.1777 16.643 14.2512 16.7116 14.3117C16.7802 14.3722 16.8602 14.4184 16.9469 14.4477C17.0335 14.477 17.1251 14.4887 17.2164 14.4823C17.3076 14.4758 17.3967 14.4513 17.4783 14.4101C17.56 14.3689 17.6326 14.3118 17.692 14.2423C18.2467 13.6126 18.5527 12.8023 18.5527 11.9632C18.5527 11.1241 18.2467 10.3138 17.692 9.6842C17.6322 9.61598 17.5595 9.56025 17.478 9.52019C17.3966 9.48014 17.308 9.45655 17.2175 9.45078C17.1269 9.44502 17.0361 9.45719 16.9502 9.48659C16.8644 9.516 16.7852 9.56206 16.7172 9.62214H16.7197ZM20.2443 7.36639C20.185 7.29547 20.112 7.2372 20.0297 7.19507C19.9474 7.15293 19.8574 7.12777 19.7652 7.1211C19.673 7.11443 19.5803 7.12637 19.4928 7.15623C19.4053 7.18608 19.3247 7.23322 19.2558 7.29487C19.1868 7.35651 19.131 7.43138 19.0916 7.51503C19.0522 7.59869 19.03 7.68941 19.0264 7.78181C19.0228 7.8742 19.0378 7.96639 19.0705 8.05287C19.1032 8.13936 19.153 8.21838 19.2168 8.28524C20.1216 9.29669 20.6219 10.6062 20.6219 11.9632C20.6219 13.3203 20.1216 14.6298 19.2168 15.6412C19.153 15.7081 19.1032 15.7871 19.0705 15.8736C19.0378 15.9601 19.0228 16.0523 19.0264 16.1447C19.03 16.2371 19.0522 16.3278 19.0916 16.4114C19.131 16.4951 19.1868 16.57 19.2558 16.6316C19.3247 16.6932 19.4053 16.7404 19.4928 16.7702C19.5803 16.8001 19.673 16.812 19.7652 16.8054C19.8574 16.7987 19.9474 16.7735 20.0297 16.7314C20.112 16.6893 20.185 16.631 20.2443 16.5601C21.3749 15.2959 22 13.6593 22 11.9632C22 10.2672 21.3749 8.63061 20.2443 7.36639Z"
                                  fill="#C29D68" />
                          </svg>
                      </button>
                  </div>
              </div>
          </div>
        `;

        // Make sure the preview wrapper is visible.
        wrapper.classList.remove("hidden");
        currentRecordedAudioFile = audioFile;
        console.log("Recorded duration:", recordingDuration);
      };

      mediaRecorder.start();
      recordingStartTime = Date.now();
      recordingTimerInterval = setInterval(() => {
        const elapsedSec = Math.floor((Date.now() - recordingStartTime) / 1000);
        document.querySelector(".recordingTimer").textContent =
          "0:" + (elapsedSec < 10 ? "0" : "") + elapsedSec;
      }, 1000);
      // Show the recording UI
      document
        .querySelector(".fullAudioRecordingWrapper")
        .classList.remove("hidden");
      showFileControls("audio");
      setupWaveform(stream);
    })
    .catch((err) =>
      console.error("Failed to get user media for audio recording:", err)
    );
}

// Set up the canvas and audio context for the waveform
function setupWaveform(stream) {
  const waveWrapper = document.querySelector(".waveWrapper");
  // Create the canvas if it doesn't exist
  let canvas = document.getElementById("audioWaveCanvas");
  if (!canvas) {
    canvas = document.createElement("canvas");
    canvas.id = "audioWaveCanvas";
    waveWrapper.appendChild(canvas);
  }
  const canvasCtx = canvas.getContext("2d");
  // Resize canvas to fit its container
  function resizeCanvas() {
    canvas.width = waveWrapper.offsetWidth;
    canvas.height = waveWrapper.offsetHeight;
  }
  resizeCanvas();
  window.addEventListener("resize", resizeCanvas);

  // Create an AudioContext and AnalyserNode
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const source = audioCtx.createMediaStreamSource(stream);
  analyser = audioCtx.createAnalyser();
  analyser.fftSize = 2048;
  bufferLength = analyser.fftSize;
  dataArray = new Uint8Array(bufferLength);
  source.connect(analyser);

  // Begin drawing the waveform
  drawWaveform(canvasCtx, canvas.width, canvas.height);
}

// Continuously draw the waveform from the analyser data
function drawWaveform(canvasCtx, width, height) {
  animationId = requestAnimationFrame(() =>
    drawWaveform(canvasCtx, width, height)
  );
  analyser.getByteTimeDomainData(dataArray);
  canvasCtx.clearRect(0, 0, width, height);
  canvasCtx.lineWidth = 2;
  canvasCtx.strokeStyle = "#C29D68";
  canvasCtx.beginPath();

  const sliceWidth = width / bufferLength;
  let x = 0;
  for (let i = 0; i < bufferLength; i++) {
    const v = dataArray[i] / 128.0; // Normalize to [0,2]
    const y = (v * height) / 2;
    if (i === 0) {
      canvasCtx.moveTo(x, y);
    } else {
      canvasCtx.lineTo(x, y);
    }
    x += sliceWidth;
  }
  canvasCtx.lineTo(width, height / 2);
  canvasCtx.stroke();
}

function stopAudioRecording() {
  if (mediaRecorder && mediaRecorder.state === "recording") {
    mediaRecorder.stop();
    clearInterval(recordingTimerInterval);
    recordingTimerInterval = null;
    document
      .querySelector(".fullAudioRecordingWrapper")
      .classList.add("hidden");
    showFileControls("audio");
    // Remove hidden from audio preview in case it was hidden
    document.getElementById("audio-preview-wrapper").classList.remove("hidden");
  }
  if (animationId) {
    cancelAnimationFrame(animationId);
  }
  if (audioCtx) {
    audioCtx.close();
  }
  // Stop all media stream tracks to release the microphone
  if (mediaRecorder && mediaRecorder.stream) {
    mediaRecorder.stream.getTracks().forEach((track) => track.stop());
  }
}

function resetRecordingState() {
  currentRecordedAudioFile = null;
  recordedChunks = [];
  if (mediaRecorder && mediaRecorder.state === "recording") {
    mediaRecorder.stop();
  }
  clearInterval(recordingTimerInterval);
  recordingTimerInterval = null;
  document.querySelector(".recordingTimer").textContent = "0:00";
  document.querySelector(".fullAudioRecordingWrapper").classList.add("hidden");
  const audioPreview = document.getElementById("audio-preview-wrapper");
  audioPreview.innerHTML = "";
  audioPreview.classList.add("hidden");
}

// --- Updated resetAudioRecording: Also clears the file input ---
function resetAudioRecording() {
  resetRecordingState();
  document.getElementById("post-audio-upload").value = "";
}

// -------------------------
// File Input Event Listeners
// -------------------------

// IMAGE file input
document
  .getElementById("post-image-upload")
  .addEventListener("change", function (e) {
    const file = e.target.files[0];
    const wrapper = document.getElementById("image-preview-wrapper");
    wrapper.innerHTML = ""; // Clear previous preview if any

    if (file) {
      // Clear the other file inputs and their previews
      document.getElementById("post-audio-upload").value = "";
      document.getElementById("audio-preview-wrapper").innerHTML = "";
      document.getElementById("post-video-upload").value = "";
      document.getElementById("video-preview-wrapper").innerHTML = "";
      resetAudioRecording();

      // Create and show the image preview
      const imageURL = URL.createObjectURL(file);
      const img = document.createElement("img");
      img.src = imageURL;
      img.alt = "Image Preview";
      img.classList.add("w-full", "object-contain", "rounded");
      wrapper.appendChild(img);

      // Show refresh/clear controls for images
      showFileControls("image");
    }
  });

// AUDIO file input
document
  .getElementById("post-audio-upload")
  .addEventListener("change", function (e) {
    const file = e.target.files[0];
    const wrapper = document.getElementById("audio-preview-wrapper");
    wrapper.innerHTML = "";

    if (file) {
      // Clear image and video inputs and their previews
      document.getElementById("post-image-upload").value = "";
      document.getElementById("image-preview-wrapper").innerHTML = "";
      document.getElementById("post-video-upload").value = "";
      document.getElementById("video-preview-wrapper").innerHTML = "";
      resetRecordingState();

      const audioURL = URL.createObjectURL(file);

      // Build the custom audio player markup
      wrapper.innerHTML = `
      <div class="post-audio-wrapper mb-4">
        <div class="audio-player p-5 rounded-[12px] w-full text-center" id="audio-uploaded" data-audio-player="uploaded">
          <!-- Audio header -->
          <div class="audio-header flex items-center gap-[10px]">
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" 
                                    xmlns="http://www.w3.org/2000/svg">
                                <path d="M8.24421 9.66634C9.64153 9.66634 10.774 8.54729 10.774 7.16634V3.83301C10.774 2.45206 9.64153 1.33301 8.24421 1.33301C6.84689 1.33301 5.71445 2.45206 5.71445 3.83301V7.16634C5.71445 8.54729 6.84689 9.66634 8.24421 9.66634ZM13.1549 7.13658C13.1549 7.0711 13.1014 7.01753 13.0359 7.01753H12.143C12.0775 7.01753 12.024 7.0711 12.024 7.13658C12.024 9.22438 10.332 10.9163 8.24421 10.9163C6.15641 10.9163 4.46445 9.22438 4.46445 7.13658C4.46445 7.0711 4.41088 7.01753 4.3454 7.01753H3.45254C3.38707 7.01753 3.3335 7.0711 3.3335 7.13658C3.3335 9.647 5.21742 11.7184 7.64897 12.0116V13.5354H5.48677C5.2829 13.5354 5.11921 13.7482 5.11921 14.0116V14.5473C5.11921 14.6128 5.16088 14.6663 5.21147 14.6663H11.2769C11.3275 14.6663 11.3692 14.6128 11.3692 14.5473V14.0116C11.3692 13.7482 11.2055 13.5354 11.0017 13.5354H8.77992V12.019C11.2397 11.7512 13.1549 9.66783 13.1549 7.13658Z" fill="#C29D68"/>
                                </svg>
          </div>

          <!-- Audio element -->
          <audio id="custom-audio-upload" class="audio">
            <source src="${audioURL}" type="${file.type}">
          </audio>

          <!-- Controls -->
          <div class="controls flex justify-center gap-[15px] my-[15px]">
            <button class="bg-transparent border-none text-[#D4AF7A] cursor-pointer" id="rewind-upload">
                                    <svg width="17" height="16" viewBox="0 0 17 16" fill="none" 
                                        xmlns="http://www.w3.org/2000/svg">
                                        <path d="M15.1668 8.15293C15.167 9.77081 14.53 11.3237 13.3937 12.4754C12.2575 13.6271 10.7134 14.285 9.09568 14.3068H9.01299C7.44135 14.3107 5.92856 13.7092 4.78863 12.6273C4.73968 12.581 4.70033 12.5255 4.67282 12.464C4.64531 12.4025 4.63019 12.3362 4.62832 12.2688C4.62644 12.2015 4.63785 12.1344 4.66189 12.0715C4.68594 12.0085 4.72214 11.9509 4.76844 11.902C4.81474 11.853 4.87023 11.8137 4.93173 11.7862C4.99324 11.7587 5.05956 11.7435 5.12692 11.7417C5.19427 11.7398 5.26133 11.7512 5.32427 11.7752C5.38722 11.7993 5.44481 11.8355 5.49376 11.8818C6.22696 12.5732 7.14766 13.0333 8.14083 13.2046C9.134 13.3758 10.1556 13.2506 11.078 12.8447C12.0005 12.4387 12.7828 11.7699 13.3274 10.9218C13.8719 10.0738 14.1545 9.08408 14.1399 8.07636C14.1252 7.06864 13.8139 6.08758 13.2449 5.25573C12.676 4.42389 11.8745 3.77814 10.9406 3.39915C10.0068 3.02017 8.98194 2.92475 7.99417 3.12482C7.0064 3.32489 6.09948 3.81158 5.38671 4.52409C5.38148 4.52976 5.37591 4.53511 5.37004 4.54011L4.6944 5.1587L5.78414 6.24845C5.85694 6.31988 5.90678 6.41139 5.9273 6.51129C5.94782 6.61119 5.93809 6.71494 5.89935 6.80928C5.86061 6.90362 5.79461 6.98427 5.70981 7.04091C5.625 7.09756 5.52523 7.12763 5.42325 7.12729H2.34632C2.21032 7.12729 2.07988 7.07326 1.98371 6.97709C1.88753 6.88092 1.8335 6.75048 1.8335 6.61447V3.53755C1.83291 3.43585 1.86258 3.33626 1.91873 3.25146C1.97487 3.16666 2.05497 3.10047 2.14883 3.0613C2.24269 3.02214 2.34608 3.01177 2.44585 3.03151C2.54562 3.05125 2.63727 3.10021 2.70915 3.17217L3.96876 4.43499L4.67004 3.79396C5.53157 2.93578 6.62803 2.35208 7.82102 2.11655C9.01401 1.88101 10.25 2.0042 11.3731 2.47056C12.4961 2.93691 13.4558 3.72554 14.131 4.73687C14.8062 5.74821 15.1666 6.93691 15.1668 8.15293Z" fill="#C29D68"/>
                                    </svg>  
            </button>
            <div class="cursor-pointer" id="play-pause-upload" data-audio-button="uploaded" onclick="togglePlayPause('custom-audio-upload', this)">
                                        <svg class = "audioStateIcon playedIcon" width="33" height="32" viewBox="0 0 33 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <rect x="0.5" width="32" height="32" rx="16" fill="#C29D68"/>
                                            <path d="M22.448 15.9997C22.4484 16.1738 22.4038 16.345 22.3184 16.4968C22.2331 16.6485 22.1099 16.7756 21.9609 16.8657L12.7254 22.5154C12.5697 22.6107 12.3914 22.6628 12.2088 22.6662C12.0263 22.6695 11.8461 22.6241 11.687 22.5346C11.5294 22.4465 11.3981 22.318 11.3066 22.1623C11.2151 22.0066 11.1668 21.8293 11.1665 21.6488V10.3506C11.1668 10.17 11.2151 9.99276 11.3066 9.83707C11.3981 9.68137 11.5294 9.55286 11.687 9.46473C11.8461 9.37522 12.0263 9.3298 12.2088 9.33318C12.3914 9.33656 12.5697 9.38862 12.7254 9.48396L21.9609 15.1337C22.1099 15.2237 22.2331 15.3508 22.3184 15.5026C22.4038 15.6543 22.4484 15.8256 22.448 15.9997Z" fill="#022327"/>
                                        </svg>
                                        <svg class = "audioStateIcon pausedIcon hidden" width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <rect width="32" height="32" rx="16" fill="#C29D68"/>
                                            <path d="M22.2222 10.4441V21.5552C22.2222 21.8499 22.1052 22.1325 21.8968 22.3409C21.6884 22.5493 21.4058 22.6663 21.1111 22.6663H18.3333C18.0386 22.6663 17.756 22.5493 17.5477 22.3409C17.3393 22.1325 17.2222 21.8499 17.2222 21.5552V10.4441C17.2222 10.1494 17.3393 9.86682 17.5477 9.65844C17.756 9.45007 18.0386 9.33301 18.3333 9.33301H21.1111C21.4058 9.33301 21.6884 9.45007 21.8968 9.65844C22.1052 9.86682 22.2222 10.1494 22.2222 10.4441ZM13.8889 9.33301H11.1111C10.8164 9.33301 10.5338 9.45007 10.3254 9.65844C10.1171 9.86682 10 10.1494 10 10.4441V21.5552C10 21.8499 10.1171 22.1325 10.3254 22.3409C10.5338 22.5493 10.8164 22.6663 11.1111 22.6663H13.8889C14.1836 22.6663 14.4662 22.5493 14.6746 22.3409C14.8829 22.1325 15 21.8499 15 21.5552V10.4441C15 10.1494 14.8829 9.86682 14.6746 9.65844C14.4662 9.45007 14.1836 9.33301 13.8889 9.33301Z" fill="#022327"/>
                                        </svg>  
            </div>
            <button class="bg-transparent border-none text-[#D4AF7A] cursor-pointer" id="forward-upload">
                                    <svg width="17" height="16" viewBox="0 0 17 16" fill="none" 
                                        xmlns="http://www.w3.org/2000/svg">
                                        <path d="M15.1668 3.53784V6.61469C15.1668 6.75069 15.1128 6.88113 15.0166 6.9773C14.9205 7.07347 14.79 7.12749 14.654 7.12749H11.5772C11.4757 7.12757 11.3765 7.09754 11.2921 7.0412C11.2077 6.98486 11.1419 6.90474 11.103 6.81099C11.0642 6.71723 11.054 6.61406 11.0738 6.51453C11.0937 6.415 11.1426 6.3236 11.2144 6.25188L12.3041 5.16216L11.6278 4.54359L11.6118 4.5282C10.899 3.81572 9.99213 3.32904 9.00439 3.12897C8.01664 2.92891 6.99185 3.02432 6.05801 3.4033C5.12418 3.78227 4.32272 4.428 3.75375 5.25983C3.18477 6.09165 2.87351 7.07269 2.85885 8.08038C2.84419 9.08808 3.12677 10.0778 3.67131 10.9258C4.21584 11.7738 4.99818 12.4426 5.92059 12.8486C6.843 13.2545 7.86459 13.3797 8.85774 13.2085C9.85088 13.0372 10.7716 12.5772 11.5047 11.8857C11.5537 11.8394 11.6113 11.8032 11.6742 11.7792C11.7372 11.7551 11.8042 11.7437 11.8716 11.7456C11.9389 11.7475 12.0052 11.7626 12.0667 11.7901C12.1283 11.8176 12.1837 11.8569 12.23 11.9059C12.2763 11.9548 12.3125 12.0124 12.3366 12.0754C12.3606 12.1383 12.372 12.2054 12.3702 12.2727C12.3683 12.3401 12.3532 12.4064 12.3257 12.4679C12.2981 12.5294 12.2588 12.5849 12.2098 12.6312C11.0696 13.7109 9.55785 14.3109 7.98752 14.3068H7.90291C6.89507 14.293 5.90606 14.0318 5.02279 13.5463C4.13952 13.0607 3.38904 12.3657 2.83731 11.5222C2.28558 10.6786 1.94949 9.71253 1.85858 8.70871C1.76767 7.70489 1.92473 6.6941 2.31594 5.7652C2.70716 4.83629 3.32056 4.0177 4.10223 3.38137C4.8839 2.74504 5.80991 2.31046 6.79887 2.11583C7.78782 1.92119 8.80945 1.97245 9.77396 2.26511C10.7385 2.55777 11.6163 3.08287 12.3304 3.79425L13.031 4.43526L14.2912 3.17247C14.3631 3.10051 14.4547 3.05155 14.5545 3.03181C14.6543 3.01207 14.7576 3.02245 14.8515 3.06161C14.9454 3.10078 15.0255 3.16697 15.0816 3.25176C15.1377 3.33656 15.1674 3.43614 15.1668 3.53784Z" fill="#C29D68"/>
                                    </svg>   
            </button>
          </div>
          <!-- Progress and volume controls -->
          <div class="progress-container flex items-center gap-[10px]">
            <span id="current-time-upload" class="page-text text-nowrap">0:00</span>
            <input class="flex-grow-1 appearance-none bg-grey-200 h-[3px] w-full" type="range" id="progress-upload" value="0" min="0" step="0.1">
            <span id="total-time-upload" class="page-text text-nowrap">0:00</span>
            <button id="volume-upload">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" 
                                        xmlns="http://www.w3.org/2000/svg">
                                        <path d="M14.4123 3.70994V20.2114C14.4144 20.3348 14.3844 20.4568 14.3254 20.5652C14.2663 20.6737 14.1801 20.765 14.0752 20.8302C13.9561 20.9011 13.8183 20.9344 13.6799 20.9258C13.5415 20.9172 13.4089 20.8671 13.2995 20.782L7.64758 16.386C7.6066 16.3536 7.57352 16.3123 7.55082 16.2653C7.52813 16.2183 7.51641 16.1667 7.51656 16.1144V7.81202C7.51672 7.75958 7.52883 7.70787 7.55199 7.66082C7.57514 7.61377 7.60872 7.57262 7.65017 7.5405L13.3021 3.14449C13.4259 3.04851 13.5788 2.99758 13.7355 3.00009C13.8921 3.0026 14.0433 3.05839 14.164 3.15828C14.2433 3.22641 14.3067 3.31114 14.3496 3.40647C14.3925 3.50181 14.4139 3.60541 14.4123 3.70994ZM5.79264 7.82581H3.37914C3.01337 7.82581 2.66258 7.97111 2.40394 8.22975C2.1453 8.48839 2 8.83918 2 9.20495V14.7215C2 15.0873 2.1453 15.4381 2.40394 15.6967C2.66258 15.9554 3.01337 16.1007 3.37914 16.1007H5.79264C5.88408 16.1007 5.97178 16.0643 6.03644 15.9997C6.1011 15.935 6.13742 15.8473 6.13742 15.7559V8.1706C6.13742 8.07915 6.1011 7.99146 6.03644 7.9268C5.97178 7.86214 5.88408 7.82581 5.79264 7.82581ZM16.7197 9.62214C16.6516 9.68198 16.596 9.75466 16.556 9.83602C16.5161 9.91738 16.4925 10.0058 16.4868 10.0963C16.481 10.1868 16.4931 10.2775 16.5224 10.3632C16.5518 10.449 16.5977 10.5282 16.6577 10.5962C16.9903 10.9739 17.1738 11.4599 17.1738 11.9632C17.1738 12.4665 16.9903 12.9526 16.6577 13.3303C16.5961 13.398 16.5486 13.4772 16.518 13.5634C16.4873 13.6495 16.4741 13.741 16.4791 13.8323C16.4842 13.9236 16.5073 14.013 16.5472 14.0953C16.5871 14.1777 16.643 14.2512 16.7116 14.3117C16.7802 14.3722 16.8602 14.4184 16.9469 14.4477C17.0335 14.477 17.1251 14.4887 17.2164 14.4823C17.3076 14.4758 17.3967 14.4513 17.4783 14.4101C17.56 14.3689 17.6326 14.3118 17.692 14.2423C18.2467 13.6126 18.5527 12.8023 18.5527 11.9632C18.5527 11.1241 18.2467 10.3138 17.692 9.6842C17.6322 9.61598 17.5595 9.56025 17.478 9.52019C17.3966 9.48014 17.308 9.45655 17.2175 9.45078C17.1269 9.44502 17.0361 9.45719 16.9502 9.48659C16.8644 9.516 16.7852 9.56206 16.7172 9.62214H16.7197ZM20.2443 7.36639C20.185 7.29547 20.112 7.2372 20.0297 7.19507C19.9474 7.15293 19.8574 7.12777 19.7652 7.1211C19.673 7.11443 19.5803 7.12637 19.4928 7.15623C19.4053 7.18608 19.3247 7.23322 19.2558 7.29487C19.1868 7.35651 19.131 7.43138 19.0916 7.51503C19.0522 7.59869 19.03 7.68941 19.0264 7.78181C19.0228 7.8742 19.0378 7.96639 19.0705 8.05287C19.1032 8.13936 19.153 8.21838 19.2168 8.28524C20.1216 9.29669 20.6219 10.6062 20.6219 11.9632C20.6219 13.3203 20.1216 14.6298 19.2168 15.6412C19.153 15.7081 19.1032 15.7871 19.0705 15.8736C19.0378 15.9601 19.0228 16.0523 19.0264 16.1447C19.03 16.2371 19.0522 16.3278 19.0916 16.4114C19.131 16.4951 19.1868 16.57 19.2558 16.6316C19.3247 16.6932 19.4053 16.7404 19.4928 16.7702C19.5803 16.8001 19.673 16.812 19.7652 16.8054C19.8574 16.7987 19.9474 16.7735 20.0297 16.7314C20.112 16.6893 20.185 16.631 20.2443 16.5601C21.3749 15.2959 22 13.6593 22 11.9632C22 10.2672 21.3749 8.63061 20.2443 7.36639Z" fill="white"/>
                                    </svg>   
            </button>
          </div>
        </div>
      </div>
    `;

      // Ensure the preview wrapper is visible and update file controls
      wrapper.classList.remove("hidden");
      showFileControls("audio");

      // Wait for metadata to load to update the total duration
      const audioElem = document.getElementById("custom-audio-upload");
      audioElem.addEventListener("loadedmetadata", () => {
        const totalTimeSpan = document.getElementById("total-time-upload");
        totalTimeSpan.textContent = formatTime(audioElem.duration);
      });
    }
  });

// VIDEO file input
document
  .getElementById("post-video-upload")
  .addEventListener("change", function (e) {
    const file = e.target.files[0];
    const wrapper = document.getElementById("video-preview-wrapper");
    wrapper.innerHTML = "";

    if (file) {
      // Clear image and audio inputs and their previews
      document.getElementById("post-image-upload").value = "";
      document.getElementById("image-preview-wrapper").innerHTML = "";
      document.getElementById("post-audio-upload").value = "";
      document.getElementById("audio-preview-wrapper").innerHTML = "";
      resetAudioRecording();

      // Create and show the video preview
      const videoURL = URL.createObjectURL(file);
      const video = document.createElement("video");
      video.controls = true;
      video.width = 300; // adjust as needed
      video.classList.add("rounded");
      const source = document.createElement("source");
      source.src = videoURL;
      source.type = file.type;
      video.appendChild(source);
      wrapper.appendChild(video);

      // Show refresh/clear controls for video
      showFileControls("video");
    }
  });

// ---------------- Event Listeners for New Audio Recording Controls ----------------
// Start recording when the dropdown "Record Audio" is clicked
document.getElementById("record-audio-button").addEventListener("click", () => {
  // Start a new recording session only if not already recording
  if (!mediaRecorder || mediaRecorder.state !== "recording") {
    startAudioRecording();
  }
});

document.querySelector(".stopRecording").addEventListener("click", () => {
  stopAudioRecording();
});

document.querySelector(".replaceRecording").addEventListener("click", () => {
  resetAudioRecording();
  startAudioRecording();
});

document.querySelector(".deleteRecording").addEventListener("click", () => {
  // If a recording is in progress, override onstop so it doesn't create a preview.
  if (mediaRecorder && mediaRecorder.state === "recording") {
    mediaRecorder.onstop = function () {};
  }
  resetAudioRecording();

  // Ensure the audio preview container is cleared and remains hidden.
  const audioPreviewWrapper = document.getElementById("audio-preview-wrapper");
  audioPreviewWrapper.innerHTML = "";
  audioPreviewWrapper.classList.add("hidden");

  currentFileType = null;
  currentRecordedAudioFile = null;
  document.getElementById("file-controls").classList.add("hidden");
  document.getElementById("upload-image-button").classList.remove("hidden");
  document.getElementById("audioOptionsWrapper").classList.remove("hidden");
  document.getElementById("upload-video-button").classList.remove("hidden");
});

document.querySelector(".approveRecording").addEventListener("click", () => {
  if (mediaRecorder && mediaRecorder.state === "recording") {
    stopAudioRecording();
  }
  document.querySelector(".fullAudioRecordingWrapper").classList.add("hidden");
  document.getElementById("audio-preview-wrapper").classList.remove("hidden");
});

// Refresh: Clears the current preview and re-opens the same file input so the user can re-upload a file of that type.
document
  .getElementById("refresh-upload")
  .addEventListener("click", function () {
    if (currentFileType === "image") {
      document.getElementById("image-preview-wrapper").innerHTML = "";
      document.getElementById("post-image-upload").value = "";
      // Trigger file selection dialog (since the user clicked refresh, which is a user gesture)
      document.getElementById("post-image-upload").click();
    } else if (currentFileType === "audio") {
      document.getElementById("audio-preview-wrapper").innerHTML = "";
      document.getElementById("post-audio-upload").value = "";
      currentRecordedAudioFile = null;
      document.getElementById("post-audio-upload").click();
    } else if (currentFileType === "video") {
      document.getElementById("video-preview-wrapper").innerHTML = "";
      document.getElementById("post-video-upload").value = "";
      document.getElementById("post-video-upload").click();
    }
  });

// Clear (Delete): Clears the current preview and resets the UI so the three file upload buttons appear again.
document.getElementById("delete-upload").addEventListener("click", function () {
  if (currentFileType === "image") {
    document.getElementById("image-preview-wrapper").innerHTML = "";
    document.getElementById("post-image-upload").value = "";
  } else if (currentFileType === "audio") {
    document.getElementById("audio-preview-wrapper").innerHTML = "";
    document.getElementById("post-audio-upload").value = "";
    currentRecordedAudioFile = null;
  } else if (currentFileType === "video") {
    document.getElementById("video-preview-wrapper").innerHTML = "";
    document.getElementById("post-video-upload").value = "";
  }
  // Reset state
  currentFileType = null;
  // Hide the refresh/clear controls
  document.getElementById("file-controls").classList.add("hidden");
  // Show all three upload buttons so the user may pick any file type
  document.getElementById("upload-image-button").classList.remove("hidden");
  document.getElementById("audioOptionsWrapper").classList.remove("hidden");
  document.getElementById("upload-video-button").classList.remove("hidden");
});

document.getElementById("submit-post").addEventListener("click", async (e) => {
  // Get post content and file inputs...
  const editor = document.getElementById("post-editor");
  const textContent = editor.innerText.trim();
  const imageInput = document.getElementById("post-image-upload");
  const audioInput = document.getElementById("post-audio-upload");
  const videoInput = document.getElementById("post-video-upload");
  const imageFile = imageInput.files[0];
  const audioFile = audioInput.files[0] || currentRecordedAudioFile;
  const videoFile = videoInput.files[0];

  let uploadedFile = null;
  let fileType = null;
  if (imageFile) {
    uploadedFile = imageFile;
    fileType = "Image";
  } else if (audioFile) {
    uploadedFile = audioFile;
    fileType = "Audio";
  } else if (videoFile) {
    uploadedFile = videoFile;
    fileType = "Video";
  }

  // At least one (text or file) is required.
  if (!textContent && !uploadedFile) {
    UIManager.showError("Post content or a file is required.");
    return;
  }

  // Hide the modal (your modal hide logic)
  document.getElementById("postNewModal").hide();
  resetPostModal();

  // Process mentions...
  const mentionedIds = [];
  document.querySelectorAll(".mention").forEach((mention) => {
    const id = mention.dataset.contactId;
    if (id) {
      if (id === "all" && MentionManager.allContacts) {
        MentionManager.allContacts.forEach((contact) => {
          if (!mentionedIds.includes(contact.id)) {
            mentionedIds.push(contact.id);
          }
        });
      } else if (!mentionedIds.includes(id)) {
        mentionedIds.push(id);
      }
    }
  });

  // Create a temporary post for immediate UI feedback.
  const tempPost = {
    id: `temp-${Date.now()}`,
    author_id: forumManager.userId,
    disableComments: false,
    file_content: uploadedFile
      ? { link: URL.createObjectURL(uploadedFile) }
      : null,
    file_tpe: uploadedFile ? fileType : null,
    author: {
      name: forumManager.fullName,
      profileImage: forumManager.defaultLoggedInAuthorImage,
    },
    date: "Just now",
    content: textContent,
  };

  const template = $.templates("#post-template");
  const postContainer = document.querySelector(CONFIG.selectors.postsContainer);
  postContainer.insertAdjacentHTML("afterbegin", template.render(tempPost));
  const postElement = postContainer.firstElementChild;
  postElement.classList.add("state-disabled");

  // Process file upload if applicable.
  let fileData = null;
  const fileFields = [];
  if (uploadedFile) {
    fileFields.push({
      fieldName: "file_content",
      file: uploadedFile,
    });
  }

  // Separate try/catch for post creation (mutation)
  let newPost;
  try {
    if (fileFields.length > 0) {
      const toSubmitFields = {};
      await processFileFields(
        toSubmitFields,
        fileFields,
        awsParam,
        awsParamUrl
      );
      fileData =
        typeof toSubmitFields.file_content === "string"
          ? JSON.parse(toSubmitFields.file_content)
          : toSubmitFields.file_content;
      fileData.name = fileData.name || uploadedFile.name;
      fileData.size = fileData.size || uploadedFile.size;
      fileData.type = fileData.type || uploadedFile.type;
    }

    // Send the create post mutation.
    const response = await ApiService.query(
      `
        mutation createForumPost($payload: ForumPostCreateInput!) {
          createForumPost(payload: $payload) {
            id
            author_id
            post_copy
            file_tpe
            file_content
            related_course_id
            Mentioned_Users {
              id
            }
          }
        }
      `,
      {
        payload: {
          author_id: forumManager.userId,
          post_copy: textContent,
          Mentioned_Users: mentionedIds.map((id) => ({ id: Number(id) })),
          related_course_id: courseID,
          file_tpe: uploadedFile ? fileType : null,
          file_content: fileData ? fileData : null,
        },
      }
    );

    newPost = response.createForumPost;
    postElement.dataset.postId = newPost.id;
    formatPreiview();
  } catch (error) {
    console.error("Error during post creation:", error);
    UIManager.showError("Failed to post. Please try again.");
    postContainer.removeChild(postElement);
    return;
  }

  // Now try to fetch additional post details.
  try {
    const fetchResponse = await ApiService.query(
      `
        query calcForumPosts($id: PriestessForumPostID) {
          calcForumPosts(query: [{ where: { id: $id } }]) {
            ID: field(arg: ["id"])
            Author_ID: field(arg: ["author_id"])
            Author_First_Name: field(arg: ["Author", "first_name"])
            Author_Last_Name: field(arg: ["Author", "last_name"])
            Author_Profile_Image: field(arg: ["Author", "profile_image"])
            Date_Added: field(arg: ["created_at"])
            Post_Copy: field(arg: ["post_copy"])
            File_Tpe: field(arg: ["file_tpe"])
            File_Content: field(arg: ["file_content"])
            ForumCommentsTotalCount: countDistinct(args: [{ field: ["ForumComments", "id"] }])
            Member_Post_Upvotes_DataTotal_Count: countDistinct(args: [{ field: ["Member_Post_Upvotes_Data", "id"] }])
            Disable_New_Comments: field(arg: ["disable_new_comments"])
          }
        }
      `,
      { id: newPost.id }
    );

    const actualPost = fetchResponse.calcForumPosts[0];
    // Update the postElement with actualPost details.
    postElement.querySelector(".vote-button").dataset.postId = actualPost.ID;
    postElement.querySelector(".post-author-name").textContent =
      actualPost.Author_First_Name + " " + actualPost.Author_Last_Name;
    postElement.querySelector(".post-author-image").src =
      actualPost.Author_Forum_Image?.trim()
        ? actualPost.Author_Forum_Image
        : DEFAULT_AVATAR;
    postElement.querySelector(".post-copy-content").textContent =
      actualPost.Post_Copy;
    postElement.querySelector(".postCommentCount").textContent =
      actualPost.ForumCommentsTotalCount;
    postElement.querySelector(".postVoteCount").textContent =
      actualPost.Member_Post_Upvotes_DataTotal_Count;
    postElement.querySelector(".delete-post-btn").dataset.postId =
      actualPost.ID;
    postElement.querySelector(".load-comments-btn").dataset.postId =
      actualPost.ID;
    postElement.dataset.postId = actualPost.ID;

    // Update audio player elements if necessary.
    const playPauseButton = postElement.querySelector("#play-pause");
    if (playPauseButton) {
      playPauseButton.dataset.audioButton = actualPost.ID;
    }
    const audioPlayer = postElement.querySelector(".audio-player");
    if (audioPlayer) {
      audioPlayer.dataset.audioPlayer = actualPost.ID;
    }
    e.preventDefault();
  } catch (fetchError) {
    // If fetching additional details fails, log the error but don't remove the post.
    console.error("Error fetching post details:", fetchError);
  } finally {
    // Clear the editor and remove the temporary disabled state.
    editor.innerHTML = "";
    postElement.classList.remove("state-disabled");
  }
});
//-----------------------------------------------------------------
//-----------------------------------------------------------------
//-----------------------------------------------------------------
//-----------------------------------------------------------------
//Create Post Part End

//Create Reply Part start
//-----------------------------------------------------------------
//-----------------------------------------------------------------
//-----------------------------------------------------------------
//-----------------------------------------------------------------
// -------------------------------
// Delegated Click Listener
// -------------------------------
// -------------------------------
// Delegated Click Listener
// -------------------------------
document.addEventListener("click", function (e) {
  // Prevent handling if the click originates from an actual file input.
  if (e.target.matches("input[type='file']")) return;

  // 1. Handle clicks on any upload button
  const uploadBtn = e.target.closest(
    ".upload-image-button-reply, .upload-audio-button-reply, .upload-video-button-reply"
  );
  if (uploadBtn) {
    const replyForm = uploadBtn.closest(".reply-form-wrapper");
    if (!replyForm) return;
    // Based on the button's class, locate the corresponding file input.
    if (uploadBtn.classList.contains("upload-image-button-reply")) {
      const fileInput = replyForm.querySelector(".reply-image-upload");
      if (fileInput && !fileInput.value) fileInput.click();
    } else if (uploadBtn.classList.contains("upload-audio-button-reply")) {
      const fileInput = replyForm.querySelector(".reply-audio-upload");
      if (fileInput && !fileInput.value) fileInput.click();
    } else if (uploadBtn.classList.contains("upload-video-button-reply")) {
      const fileInput = replyForm.querySelector(".reply-video-upload");
      if (fileInput && !fileInput.value) fileInput.click();
    }
    return; // exit if handled
  }

  // 2. Handle clicks on the refresh button
  const refreshBtn = e.target.closest(".refresh-upload-reply");
  if (refreshBtn) {
    const replyForm = refreshBtn.closest(".reply-form-wrapper");
    if (!replyForm) return;
    // In our controls container we store the current file type.
    const fileControls = replyForm.querySelector(".file-controls-reply");
    const currentFileType = fileControls
      ? fileControls.dataset.currentFileType
      : null;
    if (!currentFileType) return;

    // Get the corresponding file input and preview wrapper.
    let fileInput, previewWrapper;
    if (currentFileType === "image") {
      fileInput = replyForm.querySelector(".reply-image-upload");
      previewWrapper = replyForm.querySelector(".image-preview-wrapper-reply");
    } else if (currentFileType === "audio") {
      fileInput = replyForm.querySelector(".reply-audio-upload");
      previewWrapper = replyForm.querySelector(".audio-preview-wrapper-reply");
    } else if (currentFileType === "video") {
      fileInput = replyForm.querySelector(".reply-video-upload");
      previewWrapper = replyForm.querySelector(".video-preview-wrapper-reply");
    }
    if (previewWrapper) previewWrapper.innerHTML = "";
    if (fileInput) {
      fileInput.value = "";
      fileInput.click();
    }
    return;
  }

  // 3. Handle clicks on the delete button
  const deleteBtn = e.target.closest(".delete-upload-reply");
  if (deleteBtn) {
    const replyForm = deleteBtn.closest(".reply-form-wrapper");
    if (!replyForm) return;
    const fileControls = replyForm.querySelector(".file-controls-reply");
    const currentFileType = fileControls
      ? fileControls.dataset.currentFileType
      : null;
    if (currentFileType === "image") {
      const fileInput = replyForm.querySelector(".reply-image-upload");
      const previewWrapper = replyForm.querySelector(
        ".image-preview-wrapper-reply"
      );
      if (previewWrapper) previewWrapper.innerHTML = "";
      if (fileInput) fileInput.value = "";
    } else if (currentFileType === "audio") {
      const fileInput = replyForm.querySelector(".reply-audio-upload");
      const previewWrapper = replyForm.querySelector(
        ".audio-preview-wrapper-reply"
      );
      if (previewWrapper) previewWrapper.innerHTML = "";
      if (fileInput) fileInput.value = "";
    } else if (currentFileType === "video") {
      const fileInput = replyForm.querySelector(".reply-video-upload");
      const previewWrapper = replyForm.querySelector(
        ".video-preview-wrapper-reply"
      );
      if (previewWrapper) previewWrapper.innerHTML = "";
      if (fileInput) fileInput.value = "";
    }
    // Hide the controls container and remove the stored file type.
    if (fileControls) {
      fileControls.classList.add("hidden");
      fileControls.removeAttribute("data-current-file-type");
    }
    // Show the upload buttons again.
    const uploadButtons = replyForm.querySelectorAll(
      ".upload-image-button-reply, .upload-audio-button-reply, .upload-video-button-reply"
    );
    uploadButtons.forEach((btn) => btn.classList.remove("hidden"));
    return;
  }
});

// -------------------------------
// Delegated Change Listener for File Inputs
// -------------------------------
document.addEventListener("change", function (e) {
  // Check if the event target is one of our file inputs.
  if (
    e.target.matches(
      ".reply-image-upload, .reply-audio-upload, .reply-video-upload"
    )
  ) {
    const file = e.target.files[0];
    if (!file) return; // No file was selected.

    let fileType = "";
    if (e.target.classList.contains("reply-image-upload")) {
      fileType = "image";
    } else if (e.target.classList.contains("reply-audio-upload")) {
      fileType = "audio";
    } else if (e.target.classList.contains("reply-video-upload")) {
      fileType = "video";
    }

    // Find the corresponding reply form container.
    const replyForm = e.target.closest(".reply-form-wrapper");
    if (!replyForm) return;

    // Clear other file inputs and their previews in this reply form.
    if (fileType === "image") {
      const audioInput = replyForm.querySelector(".reply-audio-upload");
      const videoInput = replyForm.querySelector(".reply-video-upload");
      if (audioInput) audioInput.value = "";
      if (videoInput) videoInput.value = "";
      const audioPreview = replyForm.querySelector(
        ".audio-preview-wrapper-reply"
      );
      const videoPreview = replyForm.querySelector(
        ".video-preview-wrapper-reply"
      );
      if (audioPreview) audioPreview.innerHTML = "";
      if (videoPreview) videoPreview.innerHTML = "";
    } else if (fileType === "audio") {
      const imageInput = replyForm.querySelector(".reply-image-upload");
      const videoInput = replyForm.querySelector(".reply-video-upload");
      if (imageInput) imageInput.value = "";
      if (videoInput) videoInput.value = "";
      const imagePreview = replyForm.querySelector(
        ".image-preview-wrapper-reply"
      );
      const videoPreview = replyForm.querySelector(
        ".video-preview-wrapper-reply"
      );
      if (imagePreview) imagePreview.innerHTML = "";
      if (videoPreview) videoPreview.innerHTML = "";
    } else if (fileType === "video") {
      const imageInput = replyForm.querySelector(".reply-image-upload");
      const audioInput = replyForm.querySelector(".reply-audio-upload");
      if (imageInput) imageInput.value = "";
      if (audioInput) audioInput.value = "";
      const imagePreview = replyForm.querySelector(
        ".image-preview-wrapper-reply"
      );
      const audioPreview = replyForm.querySelector(
        ".audio-preview-wrapper-reply"
      );
      if (imagePreview) imagePreview.innerHTML = "";
      if (audioPreview) audioPreview.innerHTML = "";
    }

    // Create a preview URL for the selected file.
    const previewURL = URL.createObjectURL(file);
    let previewWrapper = null;
    if (fileType === "image") {
      previewWrapper = replyForm.querySelector(".image-preview-wrapper-reply");
    } else if (fileType === "audio") {
      previewWrapper = replyForm.querySelector(".audio-preview-wrapper-reply");
    } else if (fileType === "video") {
      previewWrapper = replyForm.querySelector(".video-preview-wrapper-reply");
    }

    // Clear any existing preview and add the new one.
    if (previewWrapper) {
      previewWrapper.innerHTML = "";
      if (fileType === "image") {
        const img = document.createElement("img");
        img.src = previewURL;
        img.alt = "Image Preview";
        img.classList.add("w-full", "object-contain", "rounded");
        previewWrapper.appendChild(img);
      } else if (fileType === "audio") {
        const audio = document.createElement("audio");
        audio.controls = true;
        audio.classList.add("w-full");
        const source = document.createElement("source");
        source.src = previewURL;
        source.type = file.type;
        audio.appendChild(source);
        previewWrapper.appendChild(audio);
      } else if (fileType === "video") {
        const video = document.createElement("video");
        video.controls = true;
        video.width = 300;
        video.classList.add("rounded");
        const source = document.createElement("source");
        source.src = previewURL;
        source.type = file.type;
        video.appendChild(source);
        previewWrapper.appendChild(video);
      }
    }

    // Hide the upload buttons and show the refresh/delete controls.
    const uploadButtons = replyForm.querySelectorAll(
      ".upload-image-button-reply, .upload-audio-button-reply, .upload-video-button-reply"
    );
    uploadButtons.forEach((btn) => btn.classList.add("hidden"));
    const fileControls = replyForm.querySelector(".file-controls-reply");
    if (fileControls) {
      fileControls.classList.remove("hidden");
      // Store the current file type on the controls container.
      fileControls.dataset.currentFileType = fileType;
      // Optionally, set the inner HTML of the controls (e.g., show "Refresh" and "Delete")
      fileControls.classList.remove("hidden");
    }
  }
});

// -------------------------------
// Delegated Change Listener for File Inputs
// -------------------------------
document.addEventListener("change", function (e) {
  // --- Reply Image File Input ---
  if (e.target.matches(".reply-image-upload")) {
    const file = e.target.files[0];
    if (file) {
      const replyForm = e.target.closest(".reply-form-wrapper");
      if (replyForm) {
        // Clear other file inputs and their preview wrappers.
        const audioInput = replyForm.querySelector(".reply-audio-upload");
        const videoInput = replyForm.querySelector(".reply-video-upload");
        if (audioInput) audioInput.value = "";
        if (videoInput) videoInput.value = "";
        const audioPreview = replyForm.querySelector(
          ".audio-preview-wrapper-reply"
        );
        const videoPreview = replyForm.querySelector(
          ".video-preview-wrapper-reply"
        );
        if (audioPreview) audioPreview.innerHTML = "";
        if (videoPreview) videoPreview.innerHTML = "";

        // Create and display image preview.
        const previewURL = URL.createObjectURL(file);
        const img = document.createElement("img");
        img.src = previewURL;
        img.alt = "Image Preview";
        img.classList.add("w-full", "object-contain", "rounded");
        const imagePreview = replyForm.querySelector(
          ".image-preview-wrapper-reply"
        );
        if (imagePreview) {
          imagePreview.innerHTML = "";
          imagePreview.appendChild(img);
        }
        // Show file controls.
        const fileControls = replyForm.querySelector(".file-controls-reply");
        if (fileControls) fileControls.classList.remove("hidden");
      }
    }
  }

  // --- Reply Audio File Input ---
  if (e.target.matches(".reply-audio-upload")) {
    const file = e.target.files[0];
    if (file) {
      const replyForm = e.target.closest(".reply-form-wrapper");
      if (replyForm) {
        // Clear image and video inputs and previews.
        const imageInput = replyForm.querySelector(".reply-image-upload");
        const videoInput = replyForm.querySelector(".reply-video-upload");
        if (imageInput) imageInput.value = "";
        if (videoInput) videoInput.value = "";
        const imagePreview = replyForm.querySelector(
          ".image-preview-wrapper-reply"
        );
        const videoPreview = replyForm.querySelector(
          ".video-preview-wrapper-reply"
        );
        if (imagePreview) imagePreview.innerHTML = "";
        if (videoPreview) videoPreview.innerHTML = "";

        // Create and display audio preview.
        const previewURL = URL.createObjectURL(file);
        const audio = document.createElement("audio");
        audio.controls = true;
        audio.classList.add("w-full");
        const source = document.createElement("source");
        source.src = previewURL;
        source.type = file.type;
        audio.appendChild(source);
        const audioPreviewWrapper = replyForm.querySelector(
          ".audio-preview-wrapper-reply"
        );
        if (audioPreviewWrapper) {
          audioPreviewWrapper.innerHTML = "";
          audioPreviewWrapper.appendChild(audio);
        }
        // Show file controls.
        const fileControls = replyForm.querySelector(".file-controls-reply");
        if (fileControls) fileControls.classList.remove("hidden");
      }
    }
  }

  // --- Reply Video File Input ---
  if (e.target.matches(".reply-video-upload")) {
    const file = e.target.files[0];
    if (file) {
      const replyForm = e.target.closest(".reply-form-wrapper");
      if (replyForm) {
        // Clear image and audio inputs and their previews.
        const imageInput = replyForm.querySelector(".reply-image-upload");
        const audioInput = replyForm.querySelector(".reply-audio-upload");
        if (imageInput) imageInput.value = "";
        if (audioInput) audioInput.value = "";
        const imagePreview = replyForm.querySelector(
          ".image-preview-wrapper-reply"
        );
        const audioPreview = replyForm.querySelector(
          ".audio-preview-wrapper-reply"
        );
        if (imagePreview) imagePreview.innerHTML = "";
        if (audioPreview) audioPreview.innerHTML = "";

        // Create and display video preview.
        const previewURL = URL.createObjectURL(file);
        const video = document.createElement("video");
        video.controls = true;
        video.width = 300; // Adjust as needed.
        video.classList.add("rounded");
        const source = document.createElement("source");
        source.src = previewURL;
        source.type = file.type;
        video.appendChild(source);
        const videoPreviewWrapper = replyForm.querySelector(
          ".video-preview-wrapper-reply"
        );
        if (videoPreviewWrapper) {
          videoPreviewWrapper.innerHTML = "";
          videoPreviewWrapper.appendChild(video);
        }
        // Show file controls.
        const fileControls = replyForm.querySelector(".file-controls-reply");
        if (fileControls) fileControls.classList.remove("hidden");
      }
    }
  }
});

document.addEventListener("click", async (e) => {
  const replyButton = e.target.closest("#submit-reply");
  if (replyButton) {
    // Get the comment ID from the button’s data attribute.
    const commentId = replyButton.dataset.commentId;
    // Locate the reply form within the comment.
    const replyForm = replyButton.closest(".reply-form");
    if (!replyForm) return;
    replyForm.classList.add("state-disabled");

    // Get the reply editor and text.
    const editor = replyForm.querySelector(".reply-editor");
    const content = editor.innerText.trim();
    if (!content) {
      UIManager.showError("Reply cannot be empty");
      replyForm.classList.remove("state-disabled");
      return;
    }

    const mentionedIds = [];
    document.querySelectorAll(".mention").forEach((mention) => {
      const id = mention.dataset.contactId;
      if (id) {
        if (id === "all" && MentionManager.allContacts) {
          // Push all contact IDs from the cached list.
          MentionManager.allContacts.forEach((contact) => {
            if (!mentionedIds.includes(contact.id)) {
              mentionedIds.push(contact.id);
            }
          });
        } else if (!mentionedIds.includes(id)) {
          mentionedIds.push(id);
        }
      }
    });

    // --- File Handling for Replies ---
    const imageInput = replyForm.querySelector(".reply-image-upload");
    const audioInput = replyForm.querySelector(".reply-audio-upload");
    const videoInput = replyForm.querySelector(".reply-video-upload");

    const imageFile = imageInput.files[0];
    const audioFile = audioInput.files[0];
    const videoFile = videoInput.files[0];

    let uploadedFile = null;
    let fileType = null;
    if (imageFile) {
      uploadedFile = imageFile;
      fileType = "Image";
    } else if (audioFile) {
      uploadedFile = audioFile;
      fileType = "Audio";
    } else if (videoFile) {
      uploadedFile = videoFile;
      fileType = "Video";
    }
    // -----------------------------

    // Call createReply with the file info.
    await forumManager.createReply(
      commentId,
      content,
      mentionedIds,
      fileType,
      uploadedFile
    );
    formatPreiview();
    // Clear the reply editor and file inputs.
    editor.innerHTML = "";
    imageInput.value = "";
    audioInput.value = "";
    videoInput.value = "";
    replyForm.classList.remove("state-disabled");
  }
});

//-----------------------------------------------------------------
//-----------------------------------------------------------------
//-----------------------------------------------------------------
//-----------------------------------------------------------------
//Create Reply Part End
