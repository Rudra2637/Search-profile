import { NextResponse } from "next/server";
import { extractVanityName } from "@/app/lib/linkedin/parser";
import { fetchLinkedInProfile } from "@/app/lib/linkedin/client";
import { normalizeProfile } from "@/app/lib/linkedin/normalizer";
import { getCachedProfile, setCachedProfile } from "@/app/lib/linkedin/cache";

// Standard CORS headers so evaluators can call the API from any client
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

/**
 * Handle OPTIONS preflight requests for CORS.
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}

/**
 * Core handler for fetching and normalizing a LinkedIn profile.
 *
 * @param {string} inputUrl - The raw profile URL or vanity name.
 * @returns {Promise<NextResponse>}
 */
async function handleProfileRequest(inputUrl) {
  if (!inputUrl) {
    return NextResponse.json(
      {
        success: false,
        error: "Missing required parameter: 'url'. Provide a LinkedIn profile URL or username.",
        example: "/api/profile?url=https://www.linkedin.com/in/satyanadella",
      },
      { status: 400, headers: corsHeaders }
    );
  }

  // 1. Extract and validate vanity name
  const parseResult = extractVanityName(inputUrl);
  if (parseResult.error) {
    return NextResponse.json(
      {
        success: false,
        error: parseResult.error,
      },
      { status: 400, headers: corsHeaders }
    );
  }

  const { vanityName } = parseResult;

  // 2. Check in-memory cache (prevents duplicate hits to LinkedIn & protects session)
  const cachedData = getCachedProfile(vanityName);
  if (cachedData) {
    return NextResponse.json(
      {
        success: true,
        cached: true,
        vanityName,
        data: cachedData,
      },
      { status: 200, headers: corsHeaders }
    );
  }

  // 3. Fetch raw entity graph from LinkedIn Voyager REST API
  const fetchResult = await fetchLinkedInProfile(vanityName);
  if (!fetchResult.success) {
    return NextResponse.json(
      {
        success: false,
        error: fetchResult.error,
        vanityName,
      },
      { status: fetchResult.status || 500, headers: corsHeaders }
    );
  }

  // 4. Normalize entity graph into structured profile schema
  try {
    const normalized = normalizeProfile(fetchResult.included);

    // 5. Store in cache (1 hour TTL)
    setCachedProfile(vanityName, normalized);

    return NextResponse.json(
      {
        success: true,
        cached: false,
        vanityName,
        data: normalized,
      },
      { status: 200, headers: corsHeaders }
    );
  } catch (err) {
    console.error("Profile normalization error:", err);
    return NextResponse.json(
      {
        success: false,
        error: `Failed to parse profile data: ${err.message}`,
        vanityName,
      },
      { status: 500, headers: corsHeaders }
    );
  }
}

/**
 * GET /api/profile?url=https://www.linkedin.com/in/username
 */
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const urlParam = searchParams.get("url") || searchParams.get("username") || searchParams.get("vanity");
  return handleProfileRequest(urlParam);
}

/**
 * POST /api/profile
 * Body: { "url": "https://www.linkedin.com/in/username" }
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const urlParam = body.url || body.username || body.vanity;
    return handleProfileRequest(urlParam);
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: "Invalid JSON body. Expected: { \"url\": \"https://www.linkedin.com/in/username\" }",
      },
      { status: 400, headers: corsHeaders }
    );
  }
}
