class ForumManager {
  constructor() {
    this.userId = CONFIG.api.userId;
    this.firstName = CONFIG.api.firstName;
    this.lastName = CONFIG.api.lastName;
    this.fullName = CONFIG.api.fullName;
    this.defaultAuthorImage = CONFIG.api.defaultAuthorImage;
    this.postsOffset = 0;
    this.postsLimit = CONFIG.pagination.postsPerPage;
    this.hasMorePosts = true;
    this.currentFilter = "recent";
    this.currentSort = "latest";
    this.savedPostIds = new Map();
    this.votedPostIds = new Map();
    this.votedCommentIds = new Map();
    this.voteCommentCounts = new Map();
    this.votedReplyIds = new Map();
    this.voteReplyCounts = new Map();
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
      if (isInitialLoad) {
        postContainer.innerHTML = this.getSkeletonLoader(5);
      } else {
        postContainer.insertAdjacentHTML("beforeend", this.getSkeletonLoader());
      }
      const { query, variables } = this.buildQuery();
      const dataPromise = ApiService.query(query, variables);
      await new Promise((resolve) => setTimeout(resolve, 700));
      const data = await dataPromise;
      document
        .querySelectorAll(".skeleton-loader")
        .forEach((el) => el.remove());

      if (!data || !data.calcForumPosts || data.calcForumPosts.length === 0) {
        this.hasMorePosts = false;
        if (isInitialLoad) {
          postContainer.innerHTML = `
            <div class="flex flex-col gap-6 items-center justify-center">
              <div class="size-[200px]">
                <img src="./assets/emptyPost.svg" alt="Empty Post" class="size-full object-contain">
              </div>
              <div class="p2 text-white">No posts available.</div>
            </div>
          `;
        }
        return;
      }

      const posts = data.calcForumPosts.map((post) => {
        const postId = String(post.ID);
        return {
          id: postId,
          isBookmarked: this.savedPostIds.has(postId),
          isVoted: this.votedPostIds.has(postId),
          author_id: post.Author_ID,
          featured_post: post.Featured_Post,
          post_image: post.Post_Image,
          defaultAuthorImage: CONFIG.api.defaultAuthorImage,
          PostVotesCount: post.Member_Post_Upvotes_DataTotal_Count,
          PostCommentCount: post.ForumCommentsTotalCount,
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
    } catch (error) {
      document
        .querySelectorAll(".skeleton-loader")
        .forEach((el) => el.remove());
      document.querySelector(CONFIG.selectors.postsContainer).innerHTML = `
        <div class="text-center text-red-600 p-4">
          <p>⚠️ Failed to load posts. Please try again later.</p>
        </div>
      `;
    }
  }

  buildQuery() {
    const filterCondition = this.buildFilterCondition();
    const sortCondition = this.buildSortCondition();

    let args = [];
    if (filterCondition) args.push(filterCondition);
    args.push(`limit: $limit`, `offset: $offset`);
    if (sortCondition) args.push(sortCondition);

    const argsString = args.join(", ");

    let query = `query calcForumPosts($limit: IntScalar, $offset: IntScalar${
      this.needsUserId() ? ", $id: PriestessContactID" : ""
    }) {
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
            Post_Image: field(arg: ["post_image"])
            ForumCommentsTotalCount: countDistinct(args: [{ field: ["ForumComments", "id"] }])
            Member_Post_Upvotes_DataTotal_Count: countDistinct(args: [{ field: ["Member_Post_Upvotes_Data", "id"] }])
            ForumCommentsIDCalc: calc(args: [{countDistinct: [{ field: ["ForumComments", "id"] }]}{countDistinct: [{ field: ["Member_Post_Upvotes_Data", "id"] }]operator: "+"}])
          }
        }
      `;

    let variables = {
      limit: this.postsLimit,
      offset: this.postsOffset,
    };

    if (this.needsUserId()) {
      variables.id = this.userId;
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
        this.updateBookmarkIcons(); // ✅ Update icons when switching to Saved Posts
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
          <svg width="24" height="24" viewBox="0 0 24 24" 
               fill="${isBookmarked ? "#C29D68" : "none"}" 
               stroke="#C29D68">
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
      UIManager.showSuccess(`Post ${isVoted ? "unvoted" : "voted"}`);
    } catch (error) {
      UIManager.showError(`Failed to ${isVoted ? "unvote" : "vote"}`);
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
        <svg width="24" height="24" viewBox="0 0 24 24" 
            fill="${isVoted ? "var(--secondary)" : "none"}" 
            stroke="var(--secondary)">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
        </svg>
    `;
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

  async editPost(postid, content) {
    const postCard = document.querySelector(
      `.postCard[data-post-id="${postid}"]`
    );
    postCard.style.opacity = "50%";
    postCard.style.cursor = "not-allowed";
    try {
      const response = await ApiService.query(
        `
          mutation updateForumPost(
            $payload: ForumPostUpdateInput = null
          ) {
            updateForumPost(
              query: [{ where: { id: ${postid} } }]
              payload: $payload
            ) {
              post_copy
            }
          }
`,
        {
          payload: {
            post_copy: content,
          },
        }
      );
    } catch (error) {
      UIManager.showError("Failed to update post. Please try again.");
    } finally {
      postCard.style.opacity = "100%";
      postCard.style.cursor = "";
      this.refreshPosts();
    }
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
  async fetchComments(postId) {
    try {
      const query = `
        query {
          calcForumComments(
            orderBy: [{ path: ["created_at"], type: desc }]
            query: [{
              where: {
                Forum_Post: [{ where: { id: "${postId}" } }],
                Parent_Comment: [{ where: { id: null } }],
              }
            }]
          ) {
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
      const comments = data?.calcForumComments || [];
      return comments.map((comment) => ({
        id: comment.ID,
        content: comment.Comment,
        date: Formatter.formatTimestamp(comment.Date_Added),
        author: Formatter.formatAuthor({
          firstName: comment.Author_First_Name,
          lastName: comment.Author_Last_Name,
          profileImage: comment.Author_Profile_Image,
        }),
        isCommentVoted: this.votedCommentIds.has(comment.ID),
        voteCommentCount: this.voteCommentCounts.get(comment.ID) || 0,
      }));
    } catch (error) {
      return [];
    }
  }

  async createComment(postId, content, mentions) {
    try {
      const tempCommentId = `temp-${Date.now()}`;
      const tempComment = {
        id: tempCommentId,
        content,
        date: "Just now",
        author: {
          name: this.fullName,
          profileImage: this.defaultAuthorImage,
        },
        defaultAuthorImage: this.defaultAuthorImage,
      };

      // Optimistic rendering
      const template = $.templates("#comment-template");
      const commentsContainer = document.getElementById(
        "modal-comments-container"
      );
      commentsContainer.insertAdjacentHTML(
        "afterbegin",
        template.render(tempComment)
      );

      // Find the newly added comment and disable it
      const commentElement =
        commentsContainer.querySelector(
          `[data-comment-id="${tempCommentId}"]`
        ) || commentsContainer.firstElementChild;
      commentElement.classList.add("state-disabled"); // Add disabled class

      // API call
      const query = `
          mutation createForumComment($payload: ForumCommentCreateInput!) {
            createForumComment(payload: $payload) {
              id
              comment
              forum_post_id
            }
          }
        `;
      const variables = {
        payload: {
          author_id: this.userId,
          comment: content,
          forum_post_id: postId,
          Comment_or_Reply_Mentions: mentions.map((id) => ({ id: Number(id) })),
        },
      };

      const response = await ApiService.query(query, variables);
      const newComment = response.createForumComment;

      // Update the temporary comment with the real comment ID
      commentElement.dataset.commentId = newComment.id;
      commentElement.classList.remove("state-disabled"); // Enable comment

      // Reload comments
      await PostModalManager.loadComments(postId);
    } catch (error) {
      UIManager.showError("Failed to post comment");
    } finally {
      const commentsContainer = document.getElementById(
        "modal-comments-container"
      );
      const tempCommentElement =
        commentsContainer.querySelector(
          `[data-comment-id="${tempCommentId}"]`
        ) || commentsContainer.firstElementChild;
      if (tempCommentElement) {
        tempCommentElement.remove();
      }
    }
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
        forum_comment_upvote_id: commentId,
      };
      const data = await ApiService.query(query, variables);
      const votes = data?.calcMemberCommentUpvotesForumCommentUpvotesMany || [];
      return votes;
    } catch (error) {
      return [];
    }
  }

  async toggleCommentVote(commentId) {
    const buttons = document.querySelectorAll(
      `.vote-button[data-comment-id="${commentId}"]`
    );

    // Check if the user has already voted for this comment.
    const voteRecords = await this.fetchVoteForComment(commentId);
    const isCommentVoted = voteRecords.length > 0;

    // Get the current vote count for this comment from the local map (defaulting to 0).
    let voteCount = this.voteCommentCounts.get(commentId) || 0;

    try {
      // Disable buttons and set opacity
      buttons.forEach((button) => {
        button.disabled = true;
        button.style.opacity = "0.5"; // Add this line
      });

      if (isCommentVoted) {
        // Remove the vote.
        await this.deleteCommentVote(commentId);
        // Remove our local record for this comment.
        this.votedCommentIds.delete(commentId);
        voteCount = Math.max(0, voteCount - 1);
      } else {
        // Create a new vote.
        const voteId = await this.createCommentVote(commentId);
        // If no local record exists yet, initialize a Set.
        if (!this.votedCommentIds.has(commentId)) {
          this.votedCommentIds.set(commentId, new Set());
        }
        this.votedCommentIds.get(commentId).add(voteId);
        voteCount += 1;
      }

      // Update the local vote count.
      this.voteCommentCounts.set(commentId, voteCount);

      // Update the UI for this comment.
      this.updateCommentVoteUI(commentId);
      UIManager.showSuccess(`Comment ${isCommentVoted ? "unvoted" : "voted"}`);
    } catch (error) {
      UIManager.showError(
        `Failed to ${isCommentVoted ? "unvote" : "vote"} comment`
      );
    } finally {
      // Re-enable buttons and reset opacity
      buttons.forEach((button) => {
        button.disabled = false;
        button.style.opacity = "1"; // Add this line
      });
    }
  }

  async createCommentVote(commentId) {
    const query = `
      mutation createMemberCommentUpvotesForumCommentUpvotes(
        $payload: MemberCommentUpvotesForumCommentUpvotesCreateInput!
      ) {
        createMemberCommentUpvotesForumCommentUpvotes(payload: $payload) {
          id
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

  async deleteCommentVote(commentId) {
    let voteIds = this.votedCommentIds.get(commentId);
    if (!voteIds || voteIds.size === 0) {
      // If no local record, try to fetch them first.
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

    // Remove the entry from the local map.
    this.votedCommentIds.delete(commentId);
  }

  updateCommentVoteUI(commentId) {
    const commentElement = document.querySelector(
      `[data-comment-id="${commentId}"]`
    );
    if (!commentElement) return;

    const isVoted = this.votedCommentIds.has(commentId);
    const voteCount = this.voteCommentCounts.get(commentId) || 0;

    const voteButton = commentElement.querySelector(".vote-button");
    if (voteButton) {
      voteButton.innerHTML = this.getCommentVoteSVG(isVoted);
    }
    const voteCountElement = commentElement.querySelector(".vote-count");
    if (voteCountElement) {
      voteCountElement.textContent = voteCount;
    }
  }

  getCommentVoteSVG(isVoted) {
    return `
      <svg width="24" height="24" viewBox="0 0 24 24" 
           fill="${isVoted ? "#C29D68" : "none"}" 
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
          calcForumComments(query: [{
            where: { Parent_Comment: [{ where: { id: "${commentId}" } }] }
          }]) {
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
      return (
        data?.calcForumComments?.map((reply) => ({
          id: reply.ID,
          content: reply.Comment,
          date: Formatter.formatTimestamp(reply.Date_Added),
          author: Formatter.formatAuthor({
            firstName: reply.Author_First_Name,
            lastName: reply.Author_Last_Name,
            profileImage: reply.Author_Profile_Image,
          }),
          defaultAuthorImage: CONFIG.api.defaultAuthorImage,
        })) || []
      );
    } catch (error) {
      return [];
    }
  }

  async createReply(commentId, content, mentions) {
    try {
      const tempReplyId = `temp-${Date.now()}`;
      const tempReply = {
        id: tempReplyId,
        content,
        date: "Just now",
        author: {
          name: this.fullName, // Replace with actual user data if available.
          profileImage: this.defaultAuthorImage,
        },
        defaultAuthorImage: this.defaultAuthorImage,
      };

      // Locate the replies container within the specific comment.
      const repliesContainer = document.querySelector(
        `[data-comment-id="${commentId}"] .replies-container`
      );
      if (!repliesContainer) {
        throw new Error(
          "Replies container not found for comment: " + commentId
        );
      }

      // Optimistically render the temporary reply.
      const template = $.templates("#reply-template");
      repliesContainer.insertAdjacentHTML(
        "afterbegin",
        template.render(tempReply)
      );

      // Find the newly added reply and disable it
      const replyElement =
        repliesContainer.querySelector(`[data-reply-id="${tempReplyId}"]`) ||
        repliesContainer.firstElementChild;
      replyElement.classList.add("state-disabled"); // Add disabled class

      // Prepare the GraphQL mutation for creating a reply.
      const query = `
        mutation createForumComment($payload: ForumCommentCreateInput!) {
          createForumComment(payload: $payload) {
            id
            comment
            parent_comment_id
          }
        }
      `;
      const variables = {
        payload: {
          author_id: this.userId,
          comment: content,
          parent_comment_id: commentId,
          Comment_or_Reply_Mentions: mentions.map((id) => ({ id: Number(id) })),
        },
      };

      // Execute the API call.
      const response = await ApiService.query(query, variables);
      const newReply = response.createForumComment;

      // Update the temporary reply with the real reply ID.
      replyElement.dataset.replyId = newReply.id;
      let replyVoteButton = replyElement.querySelector(".vote-button");
      let replyDeleteButton = replyElement.querySelector(".delete-reply-btn");
      replyDeleteButton.dataset.replyId = newReply.id;
      replyVoteButton.dataset.replyId = newReply.id;
      replyElement.classList.remove("state-disabled"); // Enable reply

      // Optionally, refresh the replies for this comment here.
    } catch (error) {
      UIManager.showError("Failed to post reply");
      // Remove the optimistic reply if an error occurs.
      const repliesContainer = document.querySelector(
        `[data-comment-id="${commentId}"] .replies-container`
      );
      const tempReplyElement =
        repliesContainer.querySelector(`[data-reply-id="${tempReplyId}"]`) ||
        repliesContainer.firstElementChild;
      if (tempReplyElement) {
        tempReplyElement.remove(); // Remove temp reply on failure
      }
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
    let voteCount = this.voteReplyCounts.get(replyId) || 0;

    let successMessage = "";

    try {
      buttons.forEach((button) => {
        button.disabled = true;
        button.style.opacity = "0.5";
      });

      if (isReplyVoted) {
        await this.deleteReplyVote(replyId);
        this.votedReplyIds.delete(replyId);
        voteCount = Math.max(0, voteCount - 1);
        successMessage = "Comment unvoted";
      } else {
        const voteId = await this.createReplyVote(replyId);
        if (!this.votedReplyIds.has(replyId)) {
          this.votedReplyIds.set(replyId, new Set());
        }
        this.votedReplyIds.get(replyId).add(voteId);
        voteCount += 1;
        successMessage = "Comment voted";
      }

      this.voteReplyCounts.set(replyId, voteCount);
      this.updateReplyVoteUI(replyId);
    } catch (error) {
      UIManager.showError(
        `Failed to ${isReplyVoted ? "unvote" : "vote"} comment`
      );
      return; // Stop execution if there's an error
    } finally {
      buttons.forEach((button) => {
        button.disabled = false;
        button.style.opacity = "1";
      });
    }

    // ✅ Ensure success message is only shown if there was no error
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

    // Remove the entry from the local map.
    this.votedReplyIds.delete(replyId);
  }

  updateReplyVoteUI(replyId) {
    const replyElement = document.querySelector(`[data-reply-id="${replyId}"]`);
    if (!replyElement) return;

    const isVoted = this.votedReplyIds.has(replyId);
    const voteCount = this.voteReplyCounts.get(replyId) || 0;

    const voteButton = replyElement.querySelector(".vote-button");
    if (voteButton) {
      voteButton.innerHTML = this.getReplyVoteSVG(isVoted);
    }

    const voteCountElement = replyElement.querySelector(".vote-count"); // 🔥 Fixed from `commentElement`
    if (voteCountElement) {
      voteCountElement.textContent = voteCount;
    }
  }

  getReplyVoteSVG(isVoted) {
    return `
      <svg width="24" height="24" viewBox="0 0 24 24" 
           fill="${isVoted ? "#C29D68" : "none"}" 
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
        const postElement = document.querySelector(
          `[data-post-id="${postId}"]`
        );
        if (postElement) {
          const authorId = postElement.dataset.authorId;
          const imageElement = postElement.querySelector(
            ".post-image-wrapper img"
          );
          const postImage = imageElement ? imageElement.src : "";
          const post = {
            id: postId,
            authorId: authorId,
            author: {
              name:
                postElement.querySelector(".post-author-name")?.textContent ||
                "", // Add optional chaining
              profileImage: postElement.querySelector("img")?.src || "", // Ensure this selector is correct
            },
            date: postElement.querySelector("time")?.textContent || "",
            title: postElement.querySelector("h3")?.textContent || "",
            content:
              postElement.querySelector(".post-content div")?.textContent || "",
            post_image: postImage,
            PostVotesCount:
              postElement.querySelector(".postVoteCount")?.textContent || "0",
            PostCommentCount:
              postElement.querySelector(".postCommentCount")?.textContent ||
              "0",
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
    });
  }
}
