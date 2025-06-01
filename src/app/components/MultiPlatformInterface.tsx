'use client';

import { useState } from 'react';

interface LinkedInProfile {
    platform: 'linkedin';
    url: string;
    name: string;
    headline?: string;
    bio?: string;
    location?: string;
    profilePicture?: string;
    followersCount?: number;
    connectionsCount?: number;
    posts?: LinkedInPost[];
    experience?: Experience[];
    skills?: Skill[];
    metadata: {
        scrapedAt: string;
        platform: 'linkedin';
        profileCompleteness: number;
        estimatedPersona?: string;
        postingFrequency?: string;
        networkSize?: string;
        estimatedSeniority?: string;
        industryFocus?: string[];
    };
}

interface LinkedInPost {
    text: string;
    publishedAt: string;
    engagementCount: number;
    postUrl?: string;
    likesCount?: number;
    commentsCount?: number;
    sharesCount?: number;
}

interface Experience {
    title?: string;
    company?: string;
    location?: string;
    startDate?: string;
    endDate?: string | null;
    duration?: string;
    description?: string;
    current?: boolean;
}

interface Skill {
    name: string;
    endorsements?: number;
}

interface ScrapeResults {
    success: boolean;
    data?: LinkedInProfile;
    error?: string;
    details?: string;
    message?: string;
}

