// Your API key and endpoints
const API_KEY = "U6F6ofQc_Oes9BimgiEs5";
const WS_ENDPOINT = `wss://priestess.vitalstats.app/api/v1/graphql?apiKey=${API_KEY}`;
const HTTP_ENDPOINT = `https://priestess.vitalstats.app/api/v1/graphql`;

// Subscription query for announcements (using your provided query)
const SUBSCRIPTION_QUERY = `
  subscription subscribeToAnnouncements {
    subscribeToAnnouncements (
      orderBy: [{ path: ["created_at"], type: desc }]
    ){
      ID: id
      Title: title
      Content: content
      Date_Added: created_at
      Post_ID: post_id
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

// Set the logged-in user's contact ID – ensure this is a number.
const LOGGED_IN_CONTACT_ID = CONFIG.api.userId; // Example value

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

// Create a notification card element (for one container).
function createNotificationCard(notification, isRead) {
  // Create the card element.
  const card = document.createElement("div");
  card.className = "notification flex justify-between gap-2 load-comments-btn";
  // Save the numeric ID as a string attribute.
  card.setAttribute("data-id", String(notification.ID));
  card.setAttribute("x-on:click", "openCommentModal = true");
  card.setAttribute("data-post-id", String(notification.Post_ID));

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

  // On click, mark as read if not already marked or pending.
  card.addEventListener("click", function () {
    const id = Number(card.getAttribute("data-id"));
    if (readAnnouncements.has(id) || pendingAnnouncements.has(id)) return;
    markAsRead(id);
  });

  return card;
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
  // Update the red dot visibility after notifications update.
  updateRedDot();
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
// For example, call updateRedDot() after fetching read data.
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
        const records = Array.isArray(data.data.calcOReadContactReadAnnouncements)
          ? data.data.calcOReadContactReadAnnouncements
          : [data.data.calcOReadContactReadAnnouncements];
        records.forEach((record) => {
          if (Number(record.Read_Contact_ID) === Number(LOGGED_IN_CONTACT_ID)) {
            readAnnouncements.add(Number(record.Read_Announcement_ID));
          }
        });
        updateNotificationReadStatus();
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
    // Start the announcements subscription (id "1")
    socket.send(
      JSON.stringify({
        id: "1",
        type: "GQL_START",
        payload: { query: SUBSCRIPTION_QUERY },
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
    const result = data.payload.data.subscribeToAnnouncements;
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
