// Your API key and endpoints
const API_KEY = "U6F6ofQc_Oes9BimgiEs5";
const WS_ENDPOINT = `wss://priestess.vitalstats.app/api/v1/graphql?apiKey=${API_KEY}`;
const HTTP_ENDPOINT = `https://priestess.vitalstats.app/api/v1/graphql`;

// Set the logged-in user's contact ID – ensure this is a number.
const LOGGED_IN_CONTACT_ID = CONFIG.api.userId; // Example value
console.log(LOGGED_IN_CONTACT_ID);
// courseIdToCheck is used to handle dynamic UI behavior.
let courseIdToCheck = CONFIG.api.currentCourseId;

// -----------------------------------------------------------
// Fetch Registered Courses of Logged in Member
const REGISTERD_COURSES_QUERY = `
query calcRegisteredMembersRegisteredCoursesMany(
  $id: PriestessContactID
) {
  calcRegisteredMembersRegisteredCoursesMany(
    query: [
      {
        where: {
          Registered_Member: [{ where: { id: $id } }]
        }
      }
    ]
  ) {
    Registered_Course_ID: field(arg: ["registered_course_id"])
  }
}

`;

// Step 1: Fetch registered courses for the logged-in user.
function fetchRegisteredCourses() {
  return fetch(HTTP_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Api-Key": API_KEY,
    },
    body: JSON.stringify({
      query: REGISTERD_COURSES_QUERY,
      variables: { id: LOGGED_IN_CONTACT_ID },
    }),
  })
    .then((response) => response.json())
    .then((data) => {
      const courses =
        data.data.calcRegisteredMembersRegisteredCoursesMany || [];
      // Return an array of course IDs (converted to numbers)
      return courses.map((course) => Number(course.Registered_Course_ID));
    })
    .catch((error) => {
      console.error("Error fetching registered courses:", error);
      return [];
    });
}
// -----------------------------------------------------------
// NEW SUBSCRIPTION QUERY using the updated structure
const SUBSCRIPTION_QUERY = `
subscription subscribeToCalcAnnouncements(
  $author_id: PriestessContactID
  $related_course_id: PriestessCourseID
  $id: PriestessContactID
  $limit: IntScalar
  $offset: IntScalar
) {
  subscribeToCalcAnnouncements(
    query: [
      {
        where: {
          Post: [
            {
              where: {
                author_id: $author_id
                _OPERATOR_: neq
              }
            }
            {
              andWhere: {
                related_course_id: $related_course_id
              }
            }
          ]
        }
      }
      {
        orWhere: {
          Post: [
            {
              where: {
                Mentioned_Users: [{ where: { id: $id } }]
              }
            }
          ]
        }
      }
      {
        orWhere: {
          Comment: [
            {
              where: {
                Comment_or_Reply_Mentions: [
                  { where: { id: $id } }
                ]
              }
            }
            {
              andWhere: {
                author_id: $author_id
                _OPERATOR_: neq
              }
            }
            {
              andWhere: {
                Forum_Post: [
                  {
                    where: {
                      related_course_id: $related_course_id
                    }
                  }
                ]
              }
            }
          ]
        }
      }
      {
        orWhere: {
          Comment: [
            {
              where: {
                author_id: $author_id
                _OPERATOR_: neq
              }
            }
            {
              andWhere: {
                Forum_Post: [
                  {
                    where: {
                      related_course_id: $related_course_id
                    }
                  }
                ]
              }
            }
          ]
        }
      }
    ]
    limit: $limit
    offset: $offset
    orderBy: [{ path: ["created_at"], type: desc }]
  ) {
    ID: field(arg: ["id"])
    Title: field(arg: ["title"])
    Content: field(arg: ["content"])
    Date_Added: field(arg: ["created_at"])
    Post_ID: field(arg: ["post_id"])
    Post_Related_Course_ID: field(
      arg: ["Post", "related_course_id"]
    )
    Course_Course_name: field(
      arg: ["Post", "Related_Course", "course_name"]
    )
    Comment_ID: field(arg: ["comment_id"])
    Comment_Forum_Post_ID: field(
      arg: ["Comment", "forum_post_id"]
    )
    ForumPost_Related_Course_ID: field(
      arg: ["Comment", "Forum_Post", "related_course_id"]
    )
    Course_Course_name1: field(
      arg: [
        "Comment"
        "Forum_Post"
        "Related_Course"
        "course_name"
      ]
    )
    ForumComment_Forum_Post_ID: field(
      arg: ["Comment", "Parent_Comment", "forum_post_id"]
    )
    ForumPost_Related_Course_ID1: field(
      arg: [
        "Comment"
        "Parent_Comment"
        "Forum_Post"
        "related_course_id"
      ]
    )
    Course_Course_name2: field(
      arg: [
        "Comment"
        "Forum_Post"
        "Related_Course"
        "course_name"
      ]
    )
    Contact_Contact_ID: field(
      arg: ["Comment", "Comment_or_Reply_Mentions", "id"]
    )
    Contact_Contact_ID1: field(
      arg: ["Post", "Mentioned_Users", "id"]
    )
    Contact_First_Name: field(
      arg: ["Comment", "Author", "first_name"]
    )
    Contact_Last_Name: field(
      arg: ["Comment", "Author", "last_name"]
    )
    Contact_First_Name1: field(
      arg: ["Post", "Author", "first_name"]
    )
    Contact_Last_Name1: field(
      arg: ["Post", "Author", "last_name"]
    )
    Type: field(arg: ["type"])
  }
}

`;

