import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize the OpenAI client with your API key
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY?.trim(),
});

// Model pricing info (per million tokens)
const MODEL_PRICING = {
  'omni-moderation-latest': 0, // Free
  'gpt-4o': 2.50,  // $2.50 per 1M tokens
  'o4-mini': 1.10  // $1.10 per 1M tokens
};

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json();
    const { title, description, chaptersContent, model = 'omni-moderation-latest' } = body;
    
    // Validate required fields
    if (!title && !description && !chaptersContent) {
      return NextResponse.json(
        { error: 'At least one content field is required' },
        { status: 400 }
      );
    }

    // Validate the model
    if (!Object.keys(MODEL_PRICING).includes(model)) {
      return NextResponse.json(
        { error: 'Invalid moderation model' },
        { status: 400 }
      );
    }

    // Combine content for moderation
    const input = [
      `Title: ${title || ''}`,
      `Description: ${description || ''}`,
      chaptersContent || '',
    ].filter(Boolean).join('\n\n');

    // Different handling based on model
    let result;
    
    // For the standard moderation model
    if (model === 'omni-moderation-latest') {
      console.log('input', input);
      // Call the OpenAI moderation API
      const moderation = await openai.moderations.create({
        model,
        input,
      });
      
      result = moderation.results[0];
    } 
    // For GPT-based models
    else {
      // Use chat completion API for GPT models
      const completion = await openai.chat.completions.create({
        model,
        messages: [
          {
            role: "system",
            content: "You are a content moderation assistant. Analyze the provided content and detect any policy violations or harmful content. Return your analysis as a JSON object with the following structure: { flagged: boolean, categories: { harassment: boolean, hate: boolean, sexual: boolean, violence: boolean, self_harm: boolean, illegal: boolean, children: boolean, shocking: boolean, deception: boolean }, category_scores: { harassment: number, hate: number, sexual: number, violence: number, self_harm: number, illegal: number, children: number, shocking: number, deception: number } }"
          },
          {
            role: "user",
            content: `Please moderate the following content:\n\n${input}`
          }
        ],
        response_format: { type: "json_object" }
      });
      
      // Parse the JSON response from the model
      try {
        result = JSON.parse(completion.choices[0].message.content || '{}');
        console.log('result', result);
      } catch (e) {
        return NextResponse.json(
          { error: 'Failed to parse moderation result' },
          { status: 500 }
        );
      }
    }

    // Return formatted response
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