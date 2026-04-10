/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { GoogleGenAI } from "@google/genai";

export default function App() {
  const [subject, setSubject] = useState('');
  const [style, setStyle] = useState('');
  const [mood, setMood] = useState('');
  const [constraints, setConstraints] = useState('');
  const [finalPrompt, setFinalPrompt] = useState('');
  const [apiResponse, setApiResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [temperature, setTemperature] = useState(1);
  const [maxOutputTokens, setMaxOutputTokens] = useState(1024);
  const [topK, setTopK] = useState(64);
  const [topP, setTopP] = useState(0.95);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);

  const handleGenerate = () => {
    const prompt = `
Subject: ${subject || '[Subject]'}
Style: ${style || '[Style]'}
Mood: ${mood || '[Mood]'}
Constraints: ${constraints || '[Constraints]'}
    `.trim();
    setFinalPrompt(prompt);
    setApiResponse('');
    setGeneratedImage(null);
  };

  const handleRunPrompt = async () => {
    if (!finalPrompt) return;
    setIsLoading(true);
    setApiResponse('');
    setGeneratedImage(null);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: finalPrompt,
        config: {
          temperature,
          maxOutputTokens,
          topK,
          topP,
        },
      });
      setApiResponse(response.text || 'No response.');
    } catch (error) {
      console.error(error);
      setApiResponse('Error running prompt.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateImage = async () => {
    if (!finalPrompt) return;
    setIsLoading(true);
    setApiResponse('');
    setGeneratedImage(null);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [{ text: `Generate an image of: ${finalPrompt}` }],
        },
      });

      let foundImage = false;
      if (response.candidates && response.candidates[0].content.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            const base64EncodeString: string = part.inlineData.data;
            setGeneratedImage(`data:image/png;base64,${base64EncodeString}`);
            foundImage = true;
            break;
          }
        }
      }
      if (!foundImage) {
        setApiResponse('No image generated.');
      }
    } catch (error) {
      console.error(error);
      setApiResponse(`Error generating image: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 font-sans">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Prompt Architect</h1>
          <p className="text-gray-600 mt-2">Define your subject, style, mood, and constraints to craft the perfect prompt.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            { label: 'Subject', value: subject, setter: setSubject, placeholder: 'e.g., A technical white paper on solid-state battery cooling.' },
            { label: 'Style', value: style, setter: setStyle, placeholder: 'e.g., Written in the style of an MIT Technology Review article—academic but accessible.' },
            { label: 'Mood', value: mood, setter: setMood, placeholder: 'e.g., Objective and authoritative, but with a sense of urgent optimism for the future.' },
            { label: 'Constraints', value: constraints, setter: setConstraints, placeholder: 'e.g., Max 1,000 words. No buzzwords like \'game-changer.\' Must cite 2025 energy density stats.' },
          ].map((field) => (
            <div key={field.label} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <label className="block text-sm font-semibold text-gray-700 mb-2">{field.label}</label>
              <textarea
                value={field.value}
                onChange={(e) => field.setter(e.target.value)}
                placeholder={field.placeholder}
                className="w-full h-32 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              />
            </div>
          ))}
        </div>

        <div className="mt-8 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Advanced Settings</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Temperature', value: temperature, setter: setTemperature, min: 0, max: 2, step: 0.1 },
              { label: 'Max Tokens', value: maxOutputTokens, setter: setMaxOutputTokens, min: 1, max: 16384, step: 1 },
              { label: 'Top K', value: topK, setter: setTopK, min: 1, max: 100, step: 1 },
              { label: 'Top P', value: topP, setter: setTopP, min: 0, max: 1, step: 0.01 },
            ].map((setting) => (
              <div key={setting.label}>
                <label className="block text-sm font-semibold text-gray-700 mb-1">{setting.label}: {setting.value}</label>
                <input
                  type="range"
                  min={setting.min}
                  max={setting.max}
                  step={setting.step}
                  value={setting.value}
                  onChange={(e) => setting.setter(parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 flex justify-center gap-4">
          <button
            onClick={handleGenerate}
            className="bg-gray-800 text-white px-8 py-3 rounded-lg font-bold text-lg hover:bg-gray-900 transition-colors shadow-md"
          >
            Generate Prompt
          </button>
          <button
            onClick={handleRunPrompt}
            disabled={!finalPrompt || isLoading}
            className="bg-blue-600 text-white px-8 py-3 rounded-lg font-bold text-lg hover:bg-blue-700 transition-colors shadow-md disabled:opacity-50"
          >
            {isLoading ? 'Running...' : 'Run Prompt'}
          </button>
          <button
            onClick={handleGenerateImage}
            disabled={!finalPrompt || isLoading}
            className="bg-purple-600 text-white px-8 py-3 rounded-lg font-bold text-lg hover:bg-purple-700 transition-colors shadow-md disabled:opacity-50"
          >
            {isLoading ? 'Generating...' : 'Generate Image'}
          </button>
        </div>

        <div className="mt-8 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Generated Prompt</h2>
          <pre className="bg-gray-100 p-4 rounded-md text-gray-800 whitespace-pre-wrap font-mono text-sm min-h-[100px]">
            {finalPrompt || 'Click "Generate Prompt" to create your prompt.'}
          </pre>
        </div>

        {apiResponse && (
          <div className="mt-8 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4">AI Response</h2>
            <div className="bg-blue-50 p-4 rounded-md text-gray-800 whitespace-pre-wrap text-sm">
              {apiResponse}
            </div>
          </div>
        )}

        {generatedImage && (
          <div className="mt-8 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Generated Image</h2>
            <img src={generatedImage} alt="Generated" className="w-full rounded-lg shadow-md" referrerPolicy="no-referrer" />
          </div>
        )}
      </div>
    </div>
  );
}
