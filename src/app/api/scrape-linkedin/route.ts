import { NextRequest, NextResponse } from 'next/server';
import { ApifyClient } from 'apify-client';

// Use mock data by default for testing
const USE_MOCK_DATA = process.env.APIFY_USE_REAL !== 'true';

const apifyClient = new ApifyClient({
    token: process.env.APIFY_API_TOKEN,
});

// Define interfaces for type safety
interface Experience {
    title: string;
    company: string;
    location?: string;
    startDate?: string;
    endDate?: string | null;
    duration?: string;
    description?: string;
    current: boolean;
}

interface Post {
    text: string;
    publishedAt: string;
    likesCount: number;
    commentsCount: number;
    sharesCount: number;
}

interface Skill {
    name: string;
    endorsements: number;
}

interface MockProfile {
    linkedinUrl: string;
    name: string;
    headline: string;
    location: string;
    about: string;
    profilePicture?: string;
    connectionsCount: number;
    followersCount: number;
    experience: Experience[];
    posts: Post[];
    skills: Skill[];
    postingFrequency: string;
    networkSize: string;
    estimatedSeniority: string;
    profileCompleteness: number;
    industryFocus: string[];
}

// Comprehensive mock data for different persona types
const generateMockProfile = (url: string, index: number): MockProfile => {
    const personas = [
        // Networker Profile
        {
            linkedinUrl: url,
            name: "Sarah Chen",
            headline: "VP of Engineering | Tech Community Builder | Startup Advisor",
            location: "San Francisco, CA",
            about: "Passionate about building high-performing engineering teams and fostering innovation. I regularly speak at conferences, mentor emerging leaders, and invest in early-stage startups. Always looking to connect with fellow technologists and entrepreneurs!",
            profilePicture: "https://via.placeholder.com/150",
            connectionsCount: 2847,
            followersCount: 1592,
            
            experience: [
                {
                    title: "VP of Engineering",
                    company: "TechCorp",
                    location: "San Francisco, CA",
                    startDate: "2021-03",
                    endDate: null,
                    duration: "3 yrs 2 mos",
                    description: "Leading a team of 50+ engineers across 6 product teams. Scaled engineering from 15 to 50+ people while maintaining high velocity.",
                    current: true
                },
                {
                    title: "Senior Engineering Manager",
                    company: "Meta",
                    location: "Menlo Park, CA", 
                    startDate: "2018-01",
                    endDate: "2021-02",
                    duration: "3 yrs 1 mo",
                    description: "Managed multiple engineering teams building core platform features used by 2B+ users.",
                    current: false
                }
            ],
            
            posts: [
                {
                    text: "Just had an amazing conversation with 20 engineering leaders at #TechLeadership2024. The future of remote team building is incredibly exciting! Who else was there?",
                    publishedAt: "2024-05-28T10:30:00Z",
                    likesCount: 247,
                    commentsCount: 43,
                    sharesCount: 18
                },
                {
                    text: "Thrilled to announce I'm joining the advisory board of @StartupXYZ! Their AI-powered developer tools are going to revolutionize how we build software. DM me if you want an intro to the team!",
                    publishedAt: "2024-05-25T14:15:00Z",
                    likesCount: 189,
                    commentsCount: 67,
                    sharesCount: 31
                },
                {
                    text: "Coffee chat with fellow VPs this morning reminded me: the best engineering cultures are built on psychological safety + continuous learning. What's your take?",
                    publishedAt: "2024-05-22T09:45:00Z",
                    likesCount: 156,
                    commentsCount: 29,
                    sharesCount: 12
                }
            ],
            
            skills: [
                { name: "Engineering Leadership", endorsements: 89 },
                { name: "Team Building", endorsements: 76 },
                { name: "Strategic Planning", endorsements: 65 },
                { name: "Mentoring", endorsements: 58 },
                { name: "Public Speaking", endorsements: 45 }
            ],
            
            postingFrequency: "Very Active",
            networkSize: "Very Large", 
            estimatedSeniority: "Executive",
            profileCompleteness: 98,
            industryFocus: ["Technology", "Leadership", "Startups"]
        },
        
        // Ghost Profile
        {
            linkedinUrl: url,
            name: "Michael Rodriguez",
            headline: "Senior Software Engineer",
            location: "Austin, TX",
            about: "Software engineer with 8 years of experience in backend development.",
            profilePicture: "https://via.placeholder.com/150",
            connectionsCount: 234,
            followersCount: 67,
            
            experience: [
                {
                    title: "Senior Software Engineer",
                    company: "Austin Tech Solutions",
                    location: "Austin, TX",
                    startDate: "2020-06",
                    endDate: null,
                    duration: "3 yrs 11 mos",
                    description: "Backend development using Java and Spring Boot.",
                    current: true
                },
                {
                    title: "Software Engineer",
                    company: "LocalCorp",
                    location: "Austin, TX",
                    startDate: "2017-08",
                    endDate: "2020-05",
                    duration: "2 yrs 9 mos",
                    description: "Full-stack development and maintenance.",
                    current: false
                }
            ],
            
            posts: [
                {
                    text: "Completed AWS certification. Back to work.",
                    publishedAt: "2024-03-15T16:20:00Z",
                    likesCount: 12,
                    commentsCount: 2,
                    sharesCount: 0
                }
            ],
            
            skills: [
                { name: "Java", endorsements: 23 },
                { name: "Spring Boot", endorsements: 18 },
                { name: "MySQL", endorsements: 15 },
                { name: "Git", endorsements: 12 }
            ],
            
            postingFrequency: "Inactive",
            networkSize: "Small",
            estimatedSeniority: "Senior",
            profileCompleteness: 65,
            industryFocus: ["Software Development"]
        },
        
        // Hustler Profile
        {
            linkedinUrl: url,
            name: "David Kim",
            headline: "🚀 CEO & Founder | Scaling SaaS to $10M ARR | Looking for Strategic Partnerships | DM me!",
            location: "New York, NY",
            about: "Serial entrepreneur with 3 successful exits. Currently building the next unicorn in B2B SaaS. Always looking for top talent, investors, and strategic partners. Let's connect and explore opportunities! 📈💰",
            profilePicture: "https://via.placeholder.com/150",
            connectionsCount: 4892,
            followersCount: 3247,
            
            experience: [
                {
                    title: "CEO & Founder",
                    company: "SaaS Solutions Inc",
                    location: "New York, NY",
                    startDate: "2022-01",
                    endDate: null,
                    duration: "2 yrs 4 mos",
                    description: "Building the future of B2B automation. Raised $5M Series A. Currently scaling to $10M ARR.",
                    current: true
                }
            ],
            
            posts: [
                {
                    text: "🔥 JUST CLOSED another $500K in MRR this month! Our B2B automation platform is absolutely crushing it. Still have 2 spots left in our exclusive partner program - DM me for details! #SaaS #Entrepreneur #Growth",
                    publishedAt: "2024-05-29T07:30:00Z",
                    likesCount: 89,
                    commentsCount: 15,
                    sharesCount: 7
                },
                {
                    text: "Want to know the SECRET to scaling from $0 to $5M ARR in 18 months? 🚀 I'm hosting an exclusive webinar next week. Limited spots available. Link in comments! #StartupGrowth #SaaS #Scaling",
                    publishedAt: "2024-05-27T06:15:00Z",
                    likesCount: 134,
                    commentsCount: 28,
                    sharesCount: 45
                },
                {
                    text: "Looking for TOP TIER sales professionals who want to make $200K+ this year. We're disrupting a $50B market and need hungry closers. Send me your track record! 💰 #Sales #Hiring #Opportunity",
                    publishedAt: "2024-05-25T08:45:00Z",
                    likesCount: 67,
                    commentsCount: 89,
                    sharesCount: 23
                }
            ],
            
            skills: [
                { name: "Sales", endorsements: 156 },
                { name: "Business Development", endorsements: 134 },
                { name: "Fundraising", endorsements: 89 },
                { name: "Marketing", endorsements: 76 },
                { name: "SaaS", endorsements: 98 }
            ],
            
            postingFrequency: "Very Active",
            networkSize: "Very Large",
            estimatedSeniority: "Executive", 
            profileCompleteness: 95,
            industryFocus: ["SaaS", "Sales", "Entrepreneurship"]
        },
        
        // Lurker Profile
        {
            linkedinUrl: url,
            name: "Lisa Zhang",
            headline: "Data Scientist at Fortune 500 Company",
            location: "Seattle, WA",
            about: "Data scientist passionate about machine learning and statistical analysis. PhD in Statistics from Stanford.",
            profilePicture: "https://via.placeholder.com/150",
            connectionsCount: 567,
            followersCount: 234,
            
            experience: [
                {
                    title: "Senior Data Scientist",
                    company: "Fortune 500 Corp",
                    location: "Seattle, WA",
                    startDate: "2021-09",
                    endDate: null,
                    duration: "2 yrs 8 mos",
                    description: "Advanced analytics and machine learning model development.",
                    current: true
                }
            ],
            
            posts: [
                {
                    text: "Interesting paper on transformer architectures for time series forecasting.",
                    publishedAt: "2024-04-12T11:30:00Z",
                    likesCount: 8,
                    commentsCount: 1,
                    sharesCount: 2
                },
                {
                    text: "Congrats to the team on the successful model deployment!",
                    publishedAt: "2024-02-28T14:20:00Z",
                    likesCount: 15,
                    commentsCount: 3,
                    sharesCount: 0
                }
            ],
            
            skills: [
                { name: "Machine Learning", endorsements: 45 },
                { name: "Python", endorsements: 38 },
                { name: "Statistics", endorsements: 42 },
                { name: "Data Analysis", endorsements: 36 }
            ],
            
            postingFrequency: "Moderate",
            networkSize: "Medium",
            estimatedSeniority: "Senior",
            profileCompleteness: 82,
            industryFocus: ["Data Science", "Machine Learning"]
        }
    ];
    
    return personas[index % personas.length];
};

