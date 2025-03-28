class Formatter {
  static formatTimestamp(timestamp) {
    if (!timestamp) return ""; // or return "No date available";
    const seconds = Math.floor((Date.now() - timestamp * 1000) / 1000);
    const intervals = [
      [31536000, "year"],
      [2592000, "month"],
      [86400, "day"],
      [3600, "hour"],
      [60, "minute"],
    ];
    for (const [secondsIn, unit] of intervals) {
      const interval = Math.floor(seconds / secondsIn);
      if (interval >= 1) {
        return `${interval} ${unit}${interval > 1 ? "s" : ""} ago`;
      }
    }
    return `${seconds} seconds ago`;
  }
  

  static formatAuthor(authorData) {
    return {
      name:
        [authorData.firstName, authorData.lastName].filter(Boolean).join(" ") ||
        "Anonymous",
      profileImage: authorData.profileImage || CONFIG.api.defaultAuthorImage,
      authorDisplayName: authorData.displayName || "Anonymous",
    };
  }
}
