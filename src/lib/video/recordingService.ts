/**
 * Recording Service
 *
 * Video recording and transcription for consultations
 * Handles consent, storage, and access control
 */

/**
 * Recording config
 */
export interface RecordingConfig {
  mimeType: string;
  videoBitsPerSecond: number;
  audioBitsPerSecond: number;
  requireConsent: boolean;
}

/**
 * Recording metadata
 */
export interface RecordingMetadata {
  recordingId: string;
  consultationId: string;
  doctorId: string;
  patientId: string;
  startTime: Date;
  endTime?: Date;
  duration?: number; // in seconds
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  status: 'recording' | 'processing' | 'completed' | 'failed';
  consentObtained: boolean;
  transcription?: {
    text: string;
    chunks: {
      timestamp: number;
      speaker: string;
      text: string;
    }[];
  };
  encrypted: boolean;
}

/**
 * Recording service
 */
export class RecordingService {
  private mediaRecorder: MediaRecorder | null = null;
  private recordingChunks: Blob[] = [];
  private recordingMetadata: Map<string, RecordingMetadata> = new Map();
  private recordingConfig: RecordingConfig = {
    mimeType: 'video/webm;codecs=vp9',
    videoBitsPerSecond: 2500000,
    audioBitsPerSecond: 128000,
    requireConsent: true,
  };

  private consentMap: Map<string, boolean> = new Map();
  private recordingListeners: ((metadata: RecordingMetadata) => void)[] = [];

  /**
   * Check browser support
   */
  static isSupported(): boolean {
    const canvas = document.createElement('canvas');
    return !!(
      canvas.getContext &&
      navigator.mediaDevices &&
      navigator.mediaDevices.getUserMedia
    );
  }

  /**
   * Initialize recording service
   */
  initialize(config?: Partial<RecordingConfig>): void {
    if (config) {
      this.recordingConfig = { ...this.recordingConfig, ...config };
    }

    // Check if MIME type is supported
    if (MediaRecorder.isTypeSupported(this.recordingConfig.mimeType)) {
      console.log(`[RECORDING] Using MIME type: ${this.recordingConfig.mimeType}`);
    } else {
      // Fallback to default
      const fallbackMimeType = 'video/webm';
      console.warn(`[RECORDING] MIME type not supported, using fallback: ${fallbackMimeType}`);
      this.recordingConfig.mimeType = fallbackMimeType;
    }
  }

  /**
   * Check consent
   */
  hasConsent(consultationId: string): boolean {
    return this.consentMap.get(consultationId) ?? false;
  }

  /**
   * Obtain consent
   */
  obtainConsent(consultationId: string, granted: boolean): void {
    this.consentMap.set(consultationId, granted);
    console.log(`[RECORDING] Consent ${granted ? 'obtained' : 'denied'} for ${consultationId}`);
  }

