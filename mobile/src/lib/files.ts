import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import * as Sharing from 'expo-sharing';

import { ApiError, api, authHeaders } from './api';
import { API_URL } from './config';

export const MAX_FILE_BYTES = 3 * 1024 * 1024;

export type Report = { id: string; title: string; mime_type: string; size_bytes: number; appointment_id: string | null; created_at: string };
export type Picked = { name: string; mime: string; base64: string };

export const isImage = (mime: string) => mime.startsWith('image/');

const tooBig = () => new ApiError('That file is too large. The limit is 3 MB.', 413);

/** A photo from the gallery or the camera, shrunk by the picker so it stays well under the limit. Null if cancelled. */
export async function pickPhoto(camera: boolean): Promise<Picked | null> {
  const permission = camera ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) throw new ApiError(camera ? 'Allow camera access in Settings to take a photo.' : 'Allow photo access in Settings to choose a photo.', 0);
  const result = await (camera ? ImagePicker.launchCameraAsync : ImagePicker.launchImageLibraryAsync)({ mediaTypes: ['images'], quality: 0.6, base64: true, exif: false });
  if (result.canceled) return null;
  const a = result.assets[0];
  if (!a.base64) throw new ApiError('Could not read that photo.', 0);
  if ((a.base64.length * 3) / 4 > MAX_FILE_BYTES) throw tooBig();
  return { name: a.fileName ?? 'photo.jpg', mime: a.mimeType ?? 'image/jpeg', base64: a.base64 };
}

/** A PDF from the phone's files. Null if cancelled. */
export async function pickPdf(): Promise<Picked | null> {
  const result = await DocumentPicker.getDocumentAsync({ type: 'application/pdf', copyToCacheDirectory: true });
  if (result.canceled) return null;
  const a = result.assets[0];
  if ((a.size ?? 0) > MAX_FILE_BYTES) throw tooBig();
  const base64 = await FileSystem.readAsStringAsync(a.uri, { encoding: FileSystem.EncodingType.Base64 });
  return { name: a.name, mime: 'application/pdf', base64 };
}

export const uploadReport = (file: Picked, title: string, appointmentId?: string | null) =>
  api<{ report: Report }>('/api/patient/reports', { method: 'POST', body: { title: title.trim() || undefined, fileName: file.name, data: file.base64, appointmentId: appointmentId || undefined } });

export const shareReportWith = (id: string, appointmentId: string | null) => api(`/api/patient/reports/${id}`, { method: 'PATCH', body: { appointmentId } });

export const deleteReport = (id: string) => api(`/api/patient/reports/${id}`, { method: 'DELETE' });

/** Where a report's file is served from (needs the sign-in header). */
export const reportUrl = (id: string) => `${API_URL}/api/reports/${id}`;

/** Photos open in the app; PDFs are downloaded and handed to a viewer app. */
export async function openReport(r: Pick<Report, 'id' | 'title' | 'mime_type'>): Promise<void> {
  if (isImage(r.mime_type)) {
    router.push({ pathname: '/report/[id]', params: { id: r.id, title: r.title } });
    return;
  }
  const dir = FileSystem.cacheDirectory;
  if (!dir) throw new ApiError('This phone cannot open files here.', 0);
  const target = `${dir}report-${r.id}.pdf`;
  const res = await FileSystem.downloadAsync(reportUrl(r.id), target, { headers: await authHeaders() });
  if (res.status !== 200) throw new ApiError('Could not open this report.', res.status);
  if (!(await Sharing.isAvailableAsync())) throw new ApiError('This phone has no app that can open PDFs.', 0);
  await Sharing.shareAsync(res.uri, { mimeType: 'application/pdf', dialogTitle: r.title });
}
