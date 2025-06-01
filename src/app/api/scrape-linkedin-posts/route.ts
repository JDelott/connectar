import { NextRequest, NextResponse } from 'next/server';
import { ApifyClient } from 'apify-client';

const apifyClient = new ApifyClient({
    token: process.env.APIFY_API_TOKEN,
});

const LINKEDIN_POSTS_ACTOR_ID = 'harvestapi/linkedin-profile-posts';

interface LinkedInPost {
    text?: string;
    publishedAt?: string;
    likesCount?: number;
    commentsCount?: number;
    sharesCount?: number;
    authorName?: string;
    authorHeadline?: string;
    postUrl?: string;
    mediaType?: string;
    mediaUrl?: string;
}

// Interface for raw LinkedIn post data from Apify
interface RawLinkedInPostData {
    text?: string;
    content?: string;
    publishedAt?: string;
    date?: string;
    likesCount?: number;
    likes?: number;
    commentsCount?: number;
    comments?: number;
    sharesCount?: number;
    shares?: number;
    authorName?: string;
    authorHeadline?: string;
    postUrl?: string;
    url?: string;
    mediaType?: string;
    mediaUrl?: string;
}

interface PostsApiResponse {
    success: boolean;
    data?: LinkedInPost[];
    error?: string;
    details?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse<PostsApiResponse>> {
    try {
        const { profileUrl, maxPosts = 50 } = await request.json();

        if (!profileUrl) {
            return NextResponse.json({
                success: false,
                error: 'LinkedIn profile URL is required'
            }, { status: 400 });
        }

        console.log('🚀 Scraping LinkedIn posts for:', profileUrl);

        // Run the Apify actor for LinkedIn posts
        const run = await apifyClient.actor(LINKEDIN_POSTS_ACTOR_ID).call({
            startUrls: [profileUrl],
            maxItems: maxPosts,
            proxyConfiguration: {
                useApifyProxy: true,
                apifyProxyCountry: 'US'
            }
        });

        console.log('✅ Apify posts run completed:', run.id);

        // Get the dataset results
        const { items } = await apifyClient.dataset(run.defaultDatasetId).listItems();
        
        if (!items || items.length === 0) {
            return NextResponse.json({
                success: false,
                error: 'No posts found. The profile might be private or have no posts.'
            }, { status: 404 });
        }

        // Transform the posts data with proper typing
        const transformedPosts: LinkedInPost[] = items.map((item: RawLinkedInPostData) => ({
            text: item.text || item.content || '',
            publishedAt: item.publishedAt || item.date || '',
            likesCount: item.likesCount || item.likes || 0,
            commentsCount: item.commentsCount || item.comments || 0,
            sharesCount: item.sharesCount || item.shares || 0,
            authorName: item.authorName || '',
            authorHeadline: item.authorHeadline || '',
            postUrl: item.postUrl || item.url || '',
            mediaType: item.mediaType || '',
            mediaUrl: item.mediaUrl || ''
        }));

        console.log(`📊 Found ${transformedPosts.length} posts`);

        return NextResponse.json({
            success: true,
            data: transformedPosts
        });

    } catch (error) {
        console.error('❌ Error scraping LinkedIn posts:', error);
        
        return NextResponse.json({
            success: false,
            error: 'Failed to scrape LinkedIn posts',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
