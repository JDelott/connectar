'use client';

import { useState } from 'react';

interface VideoTestResult {
    success: boolean;
    videoUrl?: string;
    talkId?: string;
    avatarUsed?: string;
    processingTime?: string;
    error?: string;
}

interface DidTestResult {
    success: boolean;
    message?: string;
    talksCount?: number;
    videoUrl?: string;
    talkId?: string;
    error?: string;
    details?: string;
    statusCode?: number;
    debugInfo?: unknown;
    status?: string;
    imageUrl?: string;
    data?: unknown;
}

export function VideoTestInterface() {
    const [testText, setTestText] = useState('Hello! This is a test of the D-ID avatar system. Pretty cool, right?');
    const [avatarUrl, setAvatarUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<VideoTestResult | null>(null);
    const [didTestResult, setDidTestResult] = useState<DidTestResult | null>(null);
    const [currentTalkId, setCurrentTalkId] = useState<string | null>(null);

    const defaultAvatars = [
        {
            name: 'Noelle (Default)',
            url: 'https://create-images-results.d-id.com/DefaultPresenters/Noelle_f/image.jpeg'
        },
        {
            name: 'Alex',
            url: 'https://create-images-results.d-id.com/DefaultPresenters/Alex_m/image.jpeg'  
        },
        {
            name: 'Amy',
            url: 'https://create-images-results.d-id.com/DefaultPresenters/Amy_f/image.jpeg'
        }
    ];

    const testDidAPI = async (testType: 'basic' | 'simple-video' | 'working-demo' | 'get-video' | 'text-only') => {
        try {
            const requestBody: { 
                testType: 'basic' | 'simple-video' | 'working-demo' | 'get-video' | 'text-only';
                talkId?: string;
            } = { testType };
            
            if (testType === 'get-video' && currentTalkId) {
                requestBody.talkId = currentTalkId;
            }

            const response = await fetch('/api/test-did-simple', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody),
            });

            const data = await response.json();
            
            if (data.success && data.talkId) {
                setCurrentTalkId(data.talkId);
            }
            
            setDidTestResult(data);
            console.log('D-ID Test Result:', data);
        } catch (error) {
            console.error('D-ID Test Error:', error);
            setDidTestResult({ success: false, error: 'Test failed' });
        }
    };

    const handleTest = async () => {
        setLoading(true);
        setResult(null);

        try {
            console.log('🎵 Generating audio...');
            const audioResponse = await fetch('/api/generate-audio', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: testText }),
            });

            if (!audioResponse.ok) {
                throw new Error('Failed to generate audio');
            }

            const audioData = await audioResponse.json();
            console.log('✅ Audio generated, size:', audioData.audio?.length);

            console.log('📹 Generating video...');
            const videoResponse = await fetch('/api/generate-video', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    audioBase64: audioData.audio,
                    imageUrl: avatarUrl || undefined
                }),
            });

            const videoData = await videoResponse.json();
            
            if (videoData.success) {
                console.log('✅ Video generated:', videoData.videoUrl);
            }
            
            setResult(videoData);

        } catch (error) {
            console.error('❌ Test error:', error);
            setResult({
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold mb-6 text-gray-900">
                📹 D-ID Video Avatar Test
            </h2>
            
            <div className="mb-8 p-4 bg-gray-50 rounded-lg">
                <h3 className="text-lg font-semibold mb-4">🔧 D-ID API Tests</h3>
                <div className="flex gap-3 mb-4 flex-wrap">
                    <button
                        onClick={() => testDidAPI('basic')}
                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                        Test API Connection
                    </button>
                    <button
                        onClick={() => testDidAPI('text-only')}
                        className="px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600"
                    >
                        Test Text-Only
                    </button>
                    <button
                        onClick={() => testDidAPI('working-demo')}
                        className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
                    >
                        Test Working Demo
                    </button>
                    <button
                        onClick={() => testDidAPI('simple-video')}
                        className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                    >
                        Test Simple Video
                    </button>
                    {currentTalkId && (
                        <button
                            onClick={() => testDidAPI('get-video')}
                            className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
                        >
                            Check Video Status
                        </button>
                    )}
                </div>
                
                {currentTalkId && (
                    <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm text-blue-800">
                            <strong>Current Talk ID:</strong> {currentTalkId}
                        </p>
                    </div>
                )}
                
                {didTestResult && (
                    <div className={`p-3 rounded text-sm ${
                        didTestResult.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                        {didTestResult.success && didTestResult.videoUrl && (
                            <div className="mb-4">
                                <h4 className="text-lg font-semibold mb-3">
                                    🎬 Generated Video:
                                </h4>
                                <video 
                                    controls 
                                    className="w-full max-w-md mx-auto rounded-lg shadow-md mb-3"
                                    autoPlay
                                    muted
                                >
                                    <source src={didTestResult.videoUrl} type="video/mp4" />
                                    Your browser does not support the video tag.
                                </video>
                                <div className="text-center mb-3">
                                    <a 
                                        href={didTestResult.videoUrl} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="inline-block px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                                    >
                                        Open Video in New Tab
                                    </a>
                                </div>
                            </div>
                        )}
                        
                        <details>
                            <summary className="cursor-pointer font-medium mb-2">
                                Show Raw Response
                            </summary>
                            <pre className="whitespace-pre-wrap break-words text-xs">
                                {JSON.stringify(didTestResult, null, 2)}
                            </pre>
                        </details>
                    </div>
                )}
            </div>
            
            <div className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Test Text:
                    </label>
                    <textarea
                        value={testText}
                        onChange={(e) => setTestText(e.target.value)}
                        className="w-full p-4 border border-gray-300 rounded-lg h-24 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter text to convert to video..."
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Choose Avatar:
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                        {defaultAvatars.map((avatar, index) => (
                            <button
                                key={index}
                                onClick={() => setAvatarUrl(avatar.url)}
                                className={`p-3 border rounded-lg text-center transition-all ${
                                    avatarUrl === avatar.url
                                        ? 'border-blue-500 bg-blue-50'
                                        : 'border-gray-200 hover:border-gray-300'
                                }`}
                            >
                                {avatar.name}
                            </button>
                        ))}
                    </div>
                    
                    <input
                        type="url"
                        value={avatarUrl}
                        onChange={(e) => setAvatarUrl(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Or enter custom avatar image URL..."
                    />
                </div>

                <button
                    onClick={handleTest}
                    disabled={loading || !testText.trim()}
                    className="w-full bg-purple-500 text-white px-6 py-3 rounded-lg hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
                >
                    {loading ? (
                        <span className="flex items-center justify-center">
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Generating Video...
                        </span>
                    ) : (
                        '📹 Generate Avatar Video'
                    )}
                </button>

                {result && (
                    <div className={`p-6 rounded-lg border-2 ${
                        result.success 
                            ? 'border-green-200 bg-green-50' 
                            : 'border-red-200 bg-red-50'
                    }`}>
                        <h3 className={`text-lg font-semibold mb-4 ${
                            result.success ? 'text-green-800' : 'text-red-800'
                        }`}>
                            {result.success ? '✅ Success!' : '❌ Error'}
                        </h3>
                        
                        {result.success && result.videoUrl && (
                            <div className="mb-4">
                                <video 
                                    controls 
                                    className="w-full max-w-md mx-auto rounded-lg shadow-md"
                                    poster={result.avatarUsed}
                                >
                                    <source src={result.videoUrl} type="video/mp4" />
                                    Your browser does not support the video tag.
                                </video>
                                <p className="text-center mt-2 text-sm text-gray-600">
                                    Processing time: {result.processingTime || 'Unknown'}
                                </p>
                            </div>
                        )}
                        
                        <details className="mt-4">
                            <summary className="cursor-pointer font-medium">
                                Show Details
                            </summary>
                            <pre className="mt-2 text-xs bg-gray-100 p-3 rounded overflow-x-auto">
                                {JSON.stringify(result, null, 2)}
                            </pre>
                        </details>
                    </div>
                )}
            </div>
        </div>
    );
}
