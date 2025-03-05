// // Initialize when DOM is ready
// document.addEventListener("DOMContentLoaded", () => MentionManager.init());

// //Create Post Part start
// //-----------------------------------------------------------------
// //-----------------------------------------------------------------
// //-----------------------------------------------------------------
// //-----------------------------------------------------------------

// // Trigger file inputs when the corresponding button is clicked
// document.getElementById("upload-image-button").addEventListener("click", () => {
//   document.getElementById("post-image-upload").click();
// });
// document.getElementById("upload-audio-button").addEventListener("click", () => {
//   document.getElementById("post-audio-upload").click();
// });
// document.getElementById("upload-video-button").addEventListener("click", () => {
//   document.getElementById("post-video-upload").click();
// });

// // Global variable to track which file type was uploaded ("image", "audio", or "video")
// let currentFileType = null;

// /**
//  * Helper: Shows the refresh and clear controls and hides the three upload buttons.
//  * @param {string} fileType - "image", "audio", or "video"
//  */
// function showFileControls(fileType) {
//   currentFileType = fileType;
//   // Hide the three separate upload buttons
//   document.getElementById("upload-image-button").classList.add("hidden");
//   document.getElementById("upload-audio-button").classList.add("hidden");
//   document.getElementById("upload-video-button").classList.add("hidden");
//   // Show the controls container (refresh & clear)
//   document.getElementById("file-controls").classList.remove("hidden");
// }

// // -------------------------
// // File Input Event Listeners
// // -------------------------

// // IMAGE file input
// document
//   .getElementById("post-image-upload")
//   .addEventListener("change", function (e) {
//     const file = e.target.files[0];
//     const wrapper = document.getElementById("image-preview-wrapper");
//     wrapper.innerHTML = ""; // Clear previous preview if any

//     if (file) {
//       // Clear the other file inputs and their previews
//       document.getElementById("post-audio-upload").value = "";
//       document.getElementById("audio-preview-wrapper").innerHTML = "";
//       document.getElementById("post-video-upload").value = "";
//       document.getElementById("video-preview-wrapper").innerHTML = "";

//       // Create and show the image preview
//       const imageURL = URL.createObjectURL(file);
//       const img = document.createElement("img");
//       img.src = imageURL;
//       img.alt = "Image Preview";
//       img.classList.add("w-full", "object-contain", "rounded");
//       wrapper.appendChild(img);

//       // Show refresh/clear controls for images
//       showFileControls("image");
//     }
//   });

// // AUDIO file input
// document
//   .getElementById("post-audio-upload")
//   .addEventListener("change", function (e) {
//     const file = e.target.files[0];
//     const wrapper = document.getElementById("audio-preview-wrapper");
//     wrapper.innerHTML = "";

//     if (file) {
//       // Clear image and video inputs and their previews
//       document.getElementById("post-image-upload").value = "";
//       document.getElementById("image-preview-wrapper").innerHTML = "";
//       document.getElementById("post-video-upload").value = "";
//       document.getElementById("video-preview-wrapper").innerHTML = "";

//       // Create and show the audio preview
//       const audioURL = URL.createObjectURL(file);
//       const audio = document.createElement("audio");
//       audio.controls = true;
//       audio.classList.add("w-full");
//       const source = document.createElement("source");
//       source.src = audioURL;
//       source.type = file.type;
//       audio.appendChild(source);
//       wrapper.appendChild(audio);

//       // Show refresh/clear controls for audio
//       showFileControls("audio");
//     }
//   });

// // VIDEO file input
// document
//   .getElementById("post-video-upload")
//   .addEventListener("change", function (e) {
//     const file = e.target.files[0];
//     const wrapper = document.getElementById("video-preview-wrapper");
//     wrapper.innerHTML = "";

//     if (file) {
//       // Clear image and audio inputs and their previews
//       document.getElementById("post-image-upload").value = "";
//       document.getElementById("image-preview-wrapper").innerHTML = "";
//       document.getElementById("post-audio-upload").value = "";
//       document.getElementById("audio-preview-wrapper").innerHTML = "";

