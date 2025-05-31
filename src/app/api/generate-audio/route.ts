import { NextRequest, NextResponse } from 'next/server';
import { ElevenLabsClient } from 'elevenlabs';

const elevenlabs = new ElevenLabsClient({
    apiKey: process.env.ELEVENLABS_API_KEY,
});

export async function POST(request: NextRequest) {
    try {
        const { text, voiceId = 'pNInz6obpgDQGcFmaJgB' } = await request.json(); // Default to Adam voice

        if (!text) {
            return NextResponse.json({ error: 'Text is required' }, { status: 400 });
        }

        const audio = await elevenlabs.textToSpeech.convert(voiceId, {
            text: text,
            model_id: "eleven_multilingual_v2",
            output_format: "mp3_44100_128",
        });

        // Convert audio stream to buffer
        const chunks: Buffer[] = [];
        for await (const chunk of audio) {
            chunks.push(chunk);
        }
        const audioBuffer = Buffer.concat(chunks);

        // Return as base64 for easy handling
        const audioBase64 = audioBuffer.toString('base64');

        return NextResponse.json({
            success: true,
            audio: audioBase64,
            mimeType: 'audio/mpeg'
        });

    } catch (error) {
        console.error('Audio generation error:', error);
        return NextResponse.json({ 
            error: 'Failed to generate audio',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
