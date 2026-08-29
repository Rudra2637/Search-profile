"use client";

import { useState, useEffect } from "react";
import {
  Search,
  Check,
  Copy,
  Terminal,
  ExternalLink,
  Briefcase,
  GraduationCap,
  Award,
  Globe,
  Code2,
  User,
  Sparkles,
  AlertCircle,
  Clock,
  Layers,
  MapPin,
} from "lucide-react";

const SAMPLE_PROFILES = [
  { name: "Vishal Bagla", handle: "vishal-bagla" },
  { name: "Satya Nadella", handle: "satyanadella" },
  { name: "Bill Gates", handle: "williamhgates" },
  { name: "Reid Hoffman", handle: "reidhoffman" },
];

export default function HomePage() {
  const [inputUrl, setInputUrl] = useState("vishal-bagla");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("preview"); // 'preview' | 'json'
  const [copied, setCopied] = useState(false);
  const [copiedCurl, setCopiedCurl] = useState(false);
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const fetchProfile = async (target = inputUrl) => {
    if (!target.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch(`/api/profile?url=${encodeURIComponent(target.trim())}`);
      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || "Failed to fetch LinkedIn profile.");
      } else {
        setResult(data);
      }
    } catch (err) {
      setError(err.message || "Network error occurred while calling the API.");
    } finally {
      setLoading(false);
    }
  };

  const handleSampleClick = (handle) => {
    setInputUrl(handle);
    fetchProfile(handle);
  };

  const handleCopyJson = () => {
    if (!result) return;
    navigator.clipboard.writeText(JSON.stringify(result, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyCurl = () => {
    const origin = typeof window !== "undefined" ? window.location.origin : "https://your-domain.vercel.app";
    const curl = `curl "${origin}/api/profile?url=${encodeURIComponent(inputUrl || "satyanadella")}"`;
    navigator.clipboard.writeText(curl);
    setCopiedCurl(true);
    setTimeout(() => setCopiedCurl(false), 2000);
  };

  const profile = result?.data?.profile;
  const experience = result?.data?.experience || [];
  const education = result?.data?.education || [];
  const skills = result?.data?.skills || [];
  const certifications = result?.data?.certifications || [];
  const languages = result?.data?.languages || [];
  const honors = result?.data?.honors || [];
  const projects = result?.data?.projects || [];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white shadow-lg shadow-blue-500/20">
              in
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-100 leading-none">
                LinkedIn Profile API
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                Zero Browser Automation • Voyager REST API
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="/api/profile?url=vishal-bagla"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
            >
              <Terminal className="w-3.5 h-3.5 text-blue-400" />
              Direct API Endpoint
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8 space-y-6">
        {/* Search Box */}
        <section className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-white">
              Test Any LinkedIn Profile
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Enter a full profile URL (e.g.{" "}
              <code className="text-blue-400">
                https://www.linkedin.com/in/satyanadella
              </code>
              ) or vanity username.
            </p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              fetchProfile();
            }}
            className="flex flex-col sm:flex-row gap-3"
          >
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                placeholder="https://www.linkedin.com/in/username or username"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !inputUrl.trim()}
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 disabled:cursor-not-allowed text-white text-sm font-medium shadow-lg shadow-blue-600/20 transition"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Fetching...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Fetch Profile</span>
                </>
              )}
            </button>
          </form>

          {/* Quick-test suggestion chips */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-xs text-slate-400">Quick test:</span>
            {SAMPLE_PROFILES.map((sample) => (
              <button
                key={sample.handle}
                type="button"
                onClick={() => handleSampleClick(sample.handle)}
                className="text-xs px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/60 transition flex items-center gap-1.5"
              >
                <span>{sample.name}</span>
                <code className="text-[10px] text-blue-400">/{sample.handle}</code>
              </button>
            ))}
          </div>
        </section>

        {/* Error Message */}
        {error && (
          <div className="bg-red-950/40 border border-red-800/80 rounded-xl p-4 flex items-start gap-3 text-red-200">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-red-300">Request Failed</p>
              <p className="text-xs text-red-200 mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Results Section */}
        {result && (
          <section className="space-y-4">
            {/* View Switcher & Action Bar */}
            <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-lg p-1.5">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setActiveTab("preview")}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition flex items-center gap-1.5 ${
                    activeTab === "preview"
                      ? "bg-blue-600 text-white shadow"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <User className="w-3.5 h-3.5" />
                  Visual Profile
                </button>
                <button
                  onClick={() => setActiveTab("json")}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition flex items-center gap-1.5 ${
                    activeTab === "json"
                      ? "bg-blue-600 text-white shadow"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <Code2 className="w-3.5 h-3.5" />
                  JSON Response
                </button>
              </div>

              <div className="flex items-center gap-2">
                {result.cached && (
                  <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-950/70 border border-emerald-800 text-emerald-300 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Served from Cache (1hr TTL)
                  </span>
                )}

                <button
                  onClick={handleCopyJson}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition flex items-center gap-1.5"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-300">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-400" />
                      <span>Copy JSON</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleCopyCurl}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition flex items-center gap-1.5"
                >
                  {copiedCurl ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-300">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Terminal className="w-3.5 h-3.5 text-slate-400" />
                      <span>Copy cURL</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* TAB 1: Visual Profile Preview */}
            {activeTab === "preview" && (
              <div className="space-y-4">
                {/* Profile Top Card */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
                  {/* Banner */}
                  <div className="h-28 bg-gradient-to-r from-blue-900/60 via-indigo-900/50 to-slate-900 border-b border-slate-800 relative">
                    {profile?.backgroundImage && (
                      <img
                        src={profile.backgroundImage}
                        alt="Profile Banner"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover opacity-40"
                      />
                    )}
                  </div>

                  {/* Profile Header Info */}
                  <div className="px-6 pb-6 pt-0 relative">
                    <div className="flex flex-col sm:flex-row sm:items-end justify-between -mt-12 gap-4">
                      {/* Avatar */}
                      <div className="relative">
                        {profile?.profilePicture ? (
                          <img
                            src={profile.profilePicture}
                            alt={profile.fullName || "Profile"}
                            referrerPolicy="no-referrer"
                            className="w-24 h-24 rounded-full border-4 border-slate-900 object-cover bg-slate-800 shadow-xl"
                          />
                        ) : (
                          <div className="w-24 h-24 rounded-full border-4 border-slate-900 bg-slate-800 flex items-center justify-center text-2xl font-bold text-slate-400">
                            {profile?.firstName?.[0] || "?"}
                          </div>
                        )}
                      </div>

                      {/* Public Link Button */}
                      {profile?.publicIdentifier && (
                        <a
                          href={`https://www.linkedin.com/in/${profile.publicIdentifier}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 bg-blue-950/40 border border-blue-800/60 px-3 py-1.5 rounded-md self-start sm:self-auto"
                        >
                          View on LinkedIn
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>

                    <div className="mt-4 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-xl font-bold text-white">
                          {profile?.fullName || "LinkedIn Member"}
                        </h2>
                        {profile?.isPremium && (
                          <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-amber-950/70 border border-amber-800 text-amber-300">
                            Premium
                          </span>
                        )}
                        {profile?.isInfluencer && (
                          <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-purple-950/70 border border-purple-800 text-purple-300">
                            Influencer
                          </span>
                        )}
                      </div>

                      {profile?.headline && (
                        <p className="text-sm text-slate-300 leading-relaxed">
                          {profile.headline}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1">
                        {profile?.location && (
                          <span className="flex items-center gap-1 text-slate-300">
                            <MapPin className="w-3.5 h-3.5 text-blue-400" />
                            {profile.location}
                          </span>
                        )}
                        {profile?.countryCode && (
                          <span className="flex items-center gap-1 text-slate-400">
                            <Globe className="w-3.5 h-3.5 text-slate-500" />
                            Country: {profile.countryCode}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* About section */}
                    {profile?.summary && (
                      <div className="mt-5 pt-5 border-t border-slate-800/80">
                        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                          About
                        </h3>
                        <p className="text-xs text-slate-300 whitespace-pre-line leading-relaxed">
                          {profile.summary}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* 2-Column Grid: Experience & Education */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Experience */}
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <div className="flex items-center gap-2">
                        <Briefcase className="w-4 h-4 text-blue-400" />
                        <h3 className="text-sm font-semibold text-white">
                          Experience
                        </h3>
                      </div>
                      <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                        {experience.length}
                      </span>
                    </div>

                    {experience.length === 0 ? (
                      <p className="text-xs text-slate-500">
                        No experience records available.
                      </p>
                    ) : (
                      <div className="space-y-4">
                        {experience.slice(0, 5).map((exp, idx) => (
                          <div
                            key={idx}
                            className="space-y-1 text-xs border-l-2 border-slate-800 pl-3 relative"
                          >
                            <p className="font-semibold text-slate-200">
                              {exp.title}
                            </p>
                            <p className="text-slate-400">
                              {exp.companyName}
                              {exp.location && ` • ${exp.location}`}
                            </p>
                            <p className="text-[11px] text-slate-500">
                              {exp.startDate?.year || "N/A"} -{" "}
                              {exp.isCurrent ? (
                                <span className="text-emerald-400 font-medium">
                                  Present
                                </span>
                              ) : (
                                exp.endDate?.year || "N/A"
                              )}
                            </p>
                            {exp.description && (
                              <p className="text-[11px] text-slate-400 line-clamp-2 pt-0.5">
                                {exp.description}
                              </p>
                            )}
                          </div>
                        ))}
                        {experience.length > 5 && (
                          <p className="text-[11px] text-slate-500 pt-1 text-center">
                            + {experience.length - 5} more positions in JSON response
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Education */}
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <div className="flex items-center gap-2">
                        <GraduationCap className="w-4 h-4 text-indigo-400" />
                        <h3 className="text-sm font-semibold text-white">
                          Education
                        </h3>
                      </div>
                      <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                        {education.length}
                      </span>
                    </div>

                    {education.length === 0 ? (
                      <p className="text-xs text-slate-500">
                        No education records available.
                      </p>
                    ) : (
                      <div className="space-y-4">
                        {education.map((edu, idx) => (
                          <div
                            key={idx}
                            className="space-y-1 text-xs border-l-2 border-slate-800 pl-3"
                          >
                            <p className="font-semibold text-slate-200">
                              {edu.schoolName}
                            </p>
                            {(edu.degreeName || edu.fieldOfStudy) && (
                              <p className="text-slate-400">
                                {[edu.degreeName, edu.fieldOfStudy]
                                  .filter(Boolean)
                                  .join(", ")}
                              </p>
                            )}
                            <p className="text-[11px] text-slate-500">
                              {edu.startDate?.year || "N/A"} -{" "}
                              {edu.endDate?.year || "N/A"}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Skills Cloud */}
                {skills.length > 0 && (
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <div className="flex items-center gap-2">
                        <Layers className="w-4 h-4 text-blue-400" />
                        <h3 className="text-sm font-semibold text-white">Skills</h3>
                      </div>
                      <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                        {skills.length}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {skills.map((skill, idx) => (
                        <span
                          key={idx}
                          className="text-xs px-2.5 py-1 rounded-md bg-slate-950 border border-slate-800 text-slate-300"
                        >
                          {skill.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Certifications & Languages Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {certifications.length > 0 && (
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2">
                      <div className="flex items-center gap-2 text-xs font-semibold text-slate-300 border-b border-slate-800 pb-2">
                        <Award className="w-4 h-4 text-amber-400" />
                        Certifications ({certifications.length})
                      </div>
                      <ul className="space-y-2 text-xs">
                        {certifications.map((c, i) => (
                          <li key={i} className="text-slate-300">
                            <span className="font-medium text-slate-200">
                              {c.name}
                            </span>
                            {c.authority && (
                              <span className="text-slate-500">
                                {" "}
                                • {c.authority}
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {languages.length > 0 && (
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2">
                      <div className="flex items-center gap-2 text-xs font-semibold text-slate-300 border-b border-slate-800 pb-2">
                        <Globe className="w-4 h-4 text-emerald-400" />
                        Languages ({languages.length})
                      </div>
                      <ul className="space-y-1.5 text-xs">
                        {languages.map((l, i) => (
                          <li
                            key={i}
                            className="flex items-center justify-between text-slate-300"
                          >
                            <span>{l.name}</span>
                            {l.proficiency && (
                              <span className="text-[10px] text-slate-500 uppercase">
                                {l.proficiency.replace(/_/g, " ")}
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: Formatted JSON Tree */}
            {activeTab === "json" && (
              <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
                <div className="px-4 py-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
                  <span className="text-xs font-mono text-slate-400">
                    response.json ({Object.keys(result.data).length} top-level fields)
                  </span>
                  <button
                    onClick={handleCopyJson}
                    className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                  >
                    <Copy className="w-3 h-3" />
                    Copy Payload
                  </button>
                </div>
                <pre className="p-4 text-xs font-mono text-slate-200 overflow-x-auto max-h-[600px] leading-relaxed">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
            )}
          </section>
        )}

        {/* API Usage & Documentation */}
        <section className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-200">
            <Terminal className="w-4 h-4 text-blue-400" />
            <h3>Quick cURL Integration</h3>
          </div>

          <p className="text-xs text-slate-400">
            Call the REST endpoint directly from any terminal, script, or backend service:
          </p>

          <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 flex items-center justify-between font-mono text-xs text-slate-300 overflow-x-auto">
            <code>
              curl &quot;{origin}/api/profile?url=https://www.linkedin.com/in/{inputUrl || "satyanadella"}&quot;
            </code>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/60 bg-slate-950 py-4 text-center text-xs text-slate-500">
        <p>Built for the Tross Hiring Challenge • Reverse-Engineered LinkedIn Voyager REST API</p>
      </footer>
    </div>
  );
}
