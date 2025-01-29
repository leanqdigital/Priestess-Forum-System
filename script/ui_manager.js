// UI Manager
class UIManager {
  static showError(message) {
    const errorDisplay = document.querySelector(CONFIG.selectors.errorDisplay);
    errorDisplay.textContent = message;
    errorDisplay.classList.remove("hidden");
    setTimeout(() => errorDisplay.classList.add("hidden"), 5000);
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
