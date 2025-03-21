// UI Manager
class UIManager {
  static showError(message) {
    const errorDisplay = document.querySelector(CONFIG.selectors.errorDisplay);
    errorDisplay.textContent = message;
    errorDisplay.classList.remove("hidden");
    setTimeout(() => errorDisplay.classList.add("hidden"), 5000);
  }

  static showSuccess(message) {
    const successDiv = document.createElement("div");
    successDiv.className =
      "fixed top-4 right-4 p-4 bg-grey-300 text-secondary rounded-lg shadow-lg z-[123456]";
    successDiv.textContent = message;
    document.body.appendChild(successDiv);

    setTimeout(() => {
      successDiv.remove();
    }, 3000);
  }

  static showDeleteConfirmation() {
    return new Promise((resolve) => {
      const modal = document.getElementById("delete-modal");
      const confirmBtn = modal.querySelector(".confirm-delete");
      const cancelBtn = modal.querySelector(".cancel-delete");

      const handleHide = () => {
        modal.removeEventListener("sl-after-hide", handleHide);
        resolve(false);
      };

      const cleanUp = (result) => {
        modal.removeEventListener("sl-after-hide", handleHide);
        confirmBtn.removeEventListener("click", confirmHandler);
        cancelBtn.removeEventListener("click", cancelHandler);
        resolve(result);
      };

      const confirmHandler = () => {
        modal.hide();
        cleanUp(true);
      };

      const cancelHandler = () => {
        modal.hide();
        cleanUp(false);
      };

      modal.addEventListener("sl-after-hide", handleHide);
      confirmBtn.addEventListener("click", confirmHandler);
      cancelBtn.addEventListener("click", cancelHandler);

      modal.show();
    });
  }

