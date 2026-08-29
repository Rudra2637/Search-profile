# LinkedIn Profile API (Reverse-Engineered Voyager REST API)

A fast, lightweight, and hosted REST API that extracts structured LinkedIn profile data using **pure reverse-engineering of LinkedIn's internal Voyager REST API** — **strictly without headless browsers** (no Puppeteer, Playwright, or Selenium).

Built with Next.js App Router, featuring an in-memory LRU cache, request throttling for account safety, and an interactive developer playground.

---

## Live Demo & Endpoints

| Resource | Link / Path |
| :--- | :--- |
| **Interactive Playground UI** | `/` (Home page) |
| **REST API Endpoint (GET)** | `/api/profile?url=https://www.linkedin.com/in/satyanadella` |
| **REST API Endpoint (POST)** | `/api/profile` with `{ "url": "..." }` |

---

## Key Features

- **⚡ Zero Browser Overhead**: Pure HTTP requests using native Node/Next.js fetch. Responses return in **300ms–800ms** (compared to 6–12 seconds for Puppeteer/Playwright).
- **🎯 Single-Request Full Graph Extraction**: Leverages LinkedIn's Rest.li `FullProfileWithEntities-93` projection recipe to retrieve the complete profile entity graph (130+ joined entities) in a single request.
- **🛡️ Account Safety & Anti-Detection**:
  - **Unquoted CSRF Token Extraction**: Automatically extracts and aligns the `csrf-token` header with the `JSESSIONID` session cookie.
  - **Full Browser Signature**: Sends complete browser client hints (`x-restli-protocol-version`, `x-li-lang`, `x-li-track` telemetry, `sec-ch-ua`, desktop User-Agent).
  - **Request Throttler**: Enforces a 1000ms minimum interval between outbound requests to avoid burst rate-limits.
  - **LRU In-Memory Cache**: Caches parsed profiles for 1 hour, serving instant repeated queries without consuming session quota.
- **📊 Defensive Normalization**: Gracefully handles sparse profiles (missing summaries, private sections, or default avatars) with guaranteed null-safe arrays and objects.

---

## Extracted Profile Schema

The API extracts and standardizes all major profile sections:

```json
{
  "success": true,
  "cached": false,
  "vanityName": "sundarpichai",
  "data": {
    "profile": {
      "publicIdentifier": "sundarpichai",
      "firstName": "Sundar",
      "lastName": "Pichai",
      "fullName": "Sundar Pichai",
      "headline": "CEO at Google and Alphabet",
      "summary": "Full bio text...",
      "location": "San Francisco Bay Area",
      "countryCode": "US",
      "profilePicture": "https://media.licdn.com/dms/image/v2/...",
      "backgroundImage": "https://media.licdn.com/dms/image/v2/...",
      "isInfluencer": true,
      "isPremium": true,
      "entityUrn": "urn:li:fsd_profile:ACoAAA..."
    },
    "experience": [
      {
        "title": "CEO",
        "companyName": "Google",
        "companyLinkedInUrl": "https://www.linkedin.com/company/google",
        "companyLogo": "https://media.licdn.com/...",
        "location": "Mountain View, CA",
        "description": "Leading Google's product and engineering...",
        "startDate": { "month": 10, "year": 2015 },
        "endDate": null,
        "isCurrent": true
      }
    ],
    "education": [
      {
        "schoolName": "Stanford University",
        "degreeName": "Master of Science (M.S.)",
        "fieldOfStudy": "Material Science and Engineering",
        "grade": null,
        "activities": null,
        "description": null,
        "schoolLogo": "https://media.licdn.com/...",
        "startDate": { "month": null, "year": 1993 },
        "endDate": { "month": null, "year": 1995 }
      }
    ],
    "skills": [
      { "name": "Technical Product Management" },
      { "name": "Data Science" },
      { "name": "Cross-functional Team Leadership" }
    ],
    "certifications": [
      {
        "name": "Foundations of Business Strategy",
        "authority": "Coursera",
        "licenseNumber": "...",
        "url": "https://coursera.org/...",
        "startDate": { "month": 3, "year": 2018 },
        "endDate": null
      }
    ],
    "languages": [
      { "name": "English", "proficiency": "FULL_PROFESSIONAL" },
      { "name": "Hindi", "proficiency": "NATIVE_OR_BILINGUAL" }
    ],
    "honors": [ ... ],
    "projects": [ ... ],
    "volunteerExperience": [ ... ]
  }
}
```

---

## API Reference

### 1. Fetch Profile (GET)
```http
GET /api/profile?url={profileUrl}
```

