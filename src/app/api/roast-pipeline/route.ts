import { NextRequest, NextResponse } from 'next/server';

// Define proper interfaces for type safety
interface LinkedInProfile {
    linkedinUrl: string;
    name?: string;
    headline?: string;
    location?: string;
    about?: string;
    experience?: Array<{
        title: string;
        company: string;
        duration?: string;
    }>;
    education?: Array<{
        school: string;
        degree?: string;
    }>;
    connections?: number;
    posts?: Array<{
        content: string;
        date?: string;
        engagement?: number;
    }>;
}

interface PersonaAnalysis {
    persona: 'Networker' | 'Ghost' | 'Hustler' | 'Lurker';
    confidence: number;
    reasoning: string;
    contentSuggestions: string[];
}

interface GeneratedContent {
    script: string;
    persona: string;
    roastType: string;
}

interface RoastResult {
    profileId: string;
    name: string;
    persona: 'Networker' | 'Ghost' | 'Hustler' | 'Lurker' | 'Unknown';
    confidence: number;
    roastScript: string;
    audioBase64: string;
    mimeType: string;
    success: boolean;
    error?: string;
}

interface ApiResponse<T> {
    success: boolean;
    data?: T;
    analysis?: PersonaAnalysis;
    content?: GeneratedContent;
    audio?: string;
    mimeType?: string;
    error?: string;
    details?: string;
}

export async function POST(request: NextRequest) {
    try {
        const { linkedinUrls }: { linkedinUrls: string[] } = await request.json();

        if (!linkedinUrls || !Array.isArray(linkedinUrls)) {
            return NextResponse.json({ error: 'LinkedIn URLs array is required' }, { status: 400 });
        }

        // Step 1: Scrape LinkedIn profiles (mock data)
        const scrapeResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/scrape-linkedin`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ profileUrls: linkedinUrls }),
        });

        if (!scrapeResponse.ok) {
            throw new Error('LinkedIn scraping failed');
        }

        const scrapeData: ApiResponse<LinkedInProfile[]> = await scrapeResponse.json();
        const profiles = scrapeData.data || [];

        // Process each profile
        const results: RoastResult[] = await Promise.all(
            profiles.map(async (profile: LinkedInProfile): Promise<RoastResult> => {
                try {
                    // Step 2: Analyze persona
                    const personaResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/analyze-persona`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ profileData: profile }),
                    });

                    const personaData: ApiResponse<PersonaAnalysis> = await personaResponse.json();
                    
                    if (!personaData.analysis) {
                        throw new Error('Failed to get persona analysis');
                    }

                    // Step 3: Generate roast content
                    const contentResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/generate-content`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ 
                            persona: personaData.analysis.persona,
                            profileData: profile,
                            contentType: 'roast'
                        }),
                    });

                    const contentData: ApiResponse<GeneratedContent> = await contentResponse.json();

                    if (!contentData.content) {
                        throw new Error('Failed to generate roast content');
                    }

                    // Step 4: Generate audio
                    const audioResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/generate-audio`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ text: contentData.content.script }),
                    });

                    const audioData: ApiResponse<string> = await audioResponse.json();

                    if (!audioData.audio) {
                        throw new Error('Failed to generate audio');
                    }

                    return {
                        profileId: profile.linkedinUrl,
                        name: profile.name || 'Unknown',
                        persona: personaData.analysis.persona,
                        confidence: personaData.analysis.confidence,
                        roastScript: contentData.content.script,
                        audioBase64: audioData.audio,
                        mimeType: audioData.mimeType || 'audio/mpeg',
                        success: true
                    };

                } catch (error) {
                    return {
                        profileId: profile.linkedinUrl,
                        name: profile.name || 'Unknown',
                        persona: 'Unknown',
                        confidence: 0,
                        roastScript: '',
                        audioBase64: '',
                        mimeType: '',
                        success: false,
                        error: error instanceof Error ? error.message : 'Unknown error'
                    };
                }
            })
        );

        return NextResponse.json({
            success: true,
            results,
            processed: results.length,
            successful: results.filter(r => r.success).length
        });

    } catch (error) {
        console.error('Roast pipeline error:', error);
        return NextResponse.json({ 
            error: 'Roast pipeline execution failed',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