  static async showDeleteConfirmation(
    message = "Are you sure you want to delete this?"
  ) {
    return new Promise((resolve) => {
      document.getElementById("delete-confirmation-modal")?.remove();

      const modalHTML = `
            <div id="delete-confirmation-modal" class="fixed inset-0 min-[500px]:pt-[50px] modal-overlay bg-opacity-60 flex items-start justify-center !z-[99999]">
                <div class="p-6 rounded flex flex-col gap-2 relative z-[101] modal-background max-[500px]:size-full ">
                <div class="flex items-center justify-between">
                <h2 class="text-black">Delete Post</h2>
                <svg id="cancel-delete-icon" class="cancel-delete-method cursor-pointer" width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12.6622 11.837C12.7164 11.8912 12.7594 11.9555 12.7887 12.0263C12.8181 12.0971 12.8332 12.173 12.8332 12.2497C12.8332 12.3263 12.8181 12.4022 12.7887 12.473C12.7594 12.5438 12.7164 12.6082 12.6622 12.6624C12.608 12.7165 12.5437 12.7595 12.4729 12.7889C12.4021 12.8182 12.3262 12.8333 12.2495 12.8333C12.1729 12.8333 12.097 12.8182 12.0262 12.7889C11.9554 12.7595 11.8911 12.7165 11.8369 12.6624L6.99984 7.8246L2.16281 12.6624C2.05336 12.7718 1.90492 12.8333 1.75013 12.8333C1.59534 12.8333 1.44689 12.7718 1.33744 12.6624C1.22799 12.5529 1.1665 12.4045 1.1665 12.2497C1.1665 12.0949 1.22799 11.9464 1.33744 11.837L6.1752 6.99996L1.33744 2.16294C1.22799 2.05349 1.1665 1.90504 1.1665 1.75025C1.1665 1.59546 1.22799 1.44702 1.33744 1.33757C1.44689 1.22811 1.59534 1.16663 1.75013 1.16663C1.90492 1.16663 2.05336 1.22811 2.16281 1.33757L6.99984 6.17532L11.8369 1.33757C11.9463 1.22811 12.0948 1.16663 12.2495 1.16663C12.4043 1.16663 12.5528 1.22811 12.6622 1.33757C12.7717 1.44702 12.8332 1.59546 12.8332 1.75025C12.8332 1.90504 12.7717 2.05349 12.6622 2.16294L7.82448 6.99996L12.6622 11.837Z" fill="white"/>
                </svg>
                      </div>
                    <h3 class=" text-black">${message}</h3>
                    <div class="h-[1px] bg-white w-full max-[500px]:hidden"></div>
                    <div class="flex justify-end gap-3 mt-4  max-[500px]:fixed bottom-6 right-6 w-full">
                        <button id="cancel-delete" class="cancel-delete-method button  o2 text-black">Cancel</button>
                        <button id="confirm-delete" class="text-white o2  button bg-danger-100 hover:bg-danger-200 transition-all">Delete</button>
                    </div>
                </div>
            </div>
        `;

      document.body.insertAdjacentHTML("beforeend", modalHTML);
      document.querySelectorAll(".cancel-delete-method").forEach((button) => {
        button.addEventListener("click", () => {
          document.getElementById("delete-confirmation-modal").remove();
          resolve(false);
        });
      });

      document
        .getElementById("confirm-delete")
        .addEventListener("click", () => {
          document.getElementById("delete-confirmation-modal").remove();
          resolve(true);
        });
    });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  window.forumManager = new ForumManager();
  // window.modalManager = new PostModalManager();
  const filterButtons = document.querySelectorAll(".filter-button");
  const defaultActiveButton = document.querySelector(`[data-filter="recent"]`);
  defaultActiveButton.classList.add("active");
  defaultActiveButton.setAttribute("variant", "primary");

  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const filterType = button.dataset.filter;
      forumManager.handleFilterChange(filterType);
      filterButtons.forEach((btn) => {
        btn.classList.remove("active");
        btn.setAttribute("variant", "default");
      });
      button.classList.add("active");
      button.setAttribute("variant", "primary");
    });
  });

  document.querySelectorAll(".sort-button").forEach((button) => {
    button.addEventListener("click", (e) => {
      const sortType = e.currentTarget.dataset.sort;
      forumManager.currentSort = sortType;
      forumManager.loadInitialPosts();
    });
  });

  document
    .getElementById("openCreateNewPostModal")
    .addEventListener("click", function () {
      let postModal = document.getElementById("postNewModal");
      postModal.querySelector("#edit-post").classList.add("hidden");
      postModal.querySelector("#submit-post").classList.remove("hidden");
      postModal.removeAttribute("postid");
      postModal.show();
    });
});

window.addEventListener("load", function () {
  const loader = document.getElementById("loader");
  setTimeout(() => {
    loader.classList.add("fade-out");
  }, 500);
});

document.addEventListener("click", (event) => {
  if (event.target.closest(".bellIcon")) {
    document.querySelector(".announcements").classList.toggle("hidden");
  }
  if (event.target.closest(".closeNotificationModal")) {
    document.querySelector(".announcements").classList.add("hidden");
  }
});

document.addEventListener("DOMContentLoaded", function () {
  const modal = document.getElementById("postNewModal");
  const editor = document.getElementById("post-editor");

  modal.addEventListener("sl-show", () => {
    setTimeout(() => {
      editor.focus();
    }, 100);
  });
});