//       // Create and show the video preview
//       const videoURL = URL.createObjectURL(file);
//       const video = document.createElement("video");
//       video.controls = true;
//       video.width = 300; // adjust as needed
//       video.classList.add("rounded");
//       const source = document.createElement("source");
//       source.src = videoURL;
//       source.type = file.type;
//       video.appendChild(source);
//       wrapper.appendChild(video);

//       // Show refresh/clear controls for video
//       showFileControls("video");
//     }
//   });

// // -------------------------
// // Refresh and Clear Button Handlers
// // -------------------------

// // Refresh: Clears the current preview and re-opens the same file input so the user can re-upload a file of that type.
// document
//   .getElementById("refresh-upload")
//   .addEventListener("click", function () {
//     if (currentFileType === "image") {
//       document.getElementById("image-preview-wrapper").innerHTML = "";
//       document.getElementById("post-image-upload").value = "";
//       // Trigger file selection dialog (since the user clicked refresh, which is a user gesture)
//       document.getElementById("post-image-upload").click();
//     } else if (currentFileType === "audio") {
//       document.getElementById("audio-preview-wrapper").innerHTML = "";
//       document.getElementById("post-audio-upload").value = "";
//       document.getElementById("post-audio-upload").click();
//     } else if (currentFileType === "video") {
//       document.getElementById("video-preview-wrapper").innerHTML = "";
//       document.getElementById("post-video-upload").value = "";
//       document.getElementById("post-video-upload").click();
//     }
//   });

// // Clear (Delete): Clears the current preview and resets the UI so the three file upload buttons appear again.
// document.getElementById("delete-upload").addEventListener("click", function () {
//   if (currentFileType === "image") {
//     document.getElementById("image-preview-wrapper").innerHTML = "";
//     document.getElementById("post-image-upload").value = "";
//   } else if (currentFileType === "audio") {
//     document.getElementById("audio-preview-wrapper").innerHTML = "";
//     document.getElementById("post-audio-upload").value = "";
//   } else if (currentFileType === "video") {
//     document.getElementById("video-preview-wrapper").innerHTML = "";
//     document.getElementById("post-video-upload").value = "";
//   }
//   // Reset state
//   currentFileType = null;
//   // Hide the refresh/clear controls
//   document.getElementById("file-controls").classList.add("hidden");
//   // Show all three upload buttons so the user may pick any file type
//   document.getElementById("upload-image-button").classList.remove("hidden");
//   document.getElementById("upload-audio-button").classList.remove("hidden");
//   document.getElementById("upload-video-button").classList.remove("hidden");
// });

// document.getElementById("submit-post").addEventListener("click", async (e) => {
//   const editor = document.getElementById("post-editor");
//   const htmlContent = editor.innerHTML.trim();
//   const tempContainer = document.createElement("div");
//   tempContainer.innerHTML = htmlContent;

//   const mentionedIds = [];
//   tempContainer.querySelectorAll(".mention").forEach((mention) => {
//     const id = mention.dataset.contactId;
//     if (id) {
//       if (id === "all" && MentionManager.allContacts) {
//         MentionManager.allContacts.forEach((contact) => {
//           if (!mentionedIds.includes(contact.id)) {
//             mentionedIds.push(contact.id);
//           }
//         });
//       } else if (!mentionedIds.includes(id)) {
//         mentionedIds.push(id);
//       }
//     }
//   });

//   // (File input and other validations remain unchanged)
//   const imageInput = document.getElementById("post-image-upload");
//   const audioInput = document.getElementById("post-audio-upload");
//   const videoInput = document.getElementById("post-video-upload");
//   const imageFile = imageInput.files[0];
//   const audioFile = audioInput.files[0];
//   const videoFile = videoInput.files[0];

//   let uploadedFile = null;
//   let fileType = null;
//   if (imageFile) {
//     uploadedFile = imageFile;
//     fileType = "Image";
//   } else if (audioFile) {
//     uploadedFile = audioFile;
//     fileType = "Audio";
//   } else if (videoFile) {
//     uploadedFile = videoFile;
//     fileType = "Video";
//   }

