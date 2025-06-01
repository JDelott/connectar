import { NextRequest, NextResponse } from 'next/server';
import { ApifyClient } from 'apify-client';

// Define types for better type safety
interface XCrawlerInput {
  usernames: string[];
  tweetsDesired: number;
  addUserInfo: boolean;
}

interface TweetScraperInput {
  searchTerms: string[];
  maxItems: number;
  includeSearchTerms: boolean;
  onlyImage: boolean;
  onlyQuote: boolean;
  onlyTwitterBlue: boolean;
  onlyVerifiedUsers: boolean;
  onlyVideo: boolean;
  sort: string;
  tweetLanguage: string;
}

interface ApifyItem {
  demo?: boolean;
  type?: string;
  id?: string;
  id_str?: string;
  text?: string;
  full_text?: string;
  createdAt?: string;
  created_at?: string;
  author?: Record<string, unknown>;
  [key: string]: unknown;
}

export async function POST(req: NextRequest) {
  try {
    const { username = 'nasa', actor = 'apidojo/tweet-scraper' } = await req.json();

    if (!process.env.APIFY_API_TOKEN) {
      throw new Error('Apify API token not configured');
    }

    const apifyClient = new ApifyClient({
      token: process.env.APIFY_API_TOKEN,
    });

    let input: XCrawlerInput | TweetScraperInput;
    
    if (actor === 'lumen_limitless/x-crawler') {
      input = {
        usernames: [username],
        tweetsDesired: 25,
        addUserInfo: true
      };
    } else {
      input = {
        searchTerms: [`from:${username}`],
        maxItems: 25,
        includeSearchTerms: false,
        onlyImage: false,
        onlyQuote: false,
        onlyTwitterBlue: false,
        onlyVerifiedUsers: false,
        onlyVideo: false,
        sort: "Latest",
        tweetLanguage: "en"
      };
    }

    console.log('🧪 Testing direct Apify call with:', { actor, input });

    const run = await apifyClient.actor(actor).call(input);
    
    console.log('✅ Run completed:', run.id);
    console.log('📊 Run details:', {
      status: run.status,
      usage: run.usage,
      stats: run.stats
    });

    // Wait for data
    await new Promise(resolve => setTimeout(resolve, 5000));

    const result = await apifyClient.dataset(run.defaultDatasetId).listItems();
    const items = result.items as ApifyItem[];

    console.log('📦 Raw dataset items:', items.length);

    // Analyze the data structure
    const analysis = {
      totalItems: items.length,
      itemStructures: items.slice(0, 5).map((item, index) => {
        const textContent = item.text || item.full_text;
        const textString = typeof textContent === 'string' ? textContent : '';
        
        return {
          index,
          keys: Object.keys(item),
          demo: item.demo,
          type: item.type,
          hasText: !!(item.text || item.full_text),
          hasAuthor: !!item.author,
          sampleFields: {
            id: item.id || item.id_str,
            text: textString.substring(0, 100),
            createdAt: item.createdAt || item.created_at
          }
        };
      }),
      demoCount: items.filter(item => item.demo === true).length,
      realCount: items.filter(item => item.demo !== true).length
    };

    return NextResponse.json({
      success: true,
      runInfo: {
        id: run.id,
        status: run.status,
        usage: run.usage,
        stats: run.stats,
        datasetId: run.defaultDatasetId
      },
      analysis,
      rawSample: items.slice(0, 3) // First 3 items for inspection
    });

  } catch (error) {
    console.error('❌ Direct Apify test error:', error);
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
