const LOGGED_IN_USER_ID = "171031";

class ForumManager {
  constructor() {
    this.postsOffset = 0;
    this.postsLimit = CONFIG.pagination.postsPerPage;
    this.hasMorePosts = true;
    this.currentFilter = "recent";
    this.initEventListeners();
    this.loadInitialPosts();
  }

  async loadInitialPosts() {
    try {
      this.postsOffset = 0;
      document.querySelector(CONFIG.selectors.postsContainer).innerHTML = "";
      this.hasMorePosts = true;
      await this.fetchAndRenderPosts(true);
    } catch (error) {
      UIManager.showError("Failed to load posts. Please try again.");
    }
  }

  initEventListeners() {
    document.addEventListener("click", async (e) => {
      if (e.target.closest(".refresh-button")) {
        this.refreshPosts();
      }
      if (e.target.closest("#load-more-button")) {
        this.loadMorePosts();
      }
      if (e.target.closest(".filter-button")) {
        const filterType = e.target.dataset.filter;
        this.handleFilterChange(filterType);
        this.classList.add("active");
      }
      if (e.target.closest(".load-comments-btn")) {
        const postId = e.target.dataset.postId;
        const postElement = document.querySelector(
          `[data-post-id="${postId}"]`
        );

        if (!postElement) {
          return;
        }

        const post = {
          id: postId,
          author: {
            name: postElement.querySelector("h2").textContent,
            profileImage: postElement.querySelector("img").src,
          },
          date: postElement.querySelector("time").textContent,
          title: postElement.querySelector("h3")?.textContent || "",
          content: postElement.querySelector(".post-content div").textContent,
        };
        await PostModalManager.open(post);
      }
      if (e.target.closest('.delete-post-btn')) {
        const postId = e.target.closest('.delete-post-btn').dataset.postId;
        this.deletePost(postId);
      }
    });
  }

  handleFilterChange(filterType) {
    this.currentFilter = filterType;
    this.refreshPosts();
  }

  async refreshPosts() {
    document.querySelector(CONFIG.selectors.postsContainer).innerHTML = "";
    this.postsOffset = 0;
    this.hasMorePosts = true;
    await this.fetchAndRenderPosts(true);
  }

  async loadMorePosts() {
    await this.fetchAndRenderPosts(false);
  }

  async fetchAndRenderPosts(isInitialLoad = false) {
    try {
      if (!this.hasMorePosts) {
        return;
      }

      const { query, variables } = this.buildQuery();
      const data = await ApiService.query(query, variables);

      if (!data || !data.calcForumPosts || data.calcForumPosts.length === 0) {
        this.hasMorePosts = false;
        document.querySelector("#load-more-button").classList.add("hidden");

        if (isInitialLoad) {
          document.querySelector(CONFIG.selectors.postsContainer).innerHTML = `
            <div class="text-center text-gray-600 p-4">
              <p>⚠️ No posts found.</p>
            </div>
          `;
        }
        return;
      }

      const posts = data.calcForumPosts.map((post) => ({
        id: post.ID,
        author_id: post.Author_ID,
        author: Formatter.formatAuthor({
          firstName: post.Author_First_Name,
          lastName: post.Author_Last_Name,
          profileImage: post.Author_Profile_Image,
        }),
        date: Formatter.formatTimestamp(post.Date_Added),
        title: post.Post_Title,
        content: post.Post_Copy,
      }));

      const template = $.templates("#post-template");
      const postContainer = document.querySelector(
        CONFIG.selectors.postsContainer
      );

      if (isInitialLoad) {
        postContainer.innerHTML = "";
      }

      postContainer.insertAdjacentHTML(
        "beforeend",
        posts.map((post) => template.render(post)).join("")
      );

      this.postsOffset += posts.length;

      if (posts.length < this.postsLimit) {
        this.hasMorePosts = false;
        document.querySelector("#load-more-button").classList.add("hidden");
      } else {
        document.querySelector("#load-more-button").classList.remove("hidden");
      }
    } catch (error) {
      document.querySelector(CONFIG.selectors.postsContainer).innerHTML = `
        <div class="text-center text-red-600 p-4">
          <p>⚠️ Failed to load posts. Please try again later.</p>
        </div>
      `;
    }
  }