export async function POST(request: NextRequest) {
    try {
        const { profileUrls, maxConnections = 100 } = await request.json();

        if (!profileUrls || !Array.isArray(profileUrls)) {
            return NextResponse.json({ error: 'Profile URLs array is required' }, { status: 400 });
        }

        if (USE_MOCK_DATA) {
            console.log('🎭 Using mock data for LinkedIn profiles');
            
            // Generate mock profiles based on URLs
            const mockProfiles = profileUrls.map((url: string, index: number) => {
                const profile = generateMockProfile(url, index);
                return {
                    ...profile,
                    // Add metadata
                    scrapedAt: new Date().toISOString(),
                    dataSource: 'mock',
                    runId: `mock-${Date.now()}-${index}`
                };
            });

            return NextResponse.json({
                success: true,
                data: mockProfiles,
                runId: `mock-${Date.now()}`,
                totalProfiles: mockProfiles.length,
                mockMode: true,
                personas: mockProfiles.map(p => ({
                    name: p.name,
                    estimatedPersona: getPersonaFromProfile(p),
                    postingFrequency: p.postingFrequency,
                    networkSize: p.networkSize
                }))
            });
        }

        // Real Apify implementation (when USE_MOCK_DATA = false)
        const run = await apifyClient.actor('apify/linkedin-profile-scraper').call({
            profileUrls,
            maxConnections,
            proxyConfig: { useApifyProxy: true },
        });

        const { items } = await apifyClient.dataset(run.defaultDatasetId).listItems();

        return NextResponse.json({
            success: true,
            data: items,
            runId: run.id,
            mockMode: false
        });

    } catch (error) {
        console.error('LinkedIn scraping error:', error);
        return NextResponse.json({ 
            error: 'Failed to scrape LinkedIn profiles',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}

// Helper function to estimate persona from profile data - now with proper typing
function getPersonaFromProfile(profile: MockProfile): string {
    const postCount = profile.posts?.length || 0;
    const avgEngagement = profile.posts?.reduce((sum: number, post: Post) => 
        sum + (post.likesCount + post.commentsCount), 0) / postCount || 0;
    
    // Simple persona detection based on mock data patterns
    if (profile.name === "Sarah Chen") return "Networker";
    if (profile.name === "Michael Rodriguez") return "Ghost"; 
    if (profile.name === "David Kim") return "Hustler";
    if (profile.name === "Lisa Zhang") return "Lurker";
    
    // Fallback logic
    if (postCount >= 3 && avgEngagement > 100) return "Networker";
    if (postCount >= 3 && (profile.about?.includes("CEO") || profile.about?.includes("Founder"))) return "Hustler";
    if (postCount <= 1) return "Ghost";
    return "Lurker";
}
