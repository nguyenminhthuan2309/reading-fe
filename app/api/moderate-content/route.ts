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
    const { title, description, chaptersContent, model = 'text-moderation-latest' } = body;
    
    // Validate required fields
    if (!title && !description && !chaptersContent) {
      return NextResponse.json(
        { error: 'At least one content field is required' },
        { status: 400 }
      );
    }

    // Combine content for moderation
    const input = [
      `Title: ${title || ''}`,
      `Description: ${description || ''}`,
      chaptersContent || '',
    ].filter(Boolean).join('\n\n');

    // Call the OpenAI moderation API
    const moderation = await openai.moderations.create({
      model,
      input,
    });

    // Extract and format the results for the frontend
    const result = moderation.results[0];
    
    return NextResponse.json({
      model,
      flagged: result.flagged,
      categories: result.categories,
      category_scores: result.category_scores,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('OpenAI Moderation API error:', error);
    
    return NextResponse.json(
      { error: error.message || 'An error occurred while moderating your content' },
      { status: 500 }
    );
  }
} 