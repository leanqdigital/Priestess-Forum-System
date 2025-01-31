const LOGGED_IN_USER_ID = "171031";

class ForumManager {
  constructor() {
    this.LOGGED_IN_USER_ID = LOGGED_IN_USER_ID;
    this.postsOffset = 0;
    this.postsLimit = CONFIG.pagination.postsPerPage;
    this.hasMorePosts = true;
    this.currentFilter = "recent";
    this.savedPostIds = new Map();
    this.init();
  }

  async init() {
    try {
      console.log("🔄 Initializing Forum Manager...");

      // ✅ Wait for saved posts to load first
      await this.fetchSavedPosts();
      console.log("✅ Saved Posts Loaded. Now Fetching Posts...");

      // ✅ Now load the posts
      this.initEventListeners();
      await this.loadInitialPosts();
    } catch (error) {
      console.error("Initialization error:", error);
      UIManager.showError("Failed to initialize forum.");
    }
  }

  async loadInitialPosts() {
    try {
      this.postsOffset = 0;
      document.querySelector(CONFIG.selectors.postsContainer).innerHTML = "";
      this.hasMorePosts = true;

      // ❌ Don't call fetchSavedPosts() here again!
      console.log("✅ Saved Bookmarks Already Fetched:", [
        ...this.savedPostIds.keys(),
      ]);

      await this.fetchAndRenderPosts(true);
    } catch (error) {
      UIManager.showError("Failed to load posts. Please try again.");
    }
  }

  async toggleBookmark(postId) {
    const buttons = document.querySelectorAll(
      `.bookmark-button[data-post-id="${postId}"]`
    );
    const postElement = document.querySelector(`[data-post-id="${postId}"]`);

    // ✅ Fetch latest bookmarks for this post
    const existingBookmarkIds = await this.fetchAllBookmarkIdsForPost(postId);
    const isBookmarked = existingBookmarkIds.length > 0;

    try {
      buttons.forEach((button) => (button.disabled = true));

      if (isBookmarked) {
        await this.deleteMultipleBookmarks(existingBookmarkIds);
        this.savedPostIds.delete(postId); // ✅ Update local state immediately

        // ✅ If in "Saved" tab, remove the post from UI
        if (this.currentFilter === "saved" && postElement) {
          postElement.classList.add(
            "opacity-0",
            "transition-opacity",
            "duration-300"
          );
          setTimeout(() => postElement.remove(), 300);
        }
      } else {
        const newBookmarkId = await this.createBookmark(postId);
        this.savedPostIds.set(postId, newBookmarkId); // ✅ Update local state immediately
      }

      // ✅ Update icons without re-fetching everything
      this.updateBookmarkIcons();

      UIManager.showSuccess(
        `Post ${isBookmarked ? "removed from" : "added to"} bookmarks`
      );
    } catch (error) {
      UIManager.showError(
        `Failed to ${isBookmarked ? "remove" : "save"} bookmark`
      );
    } finally {
      buttons.forEach((button) => (button.disabled = false));
    }
  }

  async fetchAllBookmarkIdsForPost(postId) {
    const query = `
      query {
        calcOContactSavedPosts(query: [{
          where: {
            contact_id: "${LOGGED_IN_USER_ID}",
            saved_post_id: "${postId}"
          }
        }]) {
          ID: field(arg: ["id"])
        }
      }
    `;

    const data = await ApiService.query(query);
    return data?.calcOContactSavedPosts?.map((bookmark) => bookmark.ID) || [];
  }

  async deleteMultipleBookmarks(bookmarkIds) {
    await Promise.all(
      bookmarkIds.map((id) =>
        this.deleteBookmark(id).catch((error) =>
          console.error("Failed to delete bookmark:", id, error)
        )
      )
    );

    // Update local state
    bookmarkIds.forEach((id) => {
      const postId = [...this.savedPostIds.entries()].find(
        ([_, bookmarkId]) => bookmarkId === id
      )?.[0];
      if (postId) this.savedPostIds.delete(postId);
    });
  }

  updateBookmarkIcons() {
    console.trace("🔎 updateBookmarkIcons() CALLED");
    console.log("🔄 Updating Bookmark Icons...", [...this.savedPostIds.keys()]);

    document.querySelectorAll(".bookmark-button").forEach((button) => {
      const postId = button.dataset.postId;
      const isBookmarked = this.savedPostIds.has(postId);
      console.log(`🔎 Post ID: ${postId}, Bookmarked: ${isBookmarked}`);

      button.innerHTML = this.getBookmarkSVG(isBookmarked);
    });

    console.log("✅ Bookmark Icons Updated.");
  }

