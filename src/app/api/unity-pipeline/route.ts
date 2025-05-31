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
    talkingPoints: string[];
}

interface ProcessingResult {
    profileId: string;
    persona?: string;
    confidence?: number;
    content?: GeneratedContent;
    videoUrl?: string;
    success: boolean;
    error?: string;
}

interface ApiResponse<T> {
    success: boolean;
    data?: T;
    analysis?: PersonaAnalysis;
    content?: GeneratedContent;
    audio?: string;
    videoUrl?: string;
    error?: string;
    details?: string;
}

export async function POST(request: NextRequest) {
    try {
        const { linkedinUrls, unityCallback }: { 
            linkedinUrls: string[]; 
            unityCallback?: string; 
        } = await request.json();

        if (!linkedinUrls || !Array.isArray(linkedinUrls)) {
            return NextResponse.json({ error: 'LinkedIn URLs array is required' }, { status: 400 });
        }

        // Step 1: Scrape LinkedIn profiles
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
        const results: ProcessingResult[] = await Promise.all(
            profiles.map(async (profile: LinkedInProfile): Promise<ProcessingResult> => {
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

                    // Step 3: Generate content
                    const contentResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/generate-content`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ 
                            persona: personaData.analysis.persona,
                            profileData: profile 
                        }),
                    });

                    const contentData: ApiResponse<GeneratedContent> = await contentResponse.json();

                    if (!contentData.content) {
                        throw new Error('Failed to generate content');
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

                    // Step 5: Generate video
                    const videoResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/generate-video`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ audioBase64: audioData.audio }),
                    });

                    const videoData: ApiResponse<string> = await videoResponse.json();

                    if (!videoData.videoUrl) {
                        throw new Error('Failed to generate video');
                    }

                    return {
                        profileId: profile.linkedinUrl,
                        persona: personaData.analysis.persona,
                        confidence: personaData.analysis.confidence,
                        content: contentData.content,
                        videoUrl: videoData.videoUrl,
                        success: true
                    };

                } catch (error) {
                    return {
                        profileId: profile.linkedinUrl,
                        success: false,
                        error: error instanceof Error ? error.message : 'Unknown error'
                    };
                }
            })
        );

        // If Unity callback provided, send results
        if (unityCallback) {
            try {
                await fetch(unityCallback, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ results }),
                });
            } catch (callbackError) {
                console.error('Unity callback failed:', callbackError);
            }
        }

        return NextResponse.json({
            success: true,
            results,
            processed: results.length,
            successful: results.filter(r => r.success).length
        });

    } catch (error) {
        console.error('Pipeline error:', error);
        return NextResponse.json({ 
            error: 'Pipeline execution failed',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
