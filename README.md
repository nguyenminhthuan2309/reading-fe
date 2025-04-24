This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, install the dependencies:

```bash
npm install
# If you encounter dependency conflicts, try:
npm install --legacy-peer-deps
# If issues persist, use:
npm install --force
```

Then, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Troubleshooting Dependencies

If you encounter issues with dependencies, it might be due to:

1. Version conflicts between packages
2. React version compatibility issues
3. Peer dependency requirements

Try the following approaches in order:

```bash
# First attempt - with legacy peer deps flag
npm install --legacy-peer-deps

# Second attempt - with force flag (use with caution)
npm install --force
```

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## OpenAI API Integration

This project includes a server-side API route to interact with OpenAI's API, ensuring your API key stays secure on the server.

### Setup

1. Get an API key from [OpenAI Platform](https://platform.openai.com/account/api-keys)
2. Create a `.env.local` file in the root of your project 
3. Add your OpenAI API key:
   ```
   OPENAI_API_KEY=your_openai_api_key_here
   ```

### Usage

1. Access the demo page at [http://localhost:3001/openai-demo](http://localhost:3001/openai-demo)
2. Enter a prompt and click "Generate Response"
3. Try the moderation API at [http://localhost:3001/moderation-demo](http://localhost:3001/moderation-demo)

### Integration in Your Components

You can use the helper functions in your components:

```tsx
import { sendOpenAIRequest, checkModeration } from '@/lib/openai-helper';

// For text generation:
const result = await sendOpenAIRequest({ 
  prompt: 'Your prompt here',
  model: 'gpt-3.5-turbo', // optional
  max_tokens: 500 // optional
});
console.log(result.content); // The AI's response

// For content moderation:
const moderation = await checkModeration({
  input: 'Text to analyze for harmful content',
  model: 'omni-moderation-latest' // optional
});
console.log(moderation.results[0].flagged); // true if content is flagged
```

### API Routes

The API endpoints are available at:

1. `/api/openai` - For text generation with the following structure:
   ```json
   {
     "prompt": "Your prompt here",
     "model": "gpt-3.5-turbo", // optional
     "max_tokens": 500 // optional
   }
   ```

2. `/api/openai/moderation` - For content moderation with the following structure:
   ```json
   {
     "input": "Text to analyze for harmful content",
     "model": "omni-moderation-latest" // optional
   }
   ```
