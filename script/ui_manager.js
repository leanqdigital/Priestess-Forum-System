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
      "fixed top-4 right-4 p-4 bg-green-100 text-green-700 rounded-lg shadow-lg z-[123456]";
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
      // Remove existing modal if any
      document.getElementById("delete-confirmation-modal")?.remove();

      const modalHTML = `
            <div id="delete-confirmation-modal" class="fixed inset-0 min-[500px]:pt-[50px] modal-overlay bg-opacity-60 flex items-start justify-center z-[100]">
                <div class="p-6 rounded flex flex-col gap-2 relative z-[101] modal-background max-[500px]:size-full ">
                <div class="flex items-center justify-between">
                <h2 class="text-white">Delete Post</h2>
                <svg id="cancel-delete-icon" class="cancel-delete-method cursor-pointer" width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12.6622 11.837C12.7164 11.8912 12.7594 11.9555 12.7887 12.0263C12.8181 12.0971 12.8332 12.173 12.8332 12.2497C12.8332 12.3263 12.8181 12.4022 12.7887 12.473C12.7594 12.5438 12.7164 12.6082 12.6622 12.6624C12.608 12.7165 12.5437 12.7595 12.4729 12.7889C12.4021 12.8182 12.3262 12.8333 12.2495 12.8333C12.1729 12.8333 12.097 12.8182 12.0262 12.7889C11.9554 12.7595 11.8911 12.7165 11.8369 12.6624L6.99984 7.8246L2.16281 12.6624C2.05336 12.7718 1.90492 12.8333 1.75013 12.8333C1.59534 12.8333 1.44689 12.7718 1.33744 12.6624C1.22799 12.5529 1.1665 12.4045 1.1665 12.2497C1.1665 12.0949 1.22799 11.9464 1.33744 11.837L6.1752 6.99996L1.33744 2.16294C1.22799 2.05349 1.1665 1.90504 1.1665 1.75025C1.1665 1.59546 1.22799 1.44702 1.33744 1.33757C1.44689 1.22811 1.59534 1.16663 1.75013 1.16663C1.90492 1.16663 2.05336 1.22811 2.16281 1.33757L6.99984 6.17532L11.8369 1.33757C11.9463 1.22811 12.0948 1.16663 12.2495 1.16663C12.4043 1.16663 12.5528 1.22811 12.6622 1.33757C12.7717 1.44702 12.8332 1.59546 12.8332 1.75025C12.8332 1.90504 12.7717 2.05349 12.6622 2.16294L7.82448 6.99996L12.6622 11.837Z" fill="white"/>
                </svg>
                      </div>
                    <h3 class=" text-white">${message}</h3>
                    <div class="h-[1px] bg-white w-full max-[500px]:hidden"></div>
                    <div class="flex justify-end gap-3 mt-4  max-[500px]:fixed bottom-6 right-6 w-full">
                        <button id="cancel-delete" class="cancel-delete-method button  o2 text-white">Cancel</button>
                        <button id="confirm-delete" class="text-white o2  button bg-danger-100 hover:bg-danger-200 transition-all">Delete</button>
                    </div>
                </div>
            </div>
        `;

      // Append modal to <body> to make sure it's always on top
      document.body.insertAdjacentHTML("beforeend", modalHTML);
      // Event listeners
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
  const filterButtons = document.querySelectorAll(".filter-button");

  // Set initial active class to "Recent Posts" button
  const defaultActiveButton = document.querySelector(`[data-filter="recent"]`);
  defaultActiveButton.classList.add("active");
  defaultActiveButton.setAttribute("variant", "primary"); // Shoelace Primary Style

  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      // Remove active state from all buttons
      filterButtons.forEach((btn) => {
        btn.classList.remove("active");
        btn.setAttribute("variant", "default"); // Reset to default variant
      });

      // Add active state to clicked button
      button.classList.add("active");
      button.setAttribute("variant", "primary"); // Shoelace Primary Style
    });
  });

  document.querySelectorAll(".sort-button").forEach((button) => {
    button.addEventListener("click", (e) => {
      const sortType = e.currentTarget.dataset.sort;
      forumManager.currentSort = sortType; // Update sort type
      forumManager.loadInitialPosts(); // Reload and sort posts
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
