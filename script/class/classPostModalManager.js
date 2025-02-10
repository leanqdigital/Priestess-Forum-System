class PostModalManager {
  static async open(post) {
    const modalContent = document.querySelector("#post-modal-content");

    const imageData =
      post.type_image === "true" && post.new_post_image
        ? JSON.parse(post.new_post_image)
        : null;
    const audioData =
      post.type_audio === "true" && post.post_audio
        ? JSON.parse(post.post_audio)
        : null;
    const videoData =
      post.type_video === "true" && post.post_video
        ? JSON.parse(post.post_video)
        : null;

    modalContent.innerHTML = `
      <div class="flex flex-col gap-3  ${
    imageData ? `w-[1232px] max-[1240px]:w-full` : " min-[500px]:w-[656px] mx-auto bg-primary-100" 
}">

    <div class="flex items-start max-[1100px]:flex-col">
        ${
            imageData || videoData
            ? `
            <div class="flex flex-col gap-3 flex-1 border-r-[10px] border-[#000000]">
                ${imageData ? `<img class="w-full object-cover" src="${imageData.link}" alt="Post Image">` : ""}
                ${videoData ? `<video controls width="100%" class="object-cover">${videoData.link}</video>` : ""}
            </div>
            `
            : ""
        }
        <article class="p-4 flex-1 flex flex-col gap-3 w-full post bg-primary-100 shadow-sm max-[500px]:mb-[150px]">
            <div class="flex items-center justify-between">
                <h2 class="text-white">Post Details</h2>
                <svg class="cursor-pointer" @click="openCommentModal = false" width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12.6622 11.8364C12.7164 11.8906 12.7594 11.9549 12.7887 12.0257C12.8181 12.0965 12.8332 12.1724 12.8332 12.2491C12.8332 12.3257 12.8181 12.4016 12.7887 12.4724C12.7594 12.5432 12.7164 12.6075 12.6622 12.6617C12.608 12.7159 12.5437 12.7589 12.4729 12.7883C12.4021 12.8176 12.3262 12.8327 12.2495 12.8327C12.1729 12.8327 12.097 12.8176 12.0262 12.7883C11.9554 12.7589 11.8911 12.7159 11.8369 12.6617L6.99984 7.82399L2.16281 12.6617C2.05336 12.7712 1.90492 12.8327 1.75013 12.8327C1.59534 12.8327 1.44689 12.7712 1.33744 12.6617C1.22799 12.5523 1.1665 12.4038 1.1665 12.2491C1.1665 12.0943 1.22799 11.9458 1.33744 11.8364L6.1752 6.99935L1.33744 2.16233C1.22799 2.05288 1.1665 1.90443 1.1665 1.74964C1.1665 1.59485 1.22799 1.44641 1.33744 1.33696C1.44689 1.2275 1.59534 1.16602 1.75013 1.16602C1.90492 1.16602 2.05336 1.2275 2.16281 1.33696L6.99984 6.17471L11.8369 1.33696C11.9463 1.2275 12.0948 1.16602 12.2495 1.16602C12.4043 1.16602 12.5528 1.2275 12.6622 1.33696C12.7717 1.44641 12.8332 1.59485 12.8332 1.74964C12.8332 1.90443 12.7717 2.05288 12.6622 2.16233L7.82448 6.99935L12.6622 11.8364Z" fill="white" /></svg>
            </div>
            <div class="flex items-start justify-between w-full">
                <header class="flex items-center justify-between w-full">
                    <div class="flex items-center gap-4">
                        <img class="w-12 h-12 rounded-full object-cover" src="${post.author.profileImage}" alt="${post.author.name}">
                        <div>
                            <h2 class="font-semibold text-white">${post.author.name}</h2>
                            <time class="text-sm text-white">${post.date}</time>
                        </div>
                    </div>
                </header>
            </div>
            <div class="post-content">
                ${post.title ? `<h3 class="text-xl text-white font-medium mb-2">${post.title}</h3>` : ""}
                ${post.content ? `<p class="text-white">${post.content}</p>` : ""} </div>


            ${
                post.type_audio === "true" && audioData
                ? `<div class="text-white o1 mb-2">Click on play button to play the audio</div>
                <div class="post-audio-wrapper mb-4">
                    <audio controls>
                        <source src="${audioData.link}" type="${audioData.type}">
                        Your browser does not support the audio element.
                    </audio>
                </div>`
                : ""
            }

            <div class="flex items-center justify-between w-full">
                <div class="flex items-center gap-6 max-[500px]:gap-3">
                    <div class="flex items-center gap-2 cursor-pointer">
                        <div class="flex items-center gap-2 cursor-pointer vote-container">
                            <button class="vote-button" data-post-id="{{:id}}">
                               <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M22 8.18423C22.0015 8.8644 21.8682 9.53811 21.6076 10.1664C21.3471 10.7947 20.9646 11.3651 20.4823 11.8446L12.5097 19.9351C12.4432 20.0025 12.364 20.0561 12.2766 20.0927C12.1893 20.1293 12.0955 20.1481 12.0008 20.1481C11.9061 20.1481 11.8123 20.1293 11.725 20.0927C11.6376 20.0561 11.5584 20.0025 11.4919 19.9351L3.51935 11.8446C2.54736 10.8738 2.00084 9.55668 2 8.18292C1.99916 6.80916 2.54408 5.49134 3.51489 4.51935C4.48569 3.54736 5.80285 3.00084 7.17661 3C8.55037 2.99916 9.8682 3.54409 10.8402 4.51489L12.0008 5.59962L13.1695 4.51132C13.8948 3.78958 14.8177 3.29892 15.8217 3.10128C16.8257 2.90364 17.8657 3.00788 18.8104 3.40085C19.7552 3.79381 20.5624 4.45788 21.1301 5.30922C21.6977 6.16055 22.0004 7.16099 22 8.18423Z" fill="#C29D68" /></svg>
                            </button>
                            <div class="o1 text-white postVoteCount">${post.PostVotesCount}</div>
                        </div>
                    </div>
                    <button class="!flex items-center gap-2 load-comments-btn cursor-pointer" data-post-id="{{:id}}">
                           <svg width="24" height="24" viewBox="0 0 24 24" fill="none"xmlns="http://www.w3.org/2000/svg"><path d="M12.375 2.25C9.88943 2.25273 7.50645 3.24133 5.74889 4.99889C3.99133 6.75645 3.00273 9.13943 3 11.625V19.5C3 19.8978 3.15804 20.2794 3.43934 20.5607C3.72064 20.842 4.10218 21 4.5 21H12.375C14.8614 21 17.246 20.0123 19.0041 18.2541C20.7623 16.496 21.75 14.1114 21.75 11.625C21.75 9.1386 20.7623 6.75403 19.0041 4.99587C17.246 3.23772 14.8614 2.25 12.375 2.25ZM15.375 14.25H9C8.80109 14.25 8.61032 14.171 8.46967 14.0303C8.32902 13.8897 8.25 13.6989 8.25 13.5C8.25 13.3011 8.32902 13.1103 8.46967 12.9697C8.61032 12.829 8.80109 12.75 9 12.75H15.375C15.5739 12.75 15.7647 12.829 15.9053 12.9697C16.046 13.1103 16.125 13.3011 16.125 13.5C16.125 13.6989 16.046 13.8897 15.9053 14.0303C15.7647 14.171 15.5739 14.25 15.375 14.25ZM15.375 11.25H9C8.80109 11.25 8.61032 11.171 8.46967 11.0303C8.32902 10.8897 8.25 10.6989 8.25 10.5C8.25 10.3011 8.32902 10.1103 8.46967 9.96967C8.61032 9.82902 8.80109 9.75 9 9.75H15.375C15.5739 9.75 15.7647 9.82902 15.9053 9.96967C16.046 10.1103 16.125 10.3011 16.125 10.5C16.125 10.6989 16.046 10.8897 15.9053 11.0303C15.7647 11.171 15.5739 11.25 15.375 11.25Z"fill="#C29D68" /></svg>
                       
                        <div class="o1 text-white postCommentCount">${post.PostCommentCount}</div>
                    </button>
                </div>
                <button class="bookmark-button" data-post-id="{{:id}}">
                     </button>
            </div>
            <div class="h-[2px] w-full bg-[#d9d9d9]"></div>

            <div>
                <div class="comment-form-wrapper max-[500px]:mb-0 mb-4 flex flex-col gap-4 border border-gray-600 active:border-[#ffffff] focus:border-[#ffffff] comment-form flex items-center gap-3 w-full bg-primary-100 min-[500px]:rounded max-[500px]:p-4 z-[999] max-[500px]:!z-[99999] max-[500px]:fixed bottom-0 right-0 w-full max-[500px]:bg-primary">
                    <div id="comment-editor" class="relative h-[80px] editor comment-editor text-white p-2 w-full h-10 max-[500px]:h-1 !border-none !focus-visible:border-none rounded" contenteditable="true"></div>
                    <div class="flex items-center justify-end w-full p-2 max-[500px]:p-0">
                        <button id="submit-comment" class="w-fit bg-secondary text-white px-4 py-2 rounded hover:bg-secondary-200 transition-colors flex items-center gap-2">
                            <span>Comment</span>
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"xmlns="http://www.w3.org/2000/svg"><path d="M11.1662 5.99246C11.1666 6.14096 11.1273 6.28687 11.0524 6.41509C10.9775 6.54331 10.8697 6.64919 10.7401 6.72177L1.99252 11.7233C1.86699 11.7944 1.72527 11.8321 1.58098 11.8327C1.44803 11.832 1.31719 11.7995 1.19936 11.7379C1.08154 11.6763 0.980152 11.5874 0.903674 11.4787C0.827196 11.3699 0.777842 11.2444 0.759734 11.1127C0.741625 10.981 0.755286 10.8469 0.799577 10.7215L2.20611 6.55663C2.21985 6.51591 2.24585 6.48044 2.28055 6.45507C2.31524 6.42971 2.35693 6.41569 2.3999 6.41494H6.16523C6.22236 6.41506 6.27891 6.40344 6.33136 6.38079C6.38381 6.35814 6.43104 6.32495 6.47012 6.28328C6.50921 6.24161 6.5393 6.19235 6.55855 6.13855C6.57779 6.08476 6.58576 6.02758 6.58198 5.97058C6.57253 5.86341 6.52294 5.76377 6.44315 5.69162C6.36336 5.61946 6.25926 5.5801 6.15168 5.58144H2.40094C2.35734 5.58144 2.31484 5.56777 2.27943 5.54235C2.24401 5.51693 2.21745 5.48105 2.2035 5.43974L0.796973 1.27537C0.74099 1.11575 0.734897 0.942879 0.779504 0.779715C0.82411 0.616551 0.917305 0.470821 1.04671 0.361883C1.17611 0.252946 1.33559 0.185958 1.50397 0.169819C1.67235 0.15368 1.84166 0.189153 1.9894 0.271527L10.7411 5.26679C10.87 5.3392 10.9772 5.44457 11.0519 5.57208C11.1266 5.69959 11.1661 5.84468 11.1662 5.99246Z" fill="#ffffff" /></svg>  
                        </button>
                    </div>
                </div>
                <section id="modal-comments-section" class="h-[50vh] max-[500px]:pb-[150px] overflow-auto ${post.post_image ? `max-[500px]:h-[45vh] ` : " max-[500px]:h-[70vh]"}">
                    <div class="my-4 text-white text-sm font-['Avenir LT Std'] leading-[14px]">Comments</div>
                    <div id="modal-comments-container" class="space-y-4 modal-comments-container-${post.id}">
                        <p class="text-gray-300">Loading comments...</p>
                    </div>
                </section>
            </div>
        </article>
    </div>
</div>
        `;
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
