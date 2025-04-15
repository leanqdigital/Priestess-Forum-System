class ForumManager {
  constructor() {
    this.userId = CONFIG.api.userId;
    this.authorDisplayName = CONFIG.api.authorDisplayName;
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
    this.activeFourmTag = CONFIG.api.activeFourmTag;
    this.hasValidTag = false;
    this.init();
  }

  async init() {
    try {
      await this.fetchSavedPosts();
      await this.fetchContactTag();
      await this.loadInitialPosts();
      await this.fetchVotes();
      await this.fetchVoteForComment();
      await this.fetchVoteForReply();
      this.initEventListeners();
    } catch (error) {
      UIManager.showError("Failed to initialize forum.");
    }
  }

  // Fetch Contact Tags
  async fetchContactTag() {
    let query = `
      query calcContacts {
        calcContacts(
          query: [
            { where: { id: "${this.userId}" } }
            {
              andWhere: {
                TagsData: [
                  {
                    where: {
                      Tag: [
                        { where: { name: "${this.activeFourmTag}" } }
                      ]
                    }
                  }
                ]
              }
            }
          ]
        ) {
          TagName: field(arg: ["TagsData", "Tag", "name"])
        }
      }
    `;
    const dataPromise = ApiService.query(query);
    await new Promise((resolve) => setTimeout(resolve, 700));
    let data = await dataPromise;

    let tagNames = data?.calcContacts
      ?.map((contact) => contact?.TagName)
      .flat();
    tagNames = String(tagNames);

    // Set the hasValidTag flag based on comparison with activeFourmTag.
    if (tagNames === this.activeFourmTag) {
      this.hasValidTag = true;
    } else {
      this.hasValidTag = false;
    }
    return tagNames;
  }
  // Fetch Contact Tags

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
    const postContainer = document.querySelector(CONFIG.selectors.postsContainer);

    // If the contact tag doesn't match the active forum tag, show the no-posts message
    // and exit early.
    if (!this.hasValidTag) {
      postContainer.innerHTML = `
        <div class="flex flex-col gap-6 items-center justify-center">
          <div class="size-[200px]">
            <img src="https://file.ontraport.com/media/815e881804d34ab797e0164d3147eac6.phpi2i7d9?Expires=4892956060&Signature=RWwlqEq5aGHRwoY5Qj6PRr1OrwGrpGx52h8-xquN4k3wcESh0eUUs2pz3zaRcSqMKKoFKQuERA58BSwA0VNAqAvNc4NMSTX3odMiC3J2VKgZ99qQCtIMm182soWKlYhjYdlY4iNvqi9M4WXRYQTm8yZtS1ShkUJd79zHKc~N1jRMLUUaPlKSwum7yUT1AAl4oK-emB11oUe--F9bom4dM~QWQUGNIMvI9rD~DT0EYElQraQFU9wopWMvMmLyqEHQPFhsAM~OmIyjH8O7q3mTT629fkQWKGFM-X6~rprLOf8h~CUq45CNSHsAe8UdNRC2r42OaSU-xkC2uQdCe1lnMQ__&Key-Pair-Id=APKAJVAAMVW6XQYWSTNA" alt="Empty Post" class="size-full object-contain">
          </div>
          <div class="p2 text-white">No posts available.</div>
        </div>
      `;
      return;
    }
    try {
      if (!this.hasMorePosts) return;
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
                <img src="https://file.ontraport.com/media/815e881804d34ab797e0164d3147eac6.phpi2i7d9?Expires=4892956060&Signature=RWwlqEq5aGHRwoY5Qj6PRr1OrwGrpGx52h8-xquN4k3wcESh0eUUs2pz3zaRcSqMKKoFKQuERA58BSwA0VNAqAvNc4NMSTX3odMiC3J2VKgZ99qQCtIMm182soWKlYhjYdlY4iNvqi9M4WXRYQTm8yZtS1ShkUJd79zHKc~N1jRMLUUaPlKSwum7yUT1AAl4oK-emB11oUe--F9bom4dM~QWQUGNIMvI9rD~DT0EYElQraQFU9wopWMvMmLyqEHQPFhsAM~OmIyjH8O7q3mTT629fkQWKGFM-X6~rprLOf8h~CUq45CNSHsAe8UdNRC2r42OaSU-xkC2uQdCe1lnMQ__&Key-Pair-Id=APKAJVAAMVW6XQYWSTNA" alt="Empty Post" class="size-full object-contain">
              </div>
              <div class="p2 text-white">No posts available.</div>
            </div>
          `;
        }
        return;
      }

      const posts = data.calcForumPosts.map((post) => {
        let fileContent = post.File_Content;
        if (typeof fileContent === "string") {
          fileContent = fileContent.trim();
          if (fileContent.startsWith("{")) {
            try {
              fileContent = JSON.parse(fileContent);
            } catch (e) {
              fileContent = { link: fileContent };
            }
          } else {
            if (
              (fileContent.startsWith('"') && fileContent.endsWith('"')) ||
              (fileContent.startsWith("'") && fileContent.endsWith("'"))
            ) {
              fileContent = fileContent.substring(1, fileContent.length - 1);
            }
            fileContent = { link: fileContent };
          }
        } else {
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
            displayName: post.Author_Display_Name,
          }),
          date: Formatter.formatTimestamp(post.Post_Publish_Date),
          title: post.Post_Title,
          content: post.Post_Copy,
          disableComments: post.Disable_New_Comments,
          authorDirectoryProfileUrl: post.Author_Directory_Profile_URL,
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
      const contentContainers =
        postContainer.querySelectorAll(".content-container");
      contentContainers.forEach((container) => {
        linkifyElement(container);
      });
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
    filters.push(
      `
      { where: { Related_Course: [{ where: { id: "${courseID}" } }] } }
      { andWhere: { post_status: "Published - Not flagged" } }
      { andWhere: { related__course__tag: "${this.activeFourmTag}"}}
       `
    );

    if (dynamicFilter) {
      filters.push(`{ andWhere: ${dynamicFilter} }`);
    }
    if (this.searchTerm && this.searchTerm.trim() !== "") {
      filters.push(`{
        andWhere: {
          Author: [
            { where: { display_name: $searchPatternDisplayName, _OPERATOR_: like } }
          ]
        }
      }`);
      filters.push(`{
        orWhere: {
          post_copy: $searchPatternPostCopy, _OPERATOR_: like
        }
      }`);
    }
    const queryFilters = `[ ${filters.join(", ")} ]`;
    let args = [];
    args.push(`query: ${queryFilters}`);
    args.push(`limit: $limit, offset: $offset`);
    if (sortCondition) args.push(sortCondition);
    const argsString = args.join(", ");
    let query = `query calcForumPosts(
          $limit: IntScalar,
          $offset: IntScalar${
            this.needsUserId() ? ", $id: PriestessContactID" : ""
          }${
      this.searchTerm && this.searchTerm.trim() !== ""
        ? ", $searchPatternDisplayName: TextScalar, $searchPatternPostCopy: LongtextScalar"
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
            Author_Display_Name: field(arg: ["Author", "display_name"])
            Post_Publish_Date: field(arg: ["post_publish_date"])
            Author_Directory_Profile_URL: field(arg: ["Author", "directory__profile_url"])
          }
        }`;
    let variables = {
      limit: this.postsLimit,
      offset: this.postsOffset,
    };

    if (this.needsUserId()) {
      variables.id = this.userId;
    }

    if (this.searchTerm && this.searchTerm.trim() !== "") {
      variables.searchPatternDisplayName = `%${this.searchTerm.trim()}%`;
      variables.searchPatternPostCopy = `%${this.searchTerm.trim()}%`;
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
        return 'orderBy: [{ path: ["post_publish_date"], type: desc }]';
      case "oldest":
        return 'orderBy: [{ path: ["post_publish_date"], type: asc }]';
      case "popular":
        return 'orderBy: [{ path: ["ForumCommentsIDCalc"], type: desc }]';
      default:
        return 'orderBy: [{ path: ["post_publish_date"], type: desc }]';
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
      postElement.classList.add("opacity-50", "pointer-events-none");
      const confirmed = await UIManager.showDeleteConfirmation();
      if (!confirmed) {
        postElement.classList.remove("opacity-50", "pointer-events-none");
        return;
      }
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

      this.savedPostIds.clear();
      data.calcOContactSavedPosts.forEach(({ ID, Saved_Post_ID }) => {
        this.savedPostIds.set(String(Saved_Post_ID), ID);
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
      throw error;
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
      buttons.forEach((button) => {
        button.disabled = true;
        button.style.opacity = "0.5";
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
      buttons.forEach((button) => {
        button.disabled = false;
        button.style.opacity = "1";
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
    const voteButtons = document.querySelectorAll(
      `[data-post-id="${postId}"].vote-button, [data-post-id="${postId}"] .vote-button`
    );
    voteButtons.forEach((button) => {
      const isVoted = this.votedPostIds.has(postId);
      button.innerHTML = this.getVoteSVG(isVoted);
      const voteCountEl = button.parentElement.querySelector(".postVoteCount");
      if (voteCountEl) {
        voteCountEl.textContent = updatedVoteCount;
      }
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
            orderBy: [{ path: ["created_at"], type: asc }]
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
            Author_Display_Name: field(arg: ["Author", "display_name"])
            Author_ID: field(arg: ["author_id"])
          }
        }
      `;

      const data = await ApiService.query(query);
      const comments = data?.calcForumComments || [];

      return comments.map((comment) => {
        let fileContent = comment.File_Content;
        if (typeof fileContent === "string") {
          fileContent = fileContent.trim();
          if (fileContent.startsWith("{") || fileContent.startsWith("[")) {
            try {
              fileContent = JSON.parse(fileContent);
            } catch (e) {
              fileContent = { link: fileContent };
            }
          } else {
            if (
              (fileContent.startsWith('"') && fileContent.endsWith('"')) ||
              (fileContent.startsWith("'") && fileContent.endsWith("'"))
            ) {
              fileContent = fileContent.substring(1, fileContent.length - 1);
            }
            fileContent = { link: fileContent };
          }
        }
        return {
          id: comment.ID,
          author_id: comment.Author_ID,
          content: comment.Comment,
          date: Formatter.formatTimestamp(comment.Date_Added),
          CommentVotesCount: comment.Member_Comment_Upvotes_DataTotal_Count,
          forLoggedInUserImage: this.defaultLoggedInAuthorImage,
          file_type: comment.File_Type,
          file_content: fileContent,
          author: Formatter.formatAuthor({
            firstName: comment.Author_First_Name,
            lastName: comment.Author_Last_Name,
            profileImage:
              comment.Author_Forum_Image && comment.Author_Forum_Image.trim()
                ? comment.Author_Forum_Image
                : this.defaultAuthorImage,
            displayName: comment.Author_Display_Name,
          }),
          isCommentVoted: this.votedCommentIds.get(comment.ID)?.size > 0,
        };
      });
    } catch (error) {
      return [];
    }
  }

  async createComment(postId, content, mentions, fileType, uploadedFile) {
    const tempCommentId = `temp-${Date.now()}`;

    let previewFileContent = null;
    if (uploadedFile) {
      previewFileContent = {
        link: URL.createObjectURL(uploadedFile),
        type: uploadedFile.type,
      };
    }

    const tempComment = {
      id: tempCommentId,
      content: content,
      CommentVotesCount: "0",
      date: "Just now",
      file_content: previewFileContent,
      file_type: fileType,
      author: {
        authorDisplayName: this.authorDisplayName,
        profileImage: this.defaultLoggedInAuthorImage,
      },
    };
    const template = $.templates("#comment-template");
    const commentsContainer = document.getElementById(
      "modal-comments-container"
    );
    const emptyMessage = commentsContainer.querySelector(".empty-message");
    if (emptyMessage) {
      emptyMessage.remove();
    }
    commentsContainer.insertAdjacentHTML(
      "beforeend",
      template.render(tempComment)
    );

    let commentElement = commentsContainer.querySelector(
      `[data-comment-id="${tempCommentId}"]`
    );
    if (commentElement) {
      commentElement.classList.add("state-disabled");
    }

    let newComment;
    let fileData = null;
    const fileFields = [];
    if (uploadedFile) {
      fileFields.push({
        fieldName: "file_content",
        file: uploadedFile,
      });
    }

    try {
      if (fileFields.length > 0) {
        const toSubmitFields = {};
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
        fileData.name = fileData.name || uploadedFile.name;
        fileData.size = fileData.size || uploadedFile.size;
        fileData.type = fileData.type || uploadedFile.type;
      }
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

    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      const fetchQuery = `
    query calcForumComments($id: PriestessForumCommentID) {
      calcForumComments(query: [{ where: { id: $id } }]) {
        ID: field(arg: ["id"])
        Author_First_Name: field(arg: ["Author", "first_name"])
        Author_Last_Name: field(arg: ["Author", "last_name"])
        Author_Profile_Image: field(arg: ["Author", "profile_image"])
        Author_ID: field(arg: ["author_id"])
        Date_Added: field(arg: ["created_at"])
        Comment: field(arg: ["comment"])
        Member_Comment_Upvotes_DataTotal_Count: countDistinct(args: [{ field: ["Member_Comment_Upvotes_Data", "id"] }])
        File_Type: field(arg: ["file_type"])
        File_Content: field(arg: ["file_content"])
        Author_Display_Name: field(arg: ["Author", "display_name"])
        Author_Forum_Image: field(arg: ["Author", "forum_image"])
      }
    }
  `;

      const fetchResponse = await ApiService.query(fetchQuery, {
        id: newComment.id,
      });
      const actualComment = fetchResponse.calcForumComments[0];
      const validFileContent =
        actualComment.File_Content &&
        typeof actualComment.File_Content === "object" &&
        typeof actualComment.File_Content.link === "string" &&
        actualComment.File_Content.link.trim().length > 0;
      const finalFileContent = validFileContent
        ? actualComment.File_Content
        : previewFileContent;
      const updatedComment = {
        id: actualComment.ID,
        content:
          actualComment.Comment && actualComment.Comment.trim().length > 0
            ? actualComment.Comment
            : content,
        author: {
          authorDisplayName: actualComment.Author_Display_Name,
          profileImage: actualComment.Author_Forum_Image?.trim()
            ? actualComment.Author_Forum_Image
            : DEFAULT_AVATAR,
        },
        CommentVotesCount: actualComment.Member_Comment_Upvotes_DataTotal_Count,
        file_content: finalFileContent,
        file_type: actualComment.File_Type,
        date: Formatter.formatTimestamp(actualComment.Date_Added),
        author_id: actualComment.Author_ID,
      };
      commentElement.outerHTML = template.render(updatedComment);
      const updatedEl = document.querySelector(
        `[data-comment-id="${updatedComment.id}"]`
      );

      const commentContentContainer =
        updatedEl.querySelector(".content-container");
      linkifyElement(commentContentContainer);
      if (updatedEl) {
        const voteButton = updatedEl.querySelector(".vote-button");
        if (voteButton) {
          voteButton.dataset.commentId = newComment.id;
        }
      }
    } catch (fetchError) {
      commentElement.dataset.commentId = newComment.id;
      commentElement.classList.remove("state-disabled");
    }
  }

  async deleteComment(commentId) {
    const commentElement = document.querySelector(
      `[data-target-comment="${commentId}"]`
    );
    if (!commentElement) return;
    commentElement.classList.add("state-disabled");
    try {
      commentElement.classList.add("opacity-50", "pointer-events-none");

      const confirmed = await UIManager.showDeleteConfirmation();

      if (!confirmed) {
        commentElement.classList.remove("opacity-50", "pointer-events-none");
        return;
      }
      commentElement.classList.add("animate-pulse");

      const query = `
        mutation deleteForumComment($id: PriestessForumCommentID) {
            deleteForumComment(query: [{ where: { id: $id } }]) {
            id
            }
        }
        `;
      const variables = { id: commentId };
      const response = await ApiService.query(query, variables);

      if (response?.deleteForumComment?.id) {
        commentElement.classList.add(
          "opacity-0",
          "transition-opacity",
          "duration-300"
        );
        setTimeout(() => commentElement.remove(), 300);
        UIManager.showSuccess("Comment deleted successfully");
      }
    } catch (error) {
      UIManager.showError("Failed to delete comment. Please try again.");
    } finally {
      replyElement?.classList.remove(
        "animate-pulse",
        "opacity-50",
        "pointer-events-none"
      );
    }
  }

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
      return [];
    }
  }

  async toggleCommentVote(commentId) {
    const buttons = document.querySelectorAll(
      `.vote-button[data-comment-id="${commentId}"]`
    );

    const voteRecords = await this.fetchVoteForComment(commentId);
    const isCommentVoted = voteRecords.length > 0;

    try {
      buttons.forEach((button) => {
        button.disabled = true;
        button.style.opacity = "0.5";
      });

      if (isCommentVoted) {
        await this.deleteCommentVote(commentId);
        this.votedCommentIds.delete(commentId);
      } else {
        const voteId = await this.createCommentVote(commentId);
        if (!this.votedCommentIds.has(commentId)) {
          this.votedCommentIds.set(commentId, new Set());
        }
        this.votedCommentIds.get(commentId).add(voteId);
      }
      await this.updateCommentVoteUI(commentId);
      UIManager.showSuccess(`Comment ${isCommentVoted ? "unliked" : "liked"}`);
    } catch (error) {
      UIManager.showError(
        `Failed to ${isCommentVoted ? "unlike" : "like"} comment`
      );
    } finally {
      buttons.forEach((button) => {
        button.disabled = false;
        button.style.opacity = "1";
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

  async deleteCommentVote(commentId) {
    let voteIds = this.votedCommentIds.get(commentId);
    if (!voteIds || voteIds.size === 0) {
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
    this.votedCommentIds.delete(commentId);
  }

  async updateCommentVoteUI(commentId) {
    const commentElements = document.querySelectorAll(
      `[data-comment-id="${commentId}"]`
    );
    commentElements.forEach(async (commentElement) => {
      const isVoted = this.votedCommentIds.get(commentId)?.size > 0;
      const voteButton = commentElement.querySelector(".vote-button");
      if (voteButton) {
        voteButton.innerHTML = this.getCommentVoteSVG(isVoted);
      }
      try {
        const count = await this.fetchCommentVoteCount(commentId);
        const voteCountElement = commentElement.querySelector(".vote-count");
        if (voteCountElement) {
          voteCountElement.textContent = count;
        }
      } catch (error) {}
    });
  }

  getCommentVoteSVG(isVoted) {
    return `
      <svg class = "${
        isVoted ? "voted" : "unVoted"
      }" width="24" height="24" viewBox="0 0 24 24" 
           fill="" 
           stroke="#c29d68">
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
          orderBy: [{ path: ["created_at"], type: asc }]
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
            Author_Display_Name: field(arg: ["Author", "display_name"])
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
            displayName: reply.Author_Display_Name,
          }),
        })) || []
      );
    } catch (error) {
      return [];
    }
  }

  async createReply(commentId, content, mentions, fileType, uploadedFile) {
    const tempReplyId = `temp-${Date.now()}`;
    let previewFileContent = null;
    if (uploadedFile) {
      previewFileContent = {
        link: URL.createObjectURL(uploadedFile),
        type: uploadedFile.type,
      };
    }

    const tempReply = {
      id: tempReplyId,
      content: content,
      date: "Just now",
      file_type: fileType,
      file_content: previewFileContent,
      author_id: this.userId,
      author: {
        authorDisplayName: this.authorDisplayName,
        profileImage: this.defaultLoggedInAuthorImage,
      },
    };

    const repliesContainer = document.querySelector(
      `[data-comment-id="${commentId}"] .replies-container`
    );
    if (!repliesContainer) {
      throw new Error("Replies container not found for comment: " + commentId);
    }

    const template = $.templates("#reply-template");
    repliesContainer.insertAdjacentHTML(
      "beforeend",
      template.render(tempReply)
    );

    const replyElement =
      repliesContainer.querySelector(`[data-reply-id="${tempReplyId}"]`) ||
      repliesContainer.firstElementChild;
    replyElement.classList.add("state-disabled");

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
      fileData.name = fileData.name || uploadedFile.name;
      fileData.size = fileData.size || uploadedFile.size;
      fileData.type = fileData.type || uploadedFile.type;
    }

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
        file_content: fileData,
      },
    };

    try {
      const response = await ApiService.query(mutationQuery, variables);
      const newReply = response.createForumComment;
      replyElement.dataset.replyId = newReply.id;
      const voteButton = replyElement.querySelector(".vote-button");
      const deleteButton = replyElement.querySelector(".delete-reply-btn");
      if (voteButton) voteButton.dataset.replyId = newReply.id;
      if (deleteButton) deleteButton.dataset.replyId = newReply.id;
      replyElement.classList.remove("state-disabled");
      formatPreiview();
      const replyContentContainer =
        replyElement.querySelector(".content-container");
      linkifyElement(replyContentContainer);
    } catch (error) {
      UIManager.showError("Failed to post reply");
      replyElement.remove();
    }
  }

  async deleteReply(replyId) {
    const replyElement = document.querySelector(`[data-reply-id="${replyId}"]`);
    if (!replyElement) return;

    replyElement.classList.add("state-disabled");

    try {
      replyElement.classList.add("opacity-50", "pointer-events-none");

      const confirmed = await UIManager.showDeleteConfirmation();

      if (!confirmed) {
        replyElement.classList.remove("opacity-50", "pointer-events-none");
        return;
      }
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
            }1
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
    } catch (error) {}

    const isVoted = this.votedReplyIds.has(replyId);
    const voteButton = replyElement.querySelector(".vote-button");
    if (voteButton) {
      voteButton.innerHTML = this.getReplyVoteSVG(isVoted);
    }
  }

  getReplyVoteSVG(isVoted) {
    return `
      <svg class = "${
        isVoted ? "voted" : "unVoted"
      }" width="24" height="24" viewBox="0 0 24 24" 
           fill="" 
           stroke="#c29d68">
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

        try {
          const response = await ApiService.query(
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
                  File_Tpe: field(arg: ["file_tpe"])
                  File_Content: field(arg: ["file_content"])
                  ForumCommentsTotalCount: countDistinct(args: [{ field: ["ForumComments", "id"] }])
                  Member_Post_Upvotes_DataTotal_Count: countDistinct(args: [{ field: ["Member_Post_Upvotes_Data", "id"] }])
                  Disable_New_Comments: field(arg: ["disable_new_comments"])
                  Author_Forum_Image: field(arg: ["Author", "forum_image"])
                  Author_Display_Name: field(arg: ["Author", "display_name"])
                  Post_Status: field(arg: ["post_status"])
                  Post_Publish_Date: field(arg: ["post_publish_date"])
                }
              }
              `,
            { id: postId }
          );

          const fetchedPost = response.calcForumPosts[0];
          let fileContent = fetchedPost.File_Content;
          if (typeof fileContent === "string") {
            fileContent = fileContent.trim();
            if (fileContent.startsWith("{")) {
              try {
                fileContent = JSON.parse(fileContent);
              } catch (e) {
                fileContent = { link: fileContent };
              }
            } else {
              if (
                (fileContent.startsWith('"') && fileContent.endsWith('"')) ||
                (fileContent.startsWith("'") && fileContent.endsWith("'"))
              ) {
                fileContent = fileContent.substring(1, fileContent.length - 1);
              }
              fileContent = { link: fileContent };
            }
          } else {
            fileContent = fetchedPost.File_Content;
          }

          const post = {
            id: fetchedPost.ID,
            author_id: fetchedPost.Author_ID,
            author: {
              name: fetchedPost.Author_Display_Name,
              profileImage: fetchedPost.Author_Forum_Image || DEFAULT_AVATAR,
            },
            date: Formatter.formatTimestamp(fetchedPost.Post_Publish_Date),
            content: fetchedPost.Post_Copy,
            file_tpe: fetchedPost.File_Tpe,
            file_content: fileContent,
            PostVotesCount: fetchedPost.Member_Post_Upvotes_DataTotal_Count,
            PostCommentCount: fetchedPost.ForumCommentsTotalCount,
            voted: forumManager.votedPostIds.has(String(fetchedPost.ID)),
          };

          await PostModalManager.open(post);
        } catch (error) {
          UIManager.showError(
            "Failed to load post details. Please try again later."
          );
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

      if (e.target.closest(".delete-comment-btn")) {
        const commentId = e.target.closest(".delete-comment-btn").dataset
          .commentId;
        console.log("Comment to delete is", commentId);
        this.deleteComment(commentId);
      }

      if (e.target.closest(".refresh-button")) {
        this.refreshPosts();
      }

      const searchInput = document.getElementById("searchPost");
      const postsContainer = document.getElementById("posts-container");
      const clearIcon = document.querySelector(".clearIcon");
      const searchIcon = document.querySelector(".searchIcon");

      let debounceTimer;

      searchInput.addEventListener("input", (e) => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          const query = e.target.value.trim();
          if (query !== "") {
            clearIcon.classList.remove("hidden");
            searchIcon.classList.add("hidden");
          } else {
            clearIcon.classList.add("hidden");
            searchIcon.classList.remove("hidden");
          }
          this.searchTerm = query;
          this.refreshPosts().then(() => {
            removeHighlights(postsContainer);
            if (query) {
              highlightMatches(postsContainer, query);
            }
          });
        }, 500);
      });

      clearIcon.addEventListener("click", () => {
        searchInput.value = "";
        clearIcon.classList.add("hidden");
        searchIcon.classList.remove("hidden");
        this.searchTerm = "";
        this.refreshPosts().then(() => {
          removeHighlights(postsContainer);
        });
      });

      function highlightMatches(element, query) {
        const terms = query.split(/\s+/).filter(Boolean);
        if (element.nodeType === Node.TEXT_NODE) {
          let text = element.nodeValue;
          const escapedTerms = terms.map((term) =>
            term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
          );
          const regex = new RegExp(`(${escapedTerms.join("|")})`, "gi");

          if (regex.test(text)) {
            const span = document.createElement("span");
            span.innerHTML = text.replace(regex, `<mark>$1</mark>`);
            element.replaceWith(span);
          }
        } else if (element.nodeType === Node.ELEMENT_NODE) {
          element.childNodes.forEach((child) => highlightMatches(child, query));
        }
      }

      function removeHighlights(element) {
        if (element.nodeType === Node.ELEMENT_NODE) {
          element.querySelectorAll("mark").forEach((mark) => {
            mark.replaceWith(document.createTextNode(mark.textContent));
          });
        }
      }
    });
  }
}