  async fetchSavedPosts() {
    try {
      const query = `
            query {
                calcOContactSavedPosts(
                    query: [{ where: { contact_id: "${LOGGED_IN_USER_ID}" } }]
                    orderBy: [{ path: ["created_at"], type: desc }]
                ) {
                    ID: field(arg: ["id"])
                    Saved_Post_ID: field(arg: ["saved_post_id"])
                }
            }
        `;

      const data = await ApiService.query(query);

      // ✅ Don't clear `savedPostIds` before verifying data
      if (!data || !data.calcOContactSavedPosts) {
        console.warn("⚠️ No saved bookmarks found.");
        return;
      }

      // ✅ Only update savedPostIds if data exists
      this.savedPostIds.clear();
      data.calcOContactSavedPosts.forEach(({ ID, Saved_Post_ID }) => {
        this.savedPostIds.set(String(Saved_Post_ID), ID); // Convert to string
      });

      console.log("✅ Saved Bookmarks Fetched:", [...this.savedPostIds.keys()]);
    } catch (error) {
      console.error("Error fetching saved posts:", error);
    }
  }

  getBookmarkSVG(isBookmarked) {
    return `
        <svg width="24" height="24" viewBox="0 0 24 24" 
             fill="${isBookmarked ? "#044047" : "none"}" 
             stroke="#044047">
            <path d="M17.8003 2H6.60003C6.17568 2 5.7687 2.16857 5.46864 2.46864C5.16857 2.7687 5 3.17568 5 3.60003V21.2004C5.00007 21.3432 5.03835 21.4833 5.11086 21.6063C5.18337 21.7293 5.28748 21.8306 5.41237 21.8998C5.53726 21.969 5.67839 22.0035 5.82111 21.9997C5.96384 21.996 6.10295 21.9541 6.22402 21.8784L12.2001 18.1433L18.1773 21.8784C18.2983 21.9538 18.4373 21.9955 18.5799 21.9991C18.7225 22.0027 18.8634 21.9682 18.9882 21.899C19.1129 21.8299 19.2169 21.7287 19.2893 21.6058C19.3618 21.483 19.4001 21.343 19.4003 21.2004V3.60003C19.4003 3.17568 19.2317 2.7687 18.9316 2.46864C18.6316 2.16857 18.2246 2 17.8003 2Z"/>
        </svg>
    `;
  }

  async createBookmark(postId) {
    // Prevent duplicate bookmarks
    if (this.savedPostIds.has(postId)) {
      throw new Error("Post is already bookmarked.");
    }

    const query = `
      mutation createOContactSavedPost($payload: OContactSavedPostCreateInput) {
        createOContactSavedPost(payload: $payload) {
          id
          saved_post_id
        }
      }
    `;
    const variables = {
      payload: {
        contact_id: LOGGED_IN_USER_ID,
        saved_post_id: postId,
      },
    };

    const response = await ApiService.query(query, variables);
    return response.createOContactSavedPost.id;
  }

  async deleteBookmark(savedRecordId) {
    const query = `
      mutation deleteOContactSavedPost($id: PriestessOContactSavedPostID) {
        deleteOContactSavedPost(query: [{ where: { id: $id } }]) {
          id
        }
      }
    `;
    const variables = { id: savedRecordId };
    await ApiService.query(query, variables);
  }

