import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const { audioBase64, imageUrl } = await request.json();

        if (!audioBase64) {
            return NextResponse.json({ error: 'Audio data is required' }, { status: 400 });
        }

        if (!process.env.DID_API_KEY) {
            return NextResponse.json({ error: 'D-ID API key not configured' }, { status: 500 });
        }

        // Correct D-ID authentication format
        const authHeader = `Basic ${Buffer.from(`${process.env.DID_API_KEY}:`).toString('base64')}`;
        
        // Use the SAME image that worked in our test
        const defaultAvatarUrl = imageUrl || 'https://d-id-public-bucket.s3.amazonaws.com/alice.jpg';

        console.log('📹 Starting D-ID video generation...');
        console.log('🖼️ Using avatar:', defaultAvatarUrl);

        // Step 1: Upload audio to D-ID's audio endpoint
        console.log('🎵 Uploading audio to D-ID...');
        
        // Convert base64 to blob for upload
        const audioBuffer = Buffer.from(audioBase64, 'base64');
        const formData = new FormData();
        const audioBlob = new Blob([audioBuffer], { type: 'audio/mpeg' });
        formData.append('audio', audioBlob, 'audio.mp3');

        const uploadResponse = await fetch('https://api.d-id.com/audios', {
            method: 'POST',
            headers: {
                'Authorization': authHeader,
            },
            body: formData
        });

        if (!uploadResponse.ok) {
            const uploadError = await uploadResponse.text();
            console.error('❌ D-ID audio upload failed:', uploadError);
            throw new Error(`Audio upload failed: ${uploadResponse.status} ${uploadResponse.statusText}`);
        }

        const uploadData = await uploadResponse.json();
        const audioUrl = uploadData.url;
        console.log('✅ Audio uploaded to D-ID:', audioUrl);

        // Step 2: Create the D-ID talk with the SAME format that worked
        console.log('📹 Creating D-ID talk...');
        const createTalkResponse = await fetch('https://api.d-id.com/talks', {
            method: 'POST',
            headers: {
                'Authorization': authHeader,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                source_url: defaultAvatarUrl,
                script: {
                    type: 'audio',
                    audio_url: audioUrl
                }
                // Removed config since our working test didn't use it
            })
        });

        if (!createTalkResponse.ok) {
            const createError = await createTalkResponse.text();
            console.error('❌ D-ID talk creation failed:', createError);
            throw new Error(`Talk creation failed: ${createTalkResponse.status} ${createTalkResponse.statusText}`);
        }

        const talkData = await createTalkResponse.json();
        const talkId = talkData.id;
        console.log(`📹 D-ID talk created: ${talkId}`);

        // Step 3: Poll for completion
        let videoUrl = null;
        let attempts = 0;
        const maxAttempts = 60; // 10 minutes max

        while (!videoUrl && attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
            
            try {
                const statusResponse = await fetch(`https://api.d-id.com/talks/${talkId}`, {
                    headers: {
                        'Authorization': authHeader,
                        'Accept': 'application/json'
                    }
                });

                if (!statusResponse.ok) {
                    throw new Error(`Status check failed: ${statusResponse.status}`);
                }

                const statusData = await statusResponse.json();
                console.log(`📹 D-ID status (attempt ${attempts + 1}): ${statusData.status}`);

                if (statusData.status === 'done') {
                    videoUrl = statusData.result_url;
                    console.log(`✅ D-ID video ready: ${videoUrl}`);
                } else if (statusData.status === 'error') {
                    throw new Error(`D-ID video generation failed: ${statusData.error?.description || 'Unknown error'}`);
                } else if (statusData.status === 'rejected') {
                    throw new Error('D-ID video generation was rejected. This may be due to content policy violations.');
                }
                
            } catch (pollError) {
                console.error(`❌ D-ID polling error (attempt ${attempts + 1}):`, pollError);
                if (attempts >= 5) {
                    throw pollError;
                }
            }
            
            attempts++;
        }

        if (!videoUrl) {
            throw new Error('D-ID video generation timeout after 10 minutes');
        }

        return NextResponse.json({
            success: true,
            videoUrl,
            talkId,
            audioUrl,
            avatarUsed: defaultAvatarUrl,
            processingTime: `${attempts * 10} seconds`
        });

    } catch (error) {
        console.error('❌ D-ID video generation error:', error);
        
        let errorMessage = 'Failed to generate video';
        let errorDetails = null;
        
        if (error instanceof Error) {
            errorMessage = error.message;
            errorDetails = error.message;
        }

        return NextResponse.json({ 
            error: errorMessage,
            details: errorDetails
        }, { status: 500 });
    }
}