  buildQuery() {
    let query = `query calcForumPosts($limit: IntScalar, $offset: IntScalar${
      this.needsUserId() ? ", $id: PriestessContactID" : ""
    }) {
        calcForumPosts(
          ${this.buildFilterCondition()}
          limit: $limit
          offset: $offset
          orderBy: [{ path: ["created_at"], type: desc }]
        ) {
          ID: field(arg: ["id"])
          Author_ID: field(arg: ["author_id"])
          Author_First_Name: field(arg: ["Author", "first_name"])
          Author_Last_Name: field(arg: ["Author", "last_name"])
          Author_Profile_Image: field(arg: ["Author", "profile_image"])
          Date_Added: field(arg: ["created_at"])
          Post_Title: field(arg: ["post_title"])
          Post_Copy: field(arg: ["post_copy"])
        }
      }
    `;

    let variables = {
      limit: this.postsLimit,
      offset: this.postsOffset,
    };

    if (this.needsUserId()) {
      variables.id = LOGGED_IN_USER_ID;
    }

    return {
      query,
      variables,
    };
  }

  buildFilterCondition() {
    switch (this.currentFilter) {
      case "featured":
        return `query: [{ where: { featured_post: true } }]`;
      case "my":
        return `query: [{ where: { Author: [{ where: { id: $id } }] } }]`;
      case "saved":
        return `query: [{ where: { Contacts: [{ where: { id: $id } }] } }]`;
      default:
        return "";
    }
  }

  needsUserId() {
    return this.currentFilter === "my" || this.currentFilter === "saved";
  }

  static async fetchComments(postId) {
    try {
      const query = `
        query {
          calcForumComments(query: [{ where: { Forum_Post: [{ where: { id: "${postId}" } }] } }]) {
            ID: field(arg: ["id"])
            Author_First_Name: field(arg: ["Author", "first_name"])
            Author_Last_Name: field(arg: ["Author", "last_name"])
            Author_Profile_Image: field(arg: ["Author", "profile_image"])
            Date_Added: field(arg: ["created_at"])
            Comment: field(arg: ["comment"])
          }
        }
      `;

      const data = await ApiService.query(query);

      if (!data || !data.calcForumComments) {
        throw new Error("No comments found or invalid API response.");
      }

      return data.calcForumComments.map((comment) => ({
        content: comment.Comment,
        date: Formatter.formatTimestamp(comment.Date_Added),
        author: Formatter.formatAuthor({
          firstName: comment.Author_First_Name,
          lastName: comment.Author_Last_Name,
          profileImage: comment.Author_Profile_Image,
        }),
      }));
    } catch (error) {
      return [];
    }
  }

  async deletePost(postId) {
    const postElement = document.querySelector(`[data-post-id="${postId}"]`);
    if (!postElement) return;
  
    try {
      // Show visual effects
      postElement.classList.add('opacity-50', 'pointer-events-none');
  
      const confirmed = await UIManager.showDeleteConfirmation();
      
      if (!confirmed) {
        // Reset styles if not confirmed
        postElement.classList.remove('opacity-50', 'pointer-events-none');
        return;
      }
  
      // Show processing state
      postElement.classList.add('animate-pulse');
  
      const query = `
        mutation deleteForumPost($id: PriestessForumPostID) {
          deleteForumPost(query: [{ where: { id: $id } }]) {
            id
          }
        }
      `;
      const variables = { id: postId };
      const response = await ApiService.query(query, variables);
  
      if (response?.deleteForumPost?.id) {
        // Add removal animation
        postElement.classList.add('opacity-0', 'transition-opacity', 'duration-300');
        setTimeout(() => postElement.remove(), 300);
        UIManager.showSuccess('Post deleted successfully');
      }
    } catch (error) {
      UIManager.showError('Failed to delete post. Please try again.');
    } finally {
      // Ensure styles are reset even if error occurs after confirmation
      postElement?.classList.remove(
        'animate-pulse',
        'opacity-50', 
        'pointer-events-none'
      );
    }
  }
}

class PostModalManager {
  static async open(post) {
    const modal = document.querySelector("#post-modal");
    const modalContent = document.querySelector("#post-modal-content");

    modalContent.innerHTML = `
        <article class="post bg-white rounded-lg shadow-sm p-6">
          <header class="flex items-center gap-4 mb-4">
            <img class="w-12 h-12 rounded-full object-cover" 
                 src="${post.author.profileImage}" 
                 alt="${post.author.name}">
            <div>
              <h2 class="font-semibold text-gray-800">${post.author.name}</h2>
              <time class="text-sm text-gray-500">${post.date}</time>
            </div>
          </header>
          
          <div class="post-content mb-4">
            ${
              post.title
                ? `<h3 class="text-xl font-medium mb-2">${post.title}</h3>`
                : ""
            }
            <div class="text-gray-700 whitespace-pre-wrap">${post.content}</div>
          </div>

          <section id="modal-comments-section" class="mt-6">
            <h3 class="text-lg font-semibold text-gray-800">Comments</h3>
            <div id="modal-comments-container" class="space-y-4 mt-4">
              <p class="text-gray-500">Loading comments...</p>
            </div>
          </section>
        </article>
      `;

    await modal.show();
    await PostModalManager.loadComments(post.id);
  }

