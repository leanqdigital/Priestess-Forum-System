class MentionManager {
  static init() {
    // Initialize Tribute with your configuration.
    this.tribute = new Tribute({
      trigger: "@",
      allowSpaces: true,
      lookup: "name",
      values: this.fetchMentionContacts.bind(this),
      menuItemTemplate: this.mentionTemplate,
      selectTemplate: this.selectTemplate,
      menuContainer: document.body,
    });

    // Attach Tribute to the main post editor.
    const editor = document.getElementById("post-editor");
    this.tribute.attach(editor);
  }

  // Fetch contacts that can be mentioned and add an "@all" option.
  static async fetchMentionContacts(text, cb) {
    try {
      const contacts = await ContactService.fetchContacts(courseID);
      // Cache all contacts for later use.
      this.allContacts = contacts;

      // Create a special "@all" option.
      const allOption = {
        id: "all",
        name: "All",
        profileImage: CONFIG.api.defaultAuthorImage,
      };

      // Prepend the special option.
      const contactList = [allOption, ...contacts];

      // Map contacts for Tribute.
      cb(
        contactList.map((contact) => ({
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
             class="w-8 h-8 rounded-full object-cover" 
             onerror="this.src='${CONFIG.api.defaultAuthorImage}'">
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