// -----------------------------------------------------------
// Query to fetch read status data
const READ_QUERY = `
  query calcOReadContactReadAnnouncements {
    calcOReadContactReadAnnouncements {
      Read_Announcement_ID: field(arg: ["read_announcement_id"])
      Read_Contact_ID: field(arg: ["read_contact_id"])
    }
  }
`;

// Mutation to mark a single announcement as read.
const MARK_READ_MUTATION = `
  mutation createOReadContactReadAnnouncement(
    $payload: OReadContactReadAnnouncementCreateInput = null
  ) {
    createOReadContactReadAnnouncement(payload: $payload) {
      Read_Announcement_ID: read_announcement_id
      Read_Contact_ID: read_contact_id
    }
  }
`;

// -----------------------------------------------------------
// Notification Containers & Buttons (for multiple areas)
const containerNavbar = document.getElementById(
  "parentNotificationTemplatesInNavbar"
);
const containerBody = document.getElementById(
  "parentNotificationTemplatesInBody"
);
const notificationsContainers = [];
if (containerNavbar) notificationsContainers.push(containerNavbar);
if (containerBody) notificationsContainers.push(containerBody);

const markAllButtons = document.querySelectorAll(".mark-all-button");

// -----------------------------------------------------------
// Variables to track notifications
let socket;
let keepAliveInterval;
const displayedNotifications = new Set();
const cardMap = new Map();
const readAnnouncements = new Set();
const pendingAnnouncements = new Set();

// -----------------------------------------------------------
// Helper: Get post details from a notification object
function getPostDetails(notification) {
  let postId = null,
    courseId = null,
    courseName = null;
  if (notification.Post_ID != null) {
    // New post announcement
    postId = notification.Post_ID;
    courseId = notification.Post_Related_Course_ID;
    courseName = notification.Course_Course_name;
  } else if (notification.Comment_ID != null) {
    // Comment or reply announcement
    if (notification.ForumComment_Forum_Post_ID) {
      // Reply: use parent's forum post id.
      postId = notification.ForumComment_Forum_Post_ID;
      courseId = notification.ForumPost_Related_Course_ID1;
      courseName = notification.Course_Course_name1 || null;
    } else if (notification.Comment_Forum_Post_ID) {
      // Comment scenario.
      postId = notification.Comment_Forum_Post_ID;
      courseId = notification.ForumPost_Related_Course_ID;
      courseName = notification.Course_Course_name1;
    }
  }
  return { postId, courseId, courseName };
}

// Helper: Convert Unix timestamp (seconds) to a relative time string.
function timeAgo(unixTimestamp) {
  const now = new Date();
  const date = new Date(unixTimestamp * 1000);
  const seconds = Math.floor((now - date) / 1000);
  let interval = Math.floor(seconds / 31536000);
  if (interval >= 1)
    return interval + " year" + (interval > 1 ? "s" : "") + " ago";
  interval = Math.floor(seconds / 2592000);
  if (interval >= 1)
    return interval + " month" + (interval > 1 ? "s" : "") + " ago";
  interval = Math.floor(seconds / 86400);
  if (interval >= 1)
    return interval + " day" + (interval > 1 ? "s" : "") + " ago";
  interval = Math.floor(seconds / 3600);
  if (interval >= 1)
    return interval + " hour" + (interval > 1 ? "s" : "") + " ago";
  interval = Math.floor(seconds / 60);
  if (interval >= 1)
    return interval + " min" + (interval > 1 ? "s" : "") + " ago";
  return "Just now";
}

