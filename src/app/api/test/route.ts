import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
    return NextResponse.json({
        message: 'Connectar API is running!',
        endpoints: {
            '/api/scrape-linkedin': 'POST - Scrape LinkedIn profiles',
            '/api/analyze-persona': 'POST - Analyze user persona',
            '/api/generate-content': 'POST - Generate connection content',
            '/api/generate-audio': 'POST - Convert text to speech',
            '/api/generate-video': 'POST - Generate video with D-ID',
            '/api/unity-pipeline': 'POST - Full pipeline for Unity'
        }
    });
}

export async function POST(request: NextRequest) {
    const { testEndpoint, ...testData } = await request.json();
    
    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/${testEndpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(testData),
        });
        
        const result = await response.json();
        
        return NextResponse.json({
            success: true,
            endpoint: testEndpoint,
            result
        });
    } catch (error) {
        return NextResponse.json({
            success: false,
            endpoint: testEndpoint,
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
