import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize the OpenAI client with your API key
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY?.trim(),
});

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json();
    const { input, model = 'omni-moderation-latest' } = body;
    
    if (!input) {
      return NextResponse.json(
        { error: 'Input text is required' },
        { status: 400 }
      );
    }

    // Call the OpenAI moderation API
    const moderation = await openai.moderations.create({
      model,
      input,
    });

    // Return the moderation response
    return NextResponse.json(moderation);
  } catch (error: any) {
    console.error('OpenAI Moderation API error:', error);
    
    return NextResponse.json(
      { error: error.message || 'An error occurred while processing your moderation request' },
      { status: 500 }
    );
  }
} 