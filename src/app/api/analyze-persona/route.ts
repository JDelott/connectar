import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
});

interface PersonaAnalysis {
    persona: 'Networker' | 'Ghost' | 'Hustler' | 'Lurker';
    confidence: number;
    reasoning: string;
    contentSuggestions: string[];
}

export async function POST(request: NextRequest) {
    try {
        const { profileData } = await request.json();

        if (!profileData) {
            return NextResponse.json({ error: 'Profile data is required' }, { status: 400 });
        }

        const prompt = `
        Analyze this LinkedIn profile data and classify the person into one of these personas:

        1. NETWORKER: Actively engages, posts regularly, builds connections strategically
        2. GHOST: Has a profile but minimal activity, rarely posts or engages
        3. HUSTLER: Constantly promoting, selling, very sales-focused content
        4. LURKER: Consumes content but doesn't create much, occasional engagement

        Profile Data:
        ${JSON.stringify(profileData, null, 2)}

        Provide your analysis in JSON format with:
        - persona: one of the four types
        - confidence: 0-100 score
        - reasoning: why you chose this persona
        - contentSuggestions: array of 3-5 connection awareness content ideas tailored to this persona

        Consider factors like:
        - Post frequency and engagement
        - Content types (professional, personal, promotional)
        - Connection patterns
        - Bio and headline style
        - Activity level
        `;

        const response = await anthropic.messages.create({
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: 1000,
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
        
        const analysis = JSON.parse(firstContent.text) as PersonaAnalysis;

        return NextResponse.json({
            success: true,
            analysis
        });

    } catch (error) {
        console.error('Persona analysis error:', error);
        return NextResponse.json({ 
            error: 'Failed to analyze persona',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
