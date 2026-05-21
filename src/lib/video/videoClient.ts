/**
 * Video Client
 *
 * WebRTC-based video consultation client
 * Integrates with video providers (Daily.co, Agora, Twilio)
 * Handles quality levels, permissions, and connection management
 */

/**
 * Video quality levels
 */
export enum VideoQuality {
  LOW = '360p',
  MEDIUM = '720p',
  HIGH = '1080p',
}

/**
 * Video quality config
 */
export interface VideoQualityConfig {
  maxWidth: number;
  maxHeight: number;
  maxFramerate: number;
  maxBitrate: number;
}

/**
 * Video constraints
 */
export interface VideoConstraints {
  video: {
    width: { max: number };
    height: { max: number };
    frameRate: { max: number };
  };
  audio: {
    echoCancellation: boolean;
    noiseSuppression: boolean;
    autoGainControl: boolean;
  };
}

/**
 * Connection stats
 */
export interface ConnectionStats {
  videoEnabled: boolean;
  audioEnabled: boolean;
  connectionState: RTCPeerConnectionState;
  videoStats?: {
    bitrate: number;
    frameRate: number;
    resolution: string;
  };
  audioStats?: {
    bitrate: number;
    level: number;
  };
  latency: number;
}

/**
 * Video client class
 */
export class VideoClient {
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private peerConnection: RTCPeerConnection | null = null;
  private videoQuality: VideoQuality = VideoQuality.MEDIUM;
  private qualityConfig: Record<VideoQuality, VideoQualityConfig> = {
    [VideoQuality.LOW]: {
      maxWidth: 640,
      maxHeight: 480,
      maxFramerate: 24,
      maxBitrate: 500000, // 500 kbps
    },
    [VideoQuality.MEDIUM]: {
      maxWidth: 1280,
      maxHeight: 720,
      maxFramerate: 30,
      maxBitrate: 2500000, // 2.5 mbps
    },
    [VideoQuality.HIGH]: {
      maxWidth: 1920,
      maxHeight: 1080,
      maxFramerate: 30,
      maxBitrate: 5000000, // 5 mbps
    },
  };

  private videoElement: HTMLVideoElement | null = null;
  private remoteVideoElement: HTMLVideoElement | null = null;
  private statsInterval: NodeJS.Timer | null = null;
  private isInitialized = false;

  /**
   * Initialize video client
   */
  async initialize(
    localVideoElement: HTMLVideoElement,
    remoteVideoElement: HTMLVideoElement
  ): Promise<void> {
    try {
      this.videoElement = localVideoElement;
      this.remoteVideoElement = remoteVideoElement;

      // Check permissions
      const result = await navigator.permissions.query({ name: 'camera' });
      if (result.state === 'denied') {
        throw new Error('Camera permission denied');
      }

      // Request streams
      const constraints = this.getVideoConstraints();
      this.localStream = await navigator.mediaDevices.getUserMedia(constraints);

      // Display local stream
      if (this.videoElement) {
        this.videoElement.srcObject = this.localStream;
      }

      this.isInitialized = true;
      console.log('[VIDEO] Initialized successfully');
    } catch (error) {
      console.error('[VIDEO] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Get video constraints based on quality
   */
  private getVideoConstraints(): VideoConstraints {
    const config = this.qualityConfig[this.videoQuality];
    return {
      video: {
        width: { max: config.maxWidth },
        height: { max: config.maxHeight },
        frameRate: { max: config.maxFramerate },
      },
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    };
  }

  /**
   * Set video quality
   */
  setVideoQuality(quality: VideoQuality): void {
    this.videoQuality = quality;
    console.log(`[VIDEO] Quality set to ${quality}`);
  }

  /**
   * Create peer connection
   */
  createPeerConnection(): RTCPeerConnection {
    const iceServers = [
      { urls: ['stun:stun.l.google.com:19302'] },
      { urls: ['stun:stun1.l.google.com:19302'] },
    ];

    this.peerConnection = new RTCPeerConnection({
      iceServers,
    });

    // Add local stream tracks
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        this.peerConnection!.addTrack(track, this.localStream!);
      });
    }

    // Handle remote stream
    this.peerConnection.ontrack = (event: RTCTrackEvent) => {
      console.log('[VIDEO] Remote track received:', event.track.kind);
      if (!this.remoteStream) {
        this.remoteStream = new MediaStream();
      }
      this.remoteStream.addTrack(event.track);

      if (this.remoteVideoElement) {
        this.remoteVideoElement.srcObject = this.remoteStream;
      }
    };

    // Handle connection state
    this.peerConnection.onconnectionstatechange = () => {
      console.log(`[VIDEO] Connection state: ${this.peerConnection?.connectionState}`);
    };

    return this.peerConnection;
  }

