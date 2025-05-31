import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const { testType = 'basic', talkId } = await request.json();

        if (!process.env.DID_API_KEY) {
            return NextResponse.json({ error: 'D-ID API key not configured' }, { status: 500 });
        }

        // Correct D-ID authentication format: Base64 encode "api_key:"
        const authHeader = `Basic ${Buffer.from(`${process.env.DID_API_KEY}:`).toString('base64')}`;

        if (testType === 'basic') {
            // Test 1: Basic API connectivity
            const response = await fetch('https://api.d-id.com/credits', {
                headers: {
                    'Authorization': authHeader,
                    'Accept': 'application/json'
                },
            });

            if (!response.ok) {
                const errorData = await response.text();
                return NextResponse.json({
                    success: false,
                    error: `D-ID API Error: ${response.status} - ${errorData}`,
                    status: response.status
                });
            }

            const data = await response.json();
            return NextResponse.json({
                success: true,
                message: 'D-ID API is accessible',
                credits: data,
                status: response.status
            });
        }

        if (testType === 'simple-video') {
            // Test with URLs that are known to have faces and proper extensions
            const testImages = [
                // Use verified face images with proper extensions
                'https://images.generated.photos/tGiLEKTIqS6btZO5RL2LLvh4FjXNqd0weQkn4_bMc38/rs:fit:256:256/czM6Ly9pY29uczgu/Z3Bob3Rvcy1wcm9k/LnBob3Rvcy92M18w/MDkzMTM2LmpwZw.jpg',
                'https://i.pravatar.cc/512.jpg',
                'https://randomuser.me/api/portraits/women/44.jpg',
                'https://randomuser.me/api/portraits/men/32.jpg',
            ];

            for (let i = 0; i < testImages.length; i++) {
                const imageUrl = testImages[i];
                console.log(`🧪 Testing D-ID with image ${i + 1}: ${imageUrl}`);
                
                try {
                    // First verify the image is accessible
                    const imageCheck = await fetch(imageUrl, { method: 'HEAD' });
                    console.log(`📊 Image accessibility: ${imageCheck.status}`);
                    
                    if (!imageCheck.ok) {
                        console.log(`❌ Image ${i + 1} not accessible, skipping...`);
                        continue;
                    }

                    const createResponse = await fetch('https://api.d-id.com/talks', {
                        method: 'POST',
                        headers: {
                            'Authorization': authHeader,
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            source_url: imageUrl,
                            script: {
                                type: 'text',
                                input: 'Hello! This is a test message.'
                            }
                        })
                    });

                    console.log(`📊 Response status: ${createResponse.status}`);

                    if (createResponse.ok) {
                        const responseData = await createResponse.json();
                        console.log('✅ D-ID Response:', responseData);

                        return NextResponse.json({
                            success: true,
                            message: `Video creation started with image ${i + 1}`,
                            talkId: responseData.id,
                            status: responseData.status,
                            imageUsed: imageUrl
                        });
                    } else {
                        const errorData = await createResponse.text();
                        console.error(`❌ D-ID Error with image ${i + 1}:`, errorData);
                        
                        // If this is the last image, return the error
                        if (i === testImages.length - 1) {
                            return NextResponse.json({
                                success: false,
                                error: `D-ID API Error: ${createResponse.status}`,
                                details: errorData,
                                status: createResponse.status,
                                note: 'Tried multiple image URLs, all failed'
                            });
                        }
                    }
                } catch (imageError) {
                    console.error(`❌ Error testing image ${i + 1}:`, imageError);
                }
            }
        }

        if (testType === 'working-demo') {
            // Test with the most reliable face image APIs
            const reliableImages = [
                'https://randomuser.me/api/portraits/women/44.jpg',
                'https://randomuser.me/api/portraits/men/32.jpg',
                'https://i.pravatar.cc/512.jpg'
            ];

            for (const imageUrl of reliableImages) {
                console.log(`🧪 Testing with reliable image: ${imageUrl}`);
                
                try {
                    const createResponse = await fetch('https://api.d-id.com/talks', {
                        method: 'POST',
                        headers: {
                            'Authorization': authHeader,
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            source_url: imageUrl,
                            script: {
                                type: 'text',
                                input: 'Hello world!'
                            }
                        })
                    });

                    console.log(`📊 D-ID Response status: ${createResponse.status}`);

                    if (createResponse.ok) {
                        const responseData = await createResponse.json();
                        console.log('✅ D-ID Success:', responseData);

                        return NextResponse.json({
                            success: true,
                            message: 'Working demo video creation started!',
                            talkId: responseData.id,
                            status: responseData.status,
                            imageUrl: imageUrl
                        });
                    } else {
                        const errorData = await createResponse.text();
                        console.error('❌ D-ID Demo Error:', errorData);
                        
                        // Try next image instead of failing immediately
                        continue;
                    }
                } catch (error) {
                    console.error(`❌ Error with image ${imageUrl}:`, error);
                    continue;
                }
            }
            
            // If we reach here, all images failed
            return NextResponse.json({
                success: false,
                error: 'All reliable images failed',
                details: 'Tried multiple face image sources, all returned errors'
            });
        }

        if (testType === 'get-video') {
            // Test getting a completed video
            if (!talkId) {
                return NextResponse.json({
                    success: false,
                    error: 'Talk ID is required for video retrieval'
                });
            }

            console.log(`🎬 Checking video status for talk: ${talkId}`);
            
            const statusResponse = await fetch(`https://api.d-id.com/talks/${talkId}`, {
                headers: {
                    'Authorization': authHeader,
                    'Accept': 'application/json'
                }
            });

            if (!statusResponse.ok) {
                const errorData = await statusResponse.text();
                return NextResponse.json({
                    success: false,
                    error: `Failed to get video status: ${statusResponse.status}`,
                    details: errorData
                });
            }

            const statusData = await statusResponse.json();
            console.log(`📊 Video status: ${statusData.status}`);

            return NextResponse.json({
                success: true,
                message: `Video status: ${statusData.status}`,
                status: statusData.status,
                videoUrl: statusData.result_url || null,
                data: statusData
            });
        }

        if (testType === 'text-only') {
            // Test with just text and default voice (no custom image)
            console.log('🎵 Testing with text-to-speech only (no image)...');
            
            // Try a simple text-to-speech request without image
            const createResponse = await fetch('https://api.d-id.com/talks', {
                method: 'POST',
                headers: {
                    'Authorization': authHeader,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    // Use a default D-ID provided image
                    source_url: 'https://d-id-public-bucket.s3.amazonaws.com/alice.jpg',
                    script: {
                        type: 'text',
                        input: 'Hello! This is a simple text to speech test.',
                        provider: {
                            type: 'microsoft',
                            voice_id: 'en-US-AriaNeural'
                        }
                    }
                })
            });

            console.log(`📊 Text-only Response status: ${createResponse.status}`);

            if (createResponse.ok) {
                const responseData = await createResponse.json();
                console.log('✅ Text-only Success:', responseData);

                return NextResponse.json({
                    success: true,
                    message: 'Text-only video creation started!',
                    talkId: responseData.id,
                    status: responseData.status
                });
            } else {
                const errorData = await createResponse.text();
                console.error('❌ Text-only Error:', errorData);
                return NextResponse.json({
                    success: false,
                    error: `D-ID API Error: ${createResponse.status}`,
                    details: errorData,
                    status: createResponse.status
                });
            }
        }

        return NextResponse.json({ error: 'Invalid test type' }, { status: 400 });

    } catch (error) {
        console.error('D-ID Test Error:', error);
        
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to test D-ID API',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