// New helper to override title and content based on custom fields.
function getCustomTitleAndContent(notification) {
  let title = notification.Title; // default fallback
  let content = notification.Content; // default fallback

  // If post-related fields are available, use them.
  if (notification.Contact_Contact_ID1) {
    const creatorId = Number(notification.Contact_Contact_ID1);
    if (creatorId !== Number(LOGGED_IN_CONTACT_ID)) {
      title = "A new post has been created";
      content = `${notification.Contact_First_Name1} ${notification.Contact_Last_Name1} has created a post`;
    } else {
      title = "You have been mentioned in a post";
      content = `${notification.Contact_First_Name1} ${notification.Contact_Last_Name1} mentioned you in a post`;
    }
  } else if (notification.Contact_Contact_ID) {
    // Otherwise if comment-related fields are available, use them.
    const creatorId = Number(notification.Contact_Contact_ID);
    if (creatorId !== Number(LOGGED_IN_CONTACT_ID)) {
      title = "A new comment has been created";
      content = `${notification.Contact_First_Name} ${notification.Contact_Last_Name} has added a comment`;
    } else {
      title = "You have been mentioned in a post";
      content = `${notification.Contact_First_Name} ${notification.Contact_Last_Name} mentioned you in a comment`;
    }
  }
  return { title, content };
}

// -----------------------------------------------------------
// Create a notification card element.
function createNotificationCard(notification, isRead) {
  const card = document.createElement("div");
  card.className = "notification flex justify-between gap-2 load-comments-btn";
  card.setAttribute("data-id", String(notification.ID));

  const { postId, courseId, courseName } = getPostDetails(notification);
  if (postId) {
    card.setAttribute("data-post-id", String(postId));
    if (courseId) {
      card.setAttribute("data-course-id", String(courseId));
      if (courseId == courseIdToCheck) {
        card.setAttribute("x-on:click", "openCommentModal = true");
      } else {
        card.removeAttribute("x-on:click");
      }
    }
    if (courseName) {
      card.setAttribute("data-course-name", courseName);
    }
  }
  if (notification.Comment_ID) {
    card.setAttribute("data-comment-id", String(notification.Comment_ID));
  }

  // Use our helper to override title and content
  const { title, content } = getCustomTitleAndContent(notification);

  card.innerHTML = `
    <div class="w-full flex flex-col p-2 gap-[4px] cursor-pointer rounded ${
      isRead ? "" : "bg-unread"
    } hover:bg-primary hover:text-white">
      <div class="flex justify-between w-full gap-[4px]">
        <div class="text-sm font-semibold leading-none">${title}</div>
        <div class="text-xs leading-3">${timeAgo(notification.Date_Added)}</div>
      </div>
      <div class="text-xs leading-none">${content}</div>
    </div>
  `;
  // Click handler: mark as read and handle redirection or modal open.
  card.addEventListener("click", function () {
    const id = Number(card.getAttribute("data-id"));
    const postIdAttr = card.getAttribute("data-post-id");
    if (!postIdAttr) {
      console.log("No post found");
      return;
    }

    if (!readAnnouncements.has(id) && !pendingAnnouncements.has(id)) {
      markAsRead(id);
    }

    const notifCourseIdRaw = card.getAttribute("data-course-id");
    const notifCourseId = notifCourseIdRaw
      ? Number(notifCourseIdRaw.trim())
      : null;
    const notifCourseName = card.getAttribute("data-course-name");
    const currentCourseId = courseIdToCheck
      ? Number(courseIdToCheck.trim())
      : null;

    console.log("Current Course ID:", currentCourseId);
    console.log("Notification Course ID:", notifCourseId);
    console.log("Post ID:", postIdAttr);

    if (
      currentCourseId &&
      notifCourseId !== null &&
      currentCourseId === notifCourseId
    ) {
      const commentId = card.getAttribute("data-comment-id");
      if (commentId) {
        console.log("Comment id is", commentId);
        openCommentModal = true;
        setTimeout(() => {
          const commentEl = document.querySelector(
            `[data-comment-id="${commentId}"] .commentCard`
          );
          console.log("Comment Element is", commentEl);
          if (commentEl) {
            commentEl.scrollIntoView({ behavior: "smooth", block: "center" });
            commentEl.classList.add("highlight");
            setTimeout(() => {
              commentEl.classList.remove("highlight");
            }, 5000);
          }
        }, 1000);
        return;
      }
      return;
    } else {
      const formattedCourseName = notifCourseName
        ? notifCourseName.replace(/\s+/g, "-").toLowerCase()
        : "course";
      let redirectUrl = `https://library.priestesspresence.com/forum/${formattedCourseName}?pid=${postIdAttr}`;
      const commentId = card.getAttribute("data-comment-id");
      if (commentId) {
        redirectUrl += `&cid=${commentId}`;
      }
      console.log("Redirecting to:", redirectUrl);
      window.location.href = redirectUrl;
      return;
    }
  });

  return card;
}

