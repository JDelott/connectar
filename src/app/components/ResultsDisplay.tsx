'use client';

// Define proper interfaces for the results data structure
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

interface ResultsDisplayProps {
  results: ResultsData;
}

export function ResultsDisplay({ results }: ResultsDisplayProps) {
  if (!results) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-8 text-center">
        <div className="text-gray-400 text-6xl mb-4">📊</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">No Results Yet</h2>
        <p className="text-gray-600">
          Run the pipeline or test an API endpoint to see results here.
        </p>
      </div>
    );
  }

  const downloadResults = () => {
    const dataStr = JSON.stringify(results, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `connectar-results-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(JSON.stringify(results, null, 2));
  };

  // Type guard to check if results is pipeline results
  const isPipelineResults = (data: ResultsData): data is PipelineResults => {
    return data !== null && 'results' in data && Array.isArray((data as PipelineResults).results);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">📊 Results</h2>
        <div className="flex gap-3">
          <button
            onClick={copyToClipboard}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
          >
            📋 Copy
          </button>
          <button
            onClick={downloadResults}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
          >
            💾 Download JSON
          </button>
        </div>
      </div>

      {/* Success/Error Summary */}
      <div className="mb-6">
        {results.success !== undefined && (
          <div className={`p-4 rounded-lg ${
            results.success ? 'bg-green-100 border border-green-300' : 'bg-red-100 border border-red-300'
          }`}>
            <div className={`font-medium ${
              results.success ? 'text-green-800' : 'text-red-800'
            }`}>
              {results.success ? '✅ Success' : '❌ Error'}
            </div>
            {results.error && (
              <div className="text-red-700 mt-1">{results.error}</div>
            )}
          </div>
        )}
      </div>

      {/* Pipeline Results */}
      {isPipelineResults(results) && results.results && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Pipeline Results ({results.successful}/{results.processed})
          </h3>
          <div className="space-y-4">
            {results.results.map((result: ProcessingResult, index: number) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900">
                    {result.profileId}
                  </span>
                  <span className={`px-2 py-1 rounded text-sm ${
                    result.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {result.success ? 'Success' : 'Failed'}
                  </span>
                </div>
                
                {result.success && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Persona:</span> {result.persona}
                    </div>
                    <div>
                      <span className="font-medium">Confidence:</span> {result.confidence}%
                    </div>
                    {result.videoUrl && (
                      <div className="md:col-span-2">
                        <span className="font-medium">Video:</span>{' '}
                        <a 
                          href={result.videoUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:underline"
                        >
                          View Video
                        </a>
                      </div>
                    )}
                  </div>
                )}
                
                {result.error && (
                  <div className="text-red-600 text-sm mt-2">
                    Error: {result.error}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Single API Result Display */}
      {!isPipelineResults(results) && results.success && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">API Response</h3>
          <div className="bg-gray-50 rounded-lg p-4">
            {/* Display analysis results if present */}
            {(results as SingleAPIResult).analysis && (
              <div className="mb-4">
                <h4 className="font-medium mb-2">Persona Analysis:</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>Persona: {(results as SingleAPIResult).analysis?.persona}</div>
                  <div>Confidence: {(results as SingleAPIResult).analysis?.confidence}%</div>
                </div>
              </div>
            )}
            
            {/* Display content if present */}
            {(results as SingleAPIResult).content && (
              <div className="mb-4">
                <h4 className="font-medium mb-2">Generated Content:</h4>
                <div className="text-sm bg-white p-3 rounded border">
                  {(results as SingleAPIResult).content?.script}
                </div>
              </div>
            )}
            
            {/* Display video URL if present */}
            {(results as SingleAPIResult).videoUrl && (
              <div className="mb-4">
                <h4 className="font-medium mb-2">Generated Video:</h4>
                <a 
                  href={(results as SingleAPIResult).videoUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline"
                >
                  View Video
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Raw JSON Display */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Raw JSON</h3>
        <pre className="bg-gray-50 p-4 rounded-lg overflow-auto text-sm border">
          {JSON.stringify(results, null, 2)}
        </pre>
      </div>
    </div>
  );
}
