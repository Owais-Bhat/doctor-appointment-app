'use client';

/**
 * Video Consultation Component
 *
 * Main consultation interface with video, chat, and controls
 */

import React, { useState, useEffect, useRef } from 'react';
import { VideoClient } from '@/lib/video/videoClient';
import { ChatManager, ChatMessage } from '@/lib/video/chatManager';
import { RecordingService } from '@/lib/video/recordingService';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Alert, AlertDescription } from '@/components/ui/Alert';

interface VideoConsultationProps {
  sessionId: string;
  consultationId: string;
  doctorName: string;
  patientName: string;
  recordingConsent: boolean;
  onEnd: () => void;
}

export function VideoConsultation({
  sessionId,
  consultationId,
  doctorName,
  patientName,
  recordingConsent,
  onEnd,
}: VideoConsultationProps) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [connectionStats, setConnectionStats] = useState<string>('Initializing...');
  const [showChat, setShowChat] = useState(true);
  const [elapsedTime, setElapsedTime] = useState(0);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const videoClientRef = useRef<VideoClient | null>(null);
  const chatManagerRef = useRef<ChatManager | null>(null);
  const recordingServiceRef = useRef<RecordingService | null>(null);

  // Initialize video consultation
  useEffect(() => {
    const initializeConsultation = async () => {
      try {
        // Initialize video client
        const videoClient = new VideoClient();
        if (localVideoRef.current && remoteVideoRef.current) {
          await videoClient.initialize(localVideoRef.current, remoteVideoRef.current);
        }
        videoClientRef.current = videoClient;

        // Initialize chat manager
        const chatManager = new ChatManager();
        chatManager.initialize(sessionId, {
          maxMessages: 1000,
          enableFileSharing: true,
          maxFileSize: 10 * 1024 * 1024, // 10 MB
        });

        // Subscribe to messages
        chatManager.onMessage((message) => {
          setMessages((prev) => [...prev, message]);
        });

        chatManagerRef.current = chatManager;

        // Initialize recording service if consent given
        if (recordingConsent) {
          const recordingService = new RecordingService();
          recordingService.initialize();
          recordingServiceRef.current = recordingService;
          recordingService.obtainConsent(consultationId, true);
        }

        // Create peer connection
        videoClient.createPeerConnection();
        videoClient.startStatsMonitoring(2000);

        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize consultation:', error);
      }
    };

    initializeConsultation();

    return () => {
      videoClientRef.current?.cleanup();
      recordingServiceRef.current?.cleanup();
      chatManagerRef.current?.cleanup();
    };
  }, [sessionId, consultationId, recordingConsent]);

  // Update connection stats
  useEffect(() => {
    if (!videoClientRef.current) return;

    const updateStats = async () => {
      try {
        const stats = await videoClientRef.current!.getConnectionStats();
        setConnectionStats(
          `${stats.connectionState} • Latency: ${Math.round(stats.latency)}ms`
        );
      } catch (error) {
        console.error('Error getting stats:', error);
      }
    };

    const interval = setInterval(updateStats, 2000);
    return () => clearInterval(interval);
  }, [isInitialized]);

  // Update elapsed time
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Handle video toggle
  const handleToggleVideo = () => {
    if (videoClientRef.current) {
      videoClientRef.current.toggleVideo(!videoEnabled);
      setVideoEnabled(!videoEnabled);
    }
  };

  // Handle audio toggle
  const handleToggleAudio = () => {
    if (videoClientRef.current) {
      videoClientRef.current.toggleAudio(!audioEnabled);
      setAudioEnabled(!audioEnabled);
    }
  };

  // Handle recording toggle
  const handleToggleRecording = async () => {
    if (!recordingServiceRef.current || !videoClientRef.current) return;

    try {
      if (!isRecording) {
        const stream = localVideoRef.current?.srcObject as MediaStream;
        if (stream) {
          recordingServiceRef.current.startRecording(
            stream,
            consultationId,
            doctorName,
            patientName
          );
          setIsRecording(true);
        }
      } else {
        recordingServiceRef.current.stopRecording();
        setIsRecording(false);
      }
    } catch (error) {
      console.error('Recording error:', error);
    }
  };

  // Handle send message
  const handleSendMessage = (content: string) => {
    if (!chatManagerRef.current) return;

    chatManagerRef.current.sendMessage(
      sessionId,
      'current-user-id', // TODO: Get from auth context
      'Your Name', // TODO: Get from auth context
      content
    );
  };

  // Format elapsed time
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    return [hours, minutes, secs]
      .map((x) => String(x).padStart(2, '0'))
      .join(':');
  };

  if (!isInitialized) {
    return (
      <Card className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-600">Initializing video consultation...</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="flex h-screen bg-black">
      {/* Video Section */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-gray-900 border-b border-gray-800 px-4 py-3 flex justify-between items-center">
          <div>
            <h2 className="text-white font-semibold">
              {doctorName} • {patientName}
            </h2>
            <p className="text-gray-400 text-sm">{formatTime(elapsedTime)}</p>
          </div>
          <div className="text-gray-400 text-sm">{connectionStats}</div>
        </div>

        {/* Video Grid */}
        <div className="flex-1 flex gap-4 p-4">
          {/* Remote Video (Large) */}
          <div className="flex-1 bg-gray-950 rounded-lg overflow-hidden">
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
          </div>

          {/* Local Video (Small) */}
          <div className="w-48 h-48 bg-gray-950 rounded-lg overflow-hidden self-end">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Controls */}
        <div className="bg-gray-900 border-t border-gray-800 px-4 py-4 flex justify-center gap-4">
          <Button
            variant={audioEnabled ? 'primary' : 'danger'}
            size="lg"
            onClick={handleToggleAudio}
            className="rounded-full w-14 h-14 flex items-center justify-center"
            title={audioEnabled ? 'Mute' : 'Unmute'}
          >
            🎤
          </Button>

          <Button
            variant={videoEnabled ? 'primary' : 'danger'}
            size="lg"
            onClick={handleToggleVideo}
            className="rounded-full w-14 h-14 flex items-center justify-center"
            title={videoEnabled ? 'Stop Video' : 'Start Video'}
          >
            📹
          </Button>

          {recordingConsent && (
            <Button
              variant={isRecording ? 'danger' : 'secondary'}
              size="lg"
              onClick={handleToggleRecording}
              className="rounded-full w-14 h-14 flex items-center justify-center"
              title={isRecording ? 'Stop Recording' : 'Start Recording'}
            >
              ⏺️
            </Button>
          )}

          <Button
            variant="ghost"
            size="lg"
            onClick={() => setShowChat(!showChat)}
            className="rounded-full w-14 h-14 flex items-center justify-center"
            title={showChat ? 'Hide Chat' : 'Show Chat'}
          >
            💬
          </Button>

          <Button
            variant="danger"
            size="lg"
            onClick={onEnd}
            className="rounded-full w-14 h-14 flex items-center justify-center"
            title="End Call"
          >
            📞
          </Button>
        </div>

        {/* Recording Indicator */}
        {isRecording && (
          <Alert variant="destructive" className="m-4">
            <AlertDescription>🔴 Recording in progress</AlertDescription>
          </Alert>
        )}
      </div>

      {/* Chat Sidebar */}
      {showChat && (
        <div className="w-80 bg-gray-50 border-l border-gray-200 flex flex-col">
          {/* Chat Header */}
          <div className="px-4 py-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">Chat</h3>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className="flex flex-col gap-1"
              >
                <p className="text-sm font-medium text-gray-900">{message.senderName}</p>
                <div className="bg-blue-50 rounded px-3 py-2">
                  <p className="text-sm text-gray-800">{message.content}</p>
                </div>
                <p className="text-xs text-gray-400">
                  {message.timestamp.toLocaleTimeString()}
                </p>
              </div>
            ))}
          </div>

          {/* Message Input */}
          <div className="px-4 py-4 border-t border-gray-200">
            <MessageInput onSend={handleSendMessage} />
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Message input component
 */
function MessageInput({ onSend }: { onSend: (message: string) => void }) {
  const [input, setInput] = useState('');

  const handleSubmit = () => {
    if (input.trim()) {
      onSend(input);
      setInput('');
    }
  };

  return (
    <div className="flex gap-2">
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
        placeholder="Type message..."
        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <Button
        variant="primary"
        size="sm"
        onClick={handleSubmit}
        disabled={!input.trim()}
      >
        Send
      </Button>
    </div>
  );
}