  initEventListeners() {
    document.addEventListener("click", async (e) => {
      if (e.target.closest(".refresh-button")) {
        this.refreshPosts();
      }
      if (e.target.closest("#load-more-button")) {
        this.loadMorePosts();
      }
      const filterButton = e.target.closest(".filter-button");

      if (filterButton) {
        const filterType = filterButton.dataset.filter;
        this.handleFilterChange(filterType);
      }

      const button = e.target.closest(".load-comments-btn");
      if (button) {
        const postId = button.dataset.postId;
        const postElement = document.querySelector(
          `[data-post-id="${postId}"]`
        );
        if (postElement) {
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
      }

      if (e.target.closest(".delete-post-btn")) {
        const postId = e.target.closest(".delete-post-btn").dataset.postId;
        this.deletePost(postId);
      }

      if (e.target.closest(".bookmark-button")) {
        const postId = e.target.closest(".bookmark-button").dataset.postId;
        this.toggleBookmark(postId);
      }
    });
  }

  handleFilterChange(filterType) {
    this.currentFilter = filterType;
    this.refreshPosts().then(() => {
      if (filterType === "saved") {
        this.updateBookmarkIcons(); // ✅ Update icons when switching to Saved Posts
      }
    });
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
      if (!this.hasMorePosts) return;

      const { query, variables } = this.buildQuery();
      const data = await ApiService.query(query, variables);

      if (!data || !data.calcForumPosts || data.calcForumPosts.length === 0) {
        this.hasMorePosts = false;
        document.querySelector("#load-more-button").classList.add("hidden");

        if (isInitialLoad) {
          document.querySelector(CONFIG.selectors.postsContainer).innerHTML = `
                  <div class="flex flex-col gap-6  items-center justify-center ">
          <div class="size-[200px]">
            <img src="./assets/emptyPost.svg" alt="Empty Post" class="size-full object-contain">
          </div>
          <div class="p2 text-black">No posts available.</div>
        </div>
                   
                `;
        }
        return;
      }

      console.log("✅ Rendering Posts. Current Saved Post IDs:", [
        ...this.savedPostIds.keys(),
      ]);

      const posts = data.calcForumPosts.map((post) => {
        const postIdString = String(post.ID); // Convert post.ID to string
        const isBookmarked = this.savedPostIds.has(postIdString);

        return {
          isBookmarked,
          id: post.ID,
          author_id: post.Author_ID,
          featured_post: post.Featured_Post,
          defaultAuthorImage: CONFIG.api.defaultAuthorImage,
          author: Formatter.formatAuthor({
            firstName: post.Author_First_Name,
            lastName: post.Author_Last_Name,
            profileImage: post.Author_Profile_Image,
          }),
          date: Formatter.formatTimestamp(post.Date_Added),
          title: post.Post_Title,
          content: post.Post_Copy,
        };
      });

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

      // ✅ Call updateBookmarkIcons *after* posts are rendered
      this.updateBookmarkIcons();
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
          Featured_Post: field(arg: ["featured_post"])
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
      case "saved":
        return `query: [{ where: { Contacts: [{ where: { id: $id } }] } }]`;
      case "featured":
        return `query: [{ where: { featured_post: true } }]`;
      case "my":
        return `query: [{ where: { Author: [{ where: { id: $id } }] } }]`;
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
      postElement.classList.add("opacity-50", "pointer-events-none");

      const confirmed = await UIManager.showDeleteConfirmation();

      if (!confirmed) {
        // Reset styles if not confirmed
        postElement.classList.remove("opacity-50", "pointer-events-none");
        return;
      }

      // Show processing state
      postElement.classList.add("animate-pulse");

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
        postElement.classList.add(
          "opacity-0",
          "transition-opacity",
          "duration-300"
        );
        setTimeout(() => postElement.remove(), 300);
        UIManager.showSuccess("Post deleted successfully");
      }
    } catch (error) {
      UIManager.showError("Failed to delete post. Please try again.");
    } finally {
      // Ensure styles are reset even if error occurs after confirmation
      postElement?.classList.remove(
        "animate-pulse",
        "opacity-50",
        "pointer-events-none"
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

// Add this after ContactService class
class MentionManager {
  static init() {
    this.tribute = new Tribute({
      trigger: "@",
      allowSpaces: true,
      lookup: "name",
      values: this.fetchMentionContacts,
      menuItemTemplate: this.mentionTemplate,
      selectTemplate: this.selectTemplate,
      menuContainer: document.body,
    });

    const editor = document.getElementById("post-editor");
    this.tribute.attach(editor);
  }

  static async fetchMentionContacts(text, cb) {
    try {
      const contacts = await ContactService.fetchContacts();
      cb(
        contacts.map((contact) => ({
          key: contact.name,
          value: contact.name,
          ...contact,
        }))
      );
    } catch (error) {
      console.error("Error fetching contacts:", error);
      cb([]);
    }
  }

  static mentionTemplate(item) {
    return `
          <div class="flex items-center gap-3 px-3 py-2">
              <img src="${item.original.profileImage}" 
                   class="w-8 h-8 rounded-full object-cover"
                   onerror="this.src='${CONFIG.api.defaultAuthorImage}'">
              <div>
                  <div class="o2 text-primary">${item.original.name}</div>
              </div>
          </div>
      `;
  }

  static selectTemplate(item) {
    return `<span class="mention" data-contact-id="${item.original.id}">@${item.original.name}</span>`;
  }
}

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
  } catch (error) {
    UIManager.showError("Failed to post. Please try again.");
    postContainer.removeChild(postContainer.firstElementChild);
  }
});
