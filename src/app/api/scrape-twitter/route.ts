import { NextRequest, NextResponse } from 'next/server';
import { ApifyClient } from 'apify-client';

// Types for transformed data
interface TwitterProfile {
  username: string;
  displayName: string;
  bio: string;
  location: string;
  website: string;
  followersCount: number;
  followingCount: number;
  postsCount: number;
  isVerified: boolean;
  profileImageUrl: string;
  bannerImageUrl: string;
  joinDate: string;
}

interface TwitterTweet {
  id: string;
  text: string;
  createdAt: string;
  likeCount: number;
  retweetCount: number;
  replyCount: number;
  isRetweet: boolean;
  isReply: boolean;
  mediaUrls: string[];
}

interface TwitterData {
  profile: TwitterProfile;
  tweets: TwitterTweet[];
  metadata: {
    totalTweets: number;
    scrapedAt: string;
    profileUrl: string;
  };
}

// Apify response types
interface ApifyAuthor {
  userName?: string;
  screen_name?: string;
  name?: string;
  description?: string;
  location?: string;
  followers?: number;
  followers_count?: number;
  following?: number;
  friends_count?: number;
  statusesCount?: number;
  statuses_count?: number;
  isVerified?: boolean;
  verified?: boolean;
  profilePicture?: string;
  profile_image_url_https?: string;
  coverPicture?: string;
  profile_banner_url?: string;
  createdAt?: string;
  created_at?: string;
}

interface ApifyTweet {
  demo?: boolean;
  type?: string;
  id?: string;
  id_str?: string;
  text?: string;
  full_text?: string;
  createdAt?: string;
  created_at?: string;
  likeCount?: number;
  favorite_count?: number;
  retweetCount?: number;
  retweet_count?: number;
  replyCount?: number;
  reply_count?: number;
  isRetweet?: boolean;
  isReply?: boolean;
  author?: ApifyAuthor;
  media?: Array<{
    media_url_https?: string;
    url?: string;
  }>;
}

function extractUsernameFromUrl(url: string): string {
  const patterns = [
    /(?:twitter\.com|x\.com)\/([^\/\?]+)/i,
    /(?:@)?([a-zA-Z0-9_]+)$/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1].replace('@', '');
    }
  }
  
  return url.replace('@', '').replace(/^https?:\/\//, '');
}

function transformTwitterData(rawData: ApifyTweet[], profileUrl: string): TwitterData {
  console.log('🔍 Raw data received:', rawData.length, 'items');
  console.log('🔍 First item full structure:', JSON.stringify(rawData[0], null, 2));
  
  if (!rawData || rawData.length === 0) {
    throw new Error('No data received from Twitter scraper');
  }

  // Better demo data detection - check for actual tweet content
  const realData = rawData.filter(item => {
    // If it has demo: true, it's definitely demo
    if (item.demo === true) return false;
    
    // If it has actual tweet data, it's likely real
    if (item.type === 'tweet' && (item.text || item.full_text)) return true;
    
    // Include all non-demo items for now
    return !item.demo;
  });
  
  console.log('🔍 Real data (non-demo):', realData.length, 'items');
  console.log('🔍 Sample real item:', JSON.stringify(realData[0], null, 2));

  if (realData.length === 0) {
    throw new Error('Only demo data received - this may be due to rate limits or usage restrictions');
  }

  // Find the first tweet with author data for profile info
  const profileTweet = realData.find(item => 
    item.type === 'tweet' && 
    item.author && 
    typeof item.author === 'object'
  );

  if (!profileTweet?.author) {
    throw new Error('No profile data found in tweets');
  }

  const author = profileTweet.author;

  const profile: TwitterProfile = {
    username: author.userName || author.screen_name || '',
    displayName: author.name || '',
    bio: author.description || '',
    location: author.location || '',
    website: '', // Extract from entities if needed
    followersCount: author.followers || author.followers_count || 0,
    followingCount: author.following || author.friends_count || 0,
    postsCount: author.statusesCount || author.statuses_count || 0,
    isVerified: author.isVerified || author.verified || false,
    profileImageUrl: author.profilePicture || author.profile_image_url_https || '',
    bannerImageUrl: author.coverPicture || author.profile_banner_url || '',
    joinDate: author.createdAt || author.created_at || ''
  };

  // Transform tweets
  const tweets: TwitterTweet[] = realData
    .filter(item => item.type === 'tweet')
    .map(tweet => {
      // Properly filter media URLs to ensure no undefined values
      const mediaUrls: string[] = [];
      if (tweet.media && Array.isArray(tweet.media)) {
        for (const mediaItem of tweet.media) {
          const url = mediaItem.media_url_https || mediaItem.url;
          if (url && typeof url === 'string') {
            mediaUrls.push(url);
          }
        }
      }

      return {
        id: tweet.id || tweet.id_str || '',
        text: tweet.text || tweet.full_text || '',
        createdAt: tweet.createdAt || tweet.created_at || '',
        likeCount: tweet.likeCount || tweet.favorite_count || 0,
        retweetCount: tweet.retweetCount || tweet.retweet_count || 0,
        replyCount: tweet.replyCount || tweet.reply_count || 0,
        isRetweet: tweet.isRetweet || false,
        isReply: tweet.isReply || false,
        mediaUrls
      };
    });

  console.log('📊 Transformed profile:', profile);
  console.log('📊 Transformed tweets count:', tweets.length);

  return {
    profile,
    tweets,
    metadata: {
      totalTweets: tweets.length,
      scrapedAt: new Date().toISOString(),
      profileUrl
    }
  };
}

