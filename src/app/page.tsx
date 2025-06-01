'use client';

import { useState } from 'react';
import { TestInterface } from './components/TestInterface';
import { PipelineInterface } from './components/PipelineInterface';
import { RoastInterface } from './components/RoastInterface';
import { ResultsDisplay } from './components/ResultsDisplay';
import { VideoTestInterface } from './components/VideoTestInterface';
import MultiPlatformInterface from './components/MultiPlatformInterface';
import SpecificDatasetTest from './components/SpecificDatasetTest';

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

type TabType = 'scraper' | 'roast' | 'video' | 'pipeline' | 'test' | 'debug' | 'results';

interface Tab {
  id: TabType;
  label: string;
  icon: string;
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabType>('scraper');
  const [results, setResults] = useState<ResultsData>(null);

  const tabs: Tab[] = [
    { id: 'scraper' as TabType, label: 'Multi-Platform Scraper', icon: '🌐' },
    { id: 'roast' as TabType, label: 'Profile Roaster', icon: '🔥' },
    { id: 'video' as TabType, label: 'Video Test', icon: '📹' },
    { id: 'pipeline' as TabType, label: 'Full Pipeline', icon: '🔄' },
    { id: 'test' as TabType, label: 'API Testing', icon: '🧪' },
    { id: 'debug' as TabType, label: 'Dataset Debug', icon: '🔍' },
    { id: 'results' as TabType, label: 'Results', icon: '📊' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            🌐 ConnectAR - Social Profile Intelligence
          </h1>
          <p className="text-gray-600 text-lg">
            Multi-platform scraping, AI analysis, and content generation
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-lg p-1 shadow-md">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 rounded-md font-medium transition-all duration-200 text-sm ${
                  activeTab === tab.id
                    ? 'bg-blue-500 text-white shadow-md'
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
        <div className="max-w-6xl mx-auto">
          {activeTab === 'scraper' && (
            <MultiPlatformInterface />
          )}
          {activeTab === 'roast' && (
            <RoastInterface onResults={setResults} />
          )}
          {activeTab === 'video' && (
            <VideoTestInterface />
          )}
          {activeTab === 'pipeline' && (
            <PipelineInterface onResults={setResults} />
          )}
          {activeTab === 'test' && (
            <TestInterface onResults={setResults} />
          )}
          {activeTab === 'debug' && (
            <SpecificDatasetTest />
          )}
          {activeTab === 'results' && (
            <ResultsDisplay results={results} />
          )}
        </div>
      </div>
    </div>
  );
}
