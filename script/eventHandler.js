// Initialize when DOM is ready
document.addEventListener("DOMContentLoaded", () => MentionManager.init());

document.getElementById("submit-post").addEventListener("click", async () => {
  const editor = document.getElementById("post-editor");
  const textContent = editor.innerText.trim();

  if (!textContent) {
    UIManager.showError("Post content cannot be empty.");
    return;
  }

  // Clear editor
  editor.innerHTML = "";
  document.getElementById("postNewModal").hide();

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
    author_id: forumManager.userId,
    author: {
      name: forumManager.fullName, // Replace with actual user data
      profileImage: forumManager.defaultAuthorImage,
    },
    date: "Just now",
    content: textContent,
  };

  // Render temporary post
  const template = $.templates("#post-template");
  const postContainer = document.querySelector(CONFIG.selectors.postsContainer);
  postContainer.insertAdjacentHTML("afterbegin", template.render(tempPost));

  const postElement = postContainer.firstElementChild;
  postElement.classList.add("state-disabled");

  try {
    // Submit to API
    const response = await ApiService.query(
      `
      mutation createForumPost($payload: ForumPostCreateInput!) {
        createForumPost(payload: $payload) {
          id
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
          author_id: forumManager.userId,
          post_copy: textContent,
          Mentioned_Users: mentionedIds.map((id) => ({ id: Number(id) })),
        },
      }
    );

    // Update with real ID
    const newPost = response.createForumPost;
    postElement.dataset.postId = newPost.id;

    // Fetch the actual post data
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
          Featured_Post: field(arg: ["featured_post"])
          Post_Image: field(arg: ["post_image"])
          ForumCommentsTotalCount: countDistinct(args: [{ field: ["ForumComments", "id"] }])
          Member_Post_Upvotes_DataTotal_Count: countDistinct(args: [{ field: ["Member_Post_Upvotes_Data", "id"] }])
        }
      }
      `,
      {
        id: newPost.id,
      }
    );

    const actualPost = fetchResponse.calcForumPosts[0];

    // Update the DOM with actual post data
    postElement.querySelector(".vote-button").dataset.postId = actualPost.ID;
    postElement.querySelector(".editPostModal").dataset.postId = actualPost.ID;
    postElement.querySelector(
      ".post-author-name"
    ).textContent = `${actualPost.Author_First_Name} ${actualPost.Author_Last_Name}`;
    postElement.querySelector(".post-author-image").src =
      actualPost.Author_Profile_Image;
    postElement.querySelector(".post-copy-content").textContent =
      actualPost.Post_Copy;
    postElement.querySelector(".postCommentCount").textContent =
      actualPost.ForumCommentsTotalCount;
    postElement.querySelector(".postVoteCount").textContent =
      actualPost.Member_Post_Upvotes_DataTotal_Count;
    postElement.dataset.postId = actualPost.ID;
  } catch (error) {
    UIManager.showError("Failed to post. Please try again.");
    postContainer.removeChild(postElement);
  } finally {
    postElement.classList.remove("state-disabled");
  }
});

document.addEventListener("click", async (e) => {
  const replyButton = e.target.closest(".submit-reply");
  if (replyButton) {
    const commentId = replyButton.dataset.commentId;
    const replyForm = replyButton.closest(".reply-form");
    replyForm.classList.add("state-disabled");
    if (!replyForm) {
      console.error("Reply form not found for comment:", commentId);
      return;
    }
    const editor = replyForm.querySelector(".reply-editor");
    // Clear the reply editor after submission.
    if (!editor) {
      console.error("Reply editor not found for comment:", commentId);
      return;
    }
    const content = editor.innerText.trim();
    if (!content) {
      UIManager.showError("Reply cannot be empty");
      return;
    }
    const mentionedIds = [];
    const mentionElements = editor.querySelectorAll(".mention");
    mentionElements.forEach((mention) => {
      const id = mention.dataset.contactId;
      if (id) mentionedIds.push(id);
    });
    await forumManager.createReply(commentId, content, mentionedIds);
    editor.innerHTML = "";
    replyForm.classList.remove("state-disabled");
  }
});

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
