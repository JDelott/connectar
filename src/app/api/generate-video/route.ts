import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import FormData from 'form-data';

export async function POST(request: NextRequest) {
    try {
        const { audioBase64, imageUrl = '/modok.jpg' } = await request.json();

        if (!audioBase64) {
            return NextResponse.json({ error: 'Audio data is required' }, { status: 400 });
        }

        // Convert base64 audio back to buffer
        const audioBuffer = Buffer.from(audioBase64, 'base64');

        // Create form data for D-ID API
        const formData = new FormData();
        formData.append('audio', audioBuffer, { filename: 'speech.mp3', contentType: 'audio/mpeg' });
        formData.append('source_url', imageUrl);
        
        // D-ID API call
        const didResponse = await axios.post(
            'https://api.d-id.com/talks',
            formData,
            {
                headers: {
                    'Authorization': `Basic ${process.env.DID_API_KEY}`,
                    'Content-Type': 'multipart/form-data',
                },
            }
        );

        const talkId = didResponse.data.id;

        // Poll for completion
        let videoUrl = null;
        let attempts = 0;
        const maxAttempts = 30; // 5 minutes max

        while (!videoUrl && attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
            
            const statusResponse = await axios.get(
                `https://api.d-id.com/talks/${talkId}`,
                {
                    headers: {
                        'Authorization': `Basic ${process.env.DID_API_KEY}`,
                    },
                }
            );

            if (statusResponse.data.status === 'done') {
                videoUrl = statusResponse.data.result_url;
            } else if (statusResponse.data.status === 'error') {
                throw new Error('D-ID video generation failed');
            }
            
            attempts++;
        }

        if (!videoUrl) {
            throw new Error('Video generation timeout');
        }

        return NextResponse.json({
            success: true,
            videoUrl,
            talkId
        });

    } catch (error) {
        console.error('Video generation error:', error);
        return NextResponse.json({ 
            error: 'Failed to generate video',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
