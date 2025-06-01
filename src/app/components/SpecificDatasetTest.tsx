'use client';

import { useState } from 'react';

interface DatasetInfo {
  id?: string;
  name?: string;
  itemCount?: number;
  cleanItemCount?: number;
  accessedAt?: string;
  createdAt?: string;
  modifiedAt?: string;
}

interface AnalysisResult {
  approach: string;
  totalItems: number;
  firstItem?: Record<string, unknown>;
  allKeys: string[];
  demoCount: number;
  realCount: number;
  itemsWithText: number;
  itemsWithAuthor: number;
  sampleSizes: number[];
  error?: string;
}

interface TestResult {
  success: boolean;
  error?: string;
  datasetInfo?: DatasetInfo;
  results?: AnalysisResult[];
  debug?: {
    datasetId: string;
    timestamp: string;
  };
}

export default function SpecificDatasetTest() {
  const [result, setResult] = useState<TestResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [datasetId, setDatasetId] = useState('KFiSgS3IGd7MJsOl4');

  const testDataset = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/test-specific-dataset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ datasetId })
      });
      
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">🔍 Dataset Debugging</h2>
        <p className="text-gray-600">Debug specific Apify datasets to understand the demo data issue</p>
      </div>
      
      <div className="grid grid-cols-1 gap-6">
        {/* Dataset ID Test */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Test Specific Dataset</h3>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Dataset ID:</label>
            <input
              type="text"
              value={datasetId}
              onChange={(e) => setDatasetId(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter dataset ID (e.g., KFiSgS3IGd7MJsOl4)"
            />
          </div>
          <button
            onClick={testDataset}
            disabled={loading}
            className="w-full px-4 py-3 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {loading ? 'Analyzing Dataset...' : 'Analyze Dataset'}
          </button>
        </div>

        {/* Issue Summary */}
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h4 className="font-medium text-yellow-900 mb-2">🚨 Current Issue Summary</h4>
          <ul className="text-sm text-yellow-800 space-y-1">
            <li>✅ Billing is working - You are being charged correctly ($0.40)</li>
            <li>✅ Runs are succeeding - Status shows SUCCEEDED</li>
            <li>❌ Actor returns only demo data - Despite successful billing</li>
            <li>❌ Data mismatch - Schema expects tweet fields, only gets demo data</li>
          </ul>
          <p className="text-sm text-yellow-800 mt-2">
            <span className="font-semibold">Conclusion:</span> This appears to be a bug with the apidojo/tweet-scraper actor itself.
          </p>
        </div>

        {/* Recommendations */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">📋 Recommended Next Steps</h4>
          <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
            <li>Contact Apify Support with evidence of billing but demo data</li>
            <li>Try a different Twitter scraper actor</li>
            <li>Consider switching to LinkedIn scraping (which is working)</li>
            <li>Use mock data for Twitter until the actor is fixed</li>
          </ol>
        </div>
      </div>

      {result && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            {result.success ? '✅' : '❌'} Test Results
          </h3>

          {result.success && result.datasetInfo && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Dataset Information</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="font-semibold">ID:</span> {result.datasetInfo.id}</div>
                <div><span className="font-semibold">Items:</span> {result.datasetInfo.itemCount}</div>
                <div><span className="font-semibold">Clean Items:</span> {result.datasetInfo.cleanItemCount}</div>
                <div><span className="font-semibold">Created:</span> {result.datasetInfo.createdAt ? new Date(result.datasetInfo.createdAt).toLocaleDateString() : 'N/A'}</div>
              </div>
            </div>
          )}

          {result.results && result.results.length > 0 && (
            <div className="space-y-4">
              <h4 className="font-medium">Analysis Results</h4>
              {result.results.map((analysis, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <h5 className="font-medium text-gray-900 mb-2">{analysis.approach}</h5>
                  {analysis.error ? (
                    <div className="text-red-600 text-sm">Error: {analysis.error}</div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div><span className="font-semibold">Total Items:</span> {analysis.totalItems}</div>
                      <div><span className="font-semibold">Demo Items:</span> {analysis.demoCount}</div>
                      <div><span className="font-semibold">Real Items:</span> {analysis.realCount}</div>
                      <div><span className="font-semibold">Items with Text:</span> {analysis.itemsWithText}</div>
                      <div><span className="font-semibold">Items with Author:</span> {analysis.itemsWithAuthor}</div>
                      <div><span className="font-semibold">Sample Sizes:</span> {analysis.sampleSizes.join(', ')} bytes</div>
                    </div>
                  )}
                  {analysis.firstItem && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-sm font-medium text-blue-600">
                        Show First Item
                      </summary>
                      <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
                        {JSON.stringify(analysis.firstItem, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              ))}
            </div>
          )}

          {result.error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="text-red-800 font-medium">Error:</div>
              <div className="text-red-700 text-sm">{result.error}</div>
            </div>
          )}

          <details className="mt-4">
            <summary className="cursor-pointer text-sm font-medium text-gray-600">
              Show Raw Response
            </summary>
            <pre className="mt-2 p-4 bg-gray-100 rounded-lg overflow-auto text-xs">
              {JSON.stringify(result, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
}
