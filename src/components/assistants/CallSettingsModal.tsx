'use client';

import { useState } from 'react';
import { X, Phone, Info, Send } from 'lucide-react';

interface CallSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CallSettingsModal({ isOpen, onClose }: CallSettingsModalProps) {
  const [recordingEnabled, setRecordingEnabled] = useState(true);
  const [maxCallTime, setMaxCallTime] = useState(30);
  const [silenceTimeout, setSilenceTimeout] = useState(15000);
  const [backgroundNoise, setBackgroundNoise] = useState('coffee-shop');
  const [backgroundVolume, setBackgroundVolume] = useState(1.25);
  const [rulesOfEngagement, setRulesOfEngagement] = useState('ai-starts-dynamic');
  const [voicemailDetection, setVoicemailDetection] = useState(true);
  const [incomingWebhook, setIncomingWebhook] = useState('');
  const [postCallWebhook, setPostCallWebhook] = useState('');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/20 transition-opacity"
        onClick={onClose}
      />
      
      {/* Sidebar Modal */}
      <div className="absolute right-0 top-0 h-full w-[600px] bg-white shadow-2xl overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white sticky top-0 z-10">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Phone className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Call Settings</h2>
              <p className="text-xs text-gray-500">
                Configure settings for your assistant when calling such as who should initiate the convo, where to send your data, and more.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Opt-Out Of Recording & Transcript */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900">Opt-Out Of Recording & Transcript</h3>
              <Info className="w-4 h-4 text-gray-400" />
            </div>
            <p className="text-xs text-yellow-700 bg-yellow-50 border border-yellow-200 rounded p-2">
              This will overwrite call recording and transcripts and that data will be lost - Use this if you require HIPAA or conversation regulation
            </p>
            <button
              onClick={() => setRecordingEnabled(!recordingEnabled)}
              className={`w-full py-3 rounded-lg font-semibold transition-colors ${
                recordingEnabled
                  ? 'bg-green-100 text-green-700 hover:bg-green-200'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {recordingEnabled ? 'RECORDING ENABLED' : 'RECORDING DISABLED'}
            </button>
          </div>

          {/* Max Call Time */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900">Max Call Time (minutes)</h3>
              <Info className="w-4 h-4 text-gray-400" />
            </div>
            <input
              type="number"
              value={maxCallTime}
              onChange={(e) => setMaxCallTime(Number(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Silence Timeout */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900">Silence Timeout (minutes)</h3>
              <Info className="w-4 h-4 text-gray-400" />
            </div>
            <input
              type="number"
              value={silenceTimeout}
              onChange={(e) => setSilenceTimeout(Number(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Background Noise & Volume */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900">Background Noise & Volume</h3>
              <Info className="w-4 h-4 text-gray-400" />
            </div>
            <select
              value={backgroundNoise}
              onChange={(e) => setBackgroundNoise(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="none">None</option>
              <option value="coffee-shop">Coffee Shop</option>
              <option value="convention-hall">Convention Hall</option>
              <option value="summer-outdoor">Summer Outdoor</option>
              <option value="mountain-outdoor">Mountain Outdoor</option>
              <option value="static-noise">Static Noise</option>
              <option value="call-center">Call Center</option>
            </select>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Volume</span>
                <span className="text-sm font-medium text-gray-900">{backgroundVolume}</span>
              </div>
              <input
                type="range"
                min="0"
                max="2"
                step="0.05"
                value={backgroundVolume}
                onChange={(e) => setBackgroundVolume(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
            </div>
          </div>

          {/* Rules of Engagement */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900">Rules of Engagement</h3>
              <Info className="w-4 h-4 text-gray-400" />
            </div>
            <select
              value={rulesOfEngagement}
              onChange={(e) => setRulesOfEngagement(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="ai-starts-dynamic">AI initiates: AI begins the conversation with a dynamic message</option>
              <option value="ai-starts-determined">AI starts: Determined message that you write</option>
              <option value="contact-starts">Contact starts: Silent start</option>
            </select>

            {/* Options Cards */}
            <div className="grid grid-cols-1 gap-3 mt-3">
              {/* AI starts: Dynamic start */}
              <div
                className={`px-4 py-3 border-2 rounded-lg cursor-pointer transition-all ${
                  rulesOfEngagement === 'ai-starts-dynamic'
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-blue-300'
                }`}
                onClick={() => setRulesOfEngagement('ai-starts-dynamic')}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h4 className="text-sm font-semibold text-gray-900">AI starts: Dynamic start</h4>
                      {rulesOfEngagement === 'ai-starts-dynamic' && (
                        <span className="text-xs font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded">Recommended</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 mt-1">
                      The assistant will start the conversation off with a dynamically generated message.
                    </p>
                  </div>
                </div>
              </div>

              {/* AI starts: Determined start */}
              <div
                className={`px-4 py-3 border-2 rounded-lg cursor-pointer transition-all ${
                  rulesOfEngagement === 'ai-starts-determined'
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-blue-300'
                }`}
                onClick={() => setRulesOfEngagement('ai-starts-determined')}
              >
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-gray-900">AI starts: Determined start</h4>
                  <p className="text-xs text-gray-600 mt-1">
                    The assistant will start the conversation off with a determined message that you write.
                  </p>
                </div>
              </div>

              {/* Contact starts: Silent start */}
              <div
                className={`px-4 py-3 border-2 rounded-lg cursor-pointer transition-all ${
                  rulesOfEngagement === 'contact-starts'
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-blue-300'
                }`}
                onClick={() => setRulesOfEngagement('contact-starts')}
              >
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-gray-900">Contact starts: Silent start</h4>
                  <p className="text-xs text-gray-600 mt-1">
                    The assistant will start the conversation off silent and will wait for the contact to speak.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Enable Voicemail Detection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900">Enable Voicemail Detection & Message</h3>
              <Info className="w-4 h-4 text-gray-400" />
            </div>
            <button
              onClick={() => setVoicemailDetection(!voicemailDetection)}
              className={`w-full py-3 rounded-lg font-semibold transition-colors ${
                voicemailDetection
                  ? 'bg-green-100 text-green-700 hover:bg-green-200'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {voicemailDetection ? 'VOICEMAIL DETECTION ON' : 'VOICEMAIL DETECTION OFF'}
            </button>
          </div>

          {/* Incoming Call Webhook */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900">Incoming Call Webhook</h3>
              <Info className="w-4 h-4 text-gray-400" />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={incomingWebhook}
                onChange={(e) => setIncomingWebhook(e.target.value)}
                placeholder="https://your-webhook-url.com/incoming"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Post-Call Webhook */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900">Post-Call Webhook</h3>
              <Info className="w-4 h-4 text-gray-400" />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={postCallWebhook}
                onChange={(e) => setPostCallWebhook(e.target.value)}
                placeholder="https://your-webhook-url.com/post-call"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 flex justify-end space-x-3 bg-white sticky bottom-0">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              // TODO: Save settings
              onClose();
            }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

