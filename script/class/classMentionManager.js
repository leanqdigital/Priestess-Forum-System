class MentionManager {
    static init() {
      this.tribute = new Tribute({
        trigger: "@",
        allowSpaces: true,
        lookup: "name",
        values: this.fetchMentionContacts,
        menuItemTemplate: this.mentionTemplate,
        selectTemplate: this.selectTemplate,
        menuContainer: document.body,
      });
  
      const editor = document.getElementById("post-editor");
      this.tribute.attach(editor);
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
        console.error("Error fetching contacts:", error);
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