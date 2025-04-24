'use client';

import { useState } from 'react';
import { checkModeration } from '@/lib/api/openai';

export function ModerationDemo() {
  const [input, setInput] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const moderationResult = await checkModeration({ input });
      setResult(moderationResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const flaggedCategories = result?.results?.[0]?.flagged 
    ? Object.entries(result.results[0].categories)
      .filter(([_, flagged]) => flagged)
      .map(([category]) => category)
    : [];

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Content Moderation Demo</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="input" className="block text-sm font-medium text-gray-700 mb-1">
            Text to analyze
          </label>
          <textarea
            id="input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            rows={4}
            placeholder="Enter text for moderation analysis..."
          />
        </div>
        
        <button 
          type="submit" 
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
          disabled={loading || !input.trim()}
        >
          {loading ? 'Analyzing...' : 'Check Content'}
        </button>
      </form>
      
      {error && (
        <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}
      
      {result && (
        <div className="mt-6">
          <h3 className="text-lg font-medium mb-2">Moderation Result:</h3>
          
          <div className="p-4 bg-gray-100 rounded-md">
            <div className="flex items-center mb-3">
              <span className="font-medium mr-2">Content Flagged:</span>
              <span className={`px-2 py-1 rounded-full text-xs ${
                result.results[0].flagged 
                  ? "bg-red-100 text-red-800" 
                  : "bg-green-100 text-green-800"
              }`}>
                {result.results[0].flagged ? 'Yes' : 'No'}
              </span>
            </div>
            
            {result.results[0].flagged && (
              <div className="mb-3">
                <p className="font-medium mb-1">Flagged Categories:</p>
                <div className="flex flex-wrap gap-1">
                  {flaggedCategories.map(category => (
                    <span 
                      key={category}
                      className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full"
                    >
                      {category}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            <div>
              <p className="font-medium mb-1">Category Scores:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {Object.entries(result.results[0].category_scores).map(([category, score]) => (
                  <div key={category} className="flex justify-between">
                    <span className="text-sm">{category}:</span>
                    <span className={`text-sm font-medium ${
                      Number(score) > 0.5 ? "text-red-600" : "text-gray-600"
                    }`}>
                      {Number(score).toFixed(4)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <details className="mt-4 border border-gray-200 rounded-md">
            <summary className="p-2 bg-gray-50 cursor-pointer">View Raw JSON Response</summary>
            <pre className="p-4 overflow-auto text-xs">{JSON.stringify(result, null, 2)}</pre>
          </details>
        </div>
      )}
    </div>
  );
} 