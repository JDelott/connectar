import { NextResponse } from 'next/server';
import { ApifyClient } from 'apify-client';

export async function GET() {
    try {
        const apiToken = process.env.APIFY_API_TOKEN;
        
        if (!apiToken) {
            return NextResponse.json({
                success: false,
                error: 'APIFY_API_TOKEN not found in environment variables'
            }, { status: 400 });
        }

        const apifyClient = new ApifyClient({
            token: apiToken,
        });

        // Test basic API access
        const user = await apifyClient.user().get();
        
        // Try to get actor info
        let actorInfo = null;
        
        try {
            // Check the specific Twitter actor
            const actor = await apifyClient.actor('web.harvester/twitter-scraper').get();
            actorInfo = {
                id: actor?.id,
                name: actor?.name,
                username: actor?.username,
                isPublic: actor?.isPublic
            };
        } catch (error) {
            console.log('Could not fetch actor info:', error);
        }
        
        return NextResponse.json({
            success: true,
            message: 'Apify API connection successful',
            user: {
                id: user?.id,
                username: user?.username,
                email: user?.email
            },
            actorInfo,
            hasToken: !!apiToken,
            tokenLength: apiToken.length
        });

    } catch (error) {
        console.error('❌ Apify API test failed:', error);
        
        return NextResponse.json({
            success: false,
            error: 'Failed to connect to Apify API',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