export default function MultiPlatformInterface() {
    const [profileUrl, setProfileUrl] = useState('');
    const [maxPosts, setMaxPosts] = useState(20);
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<ScrapeResults | null>(null);

    const isValidLinkedInUrl = (url: string): boolean => {
        const cleanUrl = url.toLowerCase().trim();
        return cleanUrl.includes('linkedin.com/in/') || cleanUrl.includes('linkedin.com/pub/');
    };

    const handleScrapeProfile = async () => {
        if (!profileUrl.trim()) {
            alert('Please enter a LinkedIn profile URL');
            return;
        }

        if (!isValidLinkedInUrl(profileUrl)) {
            alert('Please enter a valid LinkedIn profile URL (e.g., https://linkedin.com/in/username)');
            return;
        }

        setLoading(true);
        setResults(null);

        try {
            const response = await fetch('/api/scrape-linkedin', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    profileUrls: [profileUrl.trim()] // Use the format expected by our Proxycurl API
                }),
            });

            const data = await response.json();
            
            // Transform the Proxycurl response to match our UI interface
            if (data.success && data.profile) {
                const transformedData = {
                    success: true,
                    data: {
                        platform: 'linkedin' as const,
                        url: data.profile.linkedinUrl,
                        name: data.profile.name,
                        headline: data.profile.headline,
                        bio: data.profile.about,
                        location: data.profile.location,
                        profilePicture: data.profile.profilePicture,
                        followersCount: 0, // Proxycurl doesn't provide this
                        connectionsCount: data.profile.connections,
                        posts: [], // No posts from profile scraping
                        experience: data.profile.experience,
                        skills: data.profile.skills,
                        metadata: {
                            scrapedAt: data.profile.scrapedAt,
                            platform: 'linkedin' as const,
                            profileCompleteness: data.profile.profileCompleteness,
                            estimatedPersona: undefined, // We'll need to analyze this separately
                            postingFrequency: 'Unknown', // Not available from profile scraping
                            networkSize: data.profile.networkSize,
                            estimatedSeniority: data.profile.estimatedSeniority,
                            industryFocus: data.profile.industryFocus
                        }
                    }
                };
                setResults(transformedData);
            } else {
                setResults(data);
            }

        } catch (error) {
            console.error('Error:', error);
            setResults({
                success: false,
                error: 'Network error occurred',
                details: error instanceof Error ? error.message : 'Unknown error'
            });
        } finally {
            setLoading(false);
        }
    };

    const getPersonaEmoji = (persona?: string): string => {
        switch (persona) {
            case 'Networker': return '🤝';
            case 'Hustler': return '💪';
            case 'Lurker': return '👀';
            case 'Ghost': return '👻';
            default: return '❓';
        }
    };

    const getPersonaDescription = (persona?: string): string => {
        switch (persona) {
            case 'Networker': return 'Active professional who regularly engages and builds connections';
            case 'Hustler': return 'Sales-focused individual actively promoting products/services';
            case 'Lurker': return 'Occasional poster who observes more than they share';
            case 'Ghost': return 'Minimal activity, primarily uses LinkedIn for profile presence';
            default: return 'Unable to determine persona type';
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-6">
            <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">
                    🔗 LinkedIn Profile Intelligence
                </h2>
                
                <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-blue-800 text-sm">
                        <strong>Focus:</strong> We&apos;re now focused exclusively on LinkedIn scraping for reliable data and persona analysis.
                    </p>
                </div>

                <div className="space-y-4">
                    {/* URL Input */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            LinkedIn Profile URL
                        </label>
                        <input
                            type="url"
                            value={profileUrl}
                            onChange={(e) => setProfileUrl(e.target.value)}
                            placeholder="https://linkedin.com/in/username"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        {profileUrl && isValidLinkedInUrl(profileUrl) && (
                            <p className="text-sm text-green-600 mt-1">
                                ✅ Valid LinkedIn URL detected
                            </p>
                        )}
                        {profileUrl && !isValidLinkedInUrl(profileUrl) && (
                            <p className="text-sm text-red-600 mt-1">
                                ❌ Please enter a valid LinkedIn profile URL
                            </p>
                        )}
                    </div>

                    {/* Options */}
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <label className="text-sm text-gray-700">Max posts to analyze:</label>
                            <input
                                type="number"
                                value={maxPosts}
                                onChange={(e) => setMaxPosts(parseInt(e.target.value) || 20)}
                                min="1"
                                max="50"
                                className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                            />
                        </div>
                    </div>

                    {/* Scrape Button */}
                    <button
                        onClick={handleScrapeProfile}
                        disabled={loading || !profileUrl.trim() || !isValidLinkedInUrl(profileUrl)}
                        className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {loading ? (
                            <>
                                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                                Analyzing LinkedIn Profile...
                            </>
                        ) : (
                            <>🔍 Analyze LinkedIn Profile</>
                        )}
                    </button>
                </div>

                {/* Results */}
                {results && (
                    <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                        {results.success ? (
                            <div className="space-y-6">
                                <div className="flex items-center gap-2">
                                    <span className="text-green-600 text-xl">✅</span>
                                    <span className="font-semibold text-green-800">LinkedIn profile analyzed successfully!</span>
                                </div>

                                {results.data && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Profile Summary */}
                                        <div className="bg-white p-4 rounded-lg border">
                                            <h3 className="font-semibold text-lg mb-3">👤 Profile Summary</h3>
                                            <div className="space-y-2">
                                                <div><strong>Name:</strong> {results.data.name}</div>
                                                <div><strong>Headline:</strong> {results.data.headline || 'Not provided'}</div>
                                                <div><strong>Location:</strong> {results.data.location || 'Not provided'}</div>
                                                <div><strong>Connections:</strong> {results.data.connectionsCount?.toLocaleString() || '0'}</div>
                                                <div><strong>Followers:</strong> {results.data.followersCount?.toLocaleString() || '0'}</div>
                                            </div>
                                        </div>

                                        {/* Persona Analysis */}
                                        <div className="bg-white p-4 rounded-lg border">
                                            <h3 className="font-semibold text-lg mb-3">🎯 Persona Analysis</h3>
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-2xl">{getPersonaEmoji(results.data.metadata.estimatedPersona)}</span>
                                                    <span className="font-semibold text-lg">{results.data.metadata.estimatedPersona || 'Unknown'}</span>
                                                </div>
                                                <p className="text-gray-600 text-sm">
                                                    {getPersonaDescription(results.data.metadata.estimatedPersona)}
                                                </p>
                                                <div className="mt-2 space-y-1 text-sm">
                                                    <div><strong>Activity Level:</strong> {results.data.metadata.postingFrequency}</div>
                                                    <div><strong>Network Size:</strong> {results.data.metadata.networkSize}</div>
                                                    <div><strong>Seniority:</strong> {results.data.metadata.estimatedSeniority}</div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Profile Completeness */}
                                        <div className="bg-white p-4 rounded-lg border">
                                            <h3 className="font-semibold text-lg mb-3">📊 Profile Metrics</h3>
                                            <div className="space-y-2">
                                                <div>
                                                    <div className="flex justify-between mb-1">
                                                        <span className="text-sm">Profile Completeness</span>
                                                        <span className="text-sm font-semibold">{results.data.metadata.profileCompleteness}%</span>
                                                    </div>
                                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                                        <div 
                                                            className="bg-blue-600 h-2 rounded-full" 
                                                            style={{ width: `${results.data.metadata.profileCompleteness}%` }}
                                                        ></div>
                                                    </div>
                                                </div>
                                                <div><strong>Experience Entries:</strong> {results.data.experience?.length || 0}</div>
                                                <div><strong>Skills Listed:</strong> {results.data.skills?.length || 0}</div>
                                                <div><strong>Recent Posts:</strong> {results.data.posts?.length || 0}</div>
                                            </div>
                                        </div>

                                        {/* Industry Focus */}
                                        {results.data.metadata.industryFocus && results.data.metadata.industryFocus.length > 0 && (
                                            <div className="bg-white p-4 rounded-lg border">
                                                <h3 className="font-semibold text-lg mb-3">🏢 Industry Focus</h3>
                                                <div className="flex flex-wrap gap-2">
                                                    {results.data.metadata.industryFocus.map((industry, index) => (
                                                        <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                                                            {industry}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Recent Posts Preview */}
                                {results.data?.posts && results.data.posts.length > 0 && (
                                    <div className="bg-white p-4 rounded-lg border">
                                        <h3 className="font-semibold text-lg mb-3">📝 Recent Posts ({results.data.posts.length})</h3>
                                        <div className="space-y-3 max-h-60 overflow-y-auto">
                                            {results.data.posts.slice(0, 3).map((post, index) => (
                                                <div key={index} className="p-3 bg-gray-50 rounded border-l-4 border-blue-500">
                                                    <p className="text-sm text-gray-800 mb-2">
                                                        {post.text.substring(0, 200)}
                                                        {post.text.length > 200 && '...'}
                                                    </p>
                                                    <div className="flex justify-between text-xs text-gray-500">
                                                        <span>{new Date(post.publishedAt).toLocaleDateString()}</span>
                                                        <span>{post.engagementCount} total engagements</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <span className="text-red-600 text-xl">❌</span>
                                    <span className="font-semibold text-red-800">Failed to scrape profile</span>
                                </div>
                                <p className="text-red-600">{results.error}</p>
                                {results.details && (
                                    <details className="text-sm text-gray-600">
                                        <summary className="cursor-pointer">Show details</summary>
                                        <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
                                            {results.details}
                                        </pre>
                                    </details>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
