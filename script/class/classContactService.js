class ContactService {
  static async fetchContacts() {
    try {
      const query = `
          query calcContacts {
            calcContacts {
              Contact_ID: field(arg: ["id"])
              First_Name: field(arg: ["first_name"])
              Last_Name: field(arg: ["last_name"])
              Profile_Image: field(arg: ["profile_image"])
            }
          }
        `;
      const data = await ApiService.query(query);
      return data.calcContacts.map((contact) => ({
        id: contact.Contact_ID,
        name: `${contact.First_Name} ${contact.Last_Name}`,
        profileImage: contact.Profile_Image || CONFIG.api.defaultAuthorImage,
      }));
    } catch (error) {
      return [];
    }
  }
}
