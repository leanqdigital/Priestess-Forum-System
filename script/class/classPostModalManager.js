class PostModalManager {
  static async open(post) {
    const modal = document.querySelector("#post-modal");
    const modalContent = document.querySelector("#post-modal-content");
    // Render modal content
    modalContent.innerHTML = `
      <div class="flex items-start gap-3 max-[1100px]:flex-col  ${post.post_image
        ? ` w-[1232px] max-[1240px]:w-full`
        : "min-[500px]:w-[656px] mx-auto"
      }">
       ${post.post_image
        ? `<div class="flex-1"><img class=" max-[500px]:hidden   size-full" 
                     src="${post.post_image}" 
                     alt="Post image"
                     class="object-cover "
                     onerror="console.error('Failed to load image:', this.src)"></div>`
        : ""
      }
        <article class="flex-1 flex flex-col gap-3 w-full post bg-primary-100 rounded-lg shadow-sm p-6 max-[500px]:mb-[150px]">
        <div class="flex items-start justify-between w-full">
          <header class="flex items-center gap-4 ">
            <img class="w-12 h-12 rounded-full object-cover"
                 src="${post.author.profileImage}" 
                 alt="${post.author.name}">
            <div>
              <h2 class="font-semibold text-white">${post.author.name}</h2>
              <time class="text-sm text-white">${post.date}</time>
            </div>
          </header>
          <svg class="cursor-pointer" @click="openCommentModal = false" width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12.6622 11.8364C12.7164 11.8906 12.7594 11.9549 12.7887 12.0257C12.8181 12.0965 12.8332 12.1724 12.8332 12.2491C12.8332 12.3257 12.8181 12.4016 12.7887 12.4724C12.7594 12.5432 12.7164 12.6075 12.6622 12.6617C12.608 12.7159 12.5437 12.7589 12.4729 12.7883C12.4021 12.8176 12.3262 12.8327 12.2495 12.8327C12.1729 12.8327 12.097 12.8176 12.0262 12.7883C11.9554 12.7589 11.8911 12.7159 11.8369 12.6617L6.99984 7.82399L2.16281 12.6617C2.05336 12.7712 1.90492 12.8327 1.75013 12.8327C1.59534 12.8327 1.44689 12.7712 1.33744 12.6617C1.22799 12.5523 1.1665 12.4038 1.1665 12.2491C1.1665 12.0943 1.22799 11.9458 1.33744 11.8364L6.1752 6.99935L1.33744 2.16233C1.22799 2.05288 1.1665 1.90443 1.1665 1.74964C1.1665 1.59485 1.22799 1.44641 1.33744 1.33696C1.44689 1.2275 1.59534 1.16602 1.75013 1.16602C1.90492 1.16602 2.05336 1.2275 2.16281 1.33696L6.99984 6.17471L11.8369 1.33696C11.9463 1.2275 12.0948 1.16602 12.2495 1.16602C12.4043 1.16602 12.5528 1.2275 12.6622 1.33696C12.7717 1.44641 12.8332 1.59485 12.8332 1.74964C12.8332 1.90443 12.7717 2.05288 12.6622 2.16233L7.82448 6.99935L12.6622 11.8364Z" fill="white"/>
          </svg>
  
                 </div>
          
          <div class="post-content">
            ${post.title
        ? `<h3 class="text-xl text-white font-medium mb-2">${post.title}</h3>`
        : ""
      }
              ${post.post_image
        ? `<img class="  min-[500px]:hidden size-full" 
                     src="${post.post_image}" 
                     alt="Post image"
                     class="object-cover "
                     onerror="console.error('Failed to load image:', this.src)">`
        : ""
      }
            ${post.content
        ? ` <div class="text-white ">${post.content}</div>`
        : ""
      }
           
          </div>
  
  <section id="modal-comments-section" class=" max-h-[80vh] overflow-auto min-[1100px]:h-max  ${post.post_image
        ? `max-[500px]:h-[45vh] `
        : ""
      } ">
        <h3 class="text-lg font-semibold text-white mb-4">Comments</h3>
        
        <!-- Add comment form -->
        <div class="comment-form flex min-[500px]:flex-col gap-3 w-full  bg-primary-100 min-[500px]:rounded max-[500px]:p-4 z-[999] max-[500px]:fixed bottom-0 pb-6 right-0  w-full max-[500px]:bg-primary">
          <div id="comment-editor" 
               class="comment-editor text-white p-2 h-[100px] w-full  max-[500px]:h-10 border border-gray-600 rounded"
               contenteditable="true"
               placeholder="Write a comment..."></div>
          <button id="submit-comment" 
                  class="w-fit bg-secondary text-white px-4 py-2 rounded hover:bg-secondary-200 transition-colors">
            Post
          </button>
        </div>
  
        <div id="modal-comments-container" class="space-y-4">
          <p class="text-gray-300">Loading comments...</p>
        </div>
      </section>
        </article>
        </div>
      `;

    // Initialize mention functionality for comments
    const commentEditor = document.getElementById("comment-editor");
    MentionManager.tribute.attach(commentEditor);

    

    // Add comment submit handler
    document
      .getElementById("submit-comment")
      .addEventListener("click", async () => {
        const forumManager = new ForumManager();
        const editor = document.getElementById("comment-editor");
        const content = editor.innerText.trim();
        const mentions = Array.from(editor.querySelectorAll(".mention")).map(
          (el) => el.dataset.contactId
        );

        if (!content) {
          UIManager.showError("Comment cannot be empty");
          return;
        }

        await forumManager.createComment(post.id, content, mentions);
        editor.innerHTML = ""; // Clear editor
      });

    //await modal.show();
    await PostModalManager.loadComments(post.id);
  }

  static async confirmDeleteComment(commentId) {
    const confirmed = await UIManager.showDeleteConfirmation(
      "Are you sure you want to delete this comment?"
    );
    if (!confirmed) return;

    try {
      await PostModalManager.deleteComment(commentId);

      // Remove only the deleted comment, not the entire modal
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
    await ApiService.query(query, variables);
  }

  static async loadComments(postId) {
    try {
      const comments = await ForumManager.fetchComments(postId);
      const commentsContainer = document.getElementById(
        "modal-comments-container"
      );

      // Render comments using JSRender
      const template = $.templates("#comment-template");
      commentsContainer.innerHTML = template.render(comments);

      // Attach event listeners for delete buttons
      document.querySelectorAll(".delete-comment-btn").forEach((button) => {
        button.addEventListener("click", (e) => {
          const commentId = e.target.dataset.commentId;
          PostModalManager.confirmDeleteComment(commentId);
        });
      });
    } catch (error) {
      commentsContainer.innerHTML = `<p class="text-red-300">Error loading comments</p>`;
    }
  }
}
