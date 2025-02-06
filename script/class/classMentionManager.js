class MentionManager {
  static init() {
    // Initialize Tribute with your configuration.
    this.tribute = new Tribute({
      trigger: "@",
      allowSpaces: true,
      lookup: "name",
      values: this.fetchMentionContacts,
      menuItemTemplate: this.mentionTemplate,
      selectTemplate: this.selectTemplate,
      menuContainer: document.body,
    });

    // Attach Tribute to the main post editor.
    const editor = document.getElementById("post-editor");
    this.tribute.attach(editor);

    // Optionally, add placeholder logic for any element with the class "editor".
    const styledEditors = document.querySelectorAll(".editor");
    styledEditors.forEach((singleEditor) => {
      function setPlaceholder() {
        if (!singleEditor.textContent.trim()) {
          singleEditor.innerHTML =
            '<span class="placeholder"><i>Type @ to mention someone...</i></span>';
        }
      }

      singleEditor.addEventListener("focus", () => {
        if (singleEditor.querySelector(".placeholder")) {
          singleEditor.innerHTML = "";
        }
      });

      singleEditor.addEventListener("blur", setPlaceholder);

      // Initialize placeholder.
      setPlaceholder();
    });
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
      cb([]);
    }
  }

  static mentionTemplate(item) {
    return `
      <div class="flex items-center gap-3 px-3 py-2">
        <img src="${item.original.profileImage}" 
            class="w-8 h-8 rounded-full object-cover" onerror="this.src='${CONFIG.api.defaultAuthorImage}'">
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