//   if (!htmlContent && !uploadedFile) {
//     UIManager.showError("Post content or a file is required.");
//     return;
//   }

//   // Hide modal, reset state, etc.
//   document.getElementById("postNewModal").hide();

//   // Create a temporary post for immediate UI feedback.
//   const tempPost = {
//     id: `temp-${Date.now()}`,
//     author_id: forumManager.userId,
//     disableComments: false,
//     file_content: uploadedFile
//       ? { link: URL.createObjectURL(uploadedFile) }
//       : null,
//     file_tpe: uploadedFile ? fileType : null,
//     author: {
//       name: forumManager.fullName,
//       profileImage: forumManager.defaultLoggedInAuthorImage,
//     },
//     date: "Just now",
//     content: htmlContent, // Use the HTML content with mention markup.
//   };

//   const template = $.templates("#post-template");
//   const postContainer = document.querySelector(CONFIG.selectors.postsContainer);
//   postContainer.insertAdjacentHTML("afterbegin", template.render(tempPost));
//   const postElement = postContainer.firstElementChild;
//   postElement.classList.add("state-disabled");

//   // Process file upload (unchanged)
//   let fileData = null;
//   const fileFields = [];
//   if (uploadedFile) {
//     fileFields.push({
//       fieldName: "file_content",
//       file: uploadedFile,
//     });
//   }

//   let newPost;
//   try {
//     if (fileFields.length > 0) {
//       const toSubmitFields = {};
//       await processFileFields(
//         toSubmitFields,
//         fileFields,
//         awsParam,
//         awsParamUrl
//       );
//       fileData =
//         typeof toSubmitFields.file_content === "string"
//           ? JSON.parse(toSubmitFields.file_content)
//           : toSubmitFields.file_content;
//       fileData.name = fileData.name || uploadedFile.name;
//       fileData.size = fileData.size || uploadedFile.size;
//       fileData.type = fileData.type || uploadedFile.type;
//     }

//     // Send the create post mutation with HTML content.
//     const response = await ApiService.query(
//       `
//         mutation createForumPost($payload: ForumPostCreateInput!) {
//           createForumPost(payload: $payload) {
//             id
//             author_id
//             post_copy
//             file_tpe
//             file_content
//             related_course_id
//             Mentioned_Users {
//               id
//             }
//           }
//         }
//       `,
//       {
//         payload: {
//           author_id: forumManager.userId,
//           post_copy: htmlContent,
//           Mentioned_Users: mentionedIds.map((id) => ({ id: Number(id) })),
//           related_course_id: courseID,
//           file_tpe: uploadedFile ? fileType : null,
//           file_content: fileData ? fileData : null,
//         },
//       }
//     );

//     newPost = response.createForumPost;
//     postElement.dataset.postId = newPost.id;
//     formatPreiview();
//   } catch (error) {
//     console.error("Error during post creation:", error);
//     UIManager.showError("Failed to post. Please try again.");
//     postContainer.removeChild(postElement);
//     return;
//   }

//   // Fetch additional post details, update the UI, etc.
//   try {
//     const fetchResponse = await ApiService.query(
//       `
//         query calcForumPosts($id: PriestessForumPostID) {
//           calcForumPosts(query: [{ where: { id: $id } }]) {
//             ID: field(arg: ["id"])
//             Author_ID: field(arg: ["author_id"])
//             Author_First_Name: field(arg: ["Author", "first_name"])
//             Author_Last_Name: field(arg: ["Author", "last_name"])
//             Author_Profile_Image: field(arg: ["Author", "profile_image"])
//             Date_Added: field(arg: ["created_at"])
//             Post_Copy: field(arg: ["post_copy"])
//             File_Tpe: field(arg: ["file_tpe"])
//             File_Content: field(arg: ["file_content"])
//             ForumCommentsTotalCount: countDistinct(args: [{ field: ["ForumComments", "id"] }])
//             Member_Post_Upvotes_DataTotal_Count: countDistinct(args: [{ field: ["Member_Post_Upvotes_Data", "id"] }])
//             Disable_New_Comments: field(arg: ["disable_new_comments"])
//           }
//         }
//       `,
//       { id: newPost.id }
//     );