export async function POST(req: NextRequest) {
  try {
    const { profileUrl, maxPosts = 20, useAlternativeActor = false } = await req.json();

    if (!profileUrl) {
      return NextResponse.json(
        { success: false, error: 'Profile URL is required' },
        { status: 400 }
      );
    }

    const username = extractUsernameFromUrl(profileUrl);
    console.log('🐦 Scraping Twitter profile for username:', username);

    if (!process.env.APIFY_API_TOKEN) {
      throw new Error('Apify API token not configured');
    }

    const apifyClient = new ApifyClient({
      token: process.env.APIFY_API_TOKEN,
    });

    let run;

    if (useAlternativeActor) {
      // Try lumen_limitless/x-crawler (uses regular credits)
      const input = {
        usernames: [username],
        tweetsDesired: Math.max(50, maxPosts),
        addUserInfo: true
      };

      console.log('🚀 Starting Apify run with x-crawler actor:', JSON.stringify(input, null, 2));
      run = await apifyClient.actor('lumen_limitless/x-crawler').call(input);
    } else {
      // Original actor with enhanced debugging
      const input = {
        searchTerms: [`from:${username}`],
        maxItems: Math.max(50, maxPosts),
        includeSearchTerms: false,
        onlyImage: false,
        onlyQuote: false,
        onlyTwitterBlue: false,
        onlyVerifiedUsers: false,
        onlyVideo: false,
        sort: "Latest",
        tweetLanguage: "en"
      };

      console.log('🚀 Starting Apify run with tweet-scraper:', JSON.stringify(input, null, 2));
      run = await apifyClient.actor('apidojo/tweet-scraper').call(input);
    }

    if (!run || !run.id) {
      throw new Error('Failed to start Apify run');
    }

    console.log('✅ Apify run completed:', run.id);
    console.log('📊 Run details:', JSON.stringify({
      id: run.id,
      status: run.status,
      usage: run.usage,
      defaultDatasetId: run.defaultDatasetId
    }, null, 2));

    // Wait longer for data to be fully available
    await new Promise(resolve => setTimeout(resolve, 5000)); // Increased to 5 seconds

    // Try multiple times to get data with better error reporting
    let items: ApifyTweet[] = [];
    let attempts = 0;
    const maxAttempts = 5;

    while (attempts < maxAttempts) {
      try {
        const result = await apifyClient.dataset(run.defaultDatasetId).listItems();
        items = result.items;
        
        console.log(`🔍 Attempt ${attempts + 1}: Retrieved ${items.length} items from dataset`);
        
        if (items.length > 0) {
          // Log first few items for debugging
          console.log('🔍 First 3 items structure:', items.slice(0, 3).map(item => ({
            keys: Object.keys(item),
            demo: item.demo,
            type: item.type,
            hasText: !!(item.text || item.full_text),
            hasAuthor: !!item.author
          })));
          break;
        }
        
        if (attempts < maxAttempts - 1) {
          console.log('⏰ No items yet, waiting 3 more seconds...');
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
      } catch (datasetError) {
        console.error(`❌ Dataset access error on attempt ${attempts + 1}:`, datasetError);
        if (attempts === maxAttempts - 1) throw datasetError;
      }
      attempts++;
    }

    if (items.length === 0) {
      throw new Error('No items found in dataset after multiple attempts');
    }

    // Enhanced demo data detection
    const demoItems = items.filter(item => item.demo === true);
    const nonDemoItems = items.filter(item => item.demo !== true);
    const itemsWithText = items.filter(item => item.text || item.full_text);
    const itemsWithAuthor = items.filter(item => item.author);

    console.log('📊 Data analysis:', {
      total: items.length,
      demo: demoItems.length,
      nonDemo: nonDemoItems.length,
      withText: itemsWithText.length,
      withAuthor: itemsWithAuthor.length
    });

    // If all items are demo, return error with debugging info
    if (demoItems.length === items.length) {
      return NextResponse.json({
        success: false,
        error: 'Only demo data received',
        debug: {
          runId: run.id,
          actor: useAlternativeActor ? 'lumen_limitless/x-crawler' : 'apidojo/tweet-scraper',
          itemsCount: items.length,
          datasetId: run.defaultDatasetId,
          runStatus: run.status,
          runUsage: run.usage,
          allDemo: true,
          sampleItem: items[0]
        }
      }, { status: 422 });
    }

    const transformedData = transformTwitterData(items as ApifyTweet[], profileUrl);

    return NextResponse.json({
      success: true,
      data: transformedData,
      debug: {
        runId: run.id,
        actor: useAlternativeActor ? 'lumen_limitless/x-crawler' : 'apidojo/tweet-scraper',
        itemsCount: items.length,
        datasetId: run.defaultDatasetId,
        demoCount: demoItems.length,
        realCount: nonDemoItems.length
      }
    });

  } catch (error) {
    console.error('❌ Twitter scraping error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
