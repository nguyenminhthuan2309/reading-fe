import { ModerationDemo } from '@/components/ModerationDemo';

export const metadata = {
  title: 'OpenAI Moderation Demo',
  description: 'A demo of OpenAI content moderation API integration',
};

export default function ModerationDemoPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8 text-center">OpenAI Moderation API Demo</h1>
      <p className="text-center mb-8 max-w-2xl mx-auto text-gray-600">
        This demo uses OpenAI's moderation API to analyze text for potentially harmful content.
        Enter any text below to see how the API evaluates it.
      </p>
      <ModerationDemo />
    </div>
  );
} 