// -----------------------------------------------------------
// Update "No notifications" message based on current notifications.
function updateNoNotificationsMessage() {
  const notificationContainers = document.querySelectorAll(
    "#parentNotificationTemplatesInNavbar, #parentNotificationTemplatesInBody"
  );
  notificationContainers.forEach((container) => {
    let messageDiv = container.querySelector(".no-notifications-message");
    if (displayedNotifications.size === 0) {
      if (!messageDiv) {
        messageDiv = document.createElement("div");
        messageDiv.className =
          "no-notifications-message text-black text-center p-2";
        messageDiv.textContent = "No notifications";
        container.appendChild(messageDiv);
      }
      messageDiv.style.display = "block";
    } else {
      if (messageDiv) {
        messageDiv.style.display = "none";
      }
    }
  });
}

// Process a single announcement notification.
function processNotification(notification) {
  const id = Number(notification.ID);
  if (displayedNotifications.has(id)) return;
  displayedNotifications.add(id);
  const isRead = readAnnouncements.has(id);
  const cards = [];
  notificationsContainers.forEach((container) => {
    const card = createNotificationCard(notification, isRead);
    container.appendChild(card);
    cards.push(card);
  });
  cardMap.set(id, cards);
  updateNoNotificationsMessage();
  updateRedDot();
}

// -----------------------------------------------------------
// Update notification read status styling.
function updateNotificationReadStatus() {
  cardMap.forEach((cards, id) => {
    cards.forEach((card) => {
      const innerDiv = card.firstElementChild;
      if (readAnnouncements.has(id)) {
        innerDiv.classList.remove("bg-unread");
      } else {
        if (!innerDiv.classList.contains("bg-unread")) {
          innerDiv.classList.add("bg-unread");
        }
      }
    });
  });
  updateRedDot();
  updateNoNotificationsMessage();
}

// Update the red dot indicator based on unread notifications.
function updateRedDot() {
  const redDot = document.querySelector(".red-dot");
  if (!redDot) return;
  const unreadCount = Array.from(displayedNotifications).filter(
    (id) => !readAnnouncements.has(id)
  ).length;
  console.log("Unread count is", unreadCount);
  if (unreadCount > 0) {
    redDot.classList.remove("hidden");
  } else {
    redDot.classList.add("hidden");
  }
}

// -----------------------------------------------------------
// Disable and re-enable UI for notifications during async updates.
function disableNotificationUI(announcementId) {
  const cards = cardMap.get(announcementId);
  if (cards) {
    cards.forEach((card) => {
      card.style.opacity = "0.5";
      card.style.pointerEvents = "none";
      card.style.cursor = "not-allowed";
    });
  }
}

function enableNotificationUI(announcementId) {
  const cards = cardMap.get(announcementId);
  if (cards) {
    cards.forEach((card) => {
      card.style.opacity = "1";
      card.style.pointerEvents = "auto";
      card.style.cursor = "pointer";
    });
  }
}