//     const actualPost = fetchResponse.calcForumPosts[0];
//     postElement.querySelector(".vote-button").dataset.postId = actualPost.ID;
//     postElement.querySelector(".post-author-name").textContent =
//       actualPost.Author_First_Name + " " + actualPost.Author_Last_Name;
//     postElement.querySelector(".post-author-image").src =
//       actualPost.Author_Forum_Image?.trim()
//         ? actualPost.Author_Forum_Image
//         : DEFAULT_AVATAR;
//     // Use innerHTML to render the HTML content including mentions.
//     postElement.querySelector(".post-copy-content").innerHTML =
//       actualPost.Post_Copy;
//     postElement.querySelector(".postCommentCount").textContent =
//       actualPost.ForumCommentsTotalCount;
//     postElement.querySelector(".postVoteCount").textContent =
//       actualPost.Member_Post_Upvotes_DataTotal_Count;
//     postElement.querySelector(".delete-post-btn").dataset.postId =
//       actualPost.ID;
//     postElement.querySelector(".load-comments-btn").dataset.postId =
//       actualPost.ID;
//     postElement.dataset.postId = actualPost.ID;

//     const playPauseButton = postElement.querySelector("#play-pause");
//     if (playPauseButton) {
//       playPauseButton.dataset.audioButton = actualPost.ID;
//     }
//     const audioPlayer = postElement.querySelector(".audio-player");
//     if (audioPlayer) {
//       audioPlayer.dataset.audioPlayer = actualPost.ID;
//     }
//     e.preventDefault();
//   } catch (fetchError) {
//     console.error("Error fetching post details:", fetchError);
//   } finally {
//     // Clear the editor and remove the temporary disabled state.
//     editor.innerHTML = "";
//     postElement.classList.remove("state-disabled");
//   }
// });
// //-----------------------------------------------------------------
// //-----------------------------------------------------------------
// //-----------------------------------------------------------------
// //-----------------------------------------------------------------
// //Create Post Part End

// //Create Reply Part start
// //-----------------------------------------------------------------
// //-----------------------------------------------------------------
// //-----------------------------------------------------------------
// //-----------------------------------------------------------------
// // -------------------------------
// // Delegated Click Listener
// // -------------------------------
// // -------------------------------
// // Delegated Click Listener
// // -------------------------------
// document.addEventListener("click", function (e) {
//   // Prevent handling if the click originates from an actual file input.
//   if (e.target.matches("input[type='file']")) return;

//   // 1. Handle clicks on any upload button
//   const uploadBtn = e.target.closest(
//     ".upload-image-button-reply, .upload-audio-button-reply, .upload-video-button-reply"
//   );
//   if (uploadBtn) {
//     const replyForm = uploadBtn.closest(".reply-form-wrapper");
//     if (!replyForm) return;
//     // Based on the button's class, locate the corresponding file input.
//     if (uploadBtn.classList.contains("upload-image-button-reply")) {
//       const fileInput = replyForm.querySelector(".reply-image-upload");
//       if (fileInput && !fileInput.value) fileInput.click();
//     } else if (uploadBtn.classList.contains("upload-audio-button-reply")) {
//       const fileInput = replyForm.querySelector(".reply-audio-upload");
//       if (fileInput && !fileInput.value) fileInput.click();
//     } else if (uploadBtn.classList.contains("upload-video-button-reply")) {
//       const fileInput = replyForm.querySelector(".reply-video-upload");
//       if (fileInput && !fileInput.value) fileInput.click();
//     }
//     return; // exit if handled
//   }

