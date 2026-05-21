'use client';

/**
 * Waiting Room Component
 *
 * Shown to patients while waiting for doctor to join consultation
 */

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/Alert';

interface WaitingRoomProps {
  appointmentId: string;
  doctorName: string;
  doctorImage?: string;
  appointmentTime: Date;
  reason: string;
  onCancel: () => void;
  onReady: () => void;
}

export function WaitingRoom({
  appointmentId,
  doctorName,
  doctorImage,
  appointmentTime,
  reason,
  onCancel,
  onReady,
}: WaitingRoomProps) {
  const [checkInStatus, setCheckInStatus] = useState<'waiting' | 'ready' | 'doctor_joining'>('waiting');
  const [minutesUntilAppointment, setMinutesUntilAppointment] = useState(0);
  const [videoPermission, setVideoPermission] = useState<'checking' | 'granted' | 'denied'>('checking');
  const [audioPermission, setAudioPermission] = useState<'checking' | 'granted' | 'denied'>('checking');

  // Check permissions on mount
  useEffect(() => {
    const checkPermissions = async () => {
      try {
        const cameraResult = await navigator.permissions.query({ name: 'camera' });
        const micResult = await navigator.permissions.query({ name: 'microphone' });

        setVideoPermission(cameraResult.state === 'granted' ? 'granted' : 'denied');
        setAudioPermission(micResult.state === 'granted' ? 'granted' : 'denied');
      } catch (error) {
        console.error('Error checking permissions:', error);
      }
    };

    checkPermissions();
  }, []);

  // Update time until appointment
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const diff = appointmentTime.getTime() - now.getTime();
      const minutes = Math.ceil(diff / (1000 * 60));
      setMinutesUntilAppointment(Math.max(0, minutes));
    };

    updateTime();
    const interval = setInterval(updateTime, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [appointmentTime]);

  const handleCheckIn = async () => {
    try {
      // Request camera and microphone
      await navigator.mediaDevices.getUserMedia({
        video: { width: { max: 1280 }, height: { max: 720 } },
        audio: { echoCancellation: true, noiseSuppression: true },
      });

      setVideoPermission('granted');
      setAudioPermission('granted');
      setCheckInStatus('ready');
    } catch (error) {
      console.error('Permission denied:', error);
      setVideoPermission('denied');
      setAudioPermission('denied');
    }
  };

  const getPermissionIcon = (status: 'checking' | 'granted' | 'denied') => {
    switch (status) {
      case 'checking':
        return '⏳';
      case 'granted':
        return '✅';
      case 'denied':
        return '❌';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        {/* Doctor Info */}
        <div className="text-center py-8 border-b border-gray-200">
          {doctorImage && (
            <img
              src={doctorImage}
              alt={doctorName}
              className="w-20 h-20 rounded-full mx-auto mb-4 object-cover border-4 border-blue-200"
            />
          )}
          <h2 className="text-2xl font-bold text-gray-900 mb-1">{doctorName}</h2>
          <p className="text-gray-600 text-sm mb-4">Waiting for doctor to join...</p>

          {/* Status Indicator */}
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="w-3 h-3 rounded-full bg-yellow-400 animate-pulse" />
            <span className="text-sm font-medium text-gray-700">
              {minutesUntilAppointment > 0
                ? `Appointment in ${minutesUntilAppointment} min`
                : 'Ready to start'}
            </span>
          </div>
        </div>

        {/* Reason for Visit */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <p className="text-sm font-medium text-gray-700 mb-1">Reason for visit</p>
          <p className="text-gray-600">{reason}</p>
        </div>

        {/* Permissions Check */}
        <div className="px-6 py-6 space-y-3">
          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2">
              <span className="text-lg">{getPermissionIcon(videoPermission)}</span>
              <span className="text-sm font-medium text-gray-900">Camera</span>
            </div>
            <span className="text-xs text-gray-600">
              {videoPermission === 'granted' && 'Ready'}
              {videoPermission === 'denied' && 'Allow access'}
              {videoPermission === 'checking' && 'Checking...'}
            </span>
          </div>

          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2">
              <span className="text-lg">{getPermissionIcon(audioPermission)}</span>
              <span className="text-sm font-medium text-gray-900">Microphone</span>
            </div>
            <span className="text-xs text-gray-600">
              {audioPermission === 'granted' && 'Ready'}
              {audioPermission === 'denied' && 'Allow access'}
              {audioPermission === 'checking' && 'Checking...'}
            </span>
          </div>
        </div>

        {/* Permission Alert */}
        {(videoPermission === 'denied' || audioPermission === 'denied') && checkInStatus === 'waiting' && (
          <Alert variant="warning" className="m-6">
            <AlertTitle>Permissions Required</AlertTitle>
            <AlertDescription>
              Please allow camera and microphone access to start the video consultation.
            </AlertDescription>
          </Alert>
        )}

        {/* Check In Status */}
        {checkInStatus === 'waiting' && (
          <Alert variant="info" className="m-6">
            <AlertDescription>
              Click "Check In" when you're ready. The doctor will be able to see you in the waiting room.
            </AlertDescription>
          </Alert>
        )}

        {checkInStatus === 'ready' && (
          <Alert variant="success" className="m-6">
            <AlertDescription>
              ✅ You're checked in and ready. Waiting for the doctor to join...
            </AlertDescription>
          </Alert>
        )}

        {/* Actions */}
        <div className="px-6 py-4 flex gap-3">
          <Button
            variant="ghost"
            onClick={onCancel}
            fullWidth
          >
            Cancel
          </Button>
          {checkInStatus === 'waiting' && (
            <Button
              variant="primary"
              onClick={handleCheckIn}
              fullWidth
            >
              Check In
            </Button>
          )}
          {checkInStatus === 'ready' && (
            <Button
              variant="primary"
              onClick={onReady}
              fullWidth
              disabled={minutesUntilAppointment > 5}
            >
              {minutesUntilAppointment > 5 ? 'Wait for appointment time' : 'Join Consultation'}
            </Button>
          )}
        </div>

        {/* Tips */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          <p className="text-xs font-semibold text-gray-700 mb-2">💡 Tips for best experience:</p>
          <ul className="text-xs text-gray-600 space-y-1">
            <li>✓ Use a well-lit, quiet room</li>
            <li>✓ Check your internet connection</li>
            <li>✓ Close other apps to improve performance</li>
          </ul>
        </div>
      </Card>
    </div>
  );
}
