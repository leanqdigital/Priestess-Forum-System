// Initialize when DOM is ready
document.addEventListener("DOMContentLoaded", () => MentionManager.init());

//Create Post Part start
//-----------------------------------------------------------------
//-----------------------------------------------------------------
//-----------------------------------------------------------------
//-----------------------------------------------------------------

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

// Global variable to track which file type was uploaded ("image", "audio", or "video")
let currentFileType = null;

/**
 * Helper: Shows the refresh and clear controls and hides the three upload buttons.
 * @param {string} fileType - "image", "audio", or "video"
 */
function showFileControls(fileType) {
  currentFileType = fileType;
  // Hide the three separate upload buttons
  document.getElementById("upload-image-button").classList.add("hidden");
  document.getElementById("upload-audio-button").classList.add("hidden");
  document.getElementById("upload-video-button").classList.add("hidden");
  // Show the controls container (refresh & clear)
  document.getElementById("file-controls").classList.remove("hidden");
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

      // Create and show the audio preview
      const audioURL = URL.createObjectURL(file);
      const audio = document.createElement("audio");
      audio.controls = true;
      audio.classList.add("w-full");
      const source = document.createElement("source");
      source.src = audioURL;
      source.type = file.type;
      audio.appendChild(source);
      wrapper.appendChild(audio);

      // Show refresh/clear controls for audio
      showFileControls("audio");
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

// -------------------------
// Refresh and Clear Button Handlers
// -------------------------

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
  document.getElementById("upload-audio-button").classList.remove("hidden");
  document.getElementById("upload-video-button").classList.remove("hidden");
});

