// Your API key and endpoints
const API_KEY = "U6F6ofQc_Oes9BimgiEs5";
const WS_ENDPOINT = `wss://priestess.vitalstats.app/api/v1/graphql?apiKey=${API_KEY}`;
const HTTP_ENDPOINT = `https://priestess.vitalstats.app/api/v1/graphql`;
// Set the logged-in user's contact ID – ensure this is a number.
const LOGGED_IN_CONTACT_ID = CONFIG.api.userId; // Example value
let courseIdToCheck = CONFIG.api.currentCourseId;

// NEW SUBSCRIPTION QUERY using the updated structure
const SUBSCRIPTION_QUERY = `
subscription subscribeToCalcAnnouncements(
  $author_id: PriestessContactID
  $id: PriestessContactID
) {
  subscribeToCalcAnnouncements(
    query: [
      {
        where: {
          Comment: [
            {
              where: {
                Forum_Post: [
                  {
                    where: {
                      author_id: $author_id
                      _OPERATOR_: neq
                    }
                  }
                ]
              }
            }
            {
              andWhere: {
                Comment_or_Reply_Mentions: [
                  { where: { id: $id } }
                ]
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
                author_id: $author_id
                _OPERATOR_: neq
              }
            }
            {
              andWhere: {
                Mentioned_Users: [{ where: { id: $id } }]
              }
            }
          ]
        }
      }
    ]
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
  }
}
`;

// Query to fetch read status data (using your provided query)
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

// --------------------------------------------------------------------
// Instead of one container, we now support multiple containers.
// These IDs should match your markup.
const containerNavbar = document.getElementById(
  "parentNotificationTemplatesInNavbar"
);
const containerBody = document.getElementById(
  "parentNotificationTemplatesInBody"
);
const notificationsContainers = [];
if (containerNavbar) notificationsContainers.push(containerNavbar);
if (containerBody) notificationsContainers.push(containerBody);

// Query all "Mark all as read" buttons using a common class.
const markAllButtons = document.querySelectorAll(".mark-all-button");

let socket;
let keepAliveInterval;
// A set to track which announcement IDs have been processed.
const displayedNotifications = new Set();
// A map to hold, for each announcement ID, an array of its card elements (one per container).
const cardMap = new Map();
// Set to track read announcement IDs for the logged-in user (stored as numbers).
const readAnnouncements = new Set();
// Set to track announcements for which a "mark as read" mutation is in-flight.
const pendingAnnouncements = new Set();

