class ContactService {
  static async fetchContacts(courseID) {
    try {
      const query = `
        query calcRegisteredMembersRegisteredCoursesMany(
        $registered_course_id: PriestessCourseID
         $name: TextScalar
        ) {
          calcRegisteredMembersRegisteredCoursesMany(
            query: [
              {
                where: {
                  registered_course_id: $registered_course_id
                }
              }
              {
                andWhere: {
                  Registered_Member: [
                    {
                      where: {
                        TagsData: [
                          {
                            where: {
                              Tag: [
                                {
                                  where: {
                                    name: $name
                                  }
                                }
                              ]
                            }
                          }
                        ]
                      }
                    }
                  ]
                }
              }
            ]
          ) {
            Registered_Member_Contact_ID: field(arg: ["Registered_Member", "id"])
            Registered_Member_First_Name: field(arg: ["Registered_Member", "first_name"])
            Registered_Member_Last_Name: field(arg: ["Registered_Member", "last_name"])
            Registered_Member_Profile_Image: field(arg: ["Registered_Member", "profile_image"])
            Registered_Member_Display_Name: field(arg: ["Registered_Member", "display_name"])
            Registered_Member_Forum_Image: field(arg: ["Registered_Member", "forum_image"])
          }
        }
      `;

      const variables = { 
        registered_course_id: courseID,
        name: CONFIG.api.activeFourmTag,
      };

      const data = await ApiService.query(query, variables);

      return data.calcRegisteredMembersRegisteredCoursesMany.map((contact) => ({
        id: contact.Registered_Member_Contact_ID,
        name: contact.Registered_Member_Display_Name || "Anonymous",
        profileImage:
          contact.Registered_Member_Forum_Image ||
          CONFIG.api.defaultAuthorImage,
      }));
    } catch (error) {
      return [];
    }
  }
}
