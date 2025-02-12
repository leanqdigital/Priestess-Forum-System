class PostModalManager {
  static async open(post) {
    const modalContent = document.querySelector("#post-modal-content");

    // Determine which file data to show (if any)
    let imageData = null,
      audioData = null,
      videoData = null;

    if (post.file_tpe === "Image" && post.file_content) {
      imageData = post.file_content;
    } else if (post.file_tpe === "Audio" && post.file_content) {
      audioData = post.file_content;
    } else if (post.file_tpe === "Video" && post.file_content) {
      videoData = post.file_content;
    }

    let containerClass = "w-[600px]"; // default width for when neither image nor video is present

    // Check if imageData or videoData exist, and set the class accordingly
    if (
      (post.file_tpe === "Image" && imageData) ||
      (post.file_tpe === "Video" && videoData)
    ) {
      containerClass = "w-[1250px]"; // set to 1250px if image or video data exists
    }

    modalContent.innerHTML = `
<div class="flex ${containerClass} h-[700px] max-[1300px]:w-[900px] max-[1300px]:h-[600px] max-[900px]:w-screen max-[900px]:h-screen">

    
    ${
      post.file_tpe === "Image" && imageData
        ? `
      <div class="w-full h-full border-r-[10px] border-[#000000] flex-1 max-[900px]:hidden">
        ${
          imageData
            ? `
        <div class="flex flex-col gap-3 flex-1 w-full h-full">
            ${
              imageData
                ? `<img class="w-full h-full object-cover" src="${imageData.link}" alt="Post Image">`
                : ""
            }
        </div>
        `
            : ""
        }
    </div>
    `
        : ``
    }
    ${
      post.file_tpe === "Video" && videoData
        ? `
      <div class="w-full h-full border-r-[10px] border-[#000000] flex-1 max-[900px]:hidden">
        ${
          videoData
            ? `
        <div class="flex flex-col gap-3 flex-1 w-full h-full">
            ${
              videoData
                ? `<video controls width="100%" class="object-cover"><source src="${videoData.link}" type="${videoData.type}"></video>`
                : ""
            }
        </div>
        `
            : ""
        }
    </div>
    `
        : ``
    }


    <div class="flex flex-col gap-4 flex-1 bg-primary-100 overflow-auto relative">

          <div class="flex items-center justify-between px-6 py-4 w-full bg-primary-100 sticky top-0 z-[99999]">
              <h2 class="text-white">Post Details</h2>
              <svg class="cursor-pointer" @click="openCommentModal = false" width="14" height="14" viewBox="0 0 14 14"
                  fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                      d="M12.6622 11.8364C12.7164 11.8906 12.7594 11.9549 12.7887 12.0257C12.8181 12.0965 12.8332 12.1724 12.8332 12.2491C12.8332 12.3257 12.8181 12.4016 12.7887 12.4724C12.7594 12.5432 12.7164 12.6075 12.6622 12.6617C12.608 12.7159 12.5437 12.7589 12.4729 12.7883C12.4021 12.8176 12.3262 12.8327 12.2495 12.8327C12.1729 12.8327 12.097 12.8176 12.0262 12.7883C11.9554 12.7589 11.8911 12.7159 11.8369 12.6617L6.99984 7.82399L2.16281 12.6617C2.05336 12.7712 1.90492 12.8327 1.75013 12.8327C1.59534 12.8327 1.44689 12.7712 1.33744 12.6617C1.22799 12.5523 1.1665 12.4038 1.1665 12.2491C1.1665 12.0943 1.22799 11.9458 1.33744 11.8364L6.1752 6.99935L1.33744 2.16233C1.22799 2.05288 1.1665 1.90443 1.1665 1.74964C1.1665 1.59485 1.22799 1.44641 1.33744 1.33696C1.44689 1.2275 1.59534 1.16602 1.75013 1.16602C1.90492 1.16602 2.05336 1.2275 2.16281 1.33696L6.99984 6.17471L11.8369 1.33696C11.9463 1.2275 12.0948 1.16602 12.2495 1.16602C12.4043 1.16602 12.5528 1.2275 12.6622 1.33696C12.7717 1.44641 12.8332 1.59485 12.8332 1.74964C12.8332 1.90443 12.7717 2.05288 12.6622 2.16233L7.82448 6.99935L12.6622 11.8364Z"
                      fill="white" />
              </svg>
          </div>

          <div class = "flex flex-col gap-4 px-6">
            <div class="flex items-center">
                <div class="flex items-center gap-2">
                    <div class="author-image-container">
                        <img class = "w-[32px] h-[32px] rounded-full" src="${
                          post.author.profileImage
                        }">
                    </div>
                    <div class="author-name-container">
                        <div class="text-center text-white text-base font-semibold font-['Avenir LT Std'] leading-normal">${
                          post.author.name
                        }</div>
                    </div>
                    <div class="h-[15px] w-[2px] bg-[#c29d68]"></div>
                    <div class="text-center text-white text-xs font-['Avenir LT Std'] leading-3">${
                      post.date
                    }
                    </div>
                </div>
            </div>
            <div class="flex">
                <div class="post-content w-[90%]">
                    <div class="text-white text-base font-['Avenir LT Std'] leading-tight">${
                      post.content
                    }.</div>
                </div>
                <div class = "w-[5px] h-[auto] bg-[#586A80] ml-auto"></div>
            </div>
            
            <div class="flex">
                ${
                  post.file_tpe === "Image" && imageData
                    ? `
                  <div class="w-full h-full flex-1 min-[900px]:hidden">
                    ${
                      imageData
                        ? `
                    <div class="flex flex-col gap-3 flex-1 w-full h-full">
                        ${
                          imageData
                            ? `<img class="w-full h-full object-cover" src="${imageData.link}" alt="Post Image">`
                            : ""
                        }
                    </div>
                    `
                        : ""
                    }
                  </div>
                `
                    : ``
                }
                ${
                  post.file_tpe === "Video" && videoData
                    ? `
                  <div class="w-full h-full flex-1 min-[900px]:hidden">
                    ${
                      videoData
                        ? `
                    <div class="flex flex-col gap-3 flex-1 w-full h-full">
                        ${
                          videoData
                            ? `<video controls width="100%" class="object-cover"><source src="${videoData.link}" type="${videoData.type}"></video>`
                            : ""
                        }
                    </div>
                    `
                        : ""
                    }
                  </div>
                `
                    : ``
                }
                
                ${
                  post.file_tpe === "Audio" && audioData
                    ? `
                  <div class="post-audio-wrapper mb-4 w-full">
                      <!-- Initialize an Alpine component using x-data and x-init -->
                      <div class="audio-player-modal bg-primary p-5 rounded-[12px] w-full text-center" id="audio-${post.id}"
                          data-audio-player-modal="${post.id}">
                  
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
                              <source src="${audioData.link}" type="${audioData.type}">
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
                  
                              <div class="cursor-pointer" id="play-pause" data-audio-button="${post.id}">
                                  <svg class="playedIcon" width="33" height="32" viewBox="0 0 33 32" fill="none"
                                      xmlns="http://www.w3.org/2000/svg">
                                      <rect x="0.5" width="32" height="32" rx="16" fill="#C29D68" />
                                      <path
                                          d="M22.448 15.9997C22.4484 16.1738 22.4038 16.345 22.3184 16.4968C22.2331 16.6485 22.1099 16.7756 21.9609 16.8657L12.7254 22.5154C12.5697 22.6107 12.3914 22.6628 12.2088 22.6662C12.0263 22.6695 11.8461 22.6241 11.687 22.5346C11.5294 22.4465 11.3981 22.318 11.3066 22.1623C11.2151 22.0066 11.1668 21.8293 11.1665 21.6488V10.3506C11.1668 10.17 11.2151 9.99276 11.3066 9.83707C11.3981 9.68137 11.5294 9.55286 11.687 9.46473C11.8461 9.37522 12.0263 9.3298 12.2088 9.33318C12.3914 9.33656 12.5697 9.38862 12.7254 9.48396L21.9609 15.1337C22.1099 15.2237 22.2331 15.3508 22.3184 15.5026C22.4038 15.6543 22.4484 15.8256 22.448 15.9997Z"
                                          fill="#022327" />
                                  </svg>
                                  <svg class="pausedIcon hidden" width="32" height="32" viewBox="0 0 32 32" fill="none"
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
                  
                          <!-- Progress and volume -->
                          <div class="progress-container flex items-center gap-[10px]">
                              <span id="current-time" class="text-[#ffffff]">0:00</span>
                              <input class="flex-grow-1 appearance-none bg-grey-200 h-[3px] w-full" type="range" id="progress" value="0"
                                  min="0" step="0.1">
                              <span id="total-time" class="text-[#ffffff]">-0:00</span>
                              <button id="volume">
                                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M14.4123 3.70994V20.2114C14.4144 20.3348 14.3844 20.4568 14.3254 20.5652C14.2663 20.6737 14.1801 20.765 14.0752 20.8302C13.9561 20.9011 13.8183 20.9344 13.6799 20.9258C13.5415 20.9172 13.4089 20.8671 13.2995 20.782L7.64758 16.386C7.6066 16.3536 7.57352 16.3123 7.55082 16.2653C7.52813 16.2183 7.51641 16.1667 7.51656 16.1144V7.81202C7.51672 7.75958 7.52883 7.70787 7.55199 7.66082C7.57514 7.61377 7.60872 7.57262 7.65017 7.5405L13.3021 3.14449C13.4259 3.04851 13.5788 2.99758 13.7355 3.00009C13.8921 3.0026 14.0433 3.05839 14.164 3.15828C14.2433 3.22641 14.3067 3.31114 14.3496 3.40647C14.3925 3.50181 14.4139 3.60541 14.4123 3.70994ZM5.79264 7.82581H3.37914C3.01337 7.82581 2.66258 7.97111 2.40394 8.22975C2.1453 8.48839 2 8.83918 2 9.20495V14.7215C2 15.0873 2.1453 15.4381 2.40394 15.6967C2.66258 15.9554 3.01337 16.1007 3.37914 16.1007H5.79264C5.88408 16.1007 5.97178 16.0643 6.03644 15.9997C6.1011 15.935 6.13742 15.8473 6.13742 15.7559V8.1706C6.13742 8.07915 6.1011 7.99146 6.03644 7.9268C5.97178 7.86214 5.88408 7.82581 5.79264 7.82581ZM16.7197 9.62214C16.6516 9.68198 16.596 9.75466 16.556 9.83602C16.5161 9.91738 16.4925 10.0058 16.4868 10.0963C16.481 10.1868 16.4931 10.2775 16.5224 10.3632C16.5518 10.449 16.5977 10.5282 16.6577 10.5962C16.9903 10.9739 17.1738 11.4599 17.1738 11.9632C17.1738 12.4665 16.9903 12.9526 16.6577 13.3303C16.5961 13.398 16.5486 13.4772 16.518 13.5634C16.4873 13.6495 16.4741 13.741 16.4791 13.8323C16.4842 13.9236 16.5073 14.013 16.5472 14.0953C16.5871 14.1777 16.643 14.2512 16.7116 14.3117C16.7802 14.3722 16.8602 14.4184 16.9469 14.4477C17.0335 14.477 17.1251 14.4887 17.2164 14.4823C17.3076 14.4758 17.3967 14.4513 17.4783 14.4101C17.56 14.3689 17.6326 14.3118 17.692 14.2423C18.2467 13.6126 18.5527 12.8023 18.5527 11.9632C18.5527 11.1241 18.2467 10.3138 17.692 9.6842C17.6322 9.61598 17.5595 9.56025 17.478 9.52019C17.3966 9.48014 17.308 9.45655 17.2175 9.45078C17.1269 9.44502 17.0361 9.45719 16.9502 9.48659C16.8644 9.516 16.7852 9.56206 16.7172 9.62214H16.7197ZM20.2443 7.36639C20.185 7.29547 20.112 7.2372 20.0297 7.19507C19.9474 7.15293 19.8574 7.12777 19.7652 7.1211C19.673 7.11443 19.5803 7.12637 19.4928 7.15623C19.4053 7.18608 19.3247 7.23322 19.2558 7.29487C19.1868 7.35651 19.131 7.43138 19.0916 7.51503C19.0522 7.59869 19.03 7.68941 19.0264 7.78181C19.0228 7.8742 19.0378 7.96639 19.0705 8.05287C19.1032 8.13936 19.153 8.21838 19.2168 8.28524C20.1216 9.29669 20.6219 10.6062 20.6219 11.9632C20.6219 13.3203 20.1216 14.6298 19.2168 15.6412C19.153 15.7081 19.1032 15.7871 19.0705 15.8736C19.0378 15.9601 19.0228 16.0523 19.0264 16.1447C19.03 16.2371 19.0522 16.3278 19.0916 16.4114C19.131 16.4951 19.1868 16.57 19.2558 16.6316C19.3247 16.6932 19.4053 16.7404 19.4928 16.7702C19.5803 16.8001 19.673 16.812 19.7652 16.8054C19.8574 16.7987 19.9474 16.7735 20.0297 16.7314C20.112 16.6893 20.185 16.631 20.2443 16.5601C21.3749 15.2959 22 13.6593 22 11.9632C22 10.2672 21.3749 8.63061 20.2443 7.36639Z" fill="white" /></svg>
                              </button>
                          </div>
                  
                      </div> <!-- end .audio-player -->
                  </div>
                  `
                    : ""
                }
            </div>
            <div class="flex items-center justify-between">
                <div class="flex items-center gap-6">
                    <div class="flex items-center gap-2 cursor-pointer vote-container">
                        <button class="vote-button" data-post-id="${post.id}">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path
                                    d="M22 8.18423C22.0015 8.8644 21.8682 9.53811 21.6076 10.1664C21.3471 10.7947 20.9646 11.3651 20.4823 11.8446L12.5097 19.9351C12.4432 20.0025 12.364 20.0561 12.2766 20.0927C12.1893 20.1293 12.0955 20.1481 12.0008 20.1481C11.9061 20.1481 11.8123 20.1293 11.725 20.0927C11.6376 20.0561 11.5584 20.0025 11.4919 19.9351L3.51935 11.8446C2.54736 10.8738 2.00084 9.55668 2 8.18292C1.99916 6.80916 2.54408 5.49134 3.51489 4.51935C4.48569 3.54736 5.80285 3.00084 7.17661 3C8.55037 2.99916 9.8682 3.54409 10.8402 4.51489L12.0008 5.59962L13.1695 4.51132C13.8948 3.78958 14.8177 3.29892 15.8217 3.10128C16.8257 2.90364 17.8657 3.00788 18.8104 3.40085C19.7552 3.79381 20.5624 4.45788 21.1301 5.30922C21.6977 6.16055 22.0004 7.16099 22 8.18423Z"
                                    fill="#C29D68" />
                            </svg>
                        </button>
                        <div class="o1 text-white postVoteCount">${
                          post.PostVotesCount
                        }</div>
                    </div>
                    <div class="flex items-center gap-2 cursor-pointer comment-container">
                        <button class="comment-button" data-post-id="${
                          post.id
                        }">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12.375 2.25C9.88943 2.25273 7.50645 3.24133 5.74889 4.99889C3.99133 6.75645 3.00273 9.13943 3 11.625V19.5C3 19.8978 3.15804 20.2794 3.43934 20.5607C3.72064 20.842 4.10218 21 4.5 21H12.375C14.8614 21 17.246 20.0123 19.0041 18.2541C20.7623 16.496 21.75 14.1114 21.75 11.625C21.75 9.1386 20.7623 6.75403 19.0041 4.99587C17.246 3.23772 14.8614 2.25 12.375 2.25ZM15.375 14.25H9C8.80109 14.25 8.61032 14.171 8.46967 14.0303C8.32902 13.8897 8.25 13.6989 8.25 13.5C8.25 13.3011 8.32902 13.1103 8.46967 12.9697C8.61032 12.829 8.80109 12.75 9 12.75H15.375C15.5739 12.75 15.7647 12.829 15.9053 12.9697C16.046 13.1103 16.125 13.3011 16.125 13.5C16.125 13.6989 16.046 13.8897 15.9053 14.0303C15.7647 14.171 15.5739 14.25 15.375 14.25ZM15.375 11.25H9C8.80109 11.25 8.61032 11.171 8.46967 11.0303C8.32902 10.8897 8.25 10.6989 8.25 10.5C8.25 10.3011 8.32902 10.1103 8.46967 9.96967C8.61032 9.82902 8.80109 9.75 9 9.75H15.375C15.5739 9.75 15.7647 9.82902 15.9053 9.96967C16.046 10.1103 16.125 10.3011 16.125 10.5C16.125 10.6989 16.046 10.8897 15.9053 11.0303C15.7647 11.171 15.5739 11.25 15.375 11.25Z" fill="#C29D68" /></svg>
                        </button>
                        <div class="o1 text-white postCommentCount">${
                          post.PostCommentCount
                        }</div>
                    </div>
                </div>
            </div>
            <div class="h-[0px] border border-[#d9d9d9]"></div>
            <div class="flex gap-2">
                <div class="author-image-container max-[900px]:hidden"><img class = "w-[32px] h-[32px] rounded-full" src="${
                  post.author.profileImage
                }"></div>
                <div class="comment-form-wrapper rounded-[12px] max-[500px]:mb-0 mb-4 flex flex-col gap-4 border border-gray-600 active:border-[#ffffff] focus:border-[#ffffff] comment-form flex items-center gap-3 w-full bg-primary-100 max-[500px]:p-4 z-[999] max-[500px]:!z-[99999] max-[500px]:fixed bottom-0 right-0 w-full max-[500px]:bg-primary max-[500px]:flex-row max-[500px]:bottom-2 max-[500px]:left-2 max-[500px]:right-2 max-[500px]:w-[calc(100%-16px)] max-[500px]:p-2">
                    <div id="comment-editor" class="relative h-[40px] editor comment-editor text-white p-2 w-full !border-none !focus-visible:border-none rounded" contenteditable="true"></div>
                    <div class="flex items-center justify-end w-full p-2 max-[500px]:p-0">
                        <button id="submit-comment"
                            class="w-fit bg-secondary text-white px-4 py-2 rounded hover:bg-secondary-200 transition-colors flex items-center gap-2">
                            <span>Comment</span>
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path
                                    d="M11.1662 5.99246C11.1666 6.14096 11.1273 6.28687 11.0524 6.41509C10.9775 6.54331 10.8697 6.64919 10.7401 6.72177L1.99252 11.7233C1.86699 11.7944 1.72527 11.8321 1.58098 11.8327C1.44803 11.832 1.31719 11.7995 1.19936 11.7379C1.08154 11.6763 0.980152 11.5874 0.903674 11.4787C0.827196 11.3699 0.777842 11.2444 0.759734 11.1127C0.741625 10.981 0.755286 10.8469 0.799577 10.7215L2.20611 6.55663C2.21985 6.51591 2.24585 6.48044 2.28055 6.45507C2.31524 6.42971 2.35693 6.41569 2.3999 6.41494H6.16523C6.22236 6.41506 6.27891 6.40344 6.33136 6.38079C6.38381 6.35814 6.43104 6.32495 6.47012 6.28328C6.50921 6.24161 6.5393 6.19235 6.55855 6.13855C6.57779 6.08476 6.58576 6.02758 6.58198 5.97058C6.57253 5.86341 6.52294 5.76377 6.44315 5.69162C6.36336 5.61946 6.25926 5.5801 6.15168 5.58144H2.40094C2.35734 5.58144 2.31484 5.56777 2.27943 5.54235C2.24401 5.51693 2.21745 5.48105 2.2035 5.43974L0.796973 1.27537C0.74099 1.11575 0.734897 0.942879 0.779504 0.779715C0.82411 0.616551 0.917305 0.470821 1.04671 0.361883C1.17611 0.252946 1.33559 0.185958 1.50397 0.169819C1.67235 0.15368 1.84166 0.189153 1.9894 0.271527L10.7411 5.26679C10.87 5.3392 10.9772 5.44457 11.0519 5.57208C11.1266 5.69959 11.1661 5.84468 11.1662 5.99246Z"
                                    fill="#ffffff" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
            <section id="modal-comments-section" class = "pb-[150px]">
                <div class="mb-4 max-[500px]:mb-2 text-white text-sm font-['Avenir LT Std'] leading-[14px]">Comments</div>
                <div id="modal-comments-container" class="space-y-4 modal-comments-container-${
                  post.id
                }">
                    <p class="text-gray-300">Loading comments...</p>
                </div>
            </section>
          </div>  
    </div>
</div>
`;
    window.playAudioModal = function (id) {
      let player = document.querySelector(`[data-audio-player-modal="${id}"]`);
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
    };

    // Remove onclick from the HTML, then after setting innerHTML:
    const playPauseBtn = modalContent.querySelector(
      `[data-audio-button="${post.id}"]`
    );
    playPauseBtn.addEventListener("click", () => playAudioModal(post.id));

    // Initialize mention functionality for comments
    const commentEditor = document.getElementById("comment-editor");
    MentionManager.tribute.attach(commentEditor);

    // Add comment submit handler
    document
      .getElementById("submit-comment")
      .addEventListener("click", async () => {
        const commentForm = document.querySelector(".comment-form-wrapper");
        const editor = document.getElementById("comment-editor");
        const content = editor.innerText.trim();
        const mentions = Array.from(editor.querySelectorAll(".mention")).map(
          (el) => el.dataset.contactId
        );
        commentForm.classList.add("state-disabled");
        editor.innerHTML = "";
        if (!content) {
          UIManager.showError("Comment cannot be empty");
          return;
        }
        try {
          await forumManager.createComment(post.id, content, mentions);
        } catch (error) {
        } finally {
          commentForm.classList.remove("state-disabled");
        }
      });
    await PostModalManager.loadComments(post.id);
  }

  static async confirmDeleteComment(commentId) {
    const confirmed = await UIManager.showDeleteConfirmation(
      "Are you sure you want to delete this comment?"
    );
    if (!confirmed) return;
    try {
      await PostModalManager.deleteComment(commentId);
      document.querySelector(`[data-comment-id="${commentId}"]`).remove();
      UIManager.showSuccess("Comment deleted successfully.");
    } catch (error) {
      UIManager.showError("Failed to delete comment.");
    }
  }

  static async deleteComment(commentId) {
    const query = `
      mutation deleteForumComment($id: PriestessForumCommentID) {
        deleteForumComment(query: [{ where: { id: $id } }]) {
          id
        }
      }
    `;
    const variables = { id: commentId };
    const toDeleteComment = document.querySelector(
      `[data-comment-id="${commentId}"]`
    );
    toDeleteComment.classList.add("state-disabled");
    await ApiService.query(query, variables);
  }

  static async loadComments(postId) {
    try {
      const comments = await forumManager.fetchComments(postId);
      await Promise.all(
        comments.map(async (comment) => {
          const voteRecords = await forumManager.fetchVoteForComment(
            comment.id
          );
          comment.isCommentVoted = voteRecords.length > 0;
          // comment.voteCommentCount = voteRecords.length;
        })
      );

      const commentsContainer = document.getElementById(
        "modal-comments-container"
      );
      const commentTemplate = $.templates("#comment-template");
      commentsContainer.innerHTML = commentTemplate.render(comments);

      document.querySelectorAll(".delete-comment-btn").forEach((button) => {
        button.addEventListener("click", (e) => {
          const commentId = e.target.dataset.commentId;
          PostModalManager.confirmDeleteComment(commentId);
        });
      });

      const replyEditors = commentsContainer.querySelectorAll(".reply-editor");
      replyEditors.forEach((editor) => {
        setTimeout(() => {
          MentionManager.tribute.attach(editor);
        }, 500);
      });

      loadRepliesForComments(comments);
    } catch (error) {
      document.getElementById(
        "modal-comments-container"
      ).innerHTML = `<p class="text-red-300">Error loading comments</p>`;
    }

    async function loadRepliesForComments(comments) {
      await Promise.all(
        comments.map(async (comment) => {
          try {
            const replies = await forumManager.fetchReplies(comment.id);

            await Promise.all(
              replies.map(async (reply) => {
                const voteRecords = await forumManager.fetchVoteForReply(
                  reply.id
                );
                reply.isReplyVoted = voteRecords.length > 0;
              })
            );

            const container = document.querySelector(
              `[data-comment-id="${comment.id}"] .replies-container`
            );
            if (container) {
              const replyTemplate = $.templates("#reply-template");
              container.innerHTML = replies
                .map((reply) => replyTemplate.render(reply))
                .join("");
            }
          } catch (error) {}
        })
      );
    }
  }
}
