import { NextRequest, NextResponse } from 'next/server';

// Define proper interfaces for LinkedIn-focused scraping
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

interface LinkedInRawData {
    name?: string;
    headline?: string;
    aboutSection?: string;
    profilePicture?: string;
    location?: string;
    followersCount?: number;
    connectionsCount?: number;
    posts?: LinkedInPost[];
    experience?: Experience[];
    skills?: Skill[];
    postingFrequency?: string;
    networkSize?: string;
    estimatedSeniority?: string;
    profileCompleteness?: number;
    industryFocus?: string[];
}

function isLinkedInUrl(url: string): boolean {
    const cleanUrl = url.toLowerCase().trim();
    return cleanUrl.includes('linkedin.com/in/') || cleanUrl.includes('linkedin.com/pub/');
}

function calculateProfileCompleteness(profile: LinkedInRawData): number {
    let score = 0;
    const maxScore = 100;
    
    // Basic info (40 points)
    if (profile.name?.trim()) score += 15;
    if (profile.headline?.trim()) score += 15;
    if (profile.location?.trim()) score += 10;
    
    // Profile elements (40 points)
    if (profile.profilePicture) score += 10;
    if (profile.aboutSection?.trim()) score += 15;
    if (profile.experience && profile.experience.length > 0) score += 15;
    
    // Social engagement (20 points)
    if (profile.followersCount && profile.followersCount > 0) score += 5;
    if (profile.connectionsCount && profile.connectionsCount > 0) score += 5;
    if (profile.posts && profile.posts.length > 0) score += 5;
    if (profile.skills && profile.skills.length > 0) score += 5;
    
    return Math.min(score, maxScore);
}

function estimatePersona(profile: LinkedInRawData): string {
    const posts = profile.posts || [];
    const postCount = posts.length;
    const followers = profile.followersCount || 0;
    const connections = profile.connectionsCount || 0;
    
    // Check for explicit persona indicators from LinkedIn scraper
    if (profile.postingFrequency === "Very Active" && (followers > 1000 || connections > 1000)) {
        // Look for hustler indicators in recent posts
        const recentPosts = posts.slice(0, 3);
        const hustlerKeywords = ['dm me', 'looking for', 'opportunity', 'connect', 'partnership', 'exclusive', 'limited spots'];
        const hasHustlerContent = recentPosts.some(post => 
            hustlerKeywords.some(keyword => 
                post.text?.toLowerCase().includes(keyword)
            )
        );
        
        if (hasHustlerContent) return 'Hustler';
        return 'Networker';
    }
    
    if (profile.postingFrequency === "Inactive" || postCount <= 1) {
        return 'Ghost';
    }
    
    if (postCount > 1 && postCount <= 10) {
        return 'Lurker';
    }
    
    // Default fallback based on activity
    if (postCount > 10) {
        return followers > 500 ? 'Networker' : 'Hustler';
    }
    
    return 'Ghost';
}

export async function POST(request: NextRequest) {
    try {
        const { profileUrl, maxPosts = 20 } = await request.json();

        if (!profileUrl) {
            return NextResponse.json({
                success: false,
                error: 'LinkedIn profile URL is required'
            }, { status: 400 });
        }

        // Validate LinkedIn URL
        if (!isLinkedInUrl(profileUrl)) {
            return NextResponse.json({
                success: false,
                error: 'Please provide a valid LinkedIn profile URL (e.g., https://linkedin.com/in/username)'
            }, { status: 400 });
        }

        console.log(`🔗 Scraping LinkedIn profile: ${profileUrl}`);

        // Call LinkedIn scraper directly
        const response = await fetch(`${request.nextUrl.origin}/api/scrape-linkedin`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ profileUrl, maxPosts }),
        });

        const linkedinData = await response.json();

        if (!linkedinData.success) {
            return NextResponse.json({
                success: false,
                error: 'Failed to scrape LinkedIn profile',
                details: linkedinData.error
            }, { status: response.status });
        }

        // Transform LinkedIn data to unified format
        const rawProfile = linkedinData.data as LinkedInRawData;
        
        const profileCompleteness = rawProfile.profileCompleteness || calculateProfileCompleteness(rawProfile);
        const estimatedPersona = estimatePersona(rawProfile);

        const unifiedProfile: LinkedInProfile = {
            platform: 'linkedin',
            url: profileUrl,
            name: rawProfile.name || 'Unknown',
            headline: rawProfile.headline || '',
            bio: rawProfile.aboutSection || '',
            location: rawProfile.location || '',
            profilePicture: rawProfile.profilePicture || '',
            followersCount: rawProfile.followersCount || 0,
            connectionsCount: rawProfile.connectionsCount || 0,
            posts: (rawProfile.posts || []).map((post: LinkedInPost) => ({
                text: post.text || '',
                publishedAt: post.publishedAt || '',
                engagementCount: (post.likesCount || 0) + (post.commentsCount || 0) + (post.sharesCount || 0),
                postUrl: post.postUrl || '',
                likesCount: post.likesCount || 0,
                commentsCount: post.commentsCount || 0,
                sharesCount: post.sharesCount || 0
            })),
            experience: rawProfile.experience || [],
            skills: rawProfile.skills || [],
            metadata: {
                scrapedAt: new Date().toISOString(),
                platform: 'linkedin',
                profileCompleteness,
                estimatedPersona,
                postingFrequency: rawProfile.postingFrequency || 'Unknown',
                networkSize: rawProfile.networkSize || 'Unknown',
                estimatedSeniority: rawProfile.estimatedSeniority || 'Unknown',
                industryFocus: rawProfile.industryFocus || []
            }
        };

        console.log(`✅ Successfully scraped LinkedIn profile: ${unifiedProfile.name} (${estimatedPersona})`);

        return NextResponse.json({
            success: true,
            data: unifiedProfile,
            message: `Successfully scraped LinkedIn profile - detected as ${estimatedPersona}`
        });

    } catch (error) {
        console.error('❌ Error in LinkedIn scraper:', error);
        
        return NextResponse.json({
            success: false,
            error: 'Failed to scrape LinkedIn profile',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
