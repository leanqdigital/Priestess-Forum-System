class ForumManager {
  constructor() {
    this.userId = CONFIG.api.userId;
    this.firstName = CONFIG.api.firstName;
    this.lastName = CONFIG.api.lastName;
    this.fullName = CONFIG.api.fullName;
    this.defaultLoggedInAuthorImage = CONFIG.api.defaultLoggedInAuthorImage;
    this.defaultAuthorImage = CONFIG.api.defaultAuthorImage;
    this.postsOffset = 0;
    this.postsLimit = CONFIG.pagination.postsPerPage;
    this.hasMorePosts = true;
    this.currentFilter = "recent";
    this.currentSort = "latest";
    this.savedPostIds = new Map();
    this.votedPostIds = new Map();
    this.votedCommentIds = new Map();
    this.votedReplyIds = new Map();
    this.init();
  }

  async init() {
    try {
      await this.fetchSavedPosts();
      await this.fetchVotes();
      await this.fetchVoteForComment();
      await this.fetchVoteForReply();
      this.initEventListeners();
      await this.loadInitialPosts();
    } catch (error) {
      UIManager.showError("Failed to initialize forum.");
    }
  }

  //@@Full Post Method Start
  //-----------------------------------------------------------------------
  //-----------------------------------------------------------------------
  //-----------------------------------------------------------------------
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

  async fetchAndRenderPosts(isInitialLoad = false) {
    try {
      if (!this.hasMorePosts) return;
      const postContainer = document.querySelector(
        CONFIG.selectors.postsContainer
      );

      // Show skeleton loaders while waiting
      if (isInitialLoad) {
        postContainer.innerHTML = this.getSkeletonLoader(5);
      } else {
        postContainer.insertAdjacentHTML("beforeend", this.getSkeletonLoader());
      }

      // Build and run query
      const { query, variables } = this.buildQuery();
      const dataPromise = ApiService.query(query, variables);
      await new Promise((resolve) => setTimeout(resolve, 700));
      const data = await dataPromise;

      // Remove all skeleton loaders
      document
        .querySelectorAll(".skeleton-loader")
        .forEach((el) => el.remove());

      // If no posts were returned, update UI accordingly
      if (!data || !data.calcForumPosts || data.calcForumPosts.length === 0) {
        this.hasMorePosts = false;
        if (isInitialLoad) {
          postContainer.innerHTML = `
            <div class="flex flex-col gap-6 items-center justify-center">
              <div class="size-[200px]">
                <img src="https://file.ontraport.com/media/815e881804d34ab797e0164d3147eac6.phpi2i7d9?Expires=4892956060&Signature=RWwlqEq5aGHRwoY5Qj6PRr1OrwGrpGx52h8-xquN4k3wcESh0eUUs2pz3zaRcSqMKKoFKQuERA58BSwA0VNAqAvNc4NMSTX3odMiC3J2VKgZ99qQCtIMm182soWKlYhjYdlY4iNvqi9M4WXRYQTm8yZtS1ShkUJd79zHKc~N1jRMLUUaPlKSwum7yUT1AAl4oK-emB11oUe--F9bom4dM~QWQUGNIMvI9rD~DT0EYElQraQFU9wopWMvMmLyqEHQPFhsAM~OmIyjH8O7q3mTT629fkQWKGFM-X6~rprLOf8h~CUq45CNSHsAe8UdNRC2r42OaSU-xkC2uQdCe1lnMQ__&Key-Pair-Id=APKAJVAAMVW6XQYWSTNA" alt="Empty Post" class="size-full object-contain">
              </div>
              <div class="p2 text-white">No posts available.</div>
            </div>
          `;
        }
        return;
      }

      // Map each returned post to include the unified file fields
      const posts = data.calcForumPosts.map((post) => {
        let fileContent = post.File_Content;
        if (typeof fileContent === "string") {
          fileContent = fileContent.trim();
          // If it starts with a '{', it's likely a JSON string
          if (fileContent.startsWith("{")) {
            try {
              fileContent = JSON.parse(fileContent);
            } catch (e) {
              // Fallback: if parsing fails, treat it as a URL string
              fileContent = { link: fileContent };
            }
          } else {
            // Sometimes the URL string might have extra quotes.
            if (
              (fileContent.startsWith('"') && fileContent.endsWith('"')) ||
              (fileContent.startsWith("'") && fileContent.endsWith("'"))
            ) {
              fileContent = fileContent.substring(1, fileContent.length - 1);
            }
            // Wrap the plain URL string into an object so your template works as expected.
            fileContent = { link: fileContent };
          }
        } else {
          // fileContent is already an object
          fileContent = post.File_Content;
        }
        const postId = String(post.ID);
        return {
          id: postId,
          isBookmarked: this.savedPostIds.has(postId),
          isVoted: this.votedPostIds.has(postId),
          author_id: post.Author_ID,
          featured_post: post.Featured_Post,
          file_tpe: post.File_Tpe,
          file_content: fileContent,
          PostVotesCount: post.Member_Post_Upvotes_DataTotal_Count,
          PostCommentCount: post.ForumCommentsTotalCount,
          author: Formatter.formatAuthor({
            firstName: post.Author_First_Name,
            lastName: post.Author_Last_Name,
            profileImage:
              post.Author_Forum_Image && post.Author_Forum_Image.trim()
                ? post.Author_Forum_Image
                : this.defaultAuthorImage,
          }),
          date: Formatter.formatTimestamp(post.Date_Added),
          title: post.Post_Title,
          content: post.Post_Copy,
          disableComments: post.Disable_New_Comments,
        };
      });

      const template = $.templates("#post-template");
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
      }
      this.updateBookmarkIcons();
      formatPreiview();
    } catch (error) {
      document
        .querySelectorAll(".skeleton-loader")
        .forEach((el) => el.remove());
      document.querySelector(CONFIG.selectors.postsContainer).innerHTML = `
        <div class="text-center text-red-600 p-4">
          <p>⚠️ Server timeout. Please refresh the page to load the posts.</p>
        </div>
      `;
    }
  }

  buildQuery() {
    const sortCondition = this.buildSortCondition();
    const dynamicFilter = this.buildFilterCondition();
    const filters = [];

    // Base filter: course filter (always required) using a "where" clause.
    filters.push(
      `{ where: { Related_Course: [{ where: { id: "${courseID}" } }] } }`
    );

    // If a dynamic filter exists, chain it with "andWhere"
    if (dynamicFilter) {
      filters.push(`{ andWhere: ${dynamicFilter} }`);
    }

    // Append search filters if a search term exists.
    if (this.searchTerm && this.searchTerm.trim() !== "") {
      // Chain the Author search filter using andWhere.
      filters.push(
        `{ andWhere: { Author: { where: { first_name: $first_name } } } }`
      );
    }

    // Build the complete filters array string.
    const queryFilters = `[ ${filters.join(", ")} ]`;

    // Build the rest of the query arguments.
    let args = [];
    args.push(`query: ${queryFilters}`);
    args.push(`limit: $limit`, `offset: $offset`);
    if (sortCondition) args.push(sortCondition);
    const argsString = args.join(", ");

    // Construct the final query string.
    let query = `query calcForumPosts(
      $limit: IntScalar,
      $offset: IntScalar${
        this.needsUserId() ? ", $id: PriestessContactID" : ""
      }${
      this.searchTerm && this.searchTerm.trim() !== ""
        ? ", $first_name: TextScalar"
        : ""
    }
    ) {
      calcForumPosts(
        ${argsString}
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
        ForumCommentsTotalCount: countDistinct(args: [{ field: ["ForumComments", "id"] }])
        Member_Post_Upvotes_DataTotal_Count: countDistinct(args: [{ field: ["Member_Post_Upvotes_Data", "id"] }])
        ForumCommentsIDCalc: calc(args: [
          { countDistinct: [{ field: ["ForumComments", "id"] }] },
          { countDistinct: [{ field: ["Member_Post_Upvotes_Data", "id"] }], operator: "+" }
        ])
        File_Tpe: field(arg: ["file_tpe"])
        File_Content: field(arg: ["file_content"])
        Disable_New_Comments: field(arg: ["disable_new_comments"])
        Author_Forum_Image: field(arg: ["Author", "forum_image"])
      }
    }`;

    // Set up variables.
    let variables = {
      limit: this.postsLimit,
      offset: this.postsOffset,
    };

    if (this.needsUserId()) {
      variables.id = this.userId;
    }
    if (this.searchTerm && this.searchTerm.trim() !== "") {
      // Use the search term for all three variables.
      variables.first_name = this.searchTerm;
    }
    return { query, variables };
  }

  buildFilterCondition() {
    switch (this.currentFilter) {
      case "saved":
        return `{ Contacts: [{ where: { id: $id } }] }`;
      case "featured":
        return `{ featured_post: true }`;
      case "my":
        return `{ Author: [{ where: { id: $id } }] }`;
      case "Image":
        return `{ file_tpe: "Image" }`;
      case "Audio":
        return `{ file_tpe: "Audio" }`;
      case "Video":
        return `{ file_tpe: "Video" }`;
      case "Text":
        return `{ file_tpe: null }`;
      case "All":
      default:
        return "";
    }
  }

  buildSortCondition() {
    switch (this.currentSort) {
      case "latest":
        return 'orderBy: [{ path: ["created_at"], type: desc }]';
      case "oldest":
        return 'orderBy: [{ path: ["created_at"], type: asc }]';
      case "popular":
        return 'orderBy: [{ path: ["ForumCommentsIDCalc"], type: desc }]';
      default:
        return 'orderBy: [{ path: ["created_at"], type: desc }]';
    }
  }

  needsUserId() {
    return this.currentFilter === "my" || this.currentFilter === "saved";
  }

  handleFilterChange(filterType) {
    this.currentFilter = filterType;
    this.refreshPosts().then(() => {
      if (filterType === "saved") {
        this.updateBookmarkIcons();
      }
    });
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

  async fetchSavedPosts() {
    try {
      const query = `
              query {
                  calcOContactSavedPosts(
                      query: [{ where: { contact_id: "${this.userId}" } }]
                      orderBy: [{ path: ["created_at"], type: desc }]
                  ) {
                      ID: field(arg: ["id"])
                      Saved_Post_ID: field(arg: ["saved_post_id"])
                  }
              }
          `;

      const data = await ApiService.query(query);

      if (!data || !data.calcOContactSavedPosts) {
        return;
      }

      // ✅ Only update savedPostIds if data exists
      this.savedPostIds.clear();
      data.calcOContactSavedPosts.forEach(({ ID, Saved_Post_ID }) => {
        this.savedPostIds.set(String(Saved_Post_ID), ID); // Convert to string
      });
    } catch (error) {}
  }

  async fetchAllBookmarkIdsForPost(postId) {
    const query = `
        query {
          calcOContactSavedPosts(query: [{
            where: {
              contact_id: "${this.userId}",
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

  async toggleBookmark(postId) {
    const buttons = document.querySelectorAll(
      `.bookmark-button[data-post-id="${postId}"]`
    );
    const postElement = document.querySelector(`[data-post-id="${postId}"]`);
    const existingBookmarkIds = await this.fetchAllBookmarkIdsForPost(postId);
    const isBookmarked = existingBookmarkIds.length > 0;
    try {
      buttons.forEach((button) => {
        button.disabled = true;
        button.style.opacity = "0.5";
      });
      if (isBookmarked) {
        await this.deleteMultipleBookmarks(existingBookmarkIds);
        this.savedPostIds.delete(postId);
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
        this.savedPostIds.set(postId, newBookmarkId);
      }
      this.updateBookmarkIcons();
      UIManager.showSuccess(
        `Post ${isBookmarked ? "removed from" : "added to"} bookmarks`
      );
    } catch (error) {
      console.error("Error in toggleBookmark:", error); // Log the error for debugging
      UIManager.showError(
        `Failed to ${isBookmarked ? "remove" : "save"} bookmark`
      );
    } finally {
      buttons.forEach((button) => {
        button.disabled = false;
        button.style.opacity = "1";
      });
    }
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
        contact_id: this.userId,
        saved_post_id: postId,
      },
    };

    const response = await ApiService.query(query, variables);
    return response.createOContactSavedPost.id;
  }

  async deleteMultipleBookmarks(bookmarkIds) {
    try {
      for (const id of bookmarkIds) {
        await this.deleteBookmark(id);
      }
    } catch (error) {
      console.error("Error in deleteMultipleBookmarks:", error); // Log the error for debugging
      throw error; // Re-throw the error to be caught by the outer try-catch block
    }
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
    const response = await ApiService.query(query, variables);
    if (!response || !response.deleteOContactSavedPost) {
      throw new Error("Failed to delete bookmark");
    }
  }

  updateBookmarkIcons() {
    document.querySelectorAll(".bookmark-button").forEach((button) => {
      const postId = button.dataset.postId;
      const isBookmarked = this.savedPostIds.has(postId);
      button.innerHTML = this.getBookmarkSVG(isBookmarked);
    });
  }

  getBookmarkSVG(isBookmarked) {
    return `
          <svg class = "${
            isBookmarked ? "isBookmarked" : "notBookmarked"
          }" width="24" height="24" viewBox="0 0 24 24" 
               fill="" 
               stroke="">
              <path d="M17.8003 2H6.60003C6.17568 2 5.7687 2.16857 5.46864 2.46864C5.16857 2.7687 5 3.17568 5 3.60003V21.2004C5.00007 21.3432 5.03835 21.4833 5.11086 21.6063C5.18337 21.7293 5.28748 21.8306 5.41237 21.8998C5.53726 21.969 5.67839 22.0035 5.82111 21.9997C5.96384 21.996 6.10295 21.9541 6.22402 21.8784L12.2001 18.1433L18.1773 21.8784C18.2983 21.9538 18.4373 21.9955 18.5799 21.9991C18.7225 22.0027 18.8634 21.9682 18.9882 21.899C19.1129 21.8299 19.2169 21.7287 19.2893 21.6058C19.3618 21.483 19.4001 21.343 19.4003 21.2004V3.60003C19.4003 3.17568 19.2317 2.7687 18.9316 2.46864C18.6316 2.16857 18.2246 2 17.8003 2Z"/>
          </svg>
      `;
  }

  async fetchVotes() {
    try {
      const query = `
              query {
                  calcMemberPostUpvotesPostUpvotesMany(
                      query: [{ where: { member_post_upvote_id: "${this.userId}" } }]
                  ) {
                      ID: field(arg: ["id"])
                      Post_Upvote_ID: field(arg: ["post_upvote_id"])
                  }
              }
          `;
      const data = await ApiService.query(query);
      const votes = data?.calcMemberPostUpvotesPostUpvotesMany || [];
      this.votedPostIds.clear();
      votes.forEach((vote) => {
        const postId = String(vote.Post_Upvote_ID);
        if (!this.votedPostIds.has(postId)) {
          this.votedPostIds.set(postId, new Set());
        }
        this.votedPostIds.get(postId).add(vote.ID);
      });
    } catch (error) {}
  }

  async fetchPostVoteCount(postId) {
    const query = `
        query {
            calcForumPosts(query: [{ where: { id: "${postId}" } }]) {
            Member_Post_Upvotes_DataTotal_Count: countDistinct(args: [{ field: ["Member_Post_Upvotes_Data", "id"] }])
          }
        }
    `;

    const response = await ApiService.query(query);
    return response.calcForumPosts[0].Member_Post_Upvotes_DataTotal_Count;
  }

  async toggleVote(postId) {
    const buttons = document.querySelectorAll(
      `.vote-button[data-post-id="${postId}"]`
    );
    const isVoted = this.votedPostIds.has(postId);

    try {
      // Disable buttons and set opacity
      buttons.forEach((button) => {
        button.disabled = true;
        button.style.opacity = "0.5"; // Add this line
      });

      if (isVoted) {
        await this.deleteVotes(postId);
        this.votedPostIds.delete(postId);
      } else {
        const voteId = await this.createVote(postId);
        if (!this.votedPostIds.has(postId)) {
          this.votedPostIds.set(postId, new Set());
        }
        this.votedPostIds.get(postId).add(voteId);
      }

      const updatedVoteCount = await this.fetchPostVoteCount(postId);

      this.updateVoteUI(postId, updatedVoteCount);
      UIManager.showSuccess(`Post ${isVoted ? "unliked" : "liked"}`);
    } catch (error) {
      UIManager.showError(`Failed to ${isVoted ? "unlike" : "like"}`);
    } finally {
      // Re-enable buttons and reset opacity
      buttons.forEach((button) => {
        button.disabled = false;
        button.style.opacity = "1"; // Add this line
      });
    }
  }

  async createVote(postId) {
    const query = `
        mutation createVote($payload: MemberPostUpvotesPostUpvotesCreateInput) {
          createMemberPostUpvotesPostUpvotes(payload: $payload) {
            id
            post_upvote_id
            member_post_upvote_id
          }
        }
      `;
    const variables = {
      payload: {
        member_post_upvote_id: this.userId,
        post_upvote_id: postId,
      },
    };

    const response = await ApiService.query(query, variables);
    return response.createMemberPostUpvotesPostUpvotes.id;
  }

  async deleteVotes(postId) {
    const voteIds = this.votedPostIds.get(postId) || new Set();

    await Promise.all(
      [...voteIds].map((id) =>
        ApiService.query(
          `
                  mutation deleteVote($id: PriestessMemberPostUpvotesPostUpvotesID) {
                      deleteMemberPostUpvotesPostUpvotes(query: [{ where: { id: $id } }]) {
                          id
                      }
                  }
              `,
          { id }
        )
      )
    );

    this.votedPostIds.delete(postId);
  }

  updateVoteUI(postId, updatedVoteCount) {
    document
      .querySelectorAll(`[data-post-id="${postId}"] .vote-button`)
      .forEach((button) => {
        const isVoted = this.votedPostIds.has(postId);
        button.innerHTML = this.getVoteSVG(isVoted);
        button.nextElementSibling.textContent = updatedVoteCount;
      });
  }

  getVoteSVG(isVoted) {
    return `
        <svg class = "${
          isVoted ? "voted" : "unVoted"
        }" width="24" height="24" viewBox="0 0 24 24" 
            fill="" 
            stroke="">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
        </svg>
    `;
  }

  async refreshPosts() {
    document.querySelector(CONFIG.selectors.postsContainer).innerHTML = "";
    this.postsOffset = 0;
    this.hasMorePosts = true;
    await this.fetchAndRenderPosts(true);
  }

  async loadMorePosts() {
    if (this.isLoading) return;
    this.isLoading = true;
    await this.fetchAndRenderPosts(false);
    this.isLoading = false;
  }

  getSkeletonLoader(count = 1) {
    let skeletons = "";
    for (let i = 0; i < count; i++) {
      skeletons += `
        <div class="skeleton-loader flex space-x-4 p-4 border border-gray-300 rounded-lg animate-pulse mb-4">
          <div class="w-16 h-16 bg-gray-300 rounded-full"></div>
          <div class="flex-1 space-y-4 py-1">
            <div class="h-4 bg-gray-300 rounded w-3/4"></div>
            <div class="h-4 bg-gray-300 rounded w-1/2"></div>
            <div class="h-6 bg-gray-300 rounded w-full"></div>
          </div>
        </div>
      `;
    }
    return skeletons;
  }

  //-----------------------------------------------------------------------
  //-----------------------------------------------------------------------
  //-----------------------------------------------------------------------
  //@@Full Post Method End

  //-----------------------------------------------------------------------
  //-----------------------------------------------------------------------
  //-----------------------------------------------------------------------
  //-----------------------------------------------------------------------
  //-----------------------------------------------------------------------
  //-----------------------------------------------------------------------
  //-----------------------------------------------------------------------
  //-----------------------------------------------------------------------

  //@@Full Comment Method Start
  //-----------------------------------------------------------------------
  //-----------------------------------------------------------------------
  //-----------------------------------------------------------------------
  // --- FETCH ALL COMMENTS FOR A POST ---
  async fetchComments(postId) {
    try {
      const query = `
      query {
        calcForumComments(
          orderBy: [{ path: ["created_at"], type: desc }]
          query: [{
            where: {
              Forum_Post: [{ where: { id: "${postId}" } }],
              Parent_Comment: [{ where: { id: null } }]
            }
          }]
        ) {
          ID: field(arg: ["id"])
          Author_First_Name: field(arg: ["Author", "first_name"])
          Author_Last_Name: field(arg: ["Author", "last_name"])
          Author_Profile_Image: field(arg: ["Author", "profile_image"])
          Date_Added: field(arg: ["created_at"])
          Comment: field(arg: ["comment"])
          Member_Comment_Upvotes_DataTotal_Count: countDistinct(args: [{ field: ["Member_Comment_Upvotes_Data", "id"] }])
          File_Type: field(arg: ["file_type"])
          File_Content: field(arg: ["file_content"])
          Author_Forum_Image: field(arg: ["Author", "forum_image"])
          Author_ID: field(arg: ["author_id"])
        }
      }
    `;
      const data = await ApiService.query(query);
      const comments = data?.calcForumComments || [];
      return comments.map((comment) => ({
        id: comment.ID,
        author_id: comment.Author_ID,
        content: comment.Comment,
        date: Formatter.formatTimestamp(comment.Date_Added),
        CommentVotesCount: comment.Member_Comment_Upvotes_DataTotal_Count,
        forLoggedInUserImage: this.defaultLoggedInAuthorImage,
        // NEW: Use the unified file fields
        file_type: comment.File_Type, // from your GraphQL response
        file_content:
          typeof comment.File_Content === "string"
            ? JSON.parse(comment.File_Content)
            : comment.File_Content,
        author: Formatter.formatAuthor({
          firstName: comment.Author_First_Name,
          lastName: comment.Author_Last_Name,
          profileImage:
            comment.Author_Forum_Image && comment.Author_Forum_Image.trim()
              ? comment.Author_Forum_Image
              : this.defaultAuthorImage,
        }),
        // If you are storing vote records in a Map (see below), check whether votes exist:
        isCommentVoted: this.votedCommentIds.get(comment.ID)?.size > 0,
      }));
    } catch (error) {
      console.error("Error fetching comments:", error);
      return [];
    }
  }

  // --- CREATE A COMMENT WITH OPTIMISTIC RENDERING ---
  async createComment(postId, content, mentions, fileType, uploadedFile) {
    // Create a temporary comment ID for optimistic rendering.
    const tempCommentId = `temp-${Date.now()}`;

    // If a file is provided, create a local preview URL.
    let previewFileContent = null;
    if (uploadedFile) {
      // This object structure should match what your template expects.
      previewFileContent = {
        link: URL.createObjectURL(uploadedFile),
        type: uploadedFile.type,
      };
    }

    // Build a temporary comment object including the preview (if available).
    const tempComment = {
      id: tempCommentId,
      content: content,
      CommentVotesCount: "0",
      date: "Just now",
      file_content: previewFileContent, // will be null if no file selected
      file_type: fileType,
      author: {
        name: this.fullName,
        profileImage: this.defaultLoggedInAuthorImage,
      },
    };

    // Render the temporary comment using your comment template.
    const template = $.templates("#comment-template");
    const commentsContainer = document.getElementById(
      "modal-comments-container"
    );
    commentsContainer.insertAdjacentHTML(
      "afterbegin",
      template.render(tempComment)
    );

    // Find the temporary comment element and disable it.
    let commentElement = commentsContainer.querySelector(
      `[data-comment-id="${tempCommentId}"]`
    );
    if (commentElement) {
      commentElement.classList.add("state-disabled");
    }

    let newComment; // to hold the mutation result
    let fileData = null;
    const fileFields = [];
    if (uploadedFile) {
      fileFields.push({
        fieldName: "file_content",
        file: uploadedFile, // Use the correct variable here.
      });
    }

    try {
      // If a file was selected, process it (for example, to upload to S3).
      if (fileFields.length > 0) {
        const toSubmitFields = {};
        // processFileFields is assumed to handle the upload and populate "toSubmitFields".
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
        // Ensure fileData has proper metadata.
        fileData.name = fileData.name || uploadedFile.name;
        fileData.size = fileData.size || uploadedFile.size;
        fileData.type = fileData.type || uploadedFile.type;
      }

      // Build and execute the mutation to create the comment.
      const mutationQuery = `
        mutation createForumComment($payload: ForumCommentCreateInput!) {
          createForumComment(payload: $payload) {
            id
            author_id
            forum_post_id
            comment
            file_type
            file_content
            Comment_or_Reply_Mentions { id }
          }
        }
      `;
      const variables = {
        payload: {
          author_id: this.userId,
          comment: content,
          forum_post_id: postId,
          Comment_or_Reply_Mentions: mentions.map((id) => ({ id: Number(id) })),
          file_type: fileType,
          // Pass the processed fileData (if any); otherwise, null.
          file_content: fileData,
        },
      };

      const mutationResponse = await ApiService.query(mutationQuery, variables);
      newComment = mutationResponse.createForumComment;
    } catch (error) {
      UIManager.showError("Failed to post comment");
      if (commentElement) {
        commentElement.remove();
      }
      return;
    }

    // ----- STEP 2: Update the Optimistic Comment with Real Data -----
    // ----- STEP 2: Update the Optimistic Comment with Real Data -----
    try {
      // Delay briefly to allow backend indexing.
      await new Promise((resolve) => setTimeout(resolve, 500));
      const fetchQuery = `
    query calcForumComments($id: PriestessForumCommentID) {
      calcForumComments(query: [{ where: { id: $id } }]) {
        ID: field(arg: ["id"])
        Author_First_Name: field(arg: ["Author", "first_name"])
        Author_Last_Name: field(arg: ["Author", "last_name"])
        Author_Profile_Image: field(arg: ["Author", "profile_image"])
        Date_Added: field(arg: ["created_at"])
        Comment: field(arg: ["comment"])
        Member_Comment_Upvotes_DataTotal_Count: countDistinct(args: [{ field: ["Member_Comment_Upvotes_Data", "id"] }])
        File_Type: field(arg: ["file_type"])
        File_Content: field(arg: ["file_content"])
      }
    }
  `;

      const fetchResponse = await ApiService.query(fetchQuery, {
        id: newComment.id,
      });
      const actualComment = fetchResponse.calcForumComments[0];

      // Check that the file_content returned from the API is a valid object with a link.
      const validFileContent =
        actualComment.File_Content &&
        typeof actualComment.File_Content === "object" &&
        typeof actualComment.File_Content.link === "string" &&
        actualComment.File_Content.link.trim().length > 0;

      // Use the API value if valid; otherwise, fall back to the optimistic preview.
      const finalFileContent = validFileContent
        ? actualComment.File_Content
        : previewFileContent;

      // Prepare the updated comment object.
      const updatedComment = {
        id: actualComment.ID,
        content:
          actualComment.Comment && actualComment.Comment.trim().length > 0
            ? actualComment.Comment
            : content, // fall back to the original content
        author: {
          name: `${actualComment.Author_First_Name} ${actualComment.Author_Last_Name}`,
          profileImage: actualComment.Author_Profile_Image,
        },
        CommentVotesCount: actualComment.Member_Comment_Upvotes_DataTotal_Count,
        file_content: finalFileContent, // use our valid file content (or preview)
        file_type: actualComment.File_Type,
        date: Formatter.formatTimestamp(actualComment.Date_Added),
      };

      // Re-render the comment with complete data.
      commentElement.outerHTML = template.render(updatedComment);
      // Update any data attributes (e.g., for voting) with the real comment ID.
      const updatedEl = document.querySelector(
        `[data-comment-id="${updatedComment.id}"]`
      );
      if (updatedEl) {
        const voteButton = updatedEl.querySelector(".vote-button");
        if (voteButton) {
          voteButton.dataset.commentId = newComment.id;
        }
      }
    } catch (fetchError) {
      // If fetching updated data fails, update the comment element minimally.
      commentElement.dataset.commentId = newComment.id;
      commentElement.classList.remove("state-disabled");
      console.error(
        "Failed to fetch updated comment data, but the comment was created:",
        fetchError
      );
    }
  }

  // --- FETCH THE VOTE COUNT FOR A COMMENT ---
  async fetchCommentVoteCount(commentId) {
    const query = `
    query {
      calcForumComments(query: [{ where: { id: "${commentId}" } }]) {
        Member_Comment_Upvotes_DataTotal_Count: countDistinct(args: [{ field: ["Member_Comment_Upvotes_Data", "id"] }])
      }
    }
  `;
    const response = await ApiService.query(query);
    return response.calcForumComments[0].Member_Comment_Upvotes_DataTotal_Count;
  }

  async fetchVoteForComment(commentId) {
    try {
      const query = `
      query calcMemberCommentUpvotesForumCommentUpvotesMany(
        $member_comment_upvote_id: PriestessContactID
        $forum_comment_upvote_id: PriestessForumCommentID
      ) {
        calcMemberCommentUpvotesForumCommentUpvotesMany(
          query: [
            { where: { member_comment_upvote_id: $member_comment_upvote_id } },
            { andWhere: { forum_comment_upvote_id: $forum_comment_upvote_id } }
          ]
        ) {
          ID: field(arg: ["id"])
        }
      }
    `;
      const variables = {
        member_comment_upvote_id: this.userId,
        forum_comment_upvote_id: commentId,
      };
      const data = await ApiService.query(query, variables);
      const votes = data?.calcMemberCommentUpvotesForumCommentUpvotesMany || [];
      return votes;
    } catch (error) {
      console.error("Error fetching vote for comment:", error);
      return [];
    }
  }

  // --- TOGGLE VOTE ON A COMMENT (Vote/Unvote) ---
  async toggleCommentVote(commentId) {
    // Get all vote buttons for the comment.
    const buttons = document.querySelectorAll(
      `.vote-button[data-comment-id="${commentId}"]`
    );

    // Check if the user has already voted.
    const voteRecords = await this.fetchVoteForComment(commentId);
    const isCommentVoted = voteRecords.length > 0;

    try {
      // Disable vote buttons during processing.
      buttons.forEach((button) => {
        button.disabled = true;
        button.style.opacity = "0.5";
      });

      if (isCommentVoted) {
        // Remove the vote.
        await this.deleteCommentVote(commentId);
        this.votedCommentIds.delete(commentId);
      } else {
        // Create a new vote.
        const voteId = await this.createCommentVote(commentId);
        if (!this.votedCommentIds.has(commentId)) {
          this.votedCommentIds.set(commentId, new Set());
        }
        this.votedCommentIds.get(commentId).add(voteId);
      }

      // Update the vote button icon and vote count.
      await this.updateCommentVoteUI(commentId);
      UIManager.showSuccess(`Comment ${isCommentVoted ? "unliked" : "liked"}`);
    } catch (error) {
      UIManager.showError(
        `Failed to ${isCommentVoted ? "unlike" : "like"} comment`
      );
      console.error("Error in toggleCommentVote:", error);
    } finally {
      // Re-enable buttons.
      buttons.forEach((button) => {
        button.disabled = false;
        button.style.opacity = "1";
      });
    }
  }

  // --- CREATE A NEW COMMENT VOTE ---
  async createCommentVote(commentId) {
    const query = `
    mutation createMemberCommentUpvotesForumCommentUpvotes(
      $payload: MemberCommentUpvotesForumCommentUpvotesCreateInput!
    ) {
      createMemberCommentUpvotesForumCommentUpvotes(payload: $payload) {
        id
        member_comment_upvote_id
        forum_comment_upvote_id
      }
    }
  `;
    const variables = {
      payload: {
        member_comment_upvote_id: this.userId,
        forum_comment_upvote_id: commentId,
      },
    };
    const response = await ApiService.query(query, variables);
    return response.createMemberCommentUpvotesForumCommentUpvotes.id;
  }

  // --- DELETE COMMENT VOTE(S) ---
  async deleteCommentVote(commentId) {
    let voteIds = this.votedCommentIds.get(commentId);
    if (!voteIds || voteIds.size === 0) {
      // If no local record exists, fetch the votes.
      const voteRecords = await this.fetchVoteForComment(commentId);
      voteRecords.forEach((vote) => {
        if (!this.votedCommentIds.has(commentId)) {
          this.votedCommentIds.set(commentId, new Set());
        }
        this.votedCommentIds.get(commentId).add(vote.ID);
      });
      voteIds = this.votedCommentIds.get(commentId);
    }

    if (!voteIds) return;

    await Promise.all(
      [...voteIds].map((id) =>
        ApiService.query(
          `
          mutation deleteMemberCommentUpvotesForumCommentUpvotes(
            $id: PriestessMemberCommentUpvotesForumCommentUpvotesID
          ) {
            deleteMemberCommentUpvotesForumCommentUpvotes(
              query: [{ where: { id: $id } }]
            ) {
              id
            }
          }
        `,
          { id }
        )
      )
    );

    // Remove the local record.
    this.votedCommentIds.delete(commentId);
  }

  // --- UPDATE COMMENT VOTE UI (Icon and Count) ---
  async updateCommentVoteUI(commentId) {
    const commentElement = document.querySelector(
      `[data-comment-id="${commentId}"]`
    );
    if (!commentElement) return;

    // Determine if the comment is voted (using our local map).
    const isVoted = this.votedCommentIds.get(commentId)?.size > 0;
    const voteButton = commentElement.querySelector(".vote-button");
    if (voteButton) {
      voteButton.innerHTML = this.getCommentVoteSVG(isVoted);
    }

    // Also update the vote count by fetching the latest count.
    try {
      const count = await this.fetchCommentVoteCount(commentId);
      const voteCountElement = commentElement.querySelector(".vote-count");
      if (voteCountElement) {
        voteCountElement.textContent = count;
      }
    } catch (error) {
      console.error("Error fetching vote count:", error);
    }
  }

  // --- GET THE SVG FOR THE VOTE BUTTON ---
  getCommentVoteSVG(isVoted) {
    return `
    <svg width="24" height="24" viewBox="0 0 24 24" 
         fill="${isVoted ? "#044047" : "none"}" 
         stroke="#044047">
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 
               2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09
               C13.09 3.81 14.76 3 16.5 3
               19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54
               L12 21.35z"/>
    </svg>
  `;
  }
  //-----------------------------------------------------------------------
  //-----------------------------------------------------------------------
  //-----------------------------------------------------------------------
  //@@Full Comment Method End

  //-----------------------------------------------------------------------
  //-----------------------------------------------------------------------
  //-----------------------------------------------------------------------
  //-----------------------------------------------------------------------
  //-----------------------------------------------------------------------
  //-----------------------------------------------------------------------
  //-----------------------------------------------------------------------
  //-----------------------------------------------------------------------

  //@@Full Reply Method Start
  //-----------------------------------------------------------------------
  //-----------------------------------------------------------------------
  //-----------------------------------------------------------------------
  async fetchReplies(commentId) {
    try {
      const query = `
        query {
          calcForumComments(
          orderBy: [{ path: ["created_at"], type: desc }]
          query: [{
            where: { Parent_Comment: [{ where: { id: "${commentId}" } }] }
          }]) {
            ID: field(arg: ["id"])
            Author_First_Name: field(arg: ["Author", "first_name"])
            Author_Last_Name: field(arg: ["Author", "last_name"])
            Author_Profile_Image: field(arg: ["Author", "profile_image"])
            Date_Added: field(arg: ["created_at"])
            Comment: field(arg: ["comment"]) 
            Member_Comment_Upvotes_DataTotal_Count: countDistinct(args: [{ field: ["Member_Comment_Upvotes_Data", "id"] }]) 
            File_Type: field(arg: ["file_type"])
            File_Content: field(arg: ["file_content"])
            Author_Forum_Image: field(arg: ["Author", "forum_image"])
            Author_ID: field(arg: ["author_id"])
          }
        }
      `;
      const data = await ApiService.query(query);

      return (
        data?.calcForumComments?.map((reply) => ({
          id: reply.ID,
          author_id: reply.Author_ID,
          content: reply.Comment,
          date: Formatter.formatTimestamp(reply.Date_Added),
          ReplyVoteCount: reply.Member_Comment_Upvotes_DataTotal_Count,
          file_type: reply.File_Type,
          file_content:
            typeof reply.File_Content === "string"
              ? JSON.parse(reply.File_Content)
              : reply.File_Content,
          author: Formatter.formatAuthor({
            firstName: reply.Author_First_Name,
            lastName: reply.Author_Last_Name,
            profileImage:
              reply.Author_Forum_Image && reply.Author_Forum_Image.trim()
                ? reply.Author_Forum_Image
                : this.defaultAuthorImage,
          }),
        })) || []
      );
    } catch (error) {
      return [];
    }
  }

  async createReply(commentId, content, mentions, fileType, uploadedFile) {
    // Generate a temporary reply ID for optimistic rendering.
    const tempReplyId = `temp-${Date.now()}`;

    // If a file is provided, create a local preview URL.
    let previewFileContent = null;
    if (uploadedFile) {
      previewFileContent = {
        link: URL.createObjectURL(uploadedFile),
        type: uploadedFile.type,
      };
    }

    // Build the optimistic reply object.
    const tempReply = {
      id: tempReplyId,
      content: content,
      date: "Just now",
      file_type: fileType,
      file_content: previewFileContent, // may be null if no file attached
      author: {
        name: this.fullName,
        profileImage: this.defaultLoggedInAuthorImage,
      },
    };

    // Locate the replies container inside the comment element.
    const repliesContainer = document.querySelector(
      `[data-comment-id="${commentId}"] .replies-container`
    );
    if (!repliesContainer) {
      throw new Error("Replies container not found for comment: " + commentId);
    }

    // Render the temporary reply using the reply template.
    const template = $.templates("#reply-template");
    repliesContainer.insertAdjacentHTML(
      "afterbegin",
      template.render(tempReply)
    );

    // Find the temporary reply element and disable it.
    const replyElement =
      repliesContainer.querySelector(`[data-reply-id="${tempReplyId}"]`) ||
      repliesContainer.firstElementChild;
    replyElement.classList.add("state-disabled");

    // Prepare to process the file if one was uploaded.
    let fileData = null;
    const fileFields = [];
    if (uploadedFile) {
      fileFields.push({
        fieldName: "file_content",
        file: uploadedFile,
      });
    }
    if (fileFields.length > 0) {
      const toSubmitFields = {};
      // processFileFields is assumed to handle the file upload and populate toSubmitFields.
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
      // Ensure fileData has the expected metadata.
      fileData.name = fileData.name || uploadedFile.name;
      fileData.size = fileData.size || uploadedFile.size;
      fileData.type = fileData.type || uploadedFile.type;
    }

    // Build the mutation query for creating the reply.
    const mutationQuery = `
      mutation createForumComment($payload: ForumCommentCreateInput!) {
        createForumComment(payload: $payload) {
          id
          comment
          parent_comment_id
          file_type
          file_content
        }
      }
    `;
    const variables = {
      payload: {
        author_id: this.userId,
        comment: content,
        parent_comment_id: commentId,
        Comment_or_Reply_Mentions: mentions.map((id) => ({ id: Number(id) })),
        file_type: fileType,
        file_content: fileData, // will be null if no file was attached
      },
    };

    try {
      // Execute the GraphQL mutation.
      const response = await ApiService.query(mutationQuery, variables);
      const newReply = response.createForumComment;

      // Update the temporary reply element with the new reply's real ID.
      replyElement.dataset.replyId = newReply.id;
      // Update any vote or delete button data attributes.
      const voteButton = replyElement.querySelector(".vote-button");
      const deleteButton = replyElement.querySelector(".delete-reply-btn");
      if (voteButton) voteButton.dataset.replyId = newReply.id;
      if (deleteButton) deleteButton.dataset.replyId = newReply.id;
      replyElement.classList.remove("state-disabled");

      // (Optional) You might re-fetch full reply details here to update the optimistic reply.
    } catch (error) {
      UIManager.showError("Failed to post reply");
      // Remove the optimistic reply element if an error occurs.
      replyElement.remove();
    }
  }

  async deleteReply(replyId) {
    const replyElement = document.querySelector(`[data-reply-id="${replyId}"]`);
    if (!replyElement) return;

    replyElement.classList.add("state-disabled");

    try {
      // Show visual effects
      replyElement.classList.add("opacity-50", "pointer-events-none");

      const confirmed = await UIManager.showDeleteConfirmation();

      if (!confirmed) {
        // Reset styles if not confirmed
        replyElement.classList.remove("opacity-50", "pointer-events-none");
        return;
      }

      // Show processing state
      replyElement.classList.add("animate-pulse");

      const query = `
        mutation deleteForumComment($id: PriestessForumCommentID) {
            deleteForumComment(query: [{ where: { id: $id } }]) {
            id
            }
        }
        `;
      const variables = { id: replyId };
      const response = await ApiService.query(query, variables);

      if (response?.deleteForumComment?.id) {
        // Add removal animation
        replyElement.classList.add(
          "opacity-0",
          "transition-opacity",
          "duration-300"
        );
        setTimeout(() => replyElement.remove(), 300);
        UIManager.showSuccess("Reply deleted successfully");
      }
    } catch (error) {
      UIManager.showError("Failed to delete reply. Please try again.");
    } finally {
      // Ensure styles are reset even if error occurs after confirmation
      replyElement?.classList.remove(
        "animate-pulse",
        "opacity-50",
        "pointer-events-none"
      );
    }
  }

  async fetchVoteForReply(replyId) {
    try {
      const query = `
        query calcMemberCommentUpvotesForumCommentUpvotesMany(
          $member_comment_upvote_id: PriestessContactID
          $forum_comment_upvote_id: PriestessForumCommentID
        ) {
          calcMemberCommentUpvotesForumCommentUpvotesMany(
            query: [
              {
                where: {
                  member_comment_upvote_id: $member_comment_upvote_id
                }
              },
              {
                andWhere: {
                  forum_comment_upvote_id: $forum_comment_upvote_id
                }
              }
            ]
          ) {
            ID: field(arg: ["id"])
          }
        }
      `;
      const variables = {
        member_comment_upvote_id: this.userId,
        forum_comment_upvote_id: replyId,
      };
      const data = await ApiService.query(query, variables);
      const votes = data?.calcMemberCommentUpvotesForumCommentUpvotesMany || [];
      return votes;
    } catch (error) {
      return [];
    }
  }

  async toggleReplyVote(replyId) {
    const buttons = document.querySelectorAll(
      `.vote-button[data-reply-id="${replyId}"]`
    );
    const voteRecords = await this.fetchVoteForReply(replyId);
    const isReplyVoted = voteRecords.length > 0;

    let successMessage = "";

    try {
      buttons.forEach((button) => {
        button.disabled = true;
        button.style.opacity = "0.5";
      });

      if (isReplyVoted) {
        await this.deleteReplyVote(replyId);
        this.votedReplyIds.delete(replyId);
        successMessage = "Comment unliked";
      } else {
        const voteId = await this.createReplyVote(replyId);
        if (!this.votedReplyIds.has(replyId)) {
          this.votedReplyIds.set(replyId, new Set());
        }
        this.votedReplyIds.get(replyId).add(voteId);
        successMessage = "Comment liked";
      }
      // Update both the vote icon and the vote count.
      await this.updateReplyVoteUI(replyId);
    } catch (error) {
      UIManager.showError(
        `Failed to ${isReplyVoted ? "unlike" : "like"} comment`
      );
      return;
    } finally {
      buttons.forEach((button) => {
        button.disabled = false;
        button.style.opacity = "1";
      });
    }
    UIManager.showSuccess(successMessage);
  }

  async createReplyVote(replyId) {
    const query = `
      mutation createMemberCommentUpvotesForumCommentUpvotes(
        $payload: MemberCommentUpvotesForumCommentUpvotesCreateInput!
      ) {
        createMemberCommentUpvotesForumCommentUpvotes(payload: $payload) {
          id
          member_comment_upvote_id
          forum_comment_upvote_id
        }
      }
    `;
    const variables = {
      payload: {
        member_comment_upvote_id: this.userId,
        forum_comment_upvote_id: replyId,
      },
    };
    const response = await ApiService.query(query, variables);
    return response.createMemberCommentUpvotesForumCommentUpvotes.id;
  }

  async deleteReplyVote(replyId) {
    let voteIds = this.votedReplyIds.get(replyId);
    if (!voteIds || voteIds.size === 0) {
      // If no local record, try to fetch them first.
      const voteRecords = await this.fetchVoteForReply(replyId);
      voteRecords.forEach((vote) => {
        if (!this.votedReplyIds.has(replyId)) {
          this.votedReplyIds.set(replyId, new Set());
        }
        this.votedReplyIds.get(replyId).add(vote.ID);
      });
      voteIds = this.votedReplyIds.get(replyId);
    }

    if (!voteIds) return;

    await Promise.all(
      [...voteIds].map((id) =>
        ApiService.query(
          `
            mutation deleteMemberCommentUpvotesForumCommentUpvotes(
              $id: PriestessMemberCommentUpvotesForumCommentUpvotesID
            ) {
              deleteMemberCommentUpvotesForumCommentUpvotes(
                query: [{ where: { id: $id } }]
              ) {
                id
              }
            }
          `,
          { id }
        )
      )
    );
    this.votedReplyIds.delete(replyId);
  }

  async updateReplyVoteUI(replyId) {
    const replyElement = document.querySelector(`[data-reply-id="${replyId}"]`);
    if (!replyElement) return;

    // Use a proper variable ($id) instead of an undefined commentId.
    const query = `
      query calcForumComments($id: PriestessForumCommentID) {
        calcForumComments(query: [{ where: { id: $id } }]) {
          Member_Comment_Upvotes_DataTotal_Count: countDistinct(args: [{ field: ["Member_Comment_Upvotes_Data", "id"] }])
        }
      }
    `;

    try {
      const data = await ApiService.query(query, { id: replyId });
      const count = await this.fetchCommentVoteCount(replyId);
      const voteCountElement = replyElement.querySelector(".vote-count");
      if (voteCountElement) {
        voteCountElement.textContent = count;
      }
    } catch (error) {
      console.error("Failed to update vote count for reply", error);
      // Optionally: return here or handle the error gracefully.
    }

    // Update the vote icon based on the local state.
    const isVoted = this.votedReplyIds.has(replyId);
    const voteButton = replyElement.querySelector(".vote-button");
    if (voteButton) {
      voteButton.innerHTML = this.getReplyVoteSVG(isVoted);
    }
  }

  getReplyVoteSVG(isVoted) {
    return `
      <svg class = "${
        isVoted ? "voted" : "nonVoted"
      }" width="24" height="24" viewBox="0 0 24 24" 
           fill="" 
           stroke="#C29D68">
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 
                 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09
                 C13.09 3.81 14.76 3 16.5 3
                 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54
                 L12 21.35z"/>
      </svg>
    `;
  }
  //-----------------------------------------------------------------------
  //-----------------------------------------------------------------------
  //-----------------------------------------------------------------------
  //@@Full Reply Method End

  //-----------------------------------------------------------------------
  //-----------------------------------------------------------------------
  //-----------------------------------------------------------------------
  //-----------------------------------------------------------------------
  //-----------------------------------------------------------------------
  //-----------------------------------------------------------------------
  //-----------------------------------------------------------------------
  //-----------------------------------------------------------------------

  //Handle event listeners
  initEventListeners() {
    let isLoading = false;

    window.addEventListener("scroll", () => {
      const scrollPosition = window.scrollY + window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      if (scrollPosition >= documentHeight - 100 && !isLoading) {
        isLoading = true;
        setTimeout(() => {
          this.loadMorePosts();
          isLoading = false;
        }, 700);
      }
    });

    document.addEventListener("click", async (e) => {
      const voteButton = e.target.closest(".vote-button");

      if (voteButton) {
        const postId = voteButton.dataset.postId;
        const commentId = voteButton.dataset.commentId;
        const replyId = voteButton.dataset.replyId;

        if (postId) {
          this.toggleVote(postId);
        } else if (commentId) {
          this.toggleCommentVote(commentId);
        } else if (replyId) {
          this.toggleReplyVote(replyId);
        }
      }

      const filterButton = e.target.closest(".filter-button");

      if (filterButton) {
        const filterType = filterButton.dataset.filter;
        this.handleFilterChange(filterType);
      }

      const buttonForComment = e.target.closest(".load-comments-btn");

      if (buttonForComment) {
        const postId = buttonForComment.dataset.postId;
        const postElement = document.querySelector(`.postcard-${postId}`);

        if (postElement) {
          const authorId = postElement.dataset.authorId;
          const authorImage = postElement.dataset.authorImage;
          const authorName = postElement.dataset.authorName;
          const date = postElement.dataset.postDate;
          const title = postElement.dataset.title;
          const content = postElement.dataset.content;
          // NEW unified file fields:
          const fileTpe = postElement.dataset.fileTpe;
          const fileContentRaw = postElement.dataset.fileContent;
          const voteCountDiv = postElement.querySelector(".postVoteCount");
          const voteCount = voteCountDiv.textContent;
          const commentCount = postElement.dataset.commentCount;
          const voteButton = postElement.querySelector(".vote-button");
          const voteIcon = voteButton.querySelector("svg");
          let voted = false; // Default value
          console.log("Vote count is", voteCount);

          if (voteIcon?.classList.contains("voted-heart")) {
            voted = true;
          } else if (voteIcon?.classList.contains("unvoted-heart")) {
            voted = false;
          }

          console.log(voted);

          // Parse fileContent (if it exists)
          let fileContent = null;
          if (fileContentRaw) {
            try {
              fileContent = JSON.parse(fileContentRaw);
            } catch (err) {
              fileContent = fileContentRaw;
            }
          }

          const post = {
            id: postId,
            authorId,
            author: { name: authorName, profileImage: authorImage },
            date,
            title,
            content,
            file_tpe: fileTpe,
            file_content: fileContent,
            PostVotesCount: voteCount,
            PostCommentCount: commentCount,
            voted: voted,
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

      if (e.target.closest(".delete-reply-btn")) {
        const replyId = e.target.closest(".delete-reply-btn").dataset.replyId;
        this.deleteReply(replyId);
      }

      if (e.target.closest(".refresh-button")) {
        this.refreshPosts();
      }

      const searchInput = document.getElementById("searchPost");
      let debounceTimer;
      searchInput.addEventListener("input", (e) => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          this.searchTerm = e.target.value.trim();
          this.refreshPosts();
        }, 500);
      });
    });
  }
}
