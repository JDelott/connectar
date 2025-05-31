import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: NextRequest) {
    try {
        const { persona, profileData } = await request.json();

        const prompt = `
        You are a witty comedian creating a playful roast of this LinkedIn profile. 

        Profile Data:
        ${JSON.stringify(profileData, null, 2)}

        Detected Persona: ${persona}

        Create a humorous but not mean-spirited roast that:
        1. Playfully calls out their ${persona} behavior patterns
        2. Makes fun of typical LinkedIn stereotypes they exhibit
        3. References specific details from their profile
        4. Keeps it light and entertaining (not actually insulting)
        5. Is 100-150 words perfect for text-to-speech

        Examples based on persona:
        - NETWORKER: "Oh look, another 'thought leader' who posts 3 times a day..."
        - GHOST: "This person's LinkedIn is like a haunted house - beautiful on the outside, nobody home inside..."
        - HUSTLER: "Every post screams 'BUY MY COURSE!' louder than a carnival barker..."
        - LURKER: "The LinkedIn equivalent of that friend who reads all your messages but never replies..."

        Generate a funny roast script that would make them laugh at themselves.
        Format as JSON with a 'script' field containing the roast text.
        `;

        const response = await anthropic.messages.create({
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: 500,
            messages: [
                {
                    role: 'user',
                    content: prompt
                }
            ]
        });

        const firstContent = response.content[0];
        if (firstContent.type !== 'text') {
            throw new Error('Expected text response from Claude');
        }
        
        const content = JSON.parse(firstContent.text);

        return NextResponse.json({
            success: true,
            content: {
                script: content.script,
                persona: persona,
                roastType: 'linkedin_profile'
            }
        });

    } catch (error) {
        console.error('Content generation error:', error);
        return NextResponse.json({ 
            error: 'Failed to generate roast content',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