#### Query Parameters:
| Parameter | Type | Required | Description | Example |
| :--- | :--- | :--- | :--- | :--- |
| `url` | `string` | **Yes** | Full profile URL, vanity handle, or subpath | `https://www.linkedin.com/in/satyanadella` or `satyanadella` |

#### Example cURL:
```bash
curl -X GET "https://your-domain.vercel.app/api/profile?url=https://www.linkedin.com/in/satyanadella"
```

---

### 2. Fetch Profile (POST)
```http
POST /api/profile
Content-Type: application/json

{
  "url": "https://www.linkedin.com/in/satyanadella"
}
```

#### Example cURL:
```bash
curl -X POST "https://your-domain.vercel.app/api/profile" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.linkedin.com/in/satyanadella"}'
```

---

### HTTP Status Codes

| Code | Status | Description |
| :--- | :--- | :--- |
| `200` | **OK** | Profile successfully fetched and normalized. |
| `400` | **Bad Request** | Missing URL parameter or invalid username format. |
| `401` | **Unauthorized** | Backend session cookie expired or invalid CSRF token. |
| `404` | **Not Found** | Profile does not exist on LinkedIn. |
| `429` | **Too Many Requests** | LinkedIn rate limit exceeded (mitigated by LRU cache). |
| `500` | **Internal Server Error** | Unexpected upstream parsing error. |

---

## Reverse Engineering & Technical Approach

LinkedIn’s web application operates on **Rest.li**, an internal RPC/REST architecture. Instead of calling separate REST endpoints for each profile section, Rest.li uses **Projection Recipes / Decorations** to return joined entity graphs.

### 1. The Core Voyager Endpoint
```http
GET https://www.linkedin.com/voyager/api/identity/dash/profiles
  ?q=memberIdentity
  &memberIdentity={vanityName}
  &decorationId=com.linkedin.voyager.dash.deco.identity.profile.FullProfileWithEntities-93
```

### 2. CSRF & Authentication Ingestion
LinkedIn authenticates via:
1. `Cookie: li_at=...; JSESSIONID="..."`
2. `csrf-token`: Header containing the **unquoted** value of `JSESSIONID` (e.g. `ajax:1428806457551619689`).

### 3. Entity Graph Dereferencing
Voyager returns a top-level `included: [...]` array containing all joined entities. The [`normalizer.js`](app/lib/linkedin/normalizer.js) builds an in-memory URN map (`urnMap[entityUrn]`) and resolves references:
- Resolves location by linking `profile.geoLocation.geoUrn` $\rightarrow$ `com.linkedin.voyager.dash.common.Geo` entity.
- Resolves company & school logos by linking `position.companyUrn` $\rightarrow$ `Company.logo` vector images.
- Extracts high-resolution image URLs from `VectorImage` artifacts.

---

## Local Setup & Development

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/your-username/linkedin-profile-api.git
cd linkedin-profile-api
npm install
```

### 2. Configure Environment Variables
Copy the `.env.example` file to `.env.local`:
```bash
cp .env.example .env.local
```

Extract your LinkedIn cookies from your browser:
1. Open [LinkedIn](https://www.linkedin.com) in your browser and log in.
2. Open **DevTools (F12)** $\rightarrow$ **Application** $\rightarrow$ **Cookies** $\rightarrow$ `https://www.linkedin.com`.
3. Copy `li_at` and `JSESSIONID`.

Set them in `.env.local`:
```env
LINKEDIN_LI_AT=AQEDAR...your_real_li_at_cookie...
LINKEDIN_JSESSIONID="ajax:1428806457551619689"
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to access the interactive playground.

---

## Deployment (Vercel)

This application is ready for 1-click deployment on [Vercel](https://vercel.com):

1. Push your repository to GitHub (ensure `.env.local` is gitignored).
2. Import the repository into Vercel.
3. In Vercel Project Settings $\rightarrow$ **Environment Variables**, add:
   - `LINKEDIN_LI_AT` = `your_li_at_cookie`
   - `LINKEDIN_JSESSIONID` = `ajax:your_jsessionid`
4. Deploy! Your API will be immediately available over public HTTPS.

---

## Known Limitations

1. **Session Expiry**: LinkedIn session cookies (`li_at`) expire periodically (typically 30–90 days) and must be refreshed.
2. **Account Checkpoints**: Making extreme bursts of un-cached requests (e.g. 500+ requests/minute) on a personal session cookie can trigger temporary LinkedIn security checkpoints. This is actively mitigated by our 1-second request throttler and 1-hour LRU in-memory cache.
3. **Private / Restricted Profiles**: Profiles with strict privacy settings may omit certain sections (e.g. skills or email). The API handles these gracefully by returning `null` or empty arrays `[]`.
