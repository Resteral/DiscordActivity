
/**
 * Discord Setup Guide Component
 * Provides step-by-step instructions to configure Discord Activity
 */

import React, { useState } from 'react';
import { CheckCircle, Copy, ExternalLink, AlertCircle } from 'lucide-react';

export function DiscordSetupGuide() {
  const [currentStep, setCurrentStep] = useState(1);
  const [clientId, setClientId] = useState('1425626912499175498');
  const [appUrl, setAppUrl] = useState('https://discord-activity-lac.vercel.app');

  const steps = [
    {
      id: 1,
      title: 'Configure OAuth2 Settings',
      description: 'Set up redirect URLs in Discord Developer Portal',
      instructions: [
        'Go to Discord Developer Portal → Your App → OAuth2',
        'Add these Redirect URLs:',
        `• ${appUrl}`,
        '• http://localhost:3000 (for local testing)',
        'Save changes'
      ]
    },
    {
      id: 2,
      title: 'Upload Rich Presence Assets',
      description: 'Add activity images to your Discord app',
      instructions: [
        'Go to Rich Presence → Art Assets',
        'Upload a 512x512px image named "activity-default"',
        'Set Large Text to "Zealot Hockey Tournament"',
        'Save changes'
      ]
    },
    {
      id: 3,
      title: 'Test Activity Link',
      description: 'Test the integration directly in Discord',
      instructions: [
        'Copy this activity link:',
        `https://discord.com/activities/${clientId}/zealot-hockey`,
        'Paste it in any Discord channel',
        'Click the link to launch your app inside Discord'
      ]
    },
    {
      id: 4,
      title: 'Complete Setup',
      description: 'Final verification steps',
      instructions: [
        'Use the Discord panel in your app',
        'Enter your Client ID: ' + clientId,
        'Click Connect → Authorize → Update Activity',
        'Check your Discord status for activity updates'
      ]
    }
  ];

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Discord Activity Setup
        </h1>
        <p className="text-gray-600">
          Follow these steps to enable Discord Rich Presence for your hockey tournaments
        </p>
      </div>

      {/* Progress Steps */}
      <div className="flex justify-between items-center mb-8">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center">
            <button
              onClick={() => setCurrentStep(step.id)}
              className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                currentStep >= step.id
                  ? 'bg-blue-500 border-blue-500 text-white'
                  : 'border-gray-300 text-gray-500'
              }`}
            >
              {currentStep > step.id ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                step.id
              )}
            </button>
            {index < steps.length - 1 && (
              <div
                className={`w-20 h-1 ${
                  currentStep > step.id ? 'bg-blue-500' : 'bg-gray-300'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Current Step Content */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Step {currentStep}: {steps[currentStep - 1].title}
          </h2>
          {currentStep === 3 && (
            <a
              href={`https://discord.com/activities/${clientId}/tournament-test`}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-4 flex items-center text-blue-500 hover:text-blue-600"
            >
              <ExternalLink className="w-4 h-4 mr-1" />
              Test Link
            </a>
          )}
        </div>
        
        <p className="text-gray-600 mb-6">
          {steps[currentStep - 1].description}
        </p>

        <div className="space-y-3">
          {steps[currentStep - 1].instructions.map((instruction, index) => (
            <div key={index} className="flex items-start">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm mt-0.5">
                {index + 1}
              </div>
              <div className="ml-3">
                {instruction.startsWith('https://') ? (
                  <div className="flex items-center space-x-2">
                    <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">
                      {instruction}
                    </code>
                    <button
                      onClick={() => copyToClipboard(instruction)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <p className="text-gray-700">{instruction}</p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Quick Test Section */}
        {currentStep === 3 && (
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center mb-2">
              <AlertCircle className="w-5 h-5 text-blue-500 mr-2" />
              <span className="font-medium text-blue-800">Quick Test</span>
            </div>
            <p className="text-blue-700 text-sm mb-3">
              Test immediately by clicking the activity link above in Discord
            </p>
            <a
              href={`https://discord.com/activities/${clientId}/tournament-test`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Open Test Link in Discord
            </a>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <button
          onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
          disabled={currentStep === 1}
          className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          Previous
        </button>
        <button
          onClick={() => setCurrentStep(Math.min(steps.length, currentStep + 1))}
          disabled={currentStep === steps.length}
          className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
        >
          Next Step
        </button>
      </div>

      {/* Troubleshooting Tips */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-center mb-2">
          <AlertCircle className="w-5 h-5 text-yellow-600 mr-2" />
          <span className="font-medium text-yellow-800">Troubleshooting</span>
        </div>
        <ul className="text-yellow-700 text-sm list-disc list-inside space-y-1">
          <li>Make sure you're testing inside Discord, not just in a browser</li>
          <li>Verify your Client ID is correct: {clientId}</li>
          <li>Check that OAuth2 redirect URLs are properly set</li>
          <li>Ensure Rich Presence assets are uploaded</li>
        </ul>
      </div>
    </div>
  );
}
