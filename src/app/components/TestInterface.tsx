'use client';

import { useState } from 'react';

// Import the same types we use in ResultsDisplay for consistency
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

interface TestInterfaceProps {
  onResults: (results: ResultsData) => void;
}

interface TestEndpoint {
  id: string;
  name: string;
  description: string;
  sampleData: string;
}

export function TestInterface({ onResults }: TestInterfaceProps) {
  const [selectedEndpoint, setSelectedEndpoint] = useState<string>('scrape-linkedin');
  const [testData, setTestData] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [lastResult, setLastResult] = useState<ResultsData>(null);

  const endpoints: TestEndpoint[] = [
    {
      id: 'scrape-linkedin',
      name: '🔍 LinkedIn Scraper',
      description: 'Scrape LinkedIn profiles using Apify',
      sampleData: JSON.stringify({
        profileUrls: ['https://linkedin.com/in/example'],
        maxConnections: 100
      }, null, 2)
    },
    {
      id: 'analyze-persona',
      name: '🧠 Persona Analysis',
      description: 'Analyze LinkedIn profile with Claude AI',
      sampleData: JSON.stringify({
        profileData: {
          name: "John Doe",
          headline: "Software Engineer at Tech Corp",
          about: "Passionate about building scalable applications...",
          posts: [
            { content: "Just launched a new feature!", engagement: 50 }
          ]
        }
      }, null, 2)
    },
    {
      id: 'generate-content',
      name: '✍️ Content Generation',
      description: 'Generate personalized connection content',
      sampleData: JSON.stringify({
        persona: "Networker",
        profileData: {
          name: "John Doe",
          headline: "Software Engineer"
        }
      }, null, 2)
    },
    {
      id: 'generate-audio',
      name: '🎵 Text-to-Speech',
      description: 'Convert text to speech using ElevenLabs',
      sampleData: JSON.stringify({
        text: "Hello! I'd love to connect with you on LinkedIn.",
        voiceId: "pNInz6obpgDQGcFmaJgB"
      }, null, 2)
    },
    {
      id: 'generate-video',
      name: '🎬 Video Generation',
      description: 'Generate talking head video with D-ID',
      sampleData: JSON.stringify({
        audioBase64: "base64_audio_data_here",
        imageUrl: "/modok.jpg"
      }, null, 2)
    }
  ];

  const handleEndpointChange = (endpointId: string): void => {
    setSelectedEndpoint(endpointId);
    const endpoint = endpoints.find(e => e.id === endpointId);
    if (endpoint) {
      setTestData(endpoint.sampleData);
    }
  };

  const handleTest = async (): Promise<void> => {
    setLoading(true);
    try {
      const response = await fetch(`/api/${selectedEndpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: testData,
      });

      const result: SingleAPIResult = await response.json();
      setLastResult(result);
      onResults(result);
    } catch (error) {
      const errorResult: SingleAPIResult = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      setLastResult(errorResult);
      onResults(errorResult);
    } finally {
      setLoading(false);
    }
  };

  const currentEndpoint = endpoints.find(e => e.id === selectedEndpoint);

  return (
    <div className="bg-white rounded-xl shadow-lg p-8">
      <h2 className="text-2xl font-bold mb-6 text-gray-900">
        🧪 API Endpoint Testing
      </h2>

      {/* Endpoint Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Select API Endpoint:
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {endpoints.map((endpoint) => (
            <button
              key={endpoint.id}
              onClick={() => handleEndpointChange(endpoint.id)}
              className={`p-4 rounded-lg border-2 text-left transition-all ${
                selectedEndpoint === endpoint.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="font-medium text-gray-900 mb-1">
                {endpoint.name}
              </div>
              <div className="text-sm text-gray-600">
                {endpoint.description}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Test Data Input */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Request Data (JSON):
        </label>
        <textarea
          value={testData}
          onChange={(e) => setTestData(e.target.value)}
          className="w-full p-4 border border-gray-300 rounded-lg h-64 font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Enter JSON data for the API request..."
        />
        <div className="flex justify-between items-center mt-2">
          <p className="text-sm text-gray-500">
            Testing: <code className="bg-gray-100 px-2 py-1 rounded">
              POST /api/{selectedEndpoint}
            </code>
          </p>
          <button
            onClick={() => setTestData(currentEndpoint?.sampleData || '')}
            className="text-sm text-blue-500 hover:text-blue-700"
          >
            Reset to Sample
          </button>
        </div>
      </div>

      {/* Test Button */}
      <button
        onClick={handleTest}
        disabled={loading || !testData.trim()}
        className="w-full bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors mb-6"
      >
        {loading ? (
          <span className="flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Testing...
          </span>
        ) : (
          `🧪 Test ${currentEndpoint?.name}`
        )}
      </button>

      {/* Quick Result Preview */}
      {lastResult && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-medium text-gray-900 mb-2">Last Test Result:</h3>
          <div className={`p-3 rounded text-sm ${
            lastResult.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {lastResult.success ? '✅ Success' : '❌ Error'}
            {lastResult.error && `: ${lastResult.error}`}
          </div>
        </div>
      )}
    </div>
  );
}
