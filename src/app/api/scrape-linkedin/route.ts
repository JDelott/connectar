import { NextRequest, NextResponse } from 'next/server';

// Proxycurl Profile Interface (Direct API)
interface ProxycurlProfile {
    linkedin_profile_url: string;
    profile_pic_url?: string;
    background_cover_image_url?: string;
    first_name?: string;
    last_name?: string;
    full_name?: string;
    occupation?: string;
    headline?: string;
    summary?: string;
    country?: string;
    country_full_name?: string;
    city?: string;
    state?: string;
    experiences?: Array<{
        starts_at?: { day?: number; month?: number; year?: number };
        ends_at?: { day?: number; month?: number; year?: number } | null;
        company?: string;
        company_linkedin_profile_url?: string;
        title?: string;
        description?: string;
        location?: string;
        logo_url?: string;
    }>;
    education?: Array<{
        starts_at?: { day?: number; month?: number; year?: number };
        ends_at?: { day?: number; month?: number; year?: number };
        field_of_study?: string;
        degree_name?: string;
        school?: string;
        school_linkedin_profile_url?: string;
        description?: string;
        logo_url?: string;
        grade?: string;
    }>;
    languages?: string[];
    accomplishment_organisations?: Array<{
        starts_at?: { day?: number; month?: number; year?: number };
        ends_at?: { day?: number; month?: number; year?: number };
        org_name?: string;
        title?: string;
        description?: string;
    }>;
    accomplishment_publications?: Array<{
        name?: string;
        publisher?: string;
        published_on?: { day?: number; month?: number; year?: number };
        description?: string;
        url?: string;
    }>;
    accomplishment_honors_awards?: Array<{
        title?: string;
        issuer?: string;
        issued_on?: { day?: number; month?: number; year?: number };
        description?: string;
    }>;
    accomplishment_patents?: Array<{
        title?: string;
        issuer?: string;
        issued_on?: { day?: number; month?: number; year?: number };
        description?: string;
        application_number?: string;
        patent_number?: string;
        url?: string;
    }>;
    accomplishment_courses?: Array<{
        name?: string;
        number?: string;
    }>;
    accomplishment_projects?: Array<{
        starts_at?: { day?: number; month?: number; year?: number };
        ends_at?: { day?: number; month?: number; year?: number };
        title?: string;
        description?: string;
        url?: string;
    }>;
    accomplishment_test_scores?: Array<{
        name?: string;
        score?: string;
        date_on?: { day?: number; month?: number; year?: number };
        description?: string;
    }>;
    volunteer_work?: Array<{
        starts_at?: { day?: number; month?: number; year?: number };
        ends_at?: { day?: number; month?: number; year?: number };
        title?: string;
        cause?: string;
        company?: string;
        company_linkedin_profile_url?: string;
        description?: string;
        logo_url?: string;
    }>;
    certifications?: Array<{
        starts_at?: { day?: number; month?: number; year?: number };
        ends_at?: { day?: number; month?: number; year?: number };
        name?: string;
        license_number?: string;
        display_source?: string;
        authority?: string;
        url?: string;
    }>;
    connections?: number;
    people_also_viewed?: Array<{
        link?: string;
        name?: string;
        summary?: string;
        location?: string;
    }>;
    recommendations?: string[];
    activities?: Array<{
        title?: string;
        link?: string;
        activity_status?: string;
    }>;
    similarly_named_profiles?: Array<{
        name?: string;
        link?: string;
        summary?: string;
        location?: string;
    }>;
    articles?: Array<{
        title?: string;
        link?: string;
        published_date?: { day?: number; month?: number; year?: number };
        author?: string;
        image_url?: string;
    }>;
    groups?: Array<{
        profile_pic_url?: string;
        name?: string;
        url?: string;
    }>;
}

interface StandardProfile {
    linkedinUrl: string;
    name: string;
    headline: string;
    location: string;
    about: string;
    profilePicture?: string;
    connections?: number;
    experience: Array<{
        title: string;
        company: string;
        location?: string;
        startDate?: string;
        endDate?: string | null;
        duration?: string;
        description?: string;
        current: boolean;
    }>;
    education: Array<{
        degree: string;
        school: string;
        fieldOfStudy?: string;
        startYear?: number;
        endYear?: number;
    }>;
    skills: Array<{
        name: string;
        endorsements?: number;
    }>;
    certifications: Array<{
        name: string;
        authority: string;
        issueDate?: string;
        licenseNumber?: string;
        url?: string;
    }>;
    languages?: Array<{
        name: string;
        proficiency?: string;
    }>;
    volunteer?: Array<{
        role: string;
        organization: string;
        description?: string;
    }>;
    profileCompleteness: number;
    estimatedSeniority: string;
    networkSize: string;
    industryFocus: string[];
    scrapedAt: string;
    dataSource: string;
    runId: string;
}