//   // 2. Handle clicks on the refresh button
//   const refreshBtn = e.target.closest(".refresh-upload-reply");
//   if (refreshBtn) {
//     const replyForm = refreshBtn.closest(".reply-form-wrapper");
//     if (!replyForm) return;
//     // In our controls container we store the current file type.
//     const fileControls = replyForm.querySelector(".file-controls-reply");
//     const currentFileType = fileControls
//       ? fileControls.dataset.currentFileType
//       : null;
//     if (!currentFileType) return;

//     // Get the corresponding file input and preview wrapper.
//     let fileInput, previewWrapper;
//     if (currentFileType === "image") {
//       fileInput = replyForm.querySelector(".reply-image-upload");
//       previewWrapper = replyForm.querySelector(".image-preview-wrapper-reply");
//     } else if (currentFileType === "audio") {
//       fileInput = replyForm.querySelector(".reply-audio-upload");
//       previewWrapper = replyForm.querySelector(".audio-preview-wrapper-reply");
//     } else if (currentFileType === "video") {
//       fileInput = replyForm.querySelector(".reply-video-upload");
//       previewWrapper = replyForm.querySelector(".video-preview-wrapper-reply");
//     }
//     if (previewWrapper) previewWrapper.innerHTML = "";
//     if (fileInput) {
//       fileInput.value = "";
//       fileInput.click();
//     }
//     return;
//   }

//   // 3. Handle clicks on the delete button
//   const deleteBtn = e.target.closest(".delete-upload-reply");
//   if (deleteBtn) {
//     const replyForm = deleteBtn.closest(".reply-form-wrapper");
//     if (!replyForm) return;
//     const fileControls = replyForm.querySelector(".file-controls-reply");
//     const currentFileType = fileControls
//       ? fileControls.dataset.currentFileType
//       : null;
//     if (currentFileType === "image") {
//       const fileInput = replyForm.querySelector(".reply-image-upload");
//       const previewWrapper = replyForm.querySelector(
//         ".image-preview-wrapper-reply"
//       );
//       if (previewWrapper) previewWrapper.innerHTML = "";
//       if (fileInput) fileInput.value = "";
//     } else if (currentFileType === "audio") {
//       const fileInput = replyForm.querySelector(".reply-audio-upload");
//       const previewWrapper = replyForm.querySelector(
//         ".audio-preview-wrapper-reply"
//       );
//       if (previewWrapper) previewWrapper.innerHTML = "";
//       if (fileInput) fileInput.value = "";
//     } else if (currentFileType === "video") {
//       const fileInput = replyForm.querySelector(".reply-video-upload");
//       const previewWrapper = replyForm.querySelector(
//         ".video-preview-wrapper-reply"
//       );
//       if (previewWrapper) previewWrapper.innerHTML = "";
//       if (fileInput) fileInput.value = "";
//     }
//     // Hide the controls container and remove the stored file type.
//     if (fileControls) {
//       fileControls.classList.add("hidden");
//       fileControls.removeAttribute("data-current-file-type");
//     }
//     // Show the upload buttons again.
//     const uploadButtons = replyForm.querySelectorAll(
//       ".upload-image-button-reply, .upload-audio-button-reply, .upload-video-button-reply"
//     );
//     uploadButtons.forEach((btn) => btn.classList.remove("hidden"));
//     return;
//   }
// });
// // -------------------------------
// // Delegated Change Listener for File Inputs
// // -------------------------------
// document.addEventListener("change", function (e) {
//   // Check if the event target is one of our file inputs.
//   if (
//     e.target.matches(
//       ".reply-image-upload, .reply-audio-upload, .reply-video-upload"
//     )
//   ) {
//     const file = e.target.files[0];
//     if (!file) return; // No file was selected.

//     let fileType = "";
//     if (e.target.classList.contains("reply-image-upload")) {
//       fileType = "image";
//     } else if (e.target.classList.contains("reply-audio-upload")) {
//       fileType = "audio";
//     } else if (e.target.classList.contains("reply-video-upload")) {
//       fileType = "video";
//     }

