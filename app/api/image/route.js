import { NextResponse } from "next/server";

/**
 * Image proxy to bypass LinkedIn CDN hotlink protection.
 *
 * GET /api/image?url=https://media.licdn.com/dms/image/...
 *
 * Fetches the image server-side (no CORS/referrer issues)
 * and streams it back to the client.
 */
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const imageUrl = searchParams.get("url");

  if (!imageUrl) {
    return NextResponse.json(
      { error: "Missing 'url' query parameter" },
      { status: 400 }
    );
  }

  // Only allow LinkedIn CDN domains
  if (!imageUrl.includes("media.licdn.com")) {
    return NextResponse.json(
      { error: "Only LinkedIn image URLs are allowed" },
      { status: 403 }
    );
  }

  try {
    const response = await fetch(imageUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36",
        Accept: "image/webp,image/apng,image/*,*/*;q=0.8",
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `LinkedIn CDN returned ${response.status}` },
        { status: response.status }
      );
    }

    const contentType = response.headers.get("content-type") || "image/jpeg";
    const buffer = await response.arrayBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, s-maxage=86400",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: `Failed to fetch image: ${err.message}` },
      { status: 500 }
    );
  }
}
