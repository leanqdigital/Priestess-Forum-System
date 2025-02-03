// Initialize when DOM is ready
document.addEventListener("DOMContentLoaded", () => MentionManager.init());

document.getElementById("submit-post").addEventListener("click", async () => {
  const editor = document.getElementById("post-editor");
  const postContent = editor.innerHTML;
  const textContent = editor.innerText.trim();

  if (!textContent) {
    UIManager.showError("Post content cannot be empty.");
    return;
  }

  // Extract mentioned contact IDs
  const mentionedIds = [];
  const mentions = editor.querySelectorAll(".mention");
  mentions.forEach((mention) => {
    const id = mention.dataset.contactId;
    if (id) mentionedIds.push(id);
  });

  // Create temporary post
  const tempPost = {
    id: `temp-${Date.now()}`,
    author_id: LOGGED_IN_USER_ID,
    author: {
      name: "Dipesh Adhikari", // Replace with actual user data
      profileImage: CONFIG.api.defaultAuthorImage,
    },
    date: "Just now",
    content: textContent,
  };

  // Render temporary post
  const template = $.templates("#post-template");
  const postContainer = document.querySelector(CONFIG.selectors.postsContainer);
  postContainer.insertAdjacentHTML("afterbegin", template.render(tempPost));

  try {
    // Submit to API
    const response = await ApiService.query(
      `
          mutation createForumPost($payload: ForumPostCreateInput!) {
              createForumPost(payload: $payload) {
                  author_id
                  post_copy
                  Mentioned_Users {
                      id
                  }
              }
          }
      `,
      {
        payload: {
          author_id: LOGGED_IN_USER_ID,
          post_copy: textContent,
          Mentioned_Users: mentionedIds.map((id) => ({ id: Number(id) })),
        },
      }
    );

    // Update with real ID
    const newPost = response.createForumPost;
    const postElement = postContainer.firstElementChild;
    postElement.dataset.postId = newPost.id;
    postElement.querySelectorAll("[data-post-id]").forEach((el) => {
      el.dataset.postId = newPost.id;
    });

    // Clear editor
    editor.innerHTML = "";
    document.getElementById("postNewModal").hide();
  } catch (error) {
    UIManager.showError("Failed to post. Please try again.");
    postContainer.removeChild(postContainer.firstElementChild);
  }
});
