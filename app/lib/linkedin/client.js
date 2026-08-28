/**
 * LinkedIn Voyager API Client
 *
 * Makes authenticated HTTP requests to LinkedIn's internal Rest.li API.
 * Uses the confirmed endpoint:
 *
 *   GET /voyager/api/identity/dash/profiles
 *       ?q=memberIdentity
 *       &memberIdentity={vanityName}
 *       &decorationId=com.linkedin.voyager.dash.deco.identity.profile.FullProfileWithEntities-93
 *
 * This single request returns the complete profile entity graph including:
 *   Profile, Positions, Education, Skills, Certifications, Languages,
 *   Companies, Schools, Geo locations, and more.
 *
 * Authentication:
 *   - Cookie: li_at (session token) + JSESSIONID (CSRF session)
 *   - Header: csrf-token = unquoted JSESSIONID value
 */

const VOYAGER_BASE = "https://www.linkedin.com/voyager/api";
const DECORATION_ID =
  "com.linkedin.voyager.dash.deco.identity.profile.FullProfileWithEntities-93";

// Rate limiting: track last request time to enforce minimum spacing
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL_MS = 1000; // 1 second between requests

/**
 * Build the full header set that mimics a real LinkedIn browser session.
 * @returns {object} Headers object
 */
function buildHeaders() {
  const liAt = process.env.LINKEDIN_LI_AT;
  const jsessionId = process.env.LINKEDIN_JSESSIONID;

  if (!liAt || !jsessionId) {
    throw new Error(
      "Missing LINKEDIN_LI_AT or LINKEDIN_JSESSIONID environment variables."
    );
  }

  // CSRF token: must be the unquoted JSESSIONID value
  const csrfToken = jsessionId.replace(/^"|"$/g, "");

  return {
    accept: "application/vnd.linkedin.normalized+json+2.1",
    "accept-language": "en-US,en;q=0.9",
    "csrf-token": csrfToken,
    "x-restli-protocol-version": "2.0.0",
    "x-li-lang": "en_US",
    "x-li-page-instance":
      "urn:li:page:d_flagship3_profile_view_base;voyager-api",
    "x-li-track": JSON.stringify({
      clientVersion: "1.13.46312",
      mpVersion: "1.13.46312",
      osName: "web",
      timezoneOffset: 5.5,
      timezone: "Asia/Calcutta",
      deviceFormFactor: "DESKTOP",
      mpName: "voyager-web",
      displayDensity: 1.25,
      displayWidth: 1920,
      displayHeight: 1080,
    }),
    "user-agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36",
    "sec-ch-ua":
      '"Not=A?Brand";v="99", "Google Chrome";v="151", "Chromium";v="151"',
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": '"Windows"',
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "same-origin",
    cookie: `li_at=${liAt}; JSESSIONID="${jsessionId}"`,
  };
}

/**
 * Enforce minimum delay between consecutive requests to protect the account.
 */
async function throttle() {
  const now = Date.now();
  const elapsed = now - lastRequestTime;

  if (elapsed < MIN_REQUEST_INTERVAL_MS) {
    const waitTime = MIN_REQUEST_INTERVAL_MS - elapsed;
    await new Promise((resolve) => setTimeout(resolve, waitTime));
  }

  lastRequestTime = Date.now();
}

/**
 * Fetch a complete LinkedIn profile by vanity name.
 *
 * @param {string} vanityName - The LinkedIn public identifier (e.g., "satyanadella")
 * @returns {Promise<{ success: boolean, data?: object, included?: array, error?: string, status?: number }>}
 */
export async function fetchLinkedInProfile(vanityName) {
  await throttle();

  const url =
    `${VOYAGER_BASE}/identity/dash/profiles` +
    `?q=memberIdentity` +
    `&memberIdentity=${vanityName}` +
    `&decorationId=${DECORATION_ID}`;

  try {
    const headers = buildHeaders();

    const response = await fetch(url, {
      method: "GET",
      headers,
      redirect: "follow",
    });

    // Handle specific HTTP error codes
    if (response.status === 401 || response.status === 403) {
      return {
        success: false,
        status: 401,
        error:
          "LinkedIn session expired or invalid. Please update your li_at and JSESSIONID cookies.",
      };
    }

    if (response.status === 404) {
      return {
        success: false,
        status: 404,
        error: `LinkedIn profile not found: "${vanityName}"`,
      };
    }

    if (response.status === 429) {
      return {
        success: false,
        status: 429,
        error:
          "LinkedIn rate limit reached. Please wait a few minutes before trying again.",
      };
    }

    if (!response.ok) {
      return {
        success: false,
        status: response.status,
        error: `LinkedIn returned HTTP ${response.status}`,
      };
    }

    const rawData = await response.json();

    // Validate response has expected structure
    if (!rawData.included || !Array.isArray(rawData.included)) {
      return {
        success: false,
        status: 502,
        error: "Unexpected response structure from LinkedIn API.",
      };
    }

    if (rawData.included.length === 0) {
      return {
        success: false,
        status: 404,
        error: `No profile data returned for: "${vanityName}"`,
      };
    }

    return {
      success: true,
      data: rawData.data,
      included: rawData.included,
    };
  } catch (err) {
    return {
      success: false,
      status: 500,
      error: `Failed to fetch LinkedIn profile: ${err.message}`,
    };
  }
}
