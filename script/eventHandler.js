document.addEventListener("DOMContentLoaded", () => MentionManager.init());

// Create post Start
const postFormConfig = {
  editor: document.getElementById("post-editor"),
  imageUploadInput: document.getElementById("post-image-upload"),
  audioUploadInput: document.getElementById("post-audio-upload"),
  videoUploadInput: document.getElementById("post-video-upload"),
  uploadImageBtn: document.getElementById("upload-image-button"),
  uploadAudioBtn: document.getElementById("upload-audio-button"),
  uploadVideoBtn: document.getElementById("upload-video-button"),
  imagePreviewWrapper: document.getElementById("image-preview-wrapper"),
  audioPreviewWrapper: document.getElementById("audio-preview-wrapper"),
  videoPreviewWrapper: document.getElementById("video-preview-wrapper"),
  fileControls: document.getElementById("file-controls"),
  audioOptionsWrapper: document.getElementById("audioOptionsWrapper"),
  recordAudioBtn: document.getElementById("record-audio-button"),
  stopRecordingBtn: document.querySelector(".stopRecording"),
  replaceRecordingBtn: document.querySelector(".replaceRecording"),
  deleteRecordingBtn: document.querySelector(".deleteRecording"),
  approveRecordingBtn: document.querySelector(".approveRecording"),
  fullAudioRecordingWrapper: document.querySelector(
    ".fullAudioRecordingWrapper"
  ),
  recordingTimer: document.querySelector(".recordingTimer"),
  waveWrapper: document.querySelector(".waveWrapper"),
  refreshBtn: document.getElementById("refresh-upload"),
  deleteUploadBtn: document.getElementById("delete-upload"),
  modal: document.getElementById("postNewModal"),
};
window.mediaFormHandler = new MediaFormHandler(postFormConfig);

