/**
 * LinkedIn Profile Normalizer
 *
 * Transforms LinkedIn's internal normalized entity graph (from the Voyager API)
 * into a clean, developer-friendly JSON structure.
 *
 * LinkedIn's response format:
 *   - `included[]` array contains ALL entities (Profile, Positions, Education, etc.)
 *   - Each entity has a `$type` field identifying its type
 *   - Entities reference each other via URN strings (e.g., "urn:li:fsd_profile:...")
 *   - Related collections use `*fieldName` pointers (e.g., "*profilePositionGroups")
 *
 * This normalizer extracts and groups entities by type, resolves cross-references
 * (like company logos for positions), and outputs a flat, structured JSON.
 */

// ─── Type Constants ──────────────────────────────────────────────
const TYPES = {
  PROFILE: "com.linkedin.voyager.dash.identity.profile.Profile",
  POSITION: "com.linkedin.voyager.dash.identity.profile.Position",
  POSITION_GROUP:
    "com.linkedin.voyager.dash.identity.profile.PositionGroup",
  EDUCATION: "com.linkedin.voyager.dash.identity.profile.Education",
  SKILL: "com.linkedin.voyager.dash.identity.profile.Skill",
  CERTIFICATION:
    "com.linkedin.voyager.dash.identity.profile.Certification",
  LANGUAGE: "com.linkedin.voyager.dash.identity.profile.Language",
  HONOR: "com.linkedin.voyager.dash.identity.profile.Honor",
  PROJECT: "com.linkedin.voyager.dash.identity.profile.Project",
  VOLUNTEER:
    "com.linkedin.voyager.dash.identity.profile.VolunteerExperience",
  COMPANY: "com.linkedin.voyager.dash.organization.Company",
  SCHOOL: "com.linkedin.voyager.dash.organization.School",
  GEO: "com.linkedin.voyager.dash.common.Geo",
};

// ─── Helpers ─────────────────────────────────────────────────────

/**
 * Group all included entities by their $type.
 */
function groupByType(included) {
  const groups = {};
  for (const entity of included) {
    const type = entity.$type || "unknown";
    if (!groups[type]) groups[type] = [];
    groups[type].push(entity);
  }
  return groups;
}

/**
 * Build a lookup map of entities by their entityUrn.
 */
function buildUrnMap(included) {
  const map = {};
  for (const entity of included) {
    if (entity.entityUrn) {
      map[entity.entityUrn] = entity;
    }
  }
  return map;
}

/**
 * Extract the highest resolution profile picture URL from a VectorImage.
 * LinkedIn stores images as a rootUrl + artifact path segments.
 */
function extractImageUrl(pictureObj) {
  if (!pictureObj?.displayImageReference?.vectorImage) return null;

  const vector = pictureObj.displayImageReference.vectorImage;
  const rootUrl = vector.rootUrl;
  const artifacts = vector.artifacts;

  if (!rootUrl || !artifacts || !artifacts.length) return null;

  // Pick the largest artifact (last in list, highest resolution)
  const largest = artifacts[artifacts.length - 1];
  const segment =
    largest.fileIdentifyingUrlPathSegment || largest.expiresAt
      ? largest.fileIdentifyingUrlPathSegment
      : null;

  if (!segment) return rootUrl;
  return rootUrl + segment;
}

/**
 * Safely extract a date range into a clean object.
 */
function extractDateRange(dateRange) {
  if (!dateRange) return { startDate: null, endDate: null };

  return {
    startDate: dateRange.start
      ? {
          month: dateRange.start.month || null,
          year: dateRange.start.year || null,
        }
      : null,
    endDate: dateRange.end
      ? {
          month: dateRange.end.month || null,
          year: dateRange.end.year || null,
        }
      : null,
  };
}

// ─── Main Normalizer ─────────────────────────────────────────────

/**
 * Normalize a LinkedIn Voyager API response into a clean profile object.
 *
 * @param {Array} included - The `included` array from the Voyager API response.
 * @returns {object} A structured profile object.
 */
