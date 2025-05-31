'use client';

import { useState } from 'react';
import { TestInterface } from './components/TestInterface';
import { PipelineInterface } from './components/PipelineInterface';
import { RoastInterface } from './components/RoastInterface';
import { ResultsDisplay } from './components/ResultsDisplay';

// Define the same types used in other components for consistency
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

type TabType = 'roast' | 'pipeline' | 'test' | 'results';

interface Tab {
  id: TabType;
  label: string;
  icon: string;
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabType>('roast');
  const [results, setResults] = useState<ResultsData>(null);

  const tabs: Tab[] = [
    { id: 'roast' as TabType, label: 'Profile Roaster', icon: '🔥' },
    { id: 'pipeline' as TabType, label: 'Full Pipeline', icon: '🔄' },
    { id: 'test' as TabType, label: 'API Testing', icon: '🧪' },
    { id: 'results' as TabType, label: 'Results', icon: '📊' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            🔥 LinkedIn Profile Roaster
          </h1>
          <p className="text-gray-600 text-lg">
            AI-powered roasts with voice synthesis
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-lg p-1 shadow-md">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-3 rounded-md font-medium transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-red-500 text-white shadow-md'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="max-w-4xl mx-auto">
          {activeTab === 'roast' && (
            <RoastInterface onResults={setResults} />
          )}
          {activeTab === 'pipeline' && (
            <PipelineInterface onResults={setResults} />
          )}
          {activeTab === 'test' && (
            <TestInterface onResults={setResults} />
          )}
          {activeTab === 'results' && (
            <ResultsDisplay results={results} />
          )}
        </div>
      </div>
    </div>
  );
}