document.getElementById("submit-post").addEventListener("click", async (e) => {
  e.preventDefault();
  resetEmojiForm();
  const htmlContent = window.mediaFormHandler.config.editor.innerHTML.trim();
  const tempContainer = document.createElement("div");
  tempContainer.innerHTML = htmlContent;
  const mentionedIds = [];
  tempContainer.querySelectorAll(".mention").forEach((mention) => {
    const id = mention.dataset.contactId;
    if (id) {
      if (id.toLowerCase() === "all" && MentionManager?.allContacts) {
        MentionManager.allContacts.forEach((contact) => {
          const numId = Number(contact.id);
          if (!isNaN(numId) && !mentionedIds.includes(numId)) {
            mentionedIds.push(numId);
          }
        });
      } else {
        const numId = Number(id);
        if (!isNaN(numId) && !mentionedIds.includes(numId)) {
          mentionedIds.push(numId);
        }
      }
    }
  });

  const imageFile = window.mediaFormHandler.config.imageUploadInput.files[0];
  const audioFile =
    window.mediaFormHandler.config.audioUploadInput.files[0] ||
    window.mediaFormHandler.currentRecordedAudioFile;
  const videoFile = window.mediaFormHandler.config.videoUploadInput.files[0];

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

  if (!htmlContent && !uploadedFile) {
    window.UIManager.showError("Post content or a file is required.");
    return;
  }

  if (window.mediaFormHandler.config.modal)
    window.mediaFormHandler.config.modal.hide();
  window.mediaFormHandler.resetForm();

  const tempPost = {
    id: `temp-${Date.now()}`,
    author_id: window.forumManager.userId,
    disableComments: false,
    file_content: uploadedFile
      ? { link: URL.createObjectURL(uploadedFile) }
      : null,
    file_tpe: uploadedFile ? fileType : null,
    author: {
      authorDisplayName: window.forumManager.authorDisplayName,
      profileImage: window.forumManager.defaultLoggedInAuthorImage,
    },
    date: "Just now",
    content: htmlContent,
  };

  const template = $.templates("#post-template");
  const postContainer = document.querySelector(CONFIG.selectors.postsContainer);
  postContainer.insertAdjacentHTML("afterbegin", template.render(tempPost));
  const postElement = postContainer.firstElementChild;
  postElement.classList.add("state-disabled");

  let fileData = null;
  if (uploadedFile) {
    const fileFields = [{ fieldName: "file_content", file: uploadedFile }];
    const toSubmitFields = {};
    await processFileFields(toSubmitFields, fileFields, awsParam, awsParamUrl);
    fileData =
      typeof toSubmitFields.file_content === "string"
        ? JSON.parse(toSubmitFields.file_content)
        : toSubmitFields.file_content;
    fileData.name = fileData.name || uploadedFile.name;
    fileData.size = fileData.size || uploadedFile.size;
    fileData.type = fileData.type || uploadedFile.type;
  }

  let newPost;
  try {
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
          Mentioned_Users { id }
        }
      }
      `,
      {
        payload: {
          author_id: forumManager.userId,
          post_copy: htmlContent,
          Mentioned_Users: mentionedIds.map((id) => ({ id: id })),
          related_course_id: courseID,
          file_tpe: uploadedFile ? fileType : null,
          file_content: fileData ? fileData : null,
        },
      }
    );
    newPost = response.createForumPost;
    postElement.dataset.postId = newPost.id;
  } catch (error) {
    window.UIManager.showError("Failed to post. Please try again.");
    postContainer.removeChild(postElement);
    return;
  }

  try {
    const fetchResponse = await ApiService.query(
      `
      query calcForumPosts($id: PriestessForumPostID) {
        calcForumPosts(query: [{ where: { id: $id } }]) {
          ID: field(arg: ["id"])
          Author_ID: field(arg: ["author_id"])
          Author_First_Name: field(arg: ["Author", "first_name"])
          Author_Last_Name: field(arg: ["Author", "last_name"])
          Author_Forum_Image: field(arg: ["Author", "forum_image"])
          Date_Added: field(arg: ["created_at"])
          Post_Copy: field(arg: ["post_copy"])
          File_Tpe: field(arg: ["file_tpe"])
          File_Content: field(arg: ["file_content"])
          ForumCommentsTotalCount: countDistinct(args: [{ field: ["ForumComments", "id"] }])
          Member_Post_Upvotes_DataTotal_Count: countDistinct(args: [{ field: ["Member_Post_Upvotes_Data", "id"] }])
          Disable_New_Comments: field(arg: ["disable_new_comments"])
          Author_Display_Name: field(arg: ["Author", "display_name"])
        }
      }
      `,
      { id: newPost.id }
    );
    const actualPost = fetchResponse.calcForumPosts[0];
    postElement.querySelector(".vote-button").dataset.postId = actualPost.ID;
    postElement.querySelector(".post-author-name").textContent =
      actualPost.Author_Display_Name;
    postElement.querySelector(".post-author-image").src =
      actualPost.Author_Forum_Image?.trim()
        ? actualPost.Author_Forum_Image
        : DEFAULT_AVATAR;
    postElement.querySelector(".post-copy-content").innerHTML =
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
    formatPreiview();
    let postCopyContentContainer =
      postElement.querySelector(".content-container");
    linkifyElement(postCopyContentContainer);
  } catch (fetchError) {
  } finally {
    window.mediaFormHandler.config.editor.innerHTML = "";
    postElement.classList.remove("state-disabled");
  }
});

document.addEventListener("DOMContentLoaded", () => {
  document.querySelector(".stopRecording").addEventListener("click", () => {
    window.mediaFormHandler.stopAudioRecording();
  });
  document.querySelector(".replaceRecording").addEventListener("click", () => {
    window.mediaFormHandler.resetAudioRecording();
    window.mediaFormHandler.startAudioRecording();
  });
  document.querySelector(".deleteRecording").addEventListener("click", () => {
    if (
      window.mediaFormHandler.mediaRecorder &&
      window.mediaFormHandler.mediaRecorder.state === "recording"
    ) {
      window.mediaFormHandler.mediaRecorder.onstop = () => {};
    }
    window.mediaFormHandler.resetAudioRecording();
    window.mediaFormHandler.stopAudioRecording();
    window.mediaFormHandler.config.audioPreviewWrapper.innerHTML = "";
    window.mediaFormHandler.config.audioPreviewWrapper.classList.add("hidden");
    window.mediaFormHandler.currentFileType = null;
    window.mediaFormHandler.currentRecordedAudioFile = null;
    window.mediaFormHandler.config.fileControls.classList.add("hidden");
    window.mediaFormHandler.config.uploadImageBtn.classList.remove("hidden");
    window.mediaFormHandler.config.audioOptionsWrapper.classList.remove(
      "hidden"
    );
    window.mediaFormHandler.config.uploadVideoBtn.classList.remove("hidden");
  });
  document.querySelector(".approveRecording").addEventListener("click", () => {
    if (
      window.mediaFormHandler.mediaRecorder &&
      window.mediaFormHandler.mediaRecorder.state === "recording"
    ) {
      window.mediaFormHandler.stopAudioRecording();
    }
    window.mediaFormHandler.config.fullAudioRecordingWrapper.classList.add(
      "hidden"
    );
    window.mediaFormHandler.config.audioPreviewWrapper.classList.remove(
      "hidden"
    );
  });

  window.mediaFormHandler.config.refreshBtn.addEventListener("click", () => {
    if (window.mediaFormHandler.currentFileType === "image") {
      window.mediaFormHandler.config.imagePreviewWrapper.innerHTML = "";
      window.mediaFormHandler.config.imageUploadInput.value = "";
      window.mediaFormHandler.config.imageUploadInput.click();
    } else if (window.mediaFormHandler.currentFileType === "audio") {
      window.mediaFormHandler.config.audioPreviewWrapper.innerHTML = "";
      window.mediaFormHandler.config.audioUploadInput.value = "";
      window.mediaFormHandler.currentRecordedAudioFile = null;
      window.mediaFormHandler.config.audioUploadInput.click();
    } else if (window.mediaFormHandler.currentFileType === "video") {
      window.mediaFormHandler.config.videoPreviewWrapper.innerHTML = "";
      window.mediaFormHandler.config.videoUploadInput.value = "";
      window.mediaFormHandler.config.videoUploadInput.click();
    }
  });

  window.mediaFormHandler.config.deleteUploadBtn.addEventListener(
    "click",
    () => {
      if (window.mediaFormHandler.currentFileType === "image") {
        window.mediaFormHandler.config.imagePreviewWrapper.innerHTML = "";
        window.mediaFormHandler.config.imageUploadInput.value = "";
      } else if (window.mediaFormHandler.currentFileType === "audio") {
        window.mediaFormHandler.config.audioPreviewWrapper.innerHTML = "";
        window.mediaFormHandler.config.audioUploadInput.value = "";
        window.mediaFormHandler.currentRecordedAudioFile = null;
      } else if (window.mediaFormHandler.currentFileType === "video") {
        window.mediaFormHandler.config.videoPreviewWrapper.innerHTML = "";
        window.mediaFormHandler.config.videoUploadInput.value = "";
      }
      window.mediaFormHandler.currentFileType = null;
      window.mediaFormHandler.config.fileControls.classList.add("hidden");
      window.mediaFormHandler.config.uploadImageBtn.classList.remove("hidden");
      window.mediaFormHandler.config.audioOptionsWrapper.classList.remove(
        "hidden"
      );
      window.mediaFormHandler.config.uploadVideoBtn.classList.remove("hidden");
    }
  );
});
// Create post end

//Create Reply Part start
document.addEventListener("click", function (e) {
  const replyBtn = e.target.closest(".reply-btn");
  if (!replyBtn) return;
  e.preventDefault();
  const targetId = replyBtn.getAttribute("data-target");
  if (!targetId) return;
  const replyForm = document.querySelector(".reply-form-" + targetId);
  if (!replyForm) return;
  if (replyForm.classList.contains("hidden")) {
    replyForm.classList.remove("hidden");
    replyForm.classList.add("flex");
    replyForm.scrollIntoView({ behavior: "smooth", block: "start" });
    initReplyFormEvents(targetId, replyForm);
    const editor = replyForm.querySelector(".reply-editor");
    if (editor) editor.focus();
  } else {
    replyForm.classList.remove("flex");
    replyForm.classList.add("hidden");
  }
});

function initReplyFormEvents(targetId, replyForm) {
  const wrapperSelector = "#reply-form-wrapper-" + targetId;
  const replyWrapper = replyForm.querySelector(wrapperSelector);
  if (!replyWrapper) return;
  if (!replyWrapper.dataset.mediaHandlerInitialized) {
    const config = {
      editor: replyWrapper.querySelector(".reply-editor"),
      imageUploadInput: replyWrapper.querySelector(".reply-image-upload"),
      audioUploadInput: replyWrapper.querySelector(".reply-audio-upload"),
      videoUploadInput: replyWrapper.querySelector(".reply-video-upload"),
      uploadImageBtn: replyWrapper.querySelector(".upload-image-button-reply"),
      uploadAudioBtn: replyWrapper.querySelector("#upload-audio-button-reply"),
      uploadVideoBtn: replyWrapper.querySelector("#upload-video-button-reply"),
      audioOptionsWrapper: replyWrapper.querySelector(
        ".replyAudioOptionsWrapper"
      ),
      imagePreviewWrapper:
        replyWrapper.querySelector("#image-preview-wrapper-reply") ||
        replyWrapper.querySelector(".image-preview-wrapper-reply"),
      audioPreviewWrapper:
        replyWrapper.querySelector("#audio-preview-wrapper-reply") ||
        replyWrapper.querySelector(".audio-preview-wrapper-reply"),
      videoPreviewWrapper:
        replyWrapper.querySelector("#video-preview-wrapper-reply") ||
        replyWrapper.querySelector(".video-preview-wrapper-reply"),
      fileControls:
        replyWrapper.querySelector("#file-controls-reply") ||
        replyWrapper.querySelector(".file-controls-reply"),
      recordAudioBtn: replyWrapper.querySelector("#record-audio-button-reply"),
      stopRecordingBtn: replyWrapper.querySelector(".stopRecordingReply"),
      replaceRecordingBtn: replyWrapper.querySelector(".replaceRecordingReply"),
      deleteRecordingBtn: replyWrapper.querySelector(".deleteRecordingReply"),
      approveRecordingBtn: replyWrapper.querySelector(".approveRecordingReply"),
      fullAudioRecordingWrapper: replyWrapper.querySelector(
        ".fullAudioRecordingWrapperReply"
      ),
      recordingTimer: replyWrapper.querySelector(".recordingTimerReply"),
      waveWrapper: replyWrapper.querySelector(".waveWrapperReply"),
    };
    replyWrapper.mediaHandler = new MediaFormHandler(config);
    replyWrapper.dataset.mediaHandlerInitialized = "true";
  }
  attachReplyControls(replyWrapper);
}

function attachReplyControls(replyWrapper) {
  const stopBtn = replyWrapper.querySelector(".stopRecordingReply");
  if (stopBtn) {
    stopBtn.addEventListener("click", function (e) {
      e.preventDefault();
      replyWrapper.mediaHandler.stopAudioRecording();
    });
  }
  const replaceBtn = replyWrapper.querySelector(".replaceRecordingReply");
  if (replaceBtn) {
    replaceBtn.addEventListener("click", function (e) {
      e.preventDefault();
      replyWrapper.mediaHandler.resetAudioRecording();
      replyWrapper.mediaHandler.startAudioRecording();
    });
  }
  const deleteRecBtn = replyWrapper.querySelector(".deleteRecordingReply");
  if (deleteRecBtn) {
    deleteRecBtn.addEventListener("click", function (e) {
      e.preventDefault();
      const mh = replyWrapper.mediaHandler;
      if (mh.mediaRecorder && mh.mediaRecorder.state === "recording") {
        mh.mediaRecorder.onstop = () => {};
      }
      mh.resetAudioRecording();
      mh.stopAudioRecording();
      const audioPrev = replyWrapper.querySelector(
        ".audio-preview-wrapper-reply"
      );
      if (audioPrev) {
        audioPrev.innerHTML = "";
        audioPrev.classList.add("hidden");
      }
      mh.currentFileType = null;
      mh.currentRecordedAudioFile = null;
      const fileCtrls = replyWrapper.querySelector(".file-controls-reply");
      if (fileCtrls) fileCtrls.classList.add("hidden");
      const imgBtn = replyWrapper.querySelector(".upload-image-button-reply");
      const audioOpts = replyWrapper.querySelector(".replyAudioOptionsWrapper");
      const vidBtn = replyWrapper.querySelector(".upload-video-button-reply");
      if (imgBtn) imgBtn.classList.remove("hidden");
      if (audioOpts) audioOpts.classList.remove("hidden");
      if (vidBtn) vidBtn.classList.remove("hidden");
    });
  }
  const approveBtn = replyWrapper.querySelector(".approveRecordingReply");
  if (approveBtn) {
    approveBtn.addEventListener("click", function (e) {
      e.preventDefault();
      const mh = replyWrapper.mediaHandler;
      if (mh.mediaRecorder && mh.mediaRecorder.state === "recording") {
        mh.stopAudioRecording();
      }
      const fullWrapper = replyWrapper.querySelector(
        ".fullAudioRecordingWrapperReply"
      );
      if (fullWrapper) fullWrapper.classList.add("hidden");
      const audioPrev = replyWrapper.querySelector(
        ".audio-preview-wrapper-reply"
      );
      if (audioPrev) audioPrev.classList.remove("hidden");
    });
  }
  const refreshBtn = replyWrapper.querySelector(".refresh-upload-reply");
  if (refreshBtn) {
    refreshBtn.addEventListener("click", function (e) {
      e.preventDefault();
      const mh = replyWrapper.mediaHandler;
      if (mh.currentFileType === "image") {
        const imgWrapper = replyWrapper.querySelector(
          ".image-preview-wrapper-reply"
        );
        const imgInput = replyWrapper.querySelector(".reply-image-upload");
        if (imgWrapper && imgInput) {
          imgWrapper.innerHTML = "";
          imgInput.value = "";
          imgInput.click();
        }
      } else if (mh.currentFileType === "audio") {
        const audioWrapper = replyWrapper.querySelector(
          ".audio-preview-wrapper-reply"
        );
        const audioInput = replyWrapper.querySelector(".reply-audio-upload");
        if (audioWrapper && audioInput) {
          audioWrapper.innerHTML = "";
          audioInput.value = "";
          mh.currentRecordedAudioFile = null;
          audioInput.click();
        }
      } else if (mh.currentFileType === "video") {
        const videoWrapper = replyWrapper.querySelector(
          ".video-preview-wrapper-reply"
        );
        const videoInput = replyWrapper.querySelector(".reply-video-upload");
        if (videoWrapper && videoInput) {
          videoWrapper.innerHTML = "";
          videoInput.value = "";
          videoInput.click();
        }
      }
    });
  }
  const deleteUploadBtn = replyWrapper.querySelector(".delete-upload-reply");
  if (deleteUploadBtn) {
    deleteUploadBtn.addEventListener("click", function (e) {
      e.preventDefault();
      const mh = replyWrapper.mediaHandler;
      if (mh.currentFileType === "image") {
        const imgWrapper = replyWrapper.querySelector(
          ".image-preview-wrapper-reply"
        );
        const imgInput = replyWrapper.querySelector(".reply-image-upload");
        if (imgWrapper && imgInput) {
          imgWrapper.innerHTML = "";
          imgInput.value = "";
        }
      } else if (mh.currentFileType === "audio") {
        const audioWrapper = replyWrapper.querySelector(
          ".audio-preview-wrapper-reply"
        );
        const audioInput = replyWrapper.querySelector(".reply-audio-upload");
        if (audioWrapper && audioInput) {
          audioWrapper.innerHTML = "";
          audioInput.value = "";
        }
        mh.currentRecordedAudioFile = null;
      } else if (mh.currentFileType === "video") {
        const videoWrapper = replyWrapper.querySelector(
          ".video-preview-wrapper-reply"
        );
        const videoInput = replyWrapper.querySelector(".reply-video-upload");
        if (videoWrapper && videoInput) {
          videoWrapper.innerHTML = "";
          videoInput.value = "";
        }
      }
      mh.currentFileType = null;
      const fileCtrls = replyWrapper.querySelector(".file-controls-reply");
      if (fileCtrls) fileCtrls.classList.add("hidden");
      const imgBtn = replyWrapper.querySelector(".upload-image-button-reply");
      const audioOpts = replyWrapper.querySelector(".replyAudioOptionsWrapper");
      const vidBtn = replyWrapper.querySelector(".upload-video-button-reply");
      if (imgBtn) imgBtn.classList.remove("hidden");
      if (audioOpts) audioOpts.classList.remove("hidden");
      if (vidBtn) vidBtn.classList.remove("hidden");
    });
  }
  const submitBtn = replyWrapper.querySelector("#submit-reply");
  if (submitBtn) {
    submitBtn.addEventListener("click", async function (e) {
      e.preventDefault();
      resetEmojiForm();
      const editor = replyWrapper.querySelector(".reply-editor");
      const content = editor.innerHTML.trim();
      const imageFile = replyWrapper.querySelector(".reply-image-upload")
        .files[0];
      const audioFile =
        replyWrapper.querySelector(".reply-audio-upload").files[0] ||
        (replyWrapper.mediaHandler
          ? replyWrapper.mediaHandler.currentRecordedAudioFile
          : null);
      const videoFile = replyWrapper.querySelector(".reply-video-upload")
        .files[0];
      let uploadedFile = null,
        fileType = null;
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
      const mentions = [];
      replyWrapper.querySelectorAll(".mention").forEach((mention) => {
        const id = mention.dataset.contactId;
        if (id) {
          if (id.toLowerCase() === "all" && MentionManager.allContacts) {
            MentionManager.allContacts.forEach((contact) => {
              if (!mentions.includes(contact.id)) mentions.push(contact.id);
            });
          } else if (!mentions.includes(id)) {
            mentions.push(id);
          }
        }
      });
      replyWrapper.classList.add("state-disabled");
      try {
        await forumManager.createReply(
          submitBtn.dataset.commentId,
          content,
          mentions,
          fileType,
          uploadedFile
        );
        editor.innerHTML = "";
        replyWrapper.querySelector(".reply-image-upload").value = "";
        replyWrapper.querySelector(".reply-audio-upload").value = "";
        replyWrapper.querySelector(".reply-video-upload").value = "";
        const imgWrapper = replyWrapper.querySelector(
          ".image-preview-wrapper-reply"
        );
        if (imgWrapper) imgWrapper.innerHTML = "";
        const audioWrapper = replyWrapper.querySelector(
          ".audio-preview-wrapper-reply"
        );
        if (audioWrapper) audioWrapper.innerHTML = "";
        const videoWrapper = replyWrapper.querySelector(
          ".video-preview-wrapper-reply"
        );
        if (videoWrapper) videoWrapper.innerHTML = "";
      } catch (error) {
        UIManager.showError("Failed to create reply. Please try again.");
      } finally {
        replyWrapper.classList.remove("state-disabled");
      }
    });
  }
}
//Create Reply Part End