export function normalizeProfile(included) {
  const groups = groupByType(included);
  const urnMap = buildUrnMap(included);

  // ── Profile (basic info) ──
  const profileEntity = groups[TYPES.PROFILE]?.[0];
  if (!profileEntity) {
    throw new Error("No Profile entity found in LinkedIn response.");
  }

  // Resolve location from Geo entity via geoLocation.*geo URN
  let locationName = null;
  const geoUrn = profileEntity.geoLocation?.geoUrn;
  if (geoUrn && urnMap[geoUrn]) {
    locationName = urnMap[geoUrn].defaultLocalizedName || null;
  }

  const profile = {
    publicIdentifier: profileEntity.publicIdentifier || null,
    firstName: profileEntity.firstName || null,
    lastName: profileEntity.lastName || null,
    fullName: [profileEntity.firstName, profileEntity.lastName]
      .filter(Boolean)
      .join(" ") || null,
    headline: profileEntity.headline || null,
    summary: profileEntity.summary || null,
    location: locationName,
    countryCode: profileEntity.location?.countryCode || null,
    profilePicture: extractImageUrl(profileEntity.profilePicture),
    backgroundImage: extractImageUrl(profileEntity.backgroundPicture),
    isInfluencer: profileEntity.influencer || false,
    isPremium: profileEntity.premium || false,
    entityUrn: profileEntity.entityUrn || null,
  };

  // ── Experience (Positions) ──
  const positions = (groups[TYPES.POSITION] || []).map((pos) => {
    // Resolve company logo
    const companyUrn = pos.companyUrn;
    const companyEntity = companyUrn ? urnMap[companyUrn] : null;

    return {
      title: pos.title || null,
      companyName: pos.companyName || null,
      companyLinkedInUrl: companyEntity?.universalName
        ? `https://www.linkedin.com/company/${companyEntity.universalName}`
        : null,
      companyLogo: companyEntity?.logo
        ? extractImageUrl(companyEntity.logo)
        : null,
      location: pos.locationName || pos.geoLocationName || null,
      description: pos.description || null,
      ...extractDateRange(pos.dateRange),
      isCurrent: pos.dateRange
        ? !pos.dateRange.end
        : false,
    };
  });

  // Sort positions: current jobs first, then by start year descending
  positions.sort((a, b) => {
    if (a.isCurrent && !b.isCurrent) return -1;
    if (!a.isCurrent && b.isCurrent) return 1;
    const yearA = a.startDate?.year || 0;
    const yearB = b.startDate?.year || 0;
    return yearB - yearA;
  });

  // ── Education ──
  const education = (groups[TYPES.EDUCATION] || []).map((edu) => {
    const schoolUrn = edu.schoolUrn;
    const schoolEntity = schoolUrn ? urnMap[schoolUrn] : null;

    return {
      schoolName: edu.schoolName || null,
      degreeName: edu.degreeName || null,
      fieldOfStudy: edu.fieldOfStudy || null,
      grade: edu.grade || null,
      activities: edu.activities || null,
      description: edu.description || null,
      schoolLogo: schoolEntity?.logo
        ? extractImageUrl(schoolEntity.logo)
        : null,
      ...extractDateRange(edu.dateRange),
    };
  });

  // Sort by start year descending
  education.sort((a, b) => {
    const yearA = a.startDate?.year || 0;
    const yearB = b.startDate?.year || 0;
    return yearB - yearA;
  });

  // ── Skills ──
  const skills = (groups[TYPES.SKILL] || []).map((skill) => ({
    name: skill.name || null,
  }));

  // ── Certifications ──
  const certifications = (groups[TYPES.CERTIFICATION] || []).map((cert) => ({
    name: cert.name || null,
    authority: cert.authority || null,
    licenseNumber: cert.licenseNumber || null,
    url: cert.url || null,
    ...extractDateRange(cert.dateRange),
  }));

  // ── Languages ──
  const languages = (groups[TYPES.LANGUAGE] || []).map((lang) => ({
    name: lang.name || null,
    proficiency: lang.proficiency || null,
  }));

  // ── Honors & Awards ──
  const honors = (groups[TYPES.HONOR] || []).map((honor) => ({
    title: honor.title || null,
    issuer: honor.issuer || null,
    description: honor.description || null,
    ...extractDateRange(honor.dateRange),
  }));

  // ── Projects ──
  const projects = (groups[TYPES.PROJECT] || []).map((proj) => ({
    title: proj.title || null,
    description: proj.description || null,
    url: proj.url || null,
    ...extractDateRange(proj.dateRange),
  }));

  // ── Volunteer Experience ──
  const volunteerExperience = (groups[TYPES.VOLUNTEER] || []).map((vol) => ({
    role: vol.role || null,
    organizationName: vol.companyName || null,
    cause: vol.cause || null,
    description: vol.description || null,
    ...extractDateRange(vol.dateRange),
  }));

  return {
    profile,
    experience: positions,
    education,
    skills,
    certifications,
    languages,
    honors,
    projects,
    volunteerExperience,
  };
}
