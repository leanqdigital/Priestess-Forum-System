class MediaFormHandler {
  constructor(config) {
    this.config = config;
    this.currentFileType = null;
    this.currentRecordedAudioFile = null;
    this.mediaRecorder = null;
    this.recordingTimer = null;
    this.recordedChunks = [];
    this.recordingTimerInterval = null;
    this.recordingStartTime = null;
    this.audioCtx = null;
    this.analyser = null;
    this.dataArray = null;
    this.bufferLength = null;
    this.animationId = null;
    this.init();
  }

  formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  }

  resetForm() {
    if (this.config.editor) this.config.editor.innerHTML = "";
    if (this.config.imageUploadInput) this.config.imageUploadInput.value = "";
    if (this.config.audioUploadInput) this.config.audioUploadInput.value = "";
    if (this.config.videoUploadInput) this.config.videoUploadInput.value = "";
    if (this.config.imagePreviewWrapper)
      this.config.imagePreviewWrapper.innerHTML = "";
    if (this.config.audioPreviewWrapper) {
      this.config.audioPreviewWrapper.innerHTML = "";
      this.config.audioPreviewWrapper.classList.add("hidden");
    }
    if (this.config.videoPreviewWrapper)
      this.config.videoPreviewWrapper.innerHTML = "";
    if (this.config.fileControls)
      this.config.fileControls.classList.add("hidden");

    this.resetRecordingState();
    this.currentFileType = null;
    this.currentRecordedAudioFile = null;
    if (this.config.uploadImageBtn)
      this.config.uploadImageBtn.classList.remove("hidden");
    if (this.config.uploadVideoBtn)
      this.config.uploadVideoBtn.classList.remove("hidden");
    if (this.config.audioOptionsWrapper)
      this.config.audioOptionsWrapper.classList.remove("hidden");
  }

  init() {
    if (this.config.uploadImageBtn && this.config.imageUploadInput) {
      this.config.uploadImageBtn.addEventListener("click", () => {
        this.config.imageUploadInput.click();
      });
    }
    if (this.config.uploadAudioBtn && this.config.audioUploadInput) {
      this.config.uploadAudioBtn.addEventListener("click", () => {
        this.config.audioUploadInput.click();
      });
    }
    if (this.config.uploadVideoBtn && this.config.videoUploadInput) {
      this.config.uploadVideoBtn.addEventListener("click", () => {
        this.config.videoUploadInput.click();
      });
    }

    if (this.config.imageUploadInput) {
      this.config.imageUploadInput.addEventListener("change", (e) =>
        this.handleImageUpload(e)
      );
    }
    if (this.config.audioUploadInput) {
      this.config.audioUploadInput.addEventListener("change", (e) =>
        this.handleAudioUpload(e)
      );
    }
    if (this.config.videoUploadInput) {
      this.config.videoUploadInput.addEventListener("change", (e) =>
        this.handleVideoUpload(e)
      );
    }

    if (this.config.recordAudioBtn) {
      this.config.recordAudioBtn.addEventListener("click", () => {
        if (!this.mediaRecorder || this.mediaRecorder.state !== "recording") {
          this.startAudioRecording();
        }
      });
    }
    if (this.config.stopRecordingBtn) {
      this.config.stopRecordingBtn.addEventListener("click", () =>
        this.stopAudioRecording()
      );
    }
    if (this.config.replaceRecordingBtn) {
      this.config.replaceRecordingBtn.addEventListener("click", () => {
        this.resetAudioRecording();
        this.startAudioRecording();
      });
    }
    if (this.config.deleteRecordingBtn) {
      this.config.deleteRecordingBtn.addEventListener("click", () => {
        if (this.mediaRecorder && this.mediaRecorder.state === "recording") {
          this.mediaRecorder.onstop = () => {};
        }
        this.resetAudioRecording();
        this.stopAudioRecording();
        if (this.config.audioPreviewWrapper) {
          this.config.audioPreviewWrapper.innerHTML = "";
          this.config.audioPreviewWrapper.classList.add("hidden");
        }
        this.currentFileType = null;
        this.currentRecordedAudioFile = null;
        if (this.config.fileControls)
          this.config.fileControls.classList.add("hidden");
        if (this.config.uploadImageBtn)
          this.config.uploadImageBtn.classList.remove("hidden");
        if (this.config.audioOptionsWrapper)
          this.config.audioOptionsWrapper.classList.remove("hidden");
        if (this.config.uploadVideoBtn)
          this.config.uploadVideoBtn.classList.remove("hidden");
      });
    }
    if (this.config.approveRecordingBtn) {
      this.config.approveRecordingBtn.addEventListener("click", () => {
        if (this.mediaRecorder && this.mediaRecorder.state === "recording") {
          this.stopAudioRecording();
        }
        if (this.config.fullAudioRecordingWrapper) {
          this.config.fullAudioRecordingWrapper.classList.add("hidden");
        }
        if (this.config.audioPreviewWrapper) {
          this.config.audioPreviewWrapper.classList.remove("hidden");
        }
      });
    }
    if (this.config.refreshBtn) {
      this.config.refreshBtn.addEventListener("click", () => {
        if (this.currentFileType === "image") {
          this.config.imagePreviewWrapper.innerHTML = "";
          this.config.imageUploadInput.value = "";
          this.config.imageUploadInput.click();
        } else if (this.currentFileType === "audio") {
          this.config.audioPreviewWrapper.innerHTML = "";
          this.config.audioUploadInput.value = "";
          this.currentRecordedAudioFile = null;
          this.config.audioUploadInput.click();
        } else if (this.currentFileType === "video") {
          this.config.videoPreviewWrapper.innerHTML = "";
          this.config.videoUploadInput.value = "";
          this.config.videoUploadInput.click();
        }
      });
    }
    if (this.config.deleteUploadBtn) {
      this.config.deleteUploadBtn.addEventListener("click", () => {
        if (this.currentFileType === "image") {
          this.config.imagePreviewWrapper.innerHTML = "";
          this.config.imageUploadInput.value = "";
        } else if (this.currentFileType === "audio") {
          this.config.audioPreviewWrapper.innerHTML = "";
          this.config.audioUploadInput.value = "";
          this.currentRecordedAudioFile = null;
        } else if (this.currentFileType === "video") {
          this.config.videoPreviewWrapper.innerHTML = "";
          this.config.videoUploadInput.value = "";
        }
        this.currentFileType = null;
        if (this.config.fileControls)
          this.config.fileControls.classList.add("hidden");
        if (this.config.uploadImageBtn)
          this.config.uploadImageBtn.classList.remove("hidden");
        if (this.config.audioOptionsWrapper)
          this.config.audioOptionsWrapper.classList.remove("hidden");
        if (this.config.uploadVideoBtn)
          this.config.uploadVideoBtn.classList.remove("hidden");
      });
    }
  }

  startAudioRecording() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      return;
    }
    let audioConstraint = true;
    if (
      this.config.selectedDeviceId &&
      typeof this.config.selectedDeviceId === "string" &&
      this.config.selectedDeviceId.trim() !== ""
    ) {
      audioConstraint = { deviceId: { exact: this.config.selectedDeviceId } };
    }

    navigator.mediaDevices
      .getUserMedia({ audio: audioConstraint })
      .then((stream) => {
        const isSafari = /^((?!chrome|android).)*safari/i.test(
          navigator.userAgent
        );
        let options = { mimeType: "audio/webm;codecs=opus" };
        if (isSafari) {
          if (MediaRecorder.isTypeSupported("audio/mp4")) {
            options = { mimeType: "audio/mp4" };
          } else {
          }
        } else if (!MediaRecorder.isTypeSupported(options.mimeType)) {
          options = { mimeType: "audio/webm" };
        }
        if (!MediaRecorder.isTypeSupported(options.mimeType)) {
          options = { mimeType: "audio/webm" };
        }
        this.mediaRecorder = new MediaRecorder(stream, options);
        this.recordedChunks = [];
        this.mediaRecorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) {
            this.recordedChunks.push(e.data);
          }
        };

        this.mediaRecorder.onstop = () => {
          const audioBlob = new Blob(this.recordedChunks, {
            type: options.mimeType,
          });
          const audioFile = new File([audioBlob], "recorded_audio.webm", {
            type: options.mimeType,
          });
          const audioURL = URL.createObjectURL(audioFile);

          // Insert the custom audio preview (innerHTML remains unchanged)
          if (this.config.audioPreviewWrapper) {
            this.config.audioPreviewWrapper.innerHTML = `
                <div class="post-audio-wrapper">
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
                            <button class="bg-transparent border-none text-[#D4AF7A] cursor-pointer rewind">
                                <svg width="17" height="16" viewBox="0 0 17 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path
                                        d="M15.1668 8.15293C15.167 9.77081 14.53 11.3237 13.3937 12.4754C12.2575 13.6271 10.7134 14.285 9.09568 14.3068H9.01299C7.44135 14.3107 5.92856 13.7092 4.78863 12.6273C4.73968 12.581 4.70033 12.5255 4.67282 12.464C4.64531 12.4025 4.63019 12.3362 4.62832 12.2688C4.62644 12.2015 4.63785 12.1344 4.66189 12.0715C4.68594 12.0085 4.72214 11.9509 4.76844 11.902C4.81474 11.853 4.87023 11.8137 4.93173 11.7862C4.99324 11.7587 5.05956 11.7435 5.12692 11.7417C5.19427 11.7398 5.26133 11.7512 5.32427 11.7752C5.38722 11.7993 5.44481 11.8355 5.49376 11.8818C6.22696 12.5732 7.14766 13.0333 8.14083 13.2046C9.134 13.3758 10.1556 13.2506 11.078 12.8447C12.0005 12.4387 12.7828 11.7699 13.3274 10.9218C13.8719 10.0738 14.1545 9.08408 14.1399 8.07636C14.1252 7.06864 13.8139 6.08758 13.2449 5.25573C12.676 4.42389 11.8745 3.77814 10.9406 3.39915C10.0068 3.02017 8.98194 2.92475 7.99417 3.12482C7.0064 3.32489 6.09948 3.81158 5.38671 4.52409C5.38148 4.52976 5.37591 4.53511 5.37004 4.54011L4.6944 5.1587L5.78414 6.24845C5.85694 6.31988 5.90678 6.41139 5.9273 6.51129C5.94782 6.61119 5.93809 6.71494 5.89935 6.80928C5.86061 6.90362 5.79461 6.98427 5.70981 7.04091C5.625 7.09756 5.52523 7.12763 5.42325 7.12729H2.34632C2.21032 7.12729 2.07988 7.07326 1.98371 6.97709C1.88753 6.88092 1.8335 6.75048 1.8335 6.61447V3.53755C1.83291 3.43585 1.86258 3.33626 1.91873 3.25146C1.97487 3.16666 2.05497 3.10047 2.14883 3.0613C2.24269 3.02214 2.34608 3.01177 2.44585 3.03151C2.54562 3.05125 2.63727 3.10021 2.70915 3.17217L3.96876 4.43499L4.67004 3.79396C5.53157 2.93578 6.62803 2.35208 7.82102 2.11655C9.01401 1.88101 10.25 2.0042 11.3731 2.47056C12.4961 2.93691 13.4558 3.72554 14.131 4.73687C14.8062 5.74821 15.1666 6.93691 15.1668 8.15293Z"
                                    fill="#C29D68" />
                                </svg>
                            </button>
                            <div class="cursor-pointer play-pause" data-audio-button="recorded">
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
                            <button class="bg-transparent border-none text-[#D4AF7A] cursor-pointer forward">
                                <svg width="17" height="16" viewBox="0 0 17 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path
                                        d="M15.1668 3.53784V6.61469C15.1668 6.75069 15.1128 6.88113 15.0166 6.9773C14.9205 7.07347 14.79 7.12749 14.654 7.12749H11.5772C11.4757 7.12757 11.3765 7.09754 11.2921 7.0412C11.2077 6.98486 11.1419 6.90474 11.103 6.81099C11.0642 6.71723 11.054 6.61406 11.0738 6.51453C11.0937 6.415 11.1426 6.3236 11.2144 6.25188L12.3041 5.16216L11.6278 4.54359L11.6118 4.5282C10.899 3.81572 9.99213 3.32904 9.00439 3.12897C8.01664 2.92891 6.99185 3.02432 6.05801 3.4033C5.12418 3.78227 4.32272 4.428 3.75375 5.25983C3.18477 6.09165 2.87351 7.07269 2.85885 8.08038C2.84419 9.08808 3.12677 10.0778 3.67131 10.9258C4.21584 11.7738 4.99818 12.4426 5.92059 12.8486C6.843 13.2545 7.86459 13.3797 8.85774 13.2085C9.85088 13.0372 10.7716 12.5772 11.5047 11.8857C11.5537 11.8394 11.6113 11.8032 11.6742 11.7792C11.7372 11.7551 11.8042 11.7437 11.8716 11.7456C11.9389 11.7475 12.0052 11.7626 12.0667 11.7901C12.1283 11.8176 12.1837 11.8569 12.23 11.9059C12.2763 11.9548 12.3125 12.0124 12.3366 12.0754C12.3606 12.1383 12.372 12.2054 12.3702 12.2727C12.3683 12.3401 12.3532 12.4064 12.3257 12.4679C12.2981 12.5294 12.2588 12.5849 12.2098 12.6312C11.0696 13.7109 9.55785 14.3109 7.98752 14.3068H7.90291C6.89507 14.293 5.90606 14.0318 5.02279 13.5463C4.13952 13.0607 3.38904 12.3657 2.83731 11.5222C2.28558 10.6786 1.94949 9.71253 1.85858 8.70871C1.76767 7.70489 1.92473 6.6941 2.31594 5.7652C2.70716 4.83629 3.32056 4.0177 4.10223 3.38137C4.8839 2.74504 5.80991 2.31046 6.79887 2.11583C7.78782 1.92119 8.80945 1.97245 9.77396 2.26511C10.7385 2.55777 11.6163 3.08287 12.3304 3.79425L13.031 4.43526L14.2912 3.17247C14.3631 3.10051 14.4547 3.05155 14.5545 3.03181C14.6543 3.01207 14.7576 3.02245 14.8515 3.06161C14.9454 3.10078 15.0255 3.16697 15.0816 3.25176C15.1377 3.33656 15.1674 3.43614 15.1668 3.53784Z"
                                        fill="#C29D68" />
                                </svg>   
                            </button>
                        </div>
                        <!-- Progress and volume controls -->
                        <div class="progress-container flex items-center gap-[10px]">
                          <span class="current-time page-text text-nowrap">0:00</span>
                          <input class="flex-grow-1 appearance-none bg-grey-200 h-[3px] w-full progress" type="range" value="0" min="0" step="0.1">
                          <span class="total-time page-text text-nowrap">0:00</span>
                          <button class="volume">
                              <svg class="unmuted" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <path
                                      d="M14.4123 3.70994V20.2114C14.4144 20.3348 14.3844 20.4568 14.3254 20.5652C14.2663 20.6737 14.1801 20.765 14.0752 20.8302C13.9561 20.9011 13.8183 20.9344 13.6799 20.9258C13.5415 20.9172 13.4089 20.8671 13.2995 20.782L7.64758 16.386C7.6066 16.3536 7.57352 16.3123 7.55082 16.2653C7.52813 16.2183 7.51641 16.1667 7.51656 16.1144V7.81202C7.51672 7.75958 7.52883 7.70787 7.55199 7.66082C7.57514 7.61377 7.60872 7.57262 7.65017 7.5405L13.3021 3.14449C13.4259 3.04851 13.5788 2.99758 13.7355 3.00009C13.8921 3.0026 14.0433 3.05839 14.164 3.15828C14.2433 3.22641 14.3067 3.31114 14.3496 3.40647C14.3925 3.50181 14.4139 3.60541 14.4123 3.70994ZM5.79264 7.82581H3.37914C3.01337 7.82581 2.66258 7.97111 2.40394 8.22975C2.1453 8.48839 2 8.83918 2 9.20495V14.7215C2 15.0873 2.1453 15.4381 2.40394 15.6967C2.66258 15.9554 3.01337 16.1007 3.37914 16.1007H5.79264C5.88408 16.1007 5.97178 16.0643 6.03644 15.9997C6.1011 15.935 6.13742 15.8473 6.13742 15.7559V8.1706C6.13742 8.07915 6.1011 7.99146 6.03644 7.9268C5.97178 7.86214 5.88408 7.82581 5.79264 7.82581ZM16.7197 9.62214C16.6516 9.68198 16.596 9.75466 16.556 9.83602C16.5161 9.91738 16.4925 10.0058 16.4868 10.0963C16.481 10.1868 16.4931 10.2775 16.5224 10.3632C16.5518 10.449 16.5977 10.5282 16.6577 10.5962C16.9903 10.9739 17.1738 11.4599 17.1738 11.9632C17.1738 12.4665 16.9903 12.9526 16.6577 13.3303C16.5961 13.398 16.5486 13.4772 16.518 13.5634C16.4873 13.6495 16.4741 13.741 16.4791 13.8323C16.4842 13.9236 16.5073 14.013 16.5472 14.0953C16.5871 14.1777 16.643 14.2512 16.7116 14.3117C16.7802 14.3722 16.8602 14.4184 16.9469 14.4477C17.0335 14.477 17.1251 14.4887 17.2164 14.4823C17.3076 14.4758 17.3967 14.4513 17.4783 14.4101C17.56 14.3689 17.6326 14.3118 17.692 14.2423C18.2467 13.6126 18.5527 12.8023 18.5527 11.9632C18.5527 11.1241 18.2467 10.3138 17.692 9.6842C17.6322 9.61598 17.5595 9.56025 17.478 9.52019C17.3966 9.48014 17.308 9.45655 17.2175 9.45078C17.1269 9.44502 17.0361 9.45719 16.9502 9.48659C16.8644 9.516 16.7852 9.56206 16.7172 9.62214H16.7197ZM20.2443 7.36639C20.185 7.29547 20.112 7.2372 20.0297 7.19507C19.9474 7.15293 19.8574 7.12777 19.7652 7.1211C19.673 7.11443 19.5803 7.12637 19.4928 7.15623C19.4053 7.18608 19.3247 7.23322 19.2558 7.29487C19.1868 7.35651 19.131 7.43138 19.0916 7.51503C19.0522 7.59869 19.03 7.68941 19.0264 7.78181C19.0228 7.8742 19.0378 7.96639 19.0705 8.05287C19.1032 8.13936 19.153 8.21838 19.2168 8.28524C20.1216 9.29669 20.6219 10.6062 20.6219 11.9632C20.6219 13.3203 20.1216 14.6298 19.2168 15.6412C19.153 15.7081 19.1032 15.7871 19.0705 15.8736C19.0378 15.9601 19.0228 16.0523 19.0264 16.1447C19.03 16.2371 19.0522 16.3278 19.0916 16.4114C19.131 16.4951 19.1868 16.57 19.2558 16.6316C19.3247 16.6932 19.4053 16.7404 19.4928 16.7702C19.5803 16.8001 19.673 16.812 19.7652 16.8054C19.8574 16.7987 19.9474 16.7735 20.0297 16.7314C20.112 16.6893 20.185 16.631 20.2443 16.5601C21.3749 15.2959 22 13.6593 22 11.9632C22 10.2672 21.3749 8.63061 20.2443 7.36639Z"
                                      fill="white" />
                              </svg>
                              <svg class="muted hidden" width="20" height="18" viewBox="0 0 20 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <path
                                      d="M19.7979 10.5452C19.9273 10.6746 20 10.8501 20 11.0331C20 11.2161 19.9273 11.3916 19.7979 11.521C19.6685 11.6504 19.493 11.7231 19.31 11.7231C19.127 11.7231 18.9515 11.6504 18.8221 11.521L17.241 9.93915L15.66 11.521C15.5306 11.6504 15.3551 11.7231 15.1721 11.7231C14.9891 11.7231 14.8136 11.6504 14.6842 11.521C14.5548 11.3916 14.4821 11.2161 14.4821 11.0331C14.4821 10.8501 14.5548 10.6746 14.6842 10.5452L16.2661 8.96417L14.6842 7.38316C14.5548 7.25376 14.4821 7.07825 14.4821 6.89524C14.4821 6.71223 14.5548 6.53672 14.6842 6.40732C14.8136 6.27791 14.9891 6.20521 15.1721 6.20521C15.3551 6.20521 15.5306 6.27791 15.66 6.40732L17.241 7.98918L18.8221 6.40732C18.9515 6.27791 19.127 6.20521 19.31 6.20521C19.493 6.20521 19.6685 6.27791 19.7979 6.40732C19.9273 6.53672 20 6.71223 20 6.89524C20 7.07825 19.9273 7.25376 19.7979 7.38316L18.216 8.96417L19.7979 10.5452ZM3.79303 4.82631H1.37928C1.01348 4.82631 0.662649 4.97163 0.403983 5.2303C0.145317 5.48896 0 5.83979 0 6.2056V11.7227C0 12.0885 0.145317 12.4394 0.403983 12.698C0.662649 12.9567 1.01348 13.102 1.37928 13.102H3.79303C3.88448 13.102 3.97219 13.0657 4.03686 13.001C4.10152 12.9364 4.13785 12.8486 4.13785 12.7572V5.17113C4.13785 5.07968 4.10152 4.99198 4.03686 4.92731C3.97219 4.86264 3.88448 4.82631 3.79303 4.82631ZM12.1679 0.1583C12.0471 0.0583964 11.896 0.00259543 11.7393 8.83181e-05C11.5826 -0.0024188 11.4297 0.0485175 11.3058 0.144507L5.65334 4.54098C5.61141 4.57283 5.57733 4.61387 5.55372 4.66094C5.53011 4.70801 5.5176 4.75986 5.51714 4.81252V13.1158C5.51729 13.1683 5.52941 13.22 5.55256 13.267C5.57572 13.3141 5.6093 13.3552 5.65075 13.3874L11.3032 17.7838C11.4127 17.8689 11.5453 17.9191 11.6837 17.9277C11.8221 17.9363 11.9599 17.903 12.0791 17.8321C12.184 17.7669 12.2701 17.6755 12.3292 17.5671C12.3883 17.4586 12.4182 17.3366 12.4161 17.2131V0.710014C12.4174 0.60527 12.3956 0.50153 12.3523 0.406172C12.3089 0.310815 12.2451 0.226184 12.1653 0.1583H12.1679Z"
                                      fill="black" />
                              </svg>
                          </button>
                        </div>
                    </div>
                </div>
              `;
            const audioPlayerElement =
              document.getElementById("audio-recorded");
            const customAudio = audioPlayerElement.querySelector(".audio");
            if (customAudio) {
              customAudio.load();
            }
            playAudio(audioPlayerElement.getAttribute("data-audio-player"));
          }
          this.currentRecordedAudioFile = audioFile;
        };

        this.mediaRecorder.start();
        // Set the start time
        this.recordingStartTime = Date.now();
        // Start updating the timer every second
        this.recordingTimerInterval = setInterval(() => {
          const elapsed = (Date.now() - this.recordingStartTime) / 1000;
          if (this.config.recordingTimer) {
            this.config.recordingTimer.textContent = this.formatTime(elapsed);
          }
        }, 1000);

        if (this.config.fullAudioRecordingWrapper) {
          this.config.fullAudioRecordingWrapper.classList.remove("hidden");
        }
        this.showFileControls("audio");
        this.setupWaveform(stream, this.config.waveWrapper);
      })
      .catch((err) => {
        console.error("Error accessing media devices:", err);
      });
  }

  showFileControls(fileType) {
    this.currentFileType = fileType;
    if (this.config.uploadImageBtn)
      this.config.uploadImageBtn.classList.add("hidden");
    if (this.config.audioOptionsWrapper)
      this.config.audioOptionsWrapper.classList.add("hidden");
    if (this.config.uploadVideoBtn)
      this.config.uploadVideoBtn.classList.add("hidden");
    if (this.config.fileControls)
      this.config.fileControls.classList.remove("hidden");
  }

  setupWaveform(stream, waveWrapper) {
    let canvas = waveWrapper.querySelector("canvas#audioWaveCanvas");
    if (!canvas) {
      canvas = document.createElement("canvas");
      canvas.id = "audioWaveCanvas";
      waveWrapper.appendChild(canvas);
    }
    const canvasCtx = canvas.getContext("2d");

    const resizeCanvas = () => {
      canvas.width = waveWrapper.offsetWidth;
      canvas.height = waveWrapper.offsetHeight;
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const source = this.audioCtx.createMediaStreamSource(stream);
    this.analyser = this.audioCtx.createAnalyser();
    this.analyser.fftSize = 2048;
    this.bufferLength = this.analyser.fftSize;
    this.dataArray = new Uint8Array(this.bufferLength);
    source.connect(this.analyser);

    this.drawWaveform(canvasCtx, canvas.width, canvas.height);
  }

  drawWaveform(canvasCtx, width, height) {
    this.animationId = requestAnimationFrame(() =>
      this.drawWaveform(canvasCtx, width, height)
    );
    this.analyser.getByteTimeDomainData(this.dataArray);
    canvasCtx.clearRect(0, 0, width, height);
    canvasCtx.lineWidth = 2;
    canvasCtx.strokeStyle = "#C29D68";
    canvasCtx.beginPath();

    const sliceWidth = width / this.bufferLength;
    let x = 0;
    for (let i = 0; i < this.bufferLength; i++) {
      const v = this.dataArray[i] / 128.0;
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

  stopAudioRecording() {
    if (this.mediaRecorder && this.mediaRecorder.state === "recording") {
      this.mediaRecorder.stop();
      clearInterval(this.recordingTimerInterval);
      this.recordingTimerInterval = null;
      if (this.config.fullAudioRecordingWrapper) {
        this.config.fullAudioRecordingWrapper.classList.add("hidden");
      }
      this.showFileControls("audio");
      if (this.config.audioPreviewWrapper) {
        this.config.audioPreviewWrapper.classList.remove("hidden");
      }
    }
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    if (this.audioCtx) {
      this.audioCtx.close();
    }
    if (this.mediaRecorder && this.mediaRecorder.stream) {
      this.mediaRecorder.stream.getTracks().forEach((track) => track.stop());
    }
  }

  resetRecordingState() {
    this.currentRecordedAudioFile = null;
    this.recordedChunks = [];
    if (this.mediaRecorder && this.mediaRecorder.state === "recording") {
      this.mediaRecorder.stop();
    }
    clearInterval(this.recordingTimerInterval);
    this.recordingTimerInterval = null;
    if (this.config.recordingTimer) {
      this.config.recordingTimer.textContent = "0:00";
    }
    if (this.config.fullAudioRecordingWrapper) {
      this.config.fullAudioRecordingWrapper.classList.add("hidden");
    }
    if (this.config.audioPreviewWrapper) {
      this.config.audioPreviewWrapper.innerHTML = "";
      this.config.audioPreviewWrapper.classList.add("hidden");
    }
  }

  resetAudioRecording() {
    this.resetRecordingState();
    if (this.config.audioUploadInput) {
      this.config.audioUploadInput.value = "";
    }
  }

  handleImageUpload(e) {
    const file = e.target.files[0];
    if (file) {
      if (this.config.audioUploadInput) this.config.audioUploadInput.value = "";
      if (this.config.audioPreviewWrapper)
        this.config.audioPreviewWrapper.innerHTML = "";
      if (this.config.videoUploadInput) this.config.videoUploadInput.value = "";
      if (this.config.videoPreviewWrapper)
        this.config.videoPreviewWrapper.innerHTML = "";
      this.resetAudioRecording();

      const imageURL = URL.createObjectURL(file);
      if (this.config.imagePreviewWrapper) {
        this.config.imagePreviewWrapper.innerHTML = "";
        const img = document.createElement("img");
        img.src = imageURL;
        img.alt = "Image Preview";
        img.classList.add("w-full", "object-contain", "rounded");
        this.config.imagePreviewWrapper.appendChild(img);
      }
      this.showFileControls("image");
    }
  }

  handleAudioUpload(e) {
    const file = e.target.files[0];
    if (file) {
      if (this.config.imageUploadInput) this.config.imageUploadInput.value = "";
      if (this.config.imagePreviewWrapper)
        this.config.imagePreviewWrapper.innerHTML = "";
      if (this.config.videoUploadInput) this.config.videoUploadInput.value = "";
      if (this.config.videoPreviewWrapper)
        this.config.videoPreviewWrapper.innerHTML = "";
      this.resetRecordingState();

      const audioURL = URL.createObjectURL(file);
      if (this.config.audioPreviewWrapper) {
        this.config.audioPreviewWrapper.innerHTML = `
          <div class="post-audio-wrapper">
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
                <button class="bg-transparent border-none text-[#D4AF7A] cursor-pointer rewind">
                    <svg width="17" height="16" viewBox="0 0 17 16" fill="none" 
                        xmlns="http://www.w3.org/2000/svg">
                        <path d="M15.1668 8.15293C15.167 9.77081 14.53 11.3237 13.3937 12.4754C12.2575 13.6271 10.7134 14.285 9.09568 14.3068H9.01299C7.44135 14.3107 5.92856 13.7092 4.78863 12.6273C4.73968 12.581 4.70033 12.5255 4.67282 12.464C4.64531 12.4025 4.63019 12.3362 4.62832 12.2688C4.62644 12.2015 4.63785 12.1344 4.66189 12.0715C4.68594 12.0085 4.72214 11.9509 4.76844 11.902C4.81474 11.853 4.87023 11.8137 4.93173 11.7862C4.99324 11.7587 5.05956 11.7435 5.12692 11.7417C5.19427 11.7398 5.26133 11.7512 5.32427 11.7752C5.38722 11.7993 5.44481 11.8355 5.49376 11.8818C6.22696 12.5732 7.14766 13.0333 8.14083 13.2046C9.134 13.3758 10.1556 13.2506 11.078 12.8447C12.0005 12.4387 12.7828 11.7699 13.3274 10.9218C13.8719 10.0738 14.1545 9.08408 14.1399 8.07636C14.1252 7.06864 13.8139 6.08758 13.2449 5.25573C12.676 4.42389 11.8745 3.77814 10.9406 3.39915C10.0068 3.02017 8.98194 2.92475 7.99417 3.12482C7.0064 3.32489 6.09948 3.81158 5.38671 4.52409C5.38148 4.52976 5.37591 4.53511 5.37004 4.54011L4.6944 5.1587L5.78414 6.24845C5.85694 6.31988 5.90678 6.41139 5.9273 6.51129C5.94782 6.61119 5.93809 6.71494 5.89935 6.80928C5.86061 6.90362 5.79461 6.98427 5.70981 7.04091C5.625 7.09756 5.52523 7.12763 5.42325 7.12729H2.34632C2.21032 7.12729 2.07988 7.07326 1.98371 6.97709C1.88753 6.88092 1.8335 6.75048 1.8335 6.61447V3.53755C1.83291 3.43585 1.86258 3.33626 1.91873 3.25146C1.97487 3.16666 2.05497 3.10047 2.14883 3.0613C2.24269 3.02214 2.34608 3.01177 2.44585 3.03151C2.54562 3.05125 2.63727 3.10021 2.70915 3.17217L3.96876 4.43499L4.67004 3.79396C5.53157 2.93578 6.62803 2.35208 7.82102 2.11655C9.01401 1.88101 10.25 2.0042 11.3731 2.47056C12.4961 2.93691 13.4558 3.72554 14.131 4.73687C14.8062 5.74821 15.1666 6.93691 15.1668 8.15293Z" fill="#C29D68"/>
                    </svg>  
                </button>
                <div class="cursor-pointer play-pause" data-audio-button="uploaded" onclick="/* Bind togglePlayPause as needed */">
                    <svg class="audioStateIcon playedIcon" width="33" height="32" viewBox="0 0 33 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="0.5" width="32" height="32" rx="16" fill="#C29D68"/>
                        <path d="M22.448 15.9997C22.4484 16.1738 22.4038 16.345 22.3184 16.4968C22.2331 16.6485 22.1099 16.7756 21.9609 16.8657L12.7254 22.5154C12.5697 22.6107 12.3914 22.6628 12.2088 22.6662C12.0263 22.6695 11.8461 22.6241 11.687 22.5346C11.5294 22.4465 11.3981 22.318 11.3066 22.1623C11.2151 22.0066 11.1668 21.8293 11.1665 21.6488V10.3506C11.1668 10.17 11.2151 9.99276 11.3066 9.83707C11.3981 9.68137 11.5294 9.55286 11.687 9.46473C11.8461 9.37522 12.0263 9.3298 12.2088 9.33318C12.3914 9.33656 12.5697 9.38862 12.7254 9.48396L21.9609 15.1337C22.1099 15.2237 22.2331 15.3508 22.3184 15.5026C22.4038 15.6543 22.4484 15.8256 22.448 15.9997Z" fill="#022327"/>
                    </svg>
                    <svg class="audioStateIcon pausedIcon hidden" width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect width="32" height="32" rx="16" fill="#C29D68"/>
                        <path d="M22.2222 10.4441V21.5552C22.2222 21.8499 22.1052 22.1325 21.8968 22.3409C21.6884 22.5493 21.4058 22.6663 21.1111 22.6663H18.3333C18.0386 22.6663 17.756 22.5493 17.5477 22.3409C17.3393 22.1325 17.2222 21.8499 17.2222 21.5552V10.4441C17.2222 10.1494 17.3393 9.86682 17.5477 9.65844C17.756 9.45007 18.0386 9.33301 18.3333 9.33301H21.1111C21.4058 9.33301 21.6884 9.45007 21.8968 9.65844C22.1052 9.86682 22.2222 10.1494 22.2222 10.4441ZM13.8889 9.33301H11.1111C10.8164 9.33301 10.5338 9.45007 10.3254 9.65844C10.1171 9.86682 10 10.1494 10 10.4441V21.5552C10 21.8499 10.1171 22.1325 10.3254 22.3409C10.5338 22.5493 10.8164 22.6663 11.1111 22.6663H13.8889C14.1836 22.6663 14.4662 22.5493 14.6746 22.3409C14.8829 22.1325 15 21.8499 15 21.5552V10.4441C15 10.1494 14.8829 9.86682 14.6746 9.65844C14.4662 9.45007 14.1836 9.33301 13.8889 9.33301Z" fill="#022327"/>
                    </svg>  
                </div>
                <button class="bg-transparent border-none text-[#D4AF7A] cursor-pointer forward">
                    <svg width="17" height="16" viewBox="0 0 17 16" fill="none" 
                        xmlns="http://www.w3.org/2000/svg">
                        <path d="M15.1668 3.53784V6.61469C15.1668 6.75069 15.1128 6.88113 15.0166 6.9773C14.9205 7.07347 14.79 7.12749 14.654 7.12749H11.5772C11.4757 7.12757 11.3765 7.09754 11.2921 7.0412C11.2077 6.98486 11.1419 6.90474 11.103 6.81099C11.0642 6.71723 11.054 6.61406 11.0738 6.51453C11.0937 6.415 11.1426 6.3236 11.2144 6.25188L12.3041 5.16216L11.6278 4.54359L11.6118 4.5282C10.899 3.81572 9.99213 3.32904 9.00439 3.12897C8.01664 2.92891 6.99185 3.02432 6.05801 3.4033C5.12418 3.78227 4.32272 4.428 3.75375 5.25983C3.18477 6.09165 2.87351 7.07269 2.85885 8.08038C2.84419 9.08808 3.12677 10.0778 3.67131 10.9258C4.21584 11.7738 4.99818 12.4426 5.92059 12.8486C6.843 13.2545 7.86459 13.3797 8.85774 13.2085C9.85088 13.0372 10.7716 12.5772 11.5047 11.8857C11.5537 11.8394 11.6113 11.8032 11.6742 11.7792C11.7372 11.7551 11.8042 11.7437 11.8716 11.7456C11.9389 11.7475 12.0052 11.7626 12.0667 11.7901C12.1283 11.8176 12.1837 11.8569 12.23 11.9059C12.2763 11.9548 12.3125 12.0124 12.3366 12.0754C12.3606 12.1383 12.372 12.2054 12.3702 12.2727C12.3683 12.3401 12.3532 12.4064 12.3257 12.4679C12.2981 12.5294 12.2588 12.5849 12.2098 12.6312C11.0696 13.7109 9.55785 14.3109 7.98752 14.3068H7.90291C6.89507 14.293 5.90606 14.0318 5.02279 13.5463C4.13952 13.0607 3.38904 12.3657 2.83731 11.5222C2.28558 10.6786 1.94949 9.71253 1.85858 8.70871C1.76767 7.70489 1.92473 6.6941 2.31594 5.7652C2.70716 4.83629 3.32056 4.0177 4.10223 3.38137C4.8839 2.74504 5.80991 2.31046 6.79887 2.11583C7.78782 1.92119 8.80945 1.97245 9.77396 2.26511C10.7385 2.55777 11.6163 3.08287 12.3304 3.79425L13.031 4.43526L14.2912 3.17247C14.3631 3.10051 14.4547 3.05155 14.5545 3.03181C14.6543 3.01207 14.7576 3.02245 14.8515 3.06161C14.9454 3.10078 15.0255 3.16697 15.0816 3.25176C15.1377 3.33656 15.1674 3.43614 15.1668 3.53784Z"
                                        fill="#C29D68" />
                    </svg>   
                </button>
              </div>
              <!-- Progress and volume controls -->
              <div class="progress-container flex items-center gap-[10px]">
                <span class="current-time page-text text-nowrap">0:00</span>
                <input class="flex-grow-1 appearance-none bg-grey-200 h-[3px] w-full progress" type="range" value="0" min="0" step="0.1">
                <span class="total-time page-text text-nowrap">0:00</span>
                <button class="volume">
                    <svg class="unmuted" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path
                            d="M14.4123 3.70994V20.2114C14.4144 20.3348 14.3844 20.4568 14.3254 20.5652C14.2663 20.6737 14.1801 20.765 14.0752 20.8302C13.9561 20.9011 13.8183 20.9344 13.6799 20.9258C13.5415 20.9172 13.4089 20.8671 13.2995 20.782L7.64758 16.386C7.6066 16.3536 7.57352 16.3123 7.55082 16.2653C7.52813 16.2183 7.51641 16.1667 7.51656 16.1144V7.81202C7.51672 7.75958 7.52883 7.70787 7.55199 7.66082C7.57514 7.61377 7.60872 7.57262 7.65017 7.5405L13.3021 3.14449C13.4259 3.04851 13.5788 2.99758 13.7355 3.00009C13.8921 3.0026 14.0433 3.05839 14.164 3.15828C14.2433 3.22641 14.3067 3.31114 14.3496 3.40647C14.3925 3.50181 14.4139 3.60541 14.4123 3.70994ZM5.79264 7.82581H3.37914C3.01337 7.82581 2.66258 7.97111 2.40394 8.22975C2.1453 8.48839 2 8.83918 2 9.20495V14.7215C2 15.0873 2.1453 15.4381 2.40394 15.6967C2.66258 15.9554 3.01337 16.1007 3.37914 16.1007H5.79264C5.88408 16.1007 5.97178 16.0643 6.03644 15.9997C6.1011 15.935 6.13742 15.8473 6.13742 15.7559V8.1706C6.13742 8.07915 6.1011 7.99146 6.03644 7.9268C5.97178 7.86214 5.88408 7.82581 5.79264 7.82581ZM16.7197 9.62214C16.6516 9.68198 16.596 9.75466 16.556 9.83602C16.5161 9.91738 16.4925 10.0058 16.4868 10.0963C16.481 10.1868 16.4931 10.2775 16.5224 10.3632C16.5518 10.449 16.5977 10.5282 16.6577 10.5962C16.9903 10.9739 17.1738 11.4599 17.1738 11.9632C17.1738 12.4665 16.9903 12.9526 16.6577 13.3303C16.5961 13.398 16.5486 13.4772 16.518 13.5634C16.4873 13.6495 16.4741 13.741 16.4791 13.8323C16.4842 13.9236 16.5073 14.013 16.5472 14.0953C16.5871 14.1777 16.643 14.2512 16.7116 14.3117C16.7802 14.3722 16.8602 14.4184 16.9469 14.4477C17.0335 14.477 17.1251 14.4887 17.2164 14.4823C17.3076 14.4758 17.3967 14.4513 17.4783 14.4101C17.56 14.3689 17.6326 14.3118 17.692 14.2423C18.2467 13.6126 18.5527 12.8023 18.5527 11.9632C18.5527 11.1241 18.2467 10.3138 17.692 9.6842C17.6322 9.61598 17.5595 9.56025 17.478 9.52019C17.3966 9.48014 17.308 9.45655 17.2175 9.45078C17.1269 9.44502 17.0361 9.45719 16.9502 9.48659C16.8644 9.516 16.7852 9.56206 16.7172 9.62214H16.7197ZM20.2443 7.36639C20.185 7.29547 20.112 7.2372 20.0297 7.19507C19.9474 7.15293 19.8574 7.12777 19.7652 7.1211C19.673 7.11443 19.5803 7.12637 19.4928 7.15623C19.4053 7.18608 19.3247 7.23322 19.2558 7.29487C19.1868 7.35651 19.131 7.43138 19.0916 7.51503C19.0522 7.59869 19.03 7.68941 19.0264 7.78181C19.0228 7.8742 19.0378 7.96639 19.0705 8.05287C19.1032 8.13936 19.153 8.21838 19.2168 8.28524C20.1216 9.29669 20.6219 10.6062 20.6219 11.9632C20.6219 13.3203 20.1216 14.6298 19.2168 15.6412C19.153 15.7081 19.1032 15.7871 19.0705 15.8736C19.0378 15.9601 19.0228 16.0523 19.0264 16.1447C19.03 16.2371 19.0522 16.3278 19.0916 16.4114C19.131 16.4951 19.1868 16.57 19.2558 16.6316C19.3247 16.6932 19.4053 16.7404 19.4928 16.7702C19.5803 16.8001 19.673 16.812 19.7652 16.8054C19.8574 16.7987 19.9474 16.7735 20.0297 16.7314C20.112 16.6893 20.185 16.631 20.2443 16.5601C21.3749 15.2959 22 13.6593 22 11.9632C22 10.2672 21.3749 8.63061 20.2443 7.36639Z"
                            fill="white" />
                    </svg>
                    <svg class="muted hidden" width="20" height="18" viewBox="0 0 20 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path
                            d="M19.7979 10.5452C19.9273 10.6746 20 10.8501 20 11.0331C20 11.2161 19.9273 11.3916 19.7979 11.521C19.6685 11.6504 19.493 11.7231 19.31 11.7231C19.127 11.7231 18.9515 11.6504 18.8221 11.521L17.241 9.93915L15.66 11.521C15.5306 11.6504 15.3551 11.7231 15.1721 11.7231C14.9891 11.7231 14.8136 11.6504 14.6842 11.521C14.5548 11.3916 14.4821 11.2161 14.4821 11.0331C14.4821 10.8501 14.5548 10.6746 14.6842 10.5452L16.2661 8.96417L14.6842 7.38316C14.5548 7.25376 14.4821 7.07825 14.4821 6.89524C14.4821 6.71223 14.5548 6.53672 14.6842 6.40732C14.8136 6.27791 14.9891 6.20521 15.1721 6.20521C15.3551 6.20521 15.5306 6.27791 15.66 6.40732L17.241 7.98918L18.8221 6.40732C18.9515 6.27791 19.127 6.20521 19.31 6.20521C19.493 6.20521 19.6685 6.27791 19.7979 6.40732C19.9273 6.53672 20 6.71223 20 6.89524C20 7.07825 19.9273 7.25376 19.7979 7.38316L18.216 8.96417L19.7979 10.5452ZM3.79303 4.82631H1.37928C1.01348 4.82631 0.662649 4.97163 0.403983 5.2303C0.145317 5.48896 0 5.83979 0 6.2056V11.7227C0 12.0885 0.145317 12.4394 0.403983 12.698C0.662649 12.9567 1.01348 13.102 1.37928 13.102H3.79303C3.88448 13.102 3.97219 13.0657 4.03686 13.001C4.10152 12.9364 4.13785 12.8486 4.13785 12.7572V5.17113C4.13785 5.07968 4.10152 4.99198 4.03686 4.92731C3.97219 4.86264 3.88448 4.82631 3.79303 4.82631ZM12.1679 0.1583C12.0471 0.0583964 11.896 0.00259543 11.7393 8.83181e-05C11.5826 -0.0024188 11.4297 0.0485175 11.3058 0.144507L5.65334 4.54098C5.61141 4.57283 5.57733 4.61387 5.55372 4.66094C5.53011 4.70801 5.5176 4.75986 5.51714 4.81252V13.1158C5.51729 13.1683 5.52941 13.22 5.55256 13.267C5.57572 13.3141 5.6093 13.3552 5.65075 13.3874L11.3032 17.7838C11.4127 17.8689 11.5453 17.9191 11.6837 17.9277C11.8221 17.9363 11.9599 17.903 12.0791 17.8321C12.184 17.7669 12.2701 17.6755 12.3292 17.5671C12.3883 17.4586 12.4182 17.3366 12.4161 17.2131V0.710014C12.4174 0.60527 12.3956 0.50153 12.3523 0.406172C12.3089 0.310815 12.2451 0.226184 12.1653 0.1583H12.1679Z"
                            fill="black" />
                    </svg>
                </button>
              </div>
            </div>
          </div>
          `;

        // Get the inserted audio player's id from the data attribute.
        const audioPlayerElement = document.getElementById("audio-uploaded");
        const audioPlayerData =
          audioPlayerElement.getAttribute("data-audio-player");

        // Call playAudio which now handles both the event listeners and duration updates internally.
        playAudio(audioPlayerData);
      }
      this.showFileControls("audio");
      if (this.config.audioPreviewWrapper) {
        this.config.audioPreviewWrapper.classList.remove("hidden");
      }
    }
  }

  handleVideoUpload(e) {
    const file = e.target.files[0];
    if (file) {
      if (this.config.imageUploadInput) this.config.imageUploadInput.value = "";
      if (this.config.imagePreviewWrapper)
        this.config.imagePreviewWrapper.innerHTML = "";
      if (this.config.audioUploadInput) this.config.audioUploadInput.value = "";
      if (this.config.audioPreviewWrapper)
        this.config.audioPreviewWrapper.innerHTML = "";
      this.resetAudioRecording();

      const videoURL = URL.createObjectURL(file);
      if (this.config.videoPreviewWrapper) {
        this.config.videoPreviewWrapper.innerHTML = "";
        const video = document.createElement("video");
        video.controls = true;
        video.width = 300;
        video.classList.add("rounded");
        const source = document.createElement("source");
        source.src = videoURL;
        source.type = file.type;
        video.appendChild(source);
        this.config.videoPreviewWrapper.appendChild(video);
      }
      this.showFileControls("video");
    }
  }
}
