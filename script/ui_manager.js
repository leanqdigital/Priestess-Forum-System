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
      "fixed top-4 right-4 p-4 bg-green-100 text-green-700 rounded-lg shadow-lg";
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
            <div id="delete-confirmation-modal" class="fixed inset-0 modal-overlay bg-opacity-60 flex items-center justify-center z-[100]">
                <div class="p-6 rounded  relative z-[101] modal-background">
                    <h3 class="p2 text-white">${message}</h3>
                    <div class="flex justify-end gap-3 mt-4">
                        <button id="cancel-delete" class="button  o2 text-white">Cancel</button>
                        <button id="confirm-delete" class="text-white o2  button bg-danger-100 hover:bg-danger-200 transition-all">Delete</button>
                    </div>
                </div>
            </div>
        `;

      // Append modal to <body> to make sure it's always on top
      document.body.insertAdjacentHTML("beforeend", modalHTML);

      // Event listeners
      document.getElementById("cancel-delete").addEventListener("click", () => {
        document.getElementById("delete-confirmation-modal").remove();
        resolve(false);
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
});

window.addEventListener("load", function () {
  const loader = document.getElementById("loader");
  setTimeout(() => {
    loader.classList.add("fade-out");
  }, 500);
});

// Open New Post Modal
document.addEventListener("DOMContentLoaded", function () {
  document
    .getElementById("openCreateNewPostModal")
    .addEventListener("click", function () {
      document.getElementById("postNewModal").show();
    });
});