  static async loadComments(postId) {
    try {
      const comments = await ForumManager.fetchComments(postId);
      const commentsContainer = document.querySelector(
        "#modal-comments-container"
      );

      if (comments.length > 0) {
        const template = $.templates("#comment-template");
        commentsContainer.innerHTML = comments
          .map((comment) => template.render(comment))
          .join("");
      } else {
        commentsContainer.innerHTML = `<p class="text-gray-500">No comments yet.</p>`;
      }
    } catch (error) {
      UIManager.showError("Failed to load comments.");
    }
  }
}

new ForumManager();

class ContactService {
  static async fetchContacts() {
    try {
      const query = `
        query calcContacts {
          calcContacts {
            Contact_ID: field(arg: ["id"])
            First_Name: field(arg: ["first_name"])
            Last_Name: field(arg: ["last_name"])
            Profile_Image: field(arg: ["profile_image"])
          }
        }
      `;
      const data = await ApiService.query(query);
      return data.calcContacts.map((contact) => ({
        id: contact.Contact_ID,
        name: `${contact.First_Name} ${contact.Last_Name}`,
        profileImage: contact.Profile_Image || CONFIG.api.defaultAuthorImage,
      }));
    } catch (error) {
      return [];
    }
  }
}

async function initializeEditor() {
  if (!window.DevExpress || !$.fn.dxHtmlEditor || !window.Quill) {
    setTimeout(initializeEditor, 500);
    return;
  }

  const contacts = await ContactService.fetchContacts();

  $("#html-objects").dxHtmlEditor({
    height: 200,
    mentions: [
      {
        dataSource: contacts,
        searchExpr: "name",
        displayExpr: "name",
        valueExpr: "id",
        template: (data) => `
          <div class="flex items-center gap-2">
            <img src="${data.profileImage}" class="w-8 h-8 rounded-full">
            <span>${data.name}</span>
          </div>
        `,
        marker: "@",
        insertExpr: (data) => `@${data.name}`,
      },
    ],
    placeholder: "Type @ to mention someone..",
  });
}

initializeEditor();

document.getElementById("submit-post").addEventListener("click", async () => {
  const editor = $("#html-objects").dxHtmlEditor("instance");
  const postCopy = editor.option("value")?.trim();

  if (!postCopy) {
    UIManager.showError("Post content cannot be empty.");
    return;
  }

  const tempPostId = `temp-${Date.now()}`;
  const tempPost = {
    id: tempPostId,
    author: {
      name: "Dipesh Adhikari",
      profileImage: CONFIG.api.defaultAuthorImage,
    },
    date: "Just now",
    content: postCopy,
  };

  const template = $.templates("#post-template");
  const postContainer = document.querySelector(CONFIG.selectors.postsContainer);
  const tempPostElement = document.createElement("div");

  // Render post template
  tempPostElement.innerHTML = template.render(tempPost);

  // 🔹 Get the first ELEMENT child (skip text nodes)
  const postElement = tempPostElement.children[0];

  if (!postElement) {
    return;
  }

  // Add loading styles
  postElement.classList.add("opacity-50", "pointer-events-none");
  postContainer.prepend(postElement);

  try {
    const query = `
      mutation createForumPost($payload: ForumPostCreateInput) {
        createForumPost(payload: $payload) {
          id  
          author_id
          post_copy
        }
      }
    `;
    const variables = {
      payload: {
        author_id: LOGGED_IN_USER_ID,
        post_copy: postCopy,
      },
    };

    const response = await ApiService.query(query, variables);

    if (response && response.createForumPost && response.createForumPost.id) {
      const actualPostId = response.createForumPost.id;
      postElement.setAttribute("data-post-id", actualPostId);
    }

    postElement.classList.remove("opacity-50", "pointer-events-none");
  } catch (error) {
    UIManager.showError("Failed to post. Please try again.");
    postElement.remove();
  }
});

function extractMentions(content) {
  const mentionRegex = /@([a-zA-Z\s]+)/g;
  let matches = [];
  let match;

  while ((match = mentionRegex.exec(content)) !== null) {
    matches.push(match[1].trim());
  }
  return matches;
}
