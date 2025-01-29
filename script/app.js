// Configuration
const LOGGED_IN_USER_ID = "171031"; // Replace with real user ID in production

// Forum Manager
class ForumManager {
  constructor() {
    this.postsOffset = 0;
    this.postsLimit = CONFIG.pagination.postsPerPage;
    this.hasMorePosts = true;
    this.currentFilter = "recent"; // Default filter
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
          console.error("Error: Post element not found.");
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

        console.log(`Opening modal for post ID: ${postId}`);
        await PostModalManager.open(post);
      }
    });
  }

  handleFilterChange(filterType) {
    console.log(`Filtering: ${filterType}`);
    this.currentFilter = filterType;
    this.refreshPosts();
  }

  async refreshPosts() {
    console.log("Refreshing posts...");
    document.querySelector(CONFIG.selectors.postsContainer).innerHTML = "";
    this.postsOffset = 0;
    this.hasMorePosts = true;
    await this.fetchAndRenderPosts(true);
  }

  async loadMorePosts() {
    console.log("Loading more posts...");
    await this.fetchAndRenderPosts(false);
  }

  async fetchAndRenderPosts(isInitialLoad = false) {
    try {
      if (!this.hasMorePosts) {
        console.log("No more posts to load.");
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
      console.error("Error fetching posts:", error);
      document.querySelector(CONFIG.selectors.postsContainer).innerHTML = `
        <div class="text-center text-red-600 p-4">
          <p>⚠️ Failed to load posts. Please try again later.</p>
        </div>
      `;
    }
  }

  buildQuery() {
    let query = `
      query calcForumPosts($limit: IntScalar, $offset: IntScalar${
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

    return { query, variables };
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
      console.log(`Fetching comments for post ID: ${postId}`);

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

      console.log("API Response for Comments:", data);

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
      console.error("Error fetching comments:", error);
      return []; // Return an empty array if an error occurs
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
      console.log(`Fetching comments for post ID: ${postId}`);

      const comments = await ForumManager.fetchComments(postId);
      const commentsContainer = document.querySelector(
        "#modal-comments-container"
      );

      console.log("Fetched comments:", comments); // Debugging log

      if (comments.length > 0) {
        const template = $.templates("#comment-template");
        commentsContainer.innerHTML = comments
          .map((comment) => template.render(comment))
          .join("");
      } else {
        commentsContainer.innerHTML = `<p class="text-gray-500">No comments yet.</p>`;
      }
    } catch (error) {
      console.error("Error loading comments:", error);
      UIManager.showError("Failed to load comments.");
    }
  }
}

// Initialize the forum
new ForumManager();