// Mark a single announcement as read.
function markAsRead(announcementId) {
  if (
    pendingAnnouncements.has(announcementId) ||
    readAnnouncements.has(announcementId)
  )
    return;
  pendingAnnouncements.add(announcementId);
  disableNotificationUI(announcementId);
  const variables = {
    payload: {
      read_announcement_id: announcementId,
      read_contact_id: LOGGED_IN_CONTACT_ID,
    },
  };
  fetch(HTTP_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Api-Key": API_KEY,
    },
    body: JSON.stringify({
      query: MARK_READ_MUTATION,
      variables: variables,
    }),
  })
    .then((response) => response.json())
    .then((data) => {
      pendingAnnouncements.delete(announcementId);
      if (data.data && data.data.createOReadContactReadAnnouncement) {
        readAnnouncements.add(announcementId);
        enableNotificationUI(announcementId);
        updateNotificationReadStatus();
      } else {
        enableNotificationUI(announcementId);
      }
    })
    .catch((error) => {
      pendingAnnouncements.delete(announcementId);
      console.error("Error marking notification as read:", error);
      enableNotificationUI(announcementId);
    });
}

// Mark all unread announcements as read.
async function markAllAsRead() {
  const unreadAnnouncementIds = [...displayedNotifications].filter(
    (id) => !readAnnouncements.has(id)
  );
  if (unreadAnnouncementIds.length === 0) return;
  markAllButtons.forEach((btn) => btn.classList.add("disabled"));
  const promises = unreadAnnouncementIds.map((announcementId) =>
    markAsRead(announcementId)
  );
  await Promise.all(promises);
  updateNotificationReadStatus();
  markAllButtons.forEach((btn) => btn.classList.remove("disabled"));
}

// -----------------------------------------------------------
// Fetch the read announcements for the logged-in user.
function fetchReadData() {
  fetch(HTTP_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Api-Key": API_KEY,
    },
    body: JSON.stringify({ query: READ_QUERY }),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.data && data.data.calcOReadContactReadAnnouncements) {
        const records = Array.isArray(
          data.data.calcOReadContactReadAnnouncements
        )
          ? data.data.calcOReadContactReadAnnouncements
          : [data.data.calcOReadContactReadAnnouncements];
        records.forEach((record) => {
          if (Number(record.Read_Contact_ID) === Number(LOGGED_IN_CONTACT_ID)) {
            readAnnouncements.add(Number(record.Read_Announcement_ID));
          }
        });
        updateNotificationReadStatus();
        updateNoNotificationsMessage();
      }
    })
    .catch((error) => {
      console.error("Error fetching read data:", error);
    });
}

// -----------------------------------------------------------
// Send a KEEP_ALIVE message over the WebSocket.
function sendKeepAlive() {
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({ type: "KEEP_ALIVE" }));
  }
}

// Connect to the WebSocket and subscribe for announcements for each registered course.
function connect() {
  socket = new WebSocket(WS_ENDPOINT, "vitalstats");

  socket.onopen = () => {
    socket.send(JSON.stringify({ type: "connection_init" }));
    keepAliveInterval = setInterval(sendKeepAlive, 28000);

    // Fetch registered courses and subscribe for each course's announcements.
    fetchRegisteredCourses().then((registeredCourseIds) => {
      console.log("Registered Course IDs:", registeredCourseIds);
      registeredCourseIds.forEach((courseId, index) => {
        const subscriptionId = `sub-${courseId}-${index}`;
        socket.send(
          JSON.stringify({
            id: subscriptionId,
            type: "GQL_START",
            payload: {
              query: SUBSCRIPTION_QUERY,
              variables: {
                author_id: LOGGED_IN_CONTACT_ID,
                id: LOGGED_IN_CONTACT_ID,
                related_course_id: courseId,
              },
            },
          })
        );
      });
    });

    // Fetch the read announcements on page load.
    fetchReadData();
  };

  socket.onmessage = (event) => {
    const data = JSON.parse(event.data);
    console.log(data, "EventData");
    if (data.type !== "GQL_DATA") return;
    if (!data.payload || !data.payload.data) return;
    const result = data.payload.data.subscribeToCalcAnnouncements;
    if (!result) return;
    const notifications = Array.isArray(result) ? result : [result];
    notifications.forEach(processNotification);
  };

  socket.onclose = () => {
    clearInterval(keepAliveInterval);
  };

  socket.onerror = (error) => {
    console.error("WebSocket error:", error);
  };
}

// -----------------------------------------------------------
// Attach event listeners for "Mark all as read" buttons.
markAllButtons.forEach((btn) => {
  btn.addEventListener("click", markAllAsRead);
});

// Start the connection.
connect();
