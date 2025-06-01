import { NextRequest, NextResponse } from 'next/server';
import { ApifyClient } from 'apify-client';

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
    const { datasetId = 'KFiSgS3IGd7MJsOl4' } = await req.json();

    if (!process.env.APIFY_API_TOKEN) {
      throw new Error('Apify API token not configured');
    }

    const apifyClient = new ApifyClient({
      token: process.env.APIFY_API_TOKEN,
    });

    console.log('🔍 Accessing specific dataset:', datasetId);

    try {
      // Get dataset info first
      const dataset = await apifyClient.dataset(datasetId).get();
      console.log('📊 Dataset info:', {
        id: dataset?.id,
        name: dataset?.name,
        itemCount: dataset?.itemCount,
        cleanItemCount: dataset?.cleanItemCount,
        accessedAt: dataset?.accessedAt,
        createdAt: dataset?.createdAt,
        modifiedAt: dataset?.modifiedAt
      });

      // Try different approaches to get data
      const approaches = [
        { name: 'listItems()', method: () => apifyClient.dataset(datasetId).listItems() },
        { name: 'listItems({limit: 10})', method: () => apifyClient.dataset(datasetId).listItems({ limit: 10 }) },
        { name: 'listItems({offset: 0, limit: 5})', method: () => apifyClient.dataset(datasetId).listItems({ offset: 0, limit: 5 }) },
      ];

      const results = [];

      for (const approach of approaches) {
        try {
          console.log(`🧪 Trying ${approach.name}...`);
          const result = await approach.method();
          const items = result.items as ApifyItem[];
          
          const analysis = {
            approach: approach.name,
            totalItems: items.length,
            firstItem: items[0] || null,
            allKeys: items.length > 0 ? [...new Set(items.flatMap(item => Object.keys(item)))] : [],
            demoCount: items.filter(item => item.demo === true).length,
            realCount: items.filter(item => item.demo !== true).length,
            itemsWithText: items.filter(item => item.text || item.full_text).length,
            itemsWithAuthor: items.filter(item => item.author).length,
            sampleSizes: items.slice(0, 3).map(item => JSON.stringify(item).length)
          };

          results.push(analysis);
          console.log(`✅ ${approach.name} completed:`, analysis);

        } catch (error) {
          console.error(`❌ ${approach.name} failed:`, error);
          results.push({
            approach: approach.name,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      return NextResponse.json({
        success: true,
        datasetInfo: dataset,
        results,
        debug: {
          datasetId,
          timestamp: new Date().toISOString()
        }
      });

    } catch (datasetError) {
      console.error('❌ Dataset access error:', datasetError);
      return NextResponse.json({
        success: false,
        error: 'Failed to access dataset',
        details: datasetError instanceof Error ? datasetError.message : 'Unknown dataset error',
        datasetId
      }, { status: 500 });
    }

  } catch (error) {
    console.error('❌ Test specific dataset error:', error);
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
