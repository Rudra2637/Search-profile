/**
 * LinkedIn URL Parser
 *
 * Extracts the vanity username (public identifier) from various
 * LinkedIn profile URL formats.
 *
 * Supported formats:
 *   - https://www.linkedin.com/in/satyanadella
 *   - https://linkedin.com/in/satyanadella/
 *   - https://www.linkedin.com/in/satyanadella?param=value
 *   - linkedin.com/in/satyanadella
 *   - in/satyanadella
 *   - satyanadella
 */

/**
 * Extract the vanity name from a LinkedIn profile URL or raw string.
 * @param {string} input - A LinkedIn profile URL or vanity name.
 * @returns {{ vanityName: string } | { error: string }}
 */
export function extractVanityName(input) {
  if (!input || typeof input !== "string") {
    return { error: "No LinkedIn profile URL or username provided." };
  }

  let cleaned = input.trim();

  // If input contains /in/ (e.g. linkedin.com/in/username, https://.../in/username, in/username)
  if (cleaned.includes("/in/") || cleaned.startsWith("in/")) {
    const match = cleaned.match(/(?:^|\/|\.)in\/([a-zA-Z0-9\-_]+)/i);
    if (match && match[1]) {
      return validateVanity(match[1]);
    }
  }

  // If it's a full URL without /in/ (e.g. https://www.linkedin.com/satyanadella)
  if (cleaned.includes("linkedin.com")) {
    if (!cleaned.startsWith("http")) {
      cleaned = "https://" + cleaned;
    }
    try {
      const url = new URL(cleaned);
      const parts = url.pathname.split("/").filter(Boolean);
      if (parts.length > 0) {
        const candidate = parts[parts.length - 1];
        return validateVanity(candidate);
      }
    } catch {
      // Fall through to raw validation
    }
  }

  // Treat as raw vanity name
  return validateVanity(cleaned);
}

/**
 * Validate that a vanity name looks reasonable.
 * LinkedIn vanity names: 3-100 chars, alphanumeric + hyphens.
 * @param {string} vanity
 * @returns {{ vanityName: string } | { error: string }}
 */
function validateVanity(vanity) {
  if (!vanity) {
    return { error: "Empty username extracted from URL." };
  }

  // LinkedIn vanity names allow letters, numbers, and hyphens
  const pattern = /^[a-zA-Z0-9\-]+$/;
  if (!pattern.test(vanity)) {
    return {
      error: `Invalid LinkedIn username: "${vanity}". Only letters, numbers, and hyphens are allowed.`,
    };
  }

  if (vanity.length < 2 || vanity.length > 100) {
    return {
      error: `Invalid LinkedIn username length: "${vanity}". Expected 2-100 characters.`,
    };
  }

  return { vanityName: vanity.toLowerCase() };
}