  /**
   * Start monitoring connection stats
   */
  startStatsMonitoring(interval: number = 1000): void {
    if (!this.peerConnection) {
      console.error('[VIDEO] Peer connection not initialized');
      return;
    }

    this.statsInterval = setInterval(async () => {
      try {
        const stats = await this.getConnectionStats();
        console.log('[VIDEO] Stats:', stats);
      } catch (error) {
        console.error('[VIDEO] Stats monitoring error:', error);
      }
    }, interval);
  }

  /**
   * Stop stats monitoring
   */
  stopStatsMonitoring(): void {
    if (this.statsInterval) {
      clearInterval(this.statsInterval);
      this.statsInterval = null;
    }
  }

  /**
   * Get connection stats
   */
  async getConnectionStats(): Promise<ConnectionStats> {
    if (!this.peerConnection) {
      throw new Error('Peer connection not initialized');
    }

    const stats: ConnectionStats = {
      videoEnabled: this.isVideoEnabled(),
      audioEnabled: this.isAudioEnabled(),
      connectionState: this.peerConnection.connectionState as RTCPeerConnectionState,
      latency: 0,
    };

    // Get WebRTC stats
    const rtcStats = await this.peerConnection.getStats();
    rtcStats.forEach((report) => {
      if (report.type === 'inbound-rtp' && report.kind === 'video') {
        stats.videoStats = {
          bitrate: (report as any).bytesReceived || 0,
          frameRate: (report as any).framesDecoded || 0,
          resolution: `${(report as any).frameWidth || 0}x${(report as any).frameHeight || 0}`,
        };
      }

      if (report.type === 'candidate-pair' && report.state === 'succeeded') {
        stats.latency = (report as any).currentRoundTripTime * 1000; // Convert to ms
      }
    });

    return stats;
  }

  /**
   * Toggle video
   */
  toggleVideo(enabled: boolean): void {
    if (this.localStream) {
      this.localStream.getVideoTracks().forEach((track) => {
        track.enabled = enabled;
      });
    }
  }

  /**
   * Toggle audio
   */
  toggleAudio(enabled: boolean): void {
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach((track) => {
        track.enabled = enabled;
      });
    }
  }

  /**
   * Check if video is enabled
   */
  isVideoEnabled(): boolean {
    return (
      this.localStream?.getVideoTracks().some((track) => track.enabled) ?? false
    );
  }

  /**
   * Check if audio is enabled
   */
  isAudioEnabled(): boolean {
    return (
      this.localStream?.getAudioTracks().some((track) => track.enabled) ?? false
    );
  }

  /**
   * Get connection state
   */
  getConnectionState(): RTCPeerConnectionState | null {
    return this.peerConnection?.connectionState ?? null;
  }

  /**
   * Clean up resources
   */
  cleanup(): void {
    this.stopStatsMonitoring();

    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
      this.localStream = null;
    }

    if (this.remoteStream) {
      this.remoteStream.getTracks().forEach((track) => track.stop());
      this.remoteStream = null;
    }

    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    if (this.videoElement) {
      this.videoElement.srcObject = null;
    }

    if (this.remoteVideoElement) {
      this.remoteVideoElement.srcObject = null;
    }

    this.isInitialized = false;
    console.log('[VIDEO] Cleaned up resources');
  }

  /**
   * Create data channel
   */
  createDataChannel(label: string): RTCDataChannel {
    if (!this.peerConnection) {
      throw new Error('Peer connection not initialized');
    }

    return this.peerConnection.createDataChannel(label);
  }

  /**
   * Get video element
   */
  getLocalVideoElement(): HTMLVideoElement | null {
    return this.videoElement;
  }

  /**
   * Get remote video element
   */
  getRemoteVideoElement(): HTMLVideoElement | null {
    return this.remoteVideoElement;
  }
}

/**
 * Global video client instance
 */
export const videoClient = new VideoClient();
