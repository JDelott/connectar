'use client';

import { useState } from 'react';

// Define the same types for consistency
interface GeneratedContent {
  script: string;
  talkingPoints: string[];
}

interface ProcessingResult {
  profileId: string;
  persona?: string;
  confidence?: number;
  content?: GeneratedContent;
  videoUrl?: string;
  success: boolean;
  error?: string;
}

interface PipelineResults {
  success: boolean;
  results?: ProcessingResult[];
  processed?: number;
  successful?: number;
  error?: string;
  details?: string;
}

interface SingleAPIResult {
  success: boolean;
  data?: unknown;
  analysis?: {
    persona: string;
    confidence: number;
    reasoning: string;
    contentSuggestions: string[];
  };
  content?: GeneratedContent;
  audio?: string;
  videoUrl?: string;
  error?: string;
  details?: string;
}

// Union type for all possible result types
type ResultsData = PipelineResults | SingleAPIResult | null;

interface PipelineInterfaceProps {
  onResults: (results: ResultsData) => void;
}

export function PipelineInterface({ onResults }: PipelineInterfaceProps) {
  const [linkedinUrls, setLinkedinUrls] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [progress, setProgress] = useState<string[]>([]);
  const [unityCallback, setUnityCallback] = useState<string>('');

  const sampleUrls = [
    'https://linkedin.com/in/example1',
    'https://linkedin.com/in/example2',
    'https://linkedin.com/in/example3'
  ].join('\n');

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setLoading(true);
    setProgress(['🚀 Starting pipeline...']);
    
    try {
      const urls = linkedinUrls.split('\n').filter(url => url.trim());
      
      if (urls.length === 0) {
        throw new Error('Please provide at least one LinkedIn URL');
      }

      setProgress(prev => [...prev, `📊 Processing ${urls.length} profile(s)...`]);

      const response = await fetch('/api/unity-pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          linkedinUrls: urls,
          unityCallback: unityCallback || undefined
        }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: PipelineResults = await response.json();
      
      setProgress(prev => [
        ...prev, 
        `✅ Pipeline complete! ${data.successful}/${data.processed} successful`
      ]);
      
      onResults(data);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setProgress(prev => [...prev, `❌ Error: ${errorMessage}`]);
      
      // Create an error result that matches our type
      const errorResult: PipelineResults = {
        success: false,
        error: errorMessage,
        processed: 0,
        successful: 0,
        results: []
      };
      
      onResults(errorResult);
      console.error('Pipeline error:', error);
    } finally {
      setLoading(false);
    }
  };

  const clearProgress = (): void => {
    setProgress([]);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-8">
      <h2 className="text-2xl font-bold mb-6 text-gray-900">
        🔄 Full Pipeline Execution
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* LinkedIn URLs Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            LinkedIn Profile URLs (one per line):
          </label>
          <textarea
            value={linkedinUrls}
            onChange={(e) => setLinkedinUrls(e.target.value)}
            className="w-full p-4 border border-gray-300 rounded-lg h-32 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder={sampleUrls}
          />
          <p className="text-sm text-gray-500 mt-1">
            Enter one LinkedIn profile URL per line
          </p>
        </div>

        {/* Unity Callback URL */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Unity Callback URL (optional):
          </label>
          <input
            type="url"
            value={unityCallback}
            onChange={(e) => setUnityCallback(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="http://your-unity-server.com/callback"
          />
          <p className="text-sm text-gray-500 mt-1">
            URL to send results to Unity application
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading || !linkedinUrls.trim()}
            className="flex-1 bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </span>
            ) : (
              '🚀 Run Full Pipeline'
            )}
          </button>
          
          <button
            type="button"
            onClick={() => setLinkedinUrls(sampleUrls)}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
          >
            📝 Use Sample URLs
          </button>
        </div>
      </form>

      {/* Progress Display */}
      {progress.length > 0 && (
        <div className="mt-8 bg-gray-50 rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Progress</h3>
            <button
              onClick={clearProgress}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Clear
            </button>
          </div>
          <div className="space-y-2">
            {progress.map((step, index) => (
              <div key={index} className="flex items-center text-sm">
                <span className="mr-2 text-xs text-gray-500">
                  {new Date().toLocaleTimeString()}
                </span>
                <span>{step}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