//     // Find the corresponding reply form container.
//     const replyForm = e.target.closest(".reply-form-wrapper");
//     if (!replyForm) return;

//     // Clear other file inputs and their previews in this reply form.
//     if (fileType === "image") {
//       const audioInput = replyForm.querySelector(".reply-audio-upload");
//       const videoInput = replyForm.querySelector(".reply-video-upload");
//       if (audioInput) audioInput.value = "";
//       if (videoInput) videoInput.value = "";
//       const audioPreview = replyForm.querySelector(
//         ".audio-preview-wrapper-reply"
//       );
//       const videoPreview = replyForm.querySelector(
//         ".video-preview-wrapper-reply"
//       );
//       if (audioPreview) audioPreview.innerHTML = "";
//       if (videoPreview) videoPreview.innerHTML = "";
//     } else if (fileType === "audio") {
//       const imageInput = replyForm.querySelector(".reply-image-upload");
//       const videoInput = replyForm.querySelector(".reply-video-upload");
//       if (imageInput) imageInput.value = "";
//       if (videoInput) videoInput.value = "";
//       const imagePreview = replyForm.querySelector(
//         ".image-preview-wrapper-reply"
//       );
//       const videoPreview = replyForm.querySelector(
//         ".video-preview-wrapper-reply"
//       );
//       if (imagePreview) imagePreview.innerHTML = "";
//       if (videoPreview) videoPreview.innerHTML = "";
//     } else if (fileType === "video") {
//       const imageInput = replyForm.querySelector(".reply-image-upload");
//       const audioInput = replyForm.querySelector(".reply-audio-upload");
//       if (imageInput) imageInput.value = "";
//       if (audioInput) audioInput.value = "";
//       const imagePreview = replyForm.querySelector(
//         ".image-preview-wrapper-reply"
//       );
//       const audioPreview = replyForm.querySelector(
//         ".audio-preview-wrapper-reply"
//       );
//       if (imagePreview) imagePreview.innerHTML = "";
//       if (audioPreview) audioPreview.innerHTML = "";
//     }

//     // Create a preview URL for the selected file.
//     const previewURL = URL.createObjectURL(file);
//     let previewWrapper = null;
//     if (fileType === "image") {
//       previewWrapper = replyForm.querySelector(".image-preview-wrapper-reply");
//     } else if (fileType === "audio") {
//       previewWrapper = replyForm.querySelector(".audio-preview-wrapper-reply");
//     } else if (fileType === "video") {
//       previewWrapper = replyForm.querySelector(".video-preview-wrapper-reply");
//     }

//     // Clear any existing preview and add the new one.
//     if (previewWrapper) {
//       previewWrapper.innerHTML = "";
//       if (fileType === "image") {
//         const img = document.createElement("img");
//         img.src = previewURL;
//         img.alt = "Image Preview";
//         img.classList.add("w-full", "object-contain", "rounded");
//         previewWrapper.appendChild(img);
//       } else if (fileType === "audio") {
//         const audio = document.createElement("audio");
//         audio.controls = true;
//         audio.classList.add("w-full");
//         const source = document.createElement("source");
//         source.src = previewURL;
//         source.type = file.type;
//         audio.appendChild(source);
//         previewWrapper.appendChild(audio);
//       } else if (fileType === "video") {
//         const video = document.createElement("video");
//         video.controls = true;
//         video.width = 300;
//         video.classList.add("rounded");
//         const source = document.createElement("source");
//         source.src = previewURL;
//         source.type = file.type;
//         video.appendChild(source);
//         previewWrapper.appendChild(video);
//       }
//     }

//     // Hide the upload buttons and show the refresh/delete controls.
//     const uploadButtons = replyForm.querySelectorAll(
//       ".upload-image-button-reply, .upload-audio-button-reply, .upload-video-button-reply"
//     );
//     uploadButtons.forEach((btn) => btn.classList.add("hidden"));
//     const fileControls = replyForm.querySelector(".file-controls-reply");
//     if (fileControls) {
//       fileControls.classList.remove("hidden");
//       // Store the current file type on the controls container.
//       fileControls.dataset.currentFileType = fileType;
//       // Optionally, set the inner HTML of the controls (e.g., show "Refresh" and "Delete")
//       fileControls.classList.remove("hidden");
//     }
//   }
// });
// // -------------------------------
// // Delegated Change Listener for File Inputs
// // -------------------------------
// document.addEventListener("change", function (e) {
//   // --- Reply Image File Input ---
//   if (e.target.matches(".reply-image-upload")) {
//     const file = e.target.files[0];
//     if (file) {
//       const replyForm = e.target.closest(".reply-form-wrapper");
//       if (replyForm) {
//         // Clear other file inputs and their preview wrappers.
//         const audioInput = replyForm.querySelector(".reply-audio-upload");
//         const videoInput = replyForm.querySelector(".reply-video-upload");
//         if (audioInput) audioInput.value = "";
//         if (videoInput) videoInput.value = "";
//         const audioPreview = replyForm.querySelector(
//           ".audio-preview-wrapper-reply"
//         );
//         const videoPreview = replyForm.querySelector(
//           ".video-preview-wrapper-reply"
//         );
//         if (audioPreview) audioPreview.innerHTML = "";
//         if (videoPreview) videoPreview.innerHTML = "";

//         // Create and display image preview.
//         const previewURL = URL.createObjectURL(file);
//         const img = document.createElement("img");
//         img.src = previewURL;
//         img.alt = "Image Preview";
//         img.classList.add("w-full", "object-contain", "rounded");
//         const imagePreview = replyForm.querySelector(
//           ".image-preview-wrapper-reply"
//         );
//         if (imagePreview) {
//           imagePreview.innerHTML = "";
//           imagePreview.appendChild(img);
//         }
//         // Show file controls.
//         const fileControls = replyForm.querySelector(".file-controls-reply");
//         if (fileControls) fileControls.classList.remove("hidden");
//       }
//     }
//   }

//   // --- Reply Audio File Input ---
//   if (e.target.matches(".reply-audio-upload")) {
//     const file = e.target.files[0];
//     if (file) {
//       const replyForm = e.target.closest(".reply-form-wrapper");
//       if (replyForm) {
//         // Clear image and video inputs and previews.
//         const imageInput = replyForm.querySelector(".reply-image-upload");
//         const videoInput = replyForm.querySelector(".reply-video-upload");
//         if (imageInput) imageInput.value = "";
//         if (videoInput) videoInput.value = "";
//         const imagePreview = replyForm.querySelector(
//           ".image-preview-wrapper-reply"
//         );
//         const videoPreview = replyForm.querySelector(
//           ".video-preview-wrapper-reply"
//         );
//         if (imagePreview) imagePreview.innerHTML = "";
//         if (videoPreview) videoPreview.innerHTML = "";

//         // Create and display audio preview.
//         const previewURL = URL.createObjectURL(file);
//         const audio = document.createElement("audio");
//         audio.controls = true;
//         audio.classList.add("w-full");
//         const source = document.createElement("source");
//         source.src = previewURL;
//         source.type = file.type;
//         audio.appendChild(source);
//         const audioPreviewWrapper = replyForm.querySelector(
//           ".audio-preview-wrapper-reply"
//         );
//         if (audioPreviewWrapper) {
//           audioPreviewWrapper.innerHTML = "";
//           audioPreviewWrapper.appendChild(audio);
//         }
//         // Show file controls.
//         const fileControls = replyForm.querySelector(".file-controls-reply");
//         if (fileControls) fileControls.classList.remove("hidden");
//       }
//     }
//   }

//   // --- Reply Video File Input ---
//   if (e.target.matches(".reply-video-upload")) {
//     const file = e.target.files[0];
//     if (file) {
//       const replyForm = e.target.closest(".reply-form-wrapper");
//       if (replyForm) {
//         // Clear image and audio inputs and their previews.
//         const imageInput = replyForm.querySelector(".reply-image-upload");
//         const audioInput = replyForm.querySelector(".reply-audio-upload");
//         if (imageInput) imageInput.value = "";
//         if (audioInput) audioInput.value = "";
//         const imagePreview = replyForm.querySelector(
//           ".image-preview-wrapper-reply"
//         );
//         const audioPreview = replyForm.querySelector(
//           ".audio-preview-wrapper-reply"
//         );
//         if (imagePreview) imagePreview.innerHTML = "";
//         if (audioPreview) audioPreview.innerHTML = "";

//         // Create and display video preview.
//         const previewURL = URL.createObjectURL(file);
//         const video = document.createElement("video");
//         video.controls = true;
//         video.width = 300; // Adjust as needed.
//         video.classList.add("rounded");
//         const source = document.createElement("source");
//         source.src = previewURL;
//         source.type = file.type;
//         video.appendChild(source);
//         const videoPreviewWrapper = replyForm.querySelector(
//           ".video-preview-wrapper-reply"
//         );
//         if (videoPreviewWrapper) {
//           videoPreviewWrapper.innerHTML = "";
//           videoPreviewWrapper.appendChild(video);
//         }
//         // Show file controls.
//         const fileControls = replyForm.querySelector(".file-controls-reply");
//         if (fileControls) fileControls.classList.remove("hidden");
//       }
//     }
//   }
// });
// document.addEventListener("click", async (e) => {
//   const replyButton = e.target.closest("#submit-reply");
//   if (replyButton) {
//     // Get the comment ID from the button’s data attribute.
//     const commentId = replyButton.dataset.commentId;
//     // Locate the reply form within the comment.
//     const replyForm = replyButton.closest(".reply-form");
//     if (!replyForm) return;
//     replyForm.classList.add("state-disabled");

//     // Get the reply editor and text.
//     const editor = replyForm.querySelector(".reply-editor");
//     const content = editor.innerHTML.trim();
//     if (!content) {
//       UIManager.showError("Reply cannot be empty");
//       replyForm.classList.remove("state-disabled");
//       return;
//     }

//     const mentionedIds = [];
//     document.querySelectorAll(".mention").forEach((mention) => {
//       const id = mention.dataset.contactId;
//       if (id) {
//         if (id === "all" && MentionManager.allContacts) {
//           // Push all contact IDs from the cached list.
//           MentionManager.allContacts.forEach((contact) => {
//             if (!mentionedIds.includes(contact.id)) {
//               mentionedIds.push(contact.id);
//             }
//           });
//         } else if (!mentionedIds.includes(id)) {
//           mentionedIds.push(id);
//         }
//       }
//     });

//     // --- File Handling for Replies ---
//     const imageInput = replyForm.querySelector(".reply-image-upload");
//     const audioInput = replyForm.querySelector(".reply-audio-upload");
//     const videoInput = replyForm.querySelector(".reply-video-upload");

//     const imageFile = imageInput.files[0];
//     const audioFile = audioInput.files[0];
//     const videoFile = videoInput.files[0];

//     let uploadedFile = null;
//     let fileType = null;
//     if (imageFile) {
//       uploadedFile = imageFile;
//       fileType = "Image";
//     } else if (audioFile) {
//       uploadedFile = audioFile;
//       fileType = "Audio";
//     } else if (videoFile) {
//       uploadedFile = videoFile;
//       fileType = "Video";
//     }
//     // -----------------------------

//     // Call createReply with the file info.
//     await forumManager.createReply(
//       commentId,
//       content,
//       mentionedIds,
//       fileType,
//       uploadedFile
//     );
//     formatPreiview();
//     // Clear the reply editor and file inputs.
//     editor.innerHTML = "";
//     imageInput.value = "";
//     audioInput.value = "";
//     videoInput.value = "";
//     replyForm.classList.remove("state-disabled");
//   }
// });
// //-----------------------------------------------------------------
// //-----------------------------------------------------------------
// //-----------------------------------------------------------------
// //-----------------------------------------------------------------
// //Create Reply Part End
