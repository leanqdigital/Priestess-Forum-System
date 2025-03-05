const tabs = document.querySelectorAll(".tab-Button");

const textElement = document.querySelector(".post-title-text");
tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    tabs.forEach((t) => t.classList.remove("tab-Active"));
    tabs.forEach((t) => t.classList.add("tab-Inactive"));
    tab.classList.add("tab-Active");
    tab.classList.remove("tab-Inactive");
  });
});
