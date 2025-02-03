class PostModalManager {
  static async open(post) {
    const modalContent = document.querySelector("#post-modal-content");
    // Render modal content
    modalContent.innerHTML = `
    <div class=" flex flex-col gap-3 p-6 max-[500px]:p-4  ${post.post_image
        ? ` w-[1232px] max-[1240px]:w-full`
        : "min-[500px]:w-[656px] mx-auto bg-primary-100"
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
</div>
          
          <div class="post-content">
            ${
              post.title
                ? `<h3 class="text-xl text-white font-medium mb-2">${post.title}</h3>`
                : ""
            }
              ${
                post.post_image
                  ? `<img class="  min-[500px]:hidden size-full" 
                     src="${post.post_image}" 
                     alt="Post image"
                     class="object-cover "
                     onerror="console.error('Failed to load image:', this.src)">`
                  : ""
              }
            ${
              post.content
                ? ` <div class="text-white ">${post.content}</div>`
                : ""
            }
           
          </div>
  
  <section id="modal-comments-section" class=" max-h-[80vh] overflow-auto min-[1100px]:h-max  ${
    post.post_image ? `max-[500px]:h-[45vh] ` : ""
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
        </div>
      `;

    // Initialize mention functionality for comments
    const commentEditor = document.getElementById("comment-editor");
    MentionManager.tribute.attach(commentEditor);

    

    // Add comment submit handler
    document
      .getElementById("submit-comment")
      .addEventListener("click", async () => {
        const editor = document.getElementById("comment-editor");
        const content = editor.innerText.trim();
        const mentions = Array.from(editor.querySelectorAll(".mention")).map(
          (el) => el.dataset.contactId
        );

        if (!content) {
          UIManager.showError("Comment cannot be empty");
          return;
        }

        // Use the existing global forumManager instance
        await window.forumManager.createComment(post.id, content, mentions);
        editor.innerHTML = ""; // Clear editor
      });

    // await modal.show();
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
