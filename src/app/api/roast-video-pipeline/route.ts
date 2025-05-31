import { NextRequest, NextResponse } from 'next/server';

// Define proper interfaces for type safety
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

interface VideoEnhancedRoastResult extends RoastResult {
    videoUrl?: string | null;
    videoError?: string | null;
    talkId?: string;
    processingTime?: string;
}

interface RoastPipelineResponse {
    success: boolean;
    results: RoastResult[];
    processed: number;
    successful: number;
    error?: string;
    details?: string;
}

interface VideoResponse {
    success: boolean;
    videoUrl?: string;
    talkId?: string;
    processingTime?: string;
    error?: string;
}

export async function POST(request: NextRequest) {
    try {
        const { linkedinUrls, generateVideo = true }: { 
            linkedinUrls: string[]; 
            generateVideo?: boolean; 
        } = await request.json();

        if (!linkedinUrls || !Array.isArray(linkedinUrls)) {
            return NextResponse.json({ error: 'LinkedIn URLs array is required' }, { status: 400 });
        }

        // Run the regular roast pipeline first
        const roastResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/roast-pipeline`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ linkedinUrls }),
        });

        if (!roastResponse.ok) {
            throw new Error('Roast pipeline failed');
        }

        const roastData: RoastPipelineResponse = await roastResponse.json();

        // If video generation is enabled, create videos for successful roasts
        if (generateVideo && roastData.success) {
            const videoResults: VideoEnhancedRoastResult[] = await Promise.all(
                roastData.results.map(async (result: RoastResult): Promise<VideoEnhancedRoastResult> => {
                    if (!result.success || !result.audioBase64) {
                        return {
                            ...result,
                            videoUrl: null,
                            videoError: 'No audio available for video generation'
                        };
                    }

                    try {
                        // Generate video
                        const videoResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/generate-video`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ 
                                audioBase64: result.audioBase64
                            }),
                        });

                        const videoData: VideoResponse = await videoResponse.json();

                        return {
                            ...result,
                            videoUrl: videoData.success ? videoData.videoUrl || null : null,
                            videoError: videoData.success ? null : videoData.error || 'Unknown video error',
                            talkId: videoData.talkId,
                            processingTime: videoData.processingTime
                        };

                    } catch (videoError) {
                        return {
                            ...result,
                            videoUrl: null,
                            videoError: videoError instanceof Error ? videoError.message : 'Video generation failed'
                        };
                    }
                })
            );

            return NextResponse.json({
                ...roastData,
                results: videoResults,
                videosGenerated: videoResults.filter(r => r.videoUrl).length
            });
        }

        return NextResponse.json(roastData);

    } catch (error) {
        console.error('Roast video pipeline error:', error);
        return NextResponse.json({ 
            error: 'Roast video pipeline execution failed',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
