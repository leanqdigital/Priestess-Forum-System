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
  document.getElementById('openCreateNewPostModal').addEventListener('click', function () {
    document.getElementById('postNewModal').show();
  });
});