let formatPreiview = function formatPreiview() {
  setTimeout(() => {
    const posts = document.querySelectorAll(".content-container");
    const urlRegex =
      /(https?:\/\/(?:www\.)?(youtube\.com|youtu\.be|loom\.com|vimeo\.com)\/\S+)/gi;

    posts.forEach((post) => {
      let content = post.innerHTML;
      const matches = content.match(urlRegex);
      if (matches) {
        matches.forEach((rawUrl) => {
          let url = rawUrl;
          if (url.includes("youtube") || url.includes("youtu.be")) {
            url = transformYoutubeUrl(url);
          } else if (url.includes("loom.com")) {
            url = transformLoomUrl(url);
          } else if (url.includes("vimeo.com")) {
            url = transformVimeoUrl(url);
          }
          if (!post.querySelector(`[data-preview-url="${url}"]`)) {
            createPreviewContainer(url, post);
          }
        });
      }
    });

    function createPreviewContainer(url, post) {
      if (post.querySelector(`[data-preview-url="${url}"]`)) {
        return;
      }
      const iframe = document.createElement("iframe");
      iframe.src = url;
      iframe.setAttribute("frameborder", "0");
      iframe.setAttribute("allowfullscreen", "");
      iframe.style.position = "absolute";
      iframe.style.top = "0";
      iframe.style.left = "0";
      iframe.style.width = "100%";
      iframe.style.height = "100%";

      const container = document.createElement("div");
      container.classList.add("preview-container");
      container.style.position = "relative";
      container.style.paddingBottom = "56.25%";
      container.style.height = "0";
      container.style.marginTop = "16px";
      container.setAttribute("data-preview-url", url);

      const skeleton = document.createElement("div");
      skeleton.classList.add("skeleton-loader");
      skeleton.style.position = "absolute";
      skeleton.style.top = "0";
      skeleton.style.left = "0";
      skeleton.style.width = "100%";
      skeleton.style.height = "100%";
      skeleton.style.backgroundColor = "#e0e0e0";
      skeleton.style.animation = "pulse 1.5s infinite";

      container.appendChild(skeleton);
      container.appendChild(iframe);

      iframe.addEventListener("load", () => {
        skeleton.remove();
      });

      post.appendChild(container);
    }

    function transformYoutubeUrl(url) {
      try {
        const urlObj = new URL(url);
        let videoId;
        if (urlObj.hostname === "youtu.be") {
          videoId = urlObj.pathname.slice(1);
        } else if (urlObj.hostname.includes("youtube.com")) {
          videoId = urlObj.searchParams.get("v");
        }
        if (videoId && videoId.length === 11) {
          return "https://www.youtube.com/embed/" + videoId;
        }
      } catch (e) {
        var regExp =
          /^.*(?:youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        var match = url.match(regExp);
        if (match && match[1].length === 11) {
          return "https://www.youtube.com/embed/" + match[1];
        }
      }
      return url;
    }

    function transformLoomUrl(url) {
      var regExp = /loom\.com\/share\/([a-f0-9]+)/;
      var match = url.match(regExp);
      if (match && match[1]) {
        return "https://www.loom.com/embed/" + match[1];
      }
      return url;
    }

    function transformVimeoUrl(url) {
      if (url.includes("player.vimeo.com/video/")) {
        return url;
      }
      var regExp = /vimeo\.com\/(\d+)\/(\w+)/;
      var match = url.match(regExp);
      if (match && match[1] && match[2]) {
        return "https://player.vimeo.com/video/" + match[1] + "?h=" + match[2];
      }
      return url;
    }
  }, 3000);
};

function linkifyElement(element) {
  const urlRegex = /(\b(https?:\/\/|www\.)\S+\b)/gi;
  const walker = document.createTreeWalker(
    element,
    NodeFilter.SHOW_TEXT,
    null,
    false
  );
  const textNodes = [];
  while (walker.nextNode()) {
    textNodes.push(walker.currentNode);
  }
  textNodes.forEach((textNode) => {
    const text = textNode.nodeValue;
    if (urlRegex.test(text)) {
      const fragment = document.createDocumentFragment();
      let lastIndex = 0;
      text.replace(urlRegex, (match, p1, offset) => {
        if (offset > lastIndex) {
          fragment.appendChild(
            document.createTextNode(text.substring(lastIndex, offset))
          );
        }
        const a = document.createElement("a");
        a.href = match.startsWith("http") ? match : "http://" + match;
        a.textContent = match;
        a.classList.add("custom-link-class");
        a.classList.add("line-clamp-1");
        a.target = "_blank";
        a.rel = "noopener noreferrer";
        fragment.appendChild(a);
        lastIndex = offset + match.length;
        return match;
      });
      if (lastIndex < text.length) {
        fragment.appendChild(
          document.createTextNode(text.substring(lastIndex))
        );
      }
      textNode.parentNode.replaceChild(fragment, textNode);
    }
  });
}