document.getElementById("submit-post").addEventListener("click", async (e) => {
  e.preventDefault();

  // Get the post content from the editor
  const editor = document.getElementById("post-editor");
  const textContent = editor.innerText.trim();

  // Get file inputs (the three remain in the DOM)
  const imageInput = document.getElementById("post-image-upload");
  const audioInput = document.getElementById("post-audio-upload");
  const videoInput = document.getElementById("post-video-upload");

  // Determine which file is uploaded – only one is allowed
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

  // At least one (text or file) is required
  if (!textContent && !uploadedFile) {
    UIManager.showError("Post content or a file is required.");
    return;
  }

  // Hide the modal (your modal hide logic remains)
  document.getElementById("postNewModal").hide();

  // Extract mentioned IDs
  const mentionedIds = [];
  editor.querySelectorAll(".mention").forEach((mention) => {
    const id = mention.dataset.contactId;
    if (id) {
      mentionedIds.push(id);
    }
  });

  // Create a temporary post using the new fields:
  const tempPost = {
    id: `temp-${Date.now()}`,
    author_id: forumManager.userId,
    // NEW: Use file_content (preview URL) and file_tpe (the file type)
    file_content: uploadedFile
      ? { link: URL.createObjectURL(uploadedFile) }
      : null,
    file_tpe: uploadedFile ? fileType : null,
    author: {
      name: forumManager.fullName,
      profileImage: forumManager.defaultAuthorImage,
    },
    date: "Just now",
    content: textContent,
  };

  const template = $.templates("#post-template");
  const postContainer = document.querySelector(CONFIG.selectors.postsContainer);
  postContainer.insertAdjacentHTML("afterbegin", template.render(tempPost));
  const postElement = postContainer.firstElementChild;
  postElement.classList.add("state-disabled");

  // Process file upload (only one file field is needed)
  let fileData = null;
  const fileFields = [];
  if (uploadedFile) {
    fileFields.push({
      fieldName: "file_content", // NEW: single file field name
      file: uploadedFile,
    });
  }

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

    // Send the create post mutation using the new file fields
    const response = await ApiService.query(
      `
        mutation createForumPost($payload: ForumPostCreateInput!) {
          createForumPost(payload: $payload) {
            id
            author_id
            post_copy
            file_tpe
            file_content
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
          // NEW: send the file type and file data regardless of which button was used
          file_tpe: uploadedFile ? fileType : null,
          file_content: fileData ? fileData : null,
        },
      }
    );

    const newPost = response.createForumPost;
    postElement.dataset.postId = newPost.id;

    // (Optional) Fetch additional details as before…
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
          }
        }
        `,
      { id: newPost.id }
    );

    const actualPost = fetchResponse.calcForumPosts[0];

    // Update DOM elements (update any file-related UI as needed)
    postElement.querySelector(".vote-button").dataset.postId = actualPost.ID;
    postElement.querySelector(".editPostModal").dataset.postId = actualPost.ID;
    postElement.querySelector(".post-author-name").textContent =
      actualPost.Author_First_Name + " " + actualPost.Author_Last_Name;
    postElement.querySelector(".post-author-image").src =
      actualPost.Author_Profile_Image;
    postElement.querySelector(".post-copy-content").textContent =
      actualPost.Post_Copy;
    postElement.querySelector(".postCommentCount").textContent =
      actualPost.ForumCommentsTotalCount;
    postElement.querySelector(".postVoteCount").textContent =
      actualPost.Member_Post_Upvotes_DataTotal_Count;
    postElement.querySelector(".delete-post-btn").dataset.postId =
      actualPost.ID;
    postElement.dataset.postId = actualPost.ID;
    // postElement.querySelector(".audio-player").id = "audio-" + actualPost.ID;
    const playPauseButton = postElement.querySelector("#play-pause");
    if (playPauseButton) {
      playPauseButton.dataset.audioButton = actualPost.ID; // Update with actual ID
    }
    const audioPlayer = postElement.querySelector(".audio-player");
    if (audioPlayer) {
      audioPlayer.dataset.audioPlayer = actualPost.ID;
    }
  } catch (error) {
    console.error("Error during post creation:", error);
    UIManager.showError("Failed to post. Please try again.");
    postContainer.removeChild(postElement);
  } finally {
    // Clear the editor and remove the temporary disabled state
    editor.innerHTML = "";
    postElement.classList.remove("state-disabled");
    // (Optional) Clear the file inputs here if desired.
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
document.addEventListener("click", function (e) {
  // --- Upload Button Clicks ---
  // Image upload button
  const imageUploadBtn = e.target.closest(".upload-image-button-reply");
  if (imageUploadBtn) {
    const replyForm = imageUploadBtn.closest(".reply-form-wrapper");
    if (replyForm) {
      const fileInput = replyForm.querySelector(".reply-image-upload");
      if (fileInput) fileInput.click();
    }
    return; // exit if handled
  }
  // Audio upload button
  const audioUploadBtn = e.target.closest(".upload-audio-button-reply");
  if (audioUploadBtn) {
    const replyForm = audioUploadBtn.closest(".reply-form-wrapper");
    if (replyForm) {
      const fileInput = replyForm.querySelector(".reply-audio-upload");
      if (fileInput) fileInput.click();
    }
    return;
  }
  // Video upload button
  const videoUploadBtn = e.target.closest(".upload-video-button-reply");
  if (videoUploadBtn) {
    const replyForm = videoUploadBtn.closest(".reply-form-wrapper");
    if (replyForm) {
      const fileInput = replyForm.querySelector(".reply-video-upload");
      if (fileInput) fileInput.click();
    }
    return;
  }

  // --- Refresh Button Click ---
  const refreshBtn = e.target.closest(".refresh-upload-reply");
  if (refreshBtn) {
    const replyForm = refreshBtn.closest(".reply-form-wrapper");
    if (replyForm) {
      // Determine which preview wrapper has content to know which file type is active.
      const imagePreview = replyForm.querySelector(
        ".image-preview-wrapper-reply"
      );
      const audioPreview = replyForm.querySelector(
        ".audio-preview-wrapper-reply"
      );
      const videoPreview = replyForm.querySelector(
        ".video-preview-wrapper-reply"
      );
      if (imagePreview && imagePreview.innerHTML.trim() !== "") {
        const fileInput = replyForm.querySelector(".reply-image-upload");
        if (fileInput) {
          fileInput.value = "";
          fileInput.click();
        }
      } else if (audioPreview && audioPreview.innerHTML.trim() !== "") {
        const fileInput = replyForm.querySelector(".reply-audio-upload");
        if (fileInput) {
          fileInput.value = "";
          fileInput.click();
        }
      } else if (videoPreview && videoPreview.innerHTML.trim() !== "") {
        const fileInput = replyForm.querySelector(".reply-video-upload");
        if (fileInput) {
          fileInput.value = "";
          fileInput.click();
        }
      }
    }
    return;
  }

  // --- Clear Button Click (Delete Upload) ---
  const clearBtn = e.target.closest(".delete-upload-reply");
  if (clearBtn) {
    const replyForm = clearBtn.closest(".reply-form-wrapper");
    if (replyForm) {
      // Clear all preview wrappers.
      const imagePreview = replyForm.querySelector(
        ".image-preview-wrapper-reply"
      );
      const audioPreview = replyForm.querySelector(
        ".audio-preview-wrapper-reply"
      );
      const videoPreview = replyForm.querySelector(
        ".video-preview-wrapper-reply"
      );
      if (imagePreview) imagePreview.innerHTML = "";
      if (audioPreview) audioPreview.innerHTML = "";
      if (videoPreview) videoPreview.innerHTML = "";
      // Reset all file inputs.
      const fileInputs = replyForm.querySelectorAll("input[type='file']");
      fileInputs.forEach((input) => (input.value = ""));
      // Hide file controls.
      const fileControls = replyForm.querySelector(".file-controls-reply");
      if (fileControls) fileControls.classList.add("hidden");
      // Optionally, ensure the upload buttons are visible.
      const uploadBtns = replyForm.querySelectorAll(
        ".upload-image-button-reply, .upload-audio-button-reply, .upload-video-button-reply"
      );
      uploadBtns.forEach((btn) => btn.classList.remove("hidden"));
    }
    return;
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

    // Get mention IDs if any.
    const mentionedIds = [];
    replyForm.querySelectorAll(".mention").forEach((mention) => {
      if (mention.dataset.contactId)
        mentionedIds.push(mention.dataset.contactId);
    });

    // --- File Handling for Replies ---
    const imageInput = document.getElementById("reply-image-upload");
    const audioInput = document.getElementById("reply-audio-upload");
    const videoInput = document.getElementById("reply-video-upload");

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

document.addEventListener("click", (event) => {
  if (event.target.closest(".edit-post")) {
    const postElement = event.target.closest("[data-postid]");
    const postId = postElement.dataset.postid;
    const editor = postElement.querySelector(".post-editor");
    const content = editor.innerText.trim();
    forumManager.editPost(postId, content);
    postElement.hide();
  }
});