function formatProxycurlDate(dateObj?: { day?: number; month?: number; year?: number }): string | undefined {
    if (!dateObj?.year) return undefined;
    const year = dateObj.year;
    const month = dateObj.month || 1;
    const day = dateObj.day || 1;
    return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
}

function calculateDuration(startDate?: string, endDate?: string | null): string {
    if (!startDate) return 'Unknown duration';
    
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : new Date();
    
    const diffInMonths = (end.getFullYear() - start.getFullYear()) * 12 + 
                        (end.getMonth() - start.getMonth());
    
    if (diffInMonths < 12) {
        return diffInMonths <= 1 ? '1 month' : `${diffInMonths} months`;
    } else {
        const years = Math.floor(diffInMonths / 12);
        const months = diffInMonths % 12;
        if (months === 0) {
            return years === 1 ? '1 year' : `${years} years`;
        } else {
            return `${years} year${years > 1 ? 's' : ''} ${months} month${months > 1 ? 's' : ''}`;
        }
    }
}

function transformProxycurlProfile(profile: ProxycurlProfile): StandardProfile {
    const runId = `proxycurl-${Date.now()}`;
    
    // Extract name
    const name = profile.full_name || 
                `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 
                'Unknown Name';
    
    // Format location
    const locationParts = [profile.city, profile.state, profile.country_full_name].filter(Boolean);
    const location = locationParts.length > 0 ? locationParts.join(', ') : 'Unknown Location';
    
    // Transform experience
    const experience = (profile.experiences || []).map((exp, index) => {
        const startDate = formatProxycurlDate(exp.starts_at);
        const endDate = exp.ends_at ? formatProxycurlDate(exp.ends_at) : null;
        
        return {
            title: exp.title || `Experience ${index + 1}`,
            company: exp.company || 'Unknown Company',
            location: exp.location,
            startDate,
            endDate,
            duration: calculateDuration(startDate, endDate),
            description: exp.description,
            current: !exp.ends_at
        };
    });

    // Transform education
    const education = (profile.education || []).map(edu => ({
        degree: edu.degree_name || 'Unknown Degree',
        school: edu.school || 'Unknown School',
        fieldOfStudy: edu.field_of_study,
        startYear: edu.starts_at?.year,
        endYear: edu.ends_at?.year
    }));

    // Transform languages to skills format (since Proxycurl just returns language names)
    const languageSkills = (profile.languages || []).map(lang => ({
        name: lang,
        endorsements: 0
    }));

    // Transform certifications
    const certifications = (profile.certifications || []).map(cert => ({
        name: cert.name || 'Unknown Certification',
        authority: cert.authority || 'Unknown Authority',
        issueDate: formatProxycurlDate(cert.starts_at),
        licenseNumber: cert.license_number,
        url: cert.url
    }));

    // Transform volunteer work
    const volunteer = (profile.volunteer_work || []).map(vol => ({
        role: vol.title || 'Volunteer',
        organization: vol.company || 'Unknown Organization',
        description: vol.description
    }));

    // Transform languages
    const languages = (profile.languages || []).map(lang => ({
        name: lang,
        proficiency: undefined
    }));

    // Calculate metrics
    const profileCompleteness = calculateProxycurlCompleteness(profile);
    const networkSize = estimateProxycurlNetworkSize(profile);
    const seniority = estimateProxycurlSeniority(profile);
    const industryFocus = profile.occupation ? [profile.occupation] : ['Unknown'];

    return {
        linkedinUrl: profile.linkedin_profile_url,
        name,
        headline: profile.headline || profile.occupation || 'No headline provided',
        location,
        about: profile.summary || 'No summary provided',
        profilePicture: profile.profile_pic_url,
        connections: profile.connections,
        experience,
        education,
        skills: languageSkills,
        certifications,
        languages,
        volunteer,
        profileCompleteness,
        estimatedSeniority: seniority,
        networkSize,
        industryFocus,
        scrapedAt: new Date().toISOString(),
        dataSource: 'Proxycurl',
        runId
    };
}

function calculateProxycurlCompleteness(profile: ProxycurlProfile): number {
    let score = 0;
    const maxScore = 10;

    if (profile.full_name || (profile.first_name && profile.last_name)) score += 1;
    if (profile.headline) score += 1;
    if (profile.summary) score += 2;
    if (profile.profile_pic_url) score += 1;
    if (profile.experiences && profile.experiences.length > 0) score += 2;
    if (profile.education && profile.education.length > 0) score += 1;
    if (profile.certifications && profile.certifications.length > 0) score += 1;
    if (profile.languages && profile.languages.length > 0) score += 0.5;
    if (profile.volunteer_work && profile.volunteer_work.length > 0) score += 0.5;

    return Math.round((score / maxScore) * 100);
}

function estimateProxycurlNetworkSize(profile: ProxycurlProfile): string {
    const connections = profile.connections || 0;
    
    if (connections === 0) return 'Unknown';
    if (connections < 50) return 'Small';
    if (connections < 500) return 'Medium';
    if (connections < 1000) return 'Large';
    return 'Very Large';
}

function estimateProxycurlSeniority(profile: ProxycurlProfile): string {
    const experiences = profile.experiences || [];
    const currentRole = experiences.find(exp => !exp.ends_at);
    
    if (!currentRole) return 'Individual Contributor';
    
    const title = (currentRole.title || '').toLowerCase();
    
    if (title.includes('ceo') || title.includes('president') || title.includes('founder')) {
        return 'C-Level';
    }
    if (title.includes('vp') || title.includes('vice president') || title.includes('director')) {
        return 'Executive';
    }
    if (title.includes('manager') || title.includes('lead') || title.includes('head')) {
        return 'Manager';
    }
    if (title.includes('senior') || title.includes('principal') || title.includes('staff')) {
        return 'Senior';
    }
    
    return 'Individual Contributor';
}

export async function POST(request: NextRequest) {
    try {
        const { profileUrls, profileUrl } = await request.json();

        // Handle both single URL and array of URLs
        let urls: string[] = [];
        if (profileUrls && Array.isArray(profileUrls)) {
            urls = profileUrls;
        } else if (profileUrl && typeof profileUrl === 'string') {
            urls = [profileUrl];
        } else {
            return NextResponse.json(
                { success: false, error: 'Either profileUrl (string) or profileUrls (array) is required' },
                { status: 400 }
            );
        }

        if (urls.length === 0) {
            return NextResponse.json(
                { success: false, error: 'At least one profile URL is required' },
                { status: 400 }
            );
        }

        const proxycurlApiKey = process.env.PROXYCURL_API_KEY;
        if (!proxycurlApiKey) {
            return NextResponse.json(
                { success: false, error: 'Proxycurl API key not configured. Please add PROXYCURL_API_KEY to your .env.local file.' },
                { status: 500 }
            );
        }

        // Take the first URL from the array (for now, we'll process one at a time)
        const targetUrl = urls[0];
        
        // Validate LinkedIn URL format
        if (!targetUrl.includes('linkedin.com/in/')) {
            return NextResponse.json(
                { success: false, error: 'Invalid LinkedIn profile URL format. Must contain "linkedin.com/in/"' },
                { status: 400 }
            );
        }

        console.log('🔍 Scraping LinkedIn profile with Proxycurl:', targetUrl);

        // Call Proxycurl Direct API - CORRECTED ENDPOINT
        const apiUrl = new URL('https://nubela.co/proxycurl/api/v2/linkedin');
        apiUrl.searchParams.append('url', targetUrl);
        apiUrl.searchParams.append('use_cache', 'if-present');

        const response = await fetch(apiUrl.toString(), {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${proxycurlApiKey}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Proxycurl API error:', response.status, errorText);
            
            if (response.status === 401) {
                return NextResponse.json(
                    { 
                        success: false, 
                        error: 'Invalid Proxycurl API key. Please check your API key.',
                        details: errorText
                    },
                    { status: 401 }
                );
            }
            
            if (response.status === 402) {
                return NextResponse.json(
                    { 
                        success: false, 
                        error: 'Proxycurl credits exhausted. Please check your account balance.',
                        details: errorText
                    },
                    { status: 402 }
                );
            }
            
            if (response.status === 404) {
                return NextResponse.json(
                    { 
                        success: false, 
                        error: 'LinkedIn profile not found or private',
                        details: errorText
                    },
                    { status: 404 }
                );
            }
            
            return NextResponse.json(
                { 
                    success: false, 
                    error: `Proxycurl API error: ${response.status}`,
                    details: errorText
                },
                { status: response.status }
            );
        }

        const proxycurlData: ProxycurlProfile = await response.json();
        console.log('✅ Proxycurl data received for:', proxycurlData.full_name || 'Unknown');

        // Transform to standard format
        const standardProfile = transformProxycurlProfile(proxycurlData);

        return NextResponse.json({
            success: true,
            profile: standardProfile,
            metadata: {
                scraper: 'Proxycurl',
                timestamp: new Date().toISOString(),
                profileUrl: targetUrl,
                creditsUsed: 1
            }
        });

    } catch (error) {
        console.error('❌ LinkedIn scraping error:', error);
        return NextResponse.json(
            { 
                success: false, 
                error: 'Failed to scrape LinkedIn profile',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}
