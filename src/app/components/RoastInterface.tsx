'use client';

import { useState } from 'react';

interface RoastResult {
  profileId: string;
  name: string;
  persona: string;
  confidence: number;
  roastScript: string;
  audioBase64: string;
  mimeType: string;
  success: boolean;
  error?: string;
}

interface RoastInterfaceProps {
  onResults: (results: { success: boolean; results: RoastResult[] }) => void;
}

export function RoastInterface({ onResults }: RoastInterfaceProps) {
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RoastResult | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const sampleUrls = [
    'https://linkedin.com/in/networker',
    'https://linkedin.com/in/ghost', 
    'https://linkedin.com/in/hustler',
    'https://linkedin.com/in/lurker'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    
    try {
      if (!linkedinUrl.trim()) {
        throw new Error('Please provide a LinkedIn URL');
      }

      const response = await fetch('/api/roast-pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ linkedinUrls: [linkedinUrl] }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success && data.results.length > 0) {
        const firstResult = data.results[0];
        setResult(firstResult);
        onResults(data);
      } else {
        throw new Error('No results generated');
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Roast error:', error);
      setResult({
        profileId: linkedinUrl,
        name: 'Error',
        persona: 'Unknown',
        confidence: 0,
        roastScript: `Error: ${errorMessage}`,
        audioBase64: '',
        mimeType: '',
        success: false,
        error: errorMessage
      });
    } finally {
      setLoading(false);
    }
  };

  const playAudio = () => {
    if (!result?.audioBase64) return;
    
    try {
      // Convert base64 to blob
      const audioData = atob(result.audioBase64);
      const audioArray = new Uint8Array(audioData.length);
      for (let i = 0; i < audioData.length; i++) {
        audioArray[i] = audioData.charCodeAt(i);
      }
      
      const audioBlob = new Blob([audioArray], { type: result.mimeType || 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      
      setIsPlaying(true);
      
      audio.onended = () => {
        setIsPlaying(false);
        URL.revokeObjectURL(audioUrl);
      };
      
      audio.onerror = () => {
        setIsPlaying(false);
        URL.revokeObjectURL(audioUrl);
        alert('Error playing audio');
      };
      
      audio.play();
      
    } catch (error) {
      console.error('Audio playback error:', error);
      setIsPlaying(false);
      alert('Failed to play audio');
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-8">
      <h2 className="text-2xl font-bold mb-6 text-gray-900">
        🔥 LinkedIn Profile Roaster
      </h2>
      <p className="text-gray-600 mb-6">
        Enter a LinkedIn profile URL and get a hilarious AI-generated roast with voice!
      </p>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            LinkedIn Profile URL:
          </label>
          <input
            type="url"
            value={linkedinUrl}
            onChange={(e) => setLinkedinUrl(e.target.value)}
            className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="https://linkedin.com/in/username"
          />
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading || !linkedinUrl.trim()}
            className="flex-1 bg-red-500 text-white px-6 py-3 rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Roasting...
              </span>
            ) : (
              '🔥 Roast This Profile!'
            )}
          </button>
        </div>

        {/* Sample URLs */}
        <div>
          <p className="text-sm text-gray-600 mb-2">Try these sample profiles:</p>
          <div className="flex flex-wrap gap-2">
            {sampleUrls.map((url, index) => (
              <button
                key={index}
                type="button"
                onClick={() => setLinkedinUrl(url)}
                className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200 transition-colors"
              >
                {url.split('/').pop()}
              </button>
            ))}
          </div>
        </div>
      </form>

      {/* Results */}
      {result && (
        <div className="mt-8 border-t pt-8">
          <div className="bg-gray-50 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                🎭 Roast Results
              </h3>
              <span className={`px-3 py-1 rounded text-sm ${
                result.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {result.success ? 'Success' : 'Failed'}
              </span>
            </div>

            {result.success ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 text-sm">
                  <div>
                    <span className="font-medium">Name:</span> {result.name}
                  </div>
                  <div>
                    <span className="font-medium">Persona:</span> {result.persona}
                  </div>
                  <div>
                    <span className="font-medium">Confidence:</span> {result.confidence}%
                  </div>
                </div>

                <div className="mb-6">
                  <h4 className="font-medium mb-2">🔥 The Roast:</h4>
                  <div className="bg-white p-4 rounded border text-gray-800 leading-relaxed">
                    {result.roastScript}
                  </div>
                </div>

                {result.audioBase64 && (
                  <div className="text-center">
                    <button
                      onClick={playAudio}
                      disabled={isPlaying}
                      className="bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 disabled:opacity-50 font-medium transition-colors"
                    >
                      {isPlaying ? (
                        <span className="flex items-center">
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Playing...
                        </span>
                      ) : (
                        <>🔊 Play Roast Audio</>
                      )}
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-red-600">
                Error: {result.error}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