// --------------------------------------------------------------------
// UPDATED HELPER FUNCTION: getPostDetails
// This function examines the notification (using the new field names) and returns an object with:
// - postId: the id of the related post (whether directly, via a comment, or via a reply)
// - courseId: the id of the course related to the post
// - courseName: the course name (to be used in the URL)
function getPostDetails(notification) {
  let postId = null,
    courseId = null,
    courseName = null;
  commentId = null;
  if (notification.Post_ID !== null && notification.Post_ID !== undefined) {
    // Announcement triggered by a new post.
    postId = notification.Post_ID;
    courseId = notification.Post_Related_Course_ID;
    courseName = notification.Course_Course_name;
  } else if (
    notification.Comment_ID !== null &&
    notification.Comment_ID !== undefined
  ) {
    // Announcement triggered by a comment or a reply.
    if (notification.ForumComment_Forum_Post_ID) {
      // Reply scenario: using parent's forum post id.
      postId = notification.ForumComment_Forum_Post_ID;
      courseId = notification.ForumPost_Related_Course_ID1;
      // Optionally, if a course name is available from the comment branch, use it.
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

function createNotificationCard(notification, isRead) {
  // Create the card element.
  const card = document.createElement("div");
  card.className = "notification flex justify-between gap-2 load-comments-btn";
  // Save the numeric ID as a string attribute.
  card.setAttribute("data-id", String(notification.ID));

  // Get the post details using the updated helper.
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

  // NEW: If the notification has a Comment_ID, add it as a data attribute.
  if (notification.Comment_ID) {
    card.setAttribute("data-comment-id", String(notification.Comment_ID));
  }

  card.innerHTML = `
    <div class="w-full flex flex-col p-2 gap-[4px] cursor-pointer rounded ${
      isRead ? "" : "bg-unread"
    } hover:bg-[#022327]">
      <div class="flex justify-between w-full gap-[4px]">
        <div class="text-white text-sm font-semibold leading-none">${
          notification.Title
        }</div>
        <div class="text-white text-xs leading-3">${timeAgo(
          notification.Date_Added
        )}</div>
      </div>
      <div class="text-white text-xs leading-none">${notification.Content}</div>
    </div>
  `;

  // Inside the createNotificationCard function's click handler:
  card.addEventListener("click", function () {
    const id = Number(card.getAttribute("data-id"));
    const postIdAttr = card.getAttribute("data-post-id");
    if (!postIdAttr) {
      console.log("No post found");
      return;
    }

    // Mark as read if needed
    if (!readAnnouncements.has(id) && !pendingAnnouncements.has(id)) {
      markAsRead(id);
    }

    // Retrieve course details
    const notifCourseIdRaw = card.getAttribute("data-course-id");
    const notifCourseId = notifCourseIdRaw
      ? Number(notifCourseIdRaw.trim())
      : null;
    const notifCourseName = card.getAttribute("data-course-name");
    const currentCourseId = courseIdToCheck
      ? Number(courseIdToCheck.trim())
      : null;

    // Debugging logs
    console.log("Current Course ID:", currentCourseId);
    console.log("Notification Course ID:", notifCourseId);
    console.log("Post ID:", postIdAttr);

    // Check if course IDs exist and match
    if (
      currentCourseId &&
      notifCourseId !== null &&
      currentCourseId === notifCourseId
    ) {
      const commentId = card.getAttribute("data-comment-id");

      // If it's a comment announcement, open the modal and then scroll to/highlight the comment.
      if (commentId) {
        console.log("Comment id is", commentId);
        // Open the comment modal (your existing code already sets openCommentModal = true)
        openCommentModal = true;

        // Give the modal a short delay to render (adjust the delay if needed)
        setTimeout(() => {
          // Find the element with the matching data-comment-id that contains the .commentCard
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
        }, 1000); // delay (in milliseconds) to ensure the modal is fully rendered

        // Stop further redirection logic
        return;
      }
      return;
    } else {
      // Course IDs don't match or missing, redirect
      const formattedCourseName = notifCourseName
        ? notifCourseName.replace(/\s+/g, "-").toLowerCase()
        : "course";
      let redirectUrl = `https://library.priestesspresence.com/forum/${formattedCourseName}?pid=${postIdAttr}`;
      // Append comment id if available
      const commentId = card.getAttribute("data-comment-id");
      if (commentId) {
        redirectUrl += `&cid=${commentId}`;
      }
      console.log("Redirecting to:", redirectUrl);
      window.location.href = redirectUrl;
      return; // Exit to prevent further execution
    }
  });

  return card;
}

function updateNoNotificationsMessage() {
  const notificationContainers = document.querySelectorAll(
    "#parentNotificationTemplatesInNavbar, #parentNotificationTemplatesInBody"
  );

  notificationContainers.forEach((container) => {
    let messageDiv = container.querySelector(".no-notifications-message");

    // If no notifications exist, show the message
    if (displayedNotifications.size === 0) {
      if (!messageDiv) {
        messageDiv = document.createElement("div");
        messageDiv.className =
          "no-notifications-message text-white text-center p-2";
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
// For each announcement (by its unique ID), create a card clone for each container and store them in cardMap.
function processNotification(notification) {
  const id = Number(notification.ID);
  if (displayedNotifications.has(id)) return; // already processed
  displayedNotifications.add(id);
  const isRead = readAnnouncements.has(id);
  const cards = [];
  notificationsContainers.forEach((container) => {
    const card = createNotificationCard(notification, isRead);
    container.appendChild(card);
    cards.push(card);
  });
  cardMap.set(id, cards);

  // Update message visibility
  updateNoNotificationsMessage();
}

// Update styling of each rendered notification based on read status.
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
  updateNoNotificationsMessage(); // Check for empty state
}

function updateRedDot() {
  // Select the red dot element.
  // Ensure your red dot element has a class (or id) that uniquely identifies it.
  const redDot = document.querySelector(".red-dot");
  if (!redDot) return; // exit if not found

  // Calculate unread announcements.
  // (displayedNotifications.size gives total announcements; readAnnouncements.size gives those marked as read)
  const unreadCount = displayedNotifications.size - readAnnouncements.size;

  if (unreadCount > 0) {
    redDot.classList.remove("hidden");
  } else {
    redDot.classList.add("hidden");
  }
}

// Disable UI for a notification across all containers.
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

// Re-enable UI for a notification across all containers.
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

// Mark all unread announcements as read by iterating over each and calling markAsRead.
async function markAllAsRead() {
  // Compute unread announcement IDs.
  const unreadAnnouncementIds = [...displayedNotifications].filter(
    (id) => !readAnnouncements.has(id)
  );
  if (unreadAnnouncementIds.length === 0) return;

  // Disable all "Mark all as read" buttons while processing.
  markAllButtons.forEach((btn) => btn.classList.add("disabled"));

  // For each unread announcement, call markAsRead.
  const promises = unreadAnnouncementIds.map((announcementId) =>
    markAsRead(announcementId)
  );
  await Promise.all(promises);

  // After all are processed, update the UI.
  updateNotificationReadStatus();
  markAllButtons.forEach((btn) => btn.classList.remove("disabled"));
}

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
        updateNoNotificationsMessage(); // Check after fetching
      }
    })
    .catch((error) => {
      console.error("Error fetching read data:", error);
    });
}

// Send a KEEP_ALIVE message over the WebSocket.
function sendKeepAlive() {
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({ type: "KEEP_ALIVE" }));
  }
}

// Connect to the announcements WebSocket and fetch initial read data.
function connect() {
  socket = new WebSocket(WS_ENDPOINT, "vitalstats");

  socket.onopen = () => {
    socket.send(JSON.stringify({ type: "connection_init" }));
    keepAliveInterval = setInterval(sendKeepAlive, 28000);
    // Start the announcements subscription (id "1") using the new query and variables.
    socket.send(
      JSON.stringify({
        id: "1",
        type: "GQL_START",
        payload: {
          query: SUBSCRIPTION_QUERY,
          variables: {
            author_id: LOGGED_IN_CONTACT_ID,
            id: LOGGED_IN_CONTACT_ID,
          },
        },
      })
    );

    // Fetch the read announcements data on page load.
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

// Attach event listeners for all "Mark all as read" buttons.
markAllButtons.forEach((btn) => {
  btn.addEventListener("click", markAllAsRead);
});

connect();
