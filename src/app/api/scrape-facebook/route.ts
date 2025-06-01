import { NextRequest, NextResponse } from 'next/server';
import { ApifyClient } from 'apify-client';

const apifyClient = new ApifyClient({
    token: process.env.APIFY_API_TOKEN,
});

const FACEBOOK_ACTOR_ID = 'axesso_data/facebook-posts-scraper';

interface FacebookPost {
    text?: string;
    publishedAt?: string;
    likesCount?: number;
    commentsCount?: number;
    sharesCount?: number;
    authorName?: string;
    postUrl?: string;
    mediaType?: string;
    mediaUrls?: string[];
}

interface FacebookProfile {
    name: string;
    bio?: string;
    location?: string;
    website?: string;
    posts: FacebookPost[];
}

interface FacebookApiResponse {
    success: boolean;
    data?: FacebookProfile;
    error?: string;
    details?: string;
}

interface RawFacebookItem {
    text?: string;
    content?: string;
    message?: string;
    publishedAt?: string;
    createdTime?: string;
    date?: string;
    likesCount?: number;
    likes?: number;
    commentsCount?: number;
    comments?: number;
    sharesCount?: number;
    shares?: number;
    authorName?: string;
    author?: string;
    postUrl?: string;
    url?: string;
    mediaType?: string;
    type?: string;
    mediaUrls?: string[];
    media?: string[];
}

export async function POST(request: NextRequest): Promise<NextResponse<FacebookApiResponse>> {
    try {
        const { profileUrl, maxPosts = 50 } = await request.json();

        if (!profileUrl) {
            return NextResponse.json({
                success: false,
                error: 'Facebook profile URL is required'
            }, { status: 400 });
        }

        console.log('🚀 Scraping Facebook posts for:', profileUrl);

        const run = await apifyClient.actor(FACEBOOK_ACTOR_ID).call({
            startUrls: [profileUrl],
            maxItems: maxPosts,
            proxyConfiguration: {
                useApifyProxy: true,
                apifyProxyCountry: 'US'
            }
        });

        console.log('✅ Apify Facebook run completed:', run.id);

        const { items } = await apifyClient.dataset(run.defaultDatasetId).listItems();
        
        if (!items || items.length === 0) {
            return NextResponse.json({
                success: false,
                error: 'No Facebook posts found. The profile might be private or have no posts.'
            }, { status: 404 });
        }

        const posts: FacebookPost[] = items.map((item: RawFacebookItem) => ({
            text: item.text || item.content || item.message || '',
            publishedAt: item.publishedAt || item.createdTime || item.date || '',
            likesCount: item.likesCount || item.likes || 0,
            commentsCount: item.commentsCount || item.comments || 0,
            sharesCount: item.sharesCount || item.shares || 0,
            authorName: item.authorName || item.author || '',
            postUrl: item.postUrl || item.url || '',
            mediaType: item.mediaType || item.type || '',
            mediaUrls: item.mediaUrls || item.media || []
        }));

        const firstItem = items[0] as RawFacebookItem;
        const profileName = firstItem?.authorName || firstItem?.author || 'Unknown User';

        const profileData: FacebookProfile = {
            name: profileName,
            bio: '',
            location: '',
            website: '',
            posts: posts
        };

        console.log(`📊 Found ${posts.length} Facebook posts for ${profileName}`);

        return NextResponse.json({
            success: true,
            data: profileData
        });

    } catch (error) {
        console.error('❌ Error scraping Facebook posts:', error);
        
        return NextResponse.json({
            success: false,
            error: 'Failed to scrape Facebook posts',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