  /**
   * Start recording
   */
  startRecording(
    stream: MediaStream,
    consultationId: string,
    doctorId: string,
    patientId: string
  ): string {
    // Check consent if required
    if (this.recordingConfig.requireConsent && !this.hasConsent(consultationId)) {
      throw new Error('Recording consent not obtained');
    }

    const recordingId = `rec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      // Create media recorder
      const options: MediaRecorderOptions = {
        mimeType: this.recordingConfig.mimeType,
        videoBitsPerSecond: this.recordingConfig.videoBitsPerSecond,
        audioBitsPerSecond: this.recordingConfig.audioBitsPerSecond,
      };

      this.mediaRecorder = new MediaRecorder(stream, options);
      this.recordingChunks = [];

      // Handle data available
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.recordingChunks.push(event.data);
        }
      };

      // Handle stop
      this.mediaRecorder.onstop = () => {
        this.handleRecordingStop(recordingId);
      };

      // Create metadata
      const metadata: RecordingMetadata = {
        recordingId,
        consultationId,
        doctorId,
        patientId,
        startTime: new Date(),
        status: 'recording',
        consentObtained: this.hasConsent(consultationId),
        encrypted: true,
      };

      this.recordingMetadata.set(recordingId, metadata);

      // Start recording
      this.mediaRecorder.start();

      console.log(`[RECORDING] Started recording: ${recordingId}`);

      return recordingId;
    } catch (error) {
      console.error('[RECORDING] Failed to start:', error);
      throw error;
    }
  }

  /**
   * Stop recording
   */
  stopRecording(): void {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
      console.log('[RECORDING] Stopped recording');
    }
  }

  /**
   * Handle recording stop
   */
  private handleRecordingStop(recordingId: string): void {
    const metadata = this.recordingMetadata.get(recordingId);
    if (!metadata) return;

    // Create blob from chunks
    const blob = new Blob(this.recordingChunks, { type: this.recordingConfig.mimeType });

    // Update metadata
    metadata.endTime = new Date();
    metadata.duration = Math.round(
      (metadata.endTime.getTime() - metadata.startTime.getTime()) / 1000
    );
    metadata.fileSize = blob.size;
    metadata.status = 'processing';
    metadata.fileName = `recording_${recordingId}.webm`;

    // In production, upload to cloud storage
    this.uploadRecording(recordingId, blob);

    // Notify listeners
    this.recordingListeners.forEach((listener) => listener(metadata));

    console.log(`[RECORDING] Recording processed: ${recordingId}`);
  }

  /**
   * Upload recording to storage
   */
  private async uploadRecording(recordingId: string, blob: Blob): Promise<void> {
    try {
      // TODO: Upload to cloud storage (S3, GCS, etc.)
      // For now, create object URL
      const fileUrl = URL.createObjectURL(blob);

      const metadata = this.recordingMetadata.get(recordingId);
      if (metadata) {
        metadata.fileUrl = fileUrl;
        metadata.status = 'completed';
      }

      console.log(`[RECORDING] Uploaded: ${recordingId}`);
    } catch (error) {
      console.error('[RECORDING] Upload failed:', error);
      const metadata = this.recordingMetadata.get(recordingId);
      if (metadata) {
        metadata.status = 'failed';
      }
    }
  }

  /**
   * Get recording metadata
   */
  getMetadata(recordingId: string): RecordingMetadata | null {
    return this.recordingMetadata.get(recordingId) ?? null;
  }

  /**
   * Get recordings for consultation
   */
  getConsultationRecordings(consultationId: string): RecordingMetadata[] {
    const recordings: RecordingMetadata[] = [];

    for (const metadata of this.recordingMetadata.values()) {
      if (metadata.consultationId === consultationId) {
        recordings.push(metadata);
      }
    }

    return recordings;
  }

  /**
   * Transcribe recording
   */
  async transcribeRecording(recordingId: string): Promise<void> {
    const metadata = this.recordingMetadata.get(recordingId);
    if (!metadata || !metadata.fileUrl) {
      throw new Error('Recording not found or not uploaded');
    }

    try {
      // TODO: Call transcription service (Google Speech-to-Text, etc.)
      const transcription = {
        text: 'Transcription placeholder',
        chunks: [
          {
            timestamp: 0,
            speaker: metadata.doctorId,
            text: 'Hello, how are you feeling today?',
          },
        ],
      };

      metadata.transcription = transcription;

      console.log(`[RECORDING] Transcribed: ${recordingId}`);
    } catch (error) {
      console.error('[RECORDING] Transcription failed:', error);
      throw error;
    }
  }

  /**
   * Delete recording
   */
  async deleteRecording(recordingId: string): Promise<void> {
    const metadata = this.recordingMetadata.get(recordingId);
    if (!metadata) {
      throw new Error('Recording not found');
    }

    try {
      // TODO: Delete from cloud storage
      if (metadata.fileUrl && metadata.fileUrl.startsWith('blob:')) {
        URL.revokeObjectURL(metadata.fileUrl);
      }

      this.recordingMetadata.delete(recordingId);

      console.log(`[RECORDING] Deleted: ${recordingId}`);
    } catch (error) {
      console.error('[RECORDING] Delete failed:', error);
      throw error;
    }
  }

  /**
   * Get recording status
   */
  getRecordingStatus(recordingId: string): 'recording' | 'processing' | 'completed' | 'failed' | null {
    const metadata = this.recordingMetadata.get(recordingId);
    return metadata?.status ?? null;
  }

  /**
   * Is recording in progress
   */
  isRecording(): boolean {
    return this.mediaRecorder?.state === 'recording';
  }

  /**
   * Subscribe to recording events
   */
  onRecordingComplete(callback: (metadata: RecordingMetadata) => void): () => void {
    this.recordingListeners.push(callback);

    return () => {
      this.recordingListeners = this.recordingListeners.filter((l) => l !== callback);
    };
  }

  /**
   * Get storage stats
   */
  getStorageStats() {
    let totalSize = 0;
    let completedCount = 0;

    for (const metadata of this.recordingMetadata.values()) {
      if (metadata.fileSize) {
        totalSize += metadata.fileSize;
      }
      if (metadata.status === 'completed') {
        completedCount++;
      }
    }

    return {
      totalRecordings: this.recordingMetadata.size,
      completedRecordings: completedCount,
      totalStorageUsed: totalSize,
      totalStorageUsedMB: Math.round(totalSize / 1024 / 1024 * 100) / 100,
    };
  }

  /**
   * Clean up resources
   */
  cleanup(): void {
    if (this.mediaRecorder) {
      this.mediaRecorder.stop();
      this.mediaRecorder = null;
    }

    this.recordingChunks = [];
    this.recordingListeners = [];

    console.log('[RECORDING] Cleaned up resources');
  }
}

/**
 * Global recording service instance
 */
export const recordingService = new RecordingService();
