export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  createdTime?: string;
  modifiedTime?: string;
  webViewLink?: string;
  webContentLink?: string;
  iconLink?: string;
  thumbnailLink?: string;
  parents?: string[];
  shared?: boolean;
}

export interface DriveAboutInfo {
  user?: {
    displayName: string;
    emailAddress: string;
    photoLink?: string;
  };
  storageQuota?: {
    limit?: string;
    usage?: string;
    usageInDrive?: string;
    usageInDriveTrash?: string;
  };
}

export const FOLDER_MIME_TYPE = 'application/vnd.google-apps.folder';

/**
 * Fetch information about current Drive user and storage quota
 */
export async function getDriveAbout(accessToken: string): Promise<DriveAboutInfo> {
  const response = await fetch(
    'https://www.googleapis.com/drive/v3/about?fields=user,storageQuota',
    {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    }
  );

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `HTTP ${response.status}: Gagal memuat info Google Drive`);
  }

  return response.json();
}

/**
 * List files and folders from Google Drive
 */
export async function listDriveFiles(
  accessToken: string,
  options: {
    query?: string;
    folderId?: string;
    mimeTypeFilter?: 'all' | 'spreadsheets' | 'documents' | 'folders' | 'pdf';
    pageSize?: number;
    pageToken?: string;
  } = {}
): Promise<{ files: DriveFile[]; nextPageToken?: string }> {
  const { query, folderId, mimeTypeFilter = 'all', pageSize = 40, pageToken } = options;

  const queryParts: string[] = ['trashed = false'];

  if (folderId) {
    queryParts.push(`'${folderId}' in parents`);
  }

  if (query && query.trim()) {
    const escapedQuery = query.replace(/'/g, "\\'");
    queryParts.push(`name contains '${escapedQuery}'`);
  }

  if (mimeTypeFilter === 'spreadsheets') {
    queryParts.push(
      "(mimeType = 'application/vnd.google-apps.spreadsheet' or mimeType = 'text/csv' or mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' or mimeType = 'application/vnd.ms-excel')"
    );
  } else if (mimeTypeFilter === 'documents') {
    queryParts.push(
      "(mimeType = 'application/vnd.google-apps.document' or mimeType = 'application/pdf' or mimeType = 'text/plain')"
    );
  } else if (mimeTypeFilter === 'pdf') {
    queryParts.push("mimeType = 'application/pdf'");
  } else if (mimeTypeFilter === 'folders') {
    queryParts.push(`mimeType = '${FOLDER_MIME_TYPE}'`);
  }

  const q = queryParts.join(' and ');

  const url = new URL('https://www.googleapis.com/drive/v3/files');
  url.searchParams.set('q', q);
  url.searchParams.set('pageSize', pageSize.toString());
  url.searchParams.set(
    'fields',
    'nextPageToken, files(id, name, mimeType, size, createdTime, modifiedTime, webViewLink, webContentLink, iconLink, thumbnailLink, parents, shared)'
  );
  url.searchParams.set('orderBy', 'folder,modifiedTime desc');

  if (pageToken) {
    url.searchParams.set('pageToken', pageToken);
  }

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `HTTP ${response.status}: Gagal memuat daftar file Google Drive`);
  }

  return response.json();
}

/**
 * Find or create a specific folder (e.g. "AKTARA School Intelligence") in Google Drive root
 */
export async function findOrCreateAppFolder(
  accessToken: string,
  folderName = 'AKTARA School Intelligence'
): Promise<DriveFile> {
  // 1. Search if folder already exists
  const searchUrl = new URL('https://www.googleapis.com/drive/v3/files');
  searchUrl.searchParams.set(
    'q',
    `name = '${folderName}' and mimeType = '${FOLDER_MIME_TYPE}' and trashed = false and 'root' in parents`
  );
  searchUrl.searchParams.set('fields', 'files(id, name, mimeType, webViewLink)');

  const searchRes = await fetch(searchUrl.toString(), {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  if (searchRes.ok) {
    const data = await searchRes.json();
    if (data.files && data.files.length > 0) {
      return data.files[0];
    }
  }

  // 2. Create if not found
  return createDriveFolder(accessToken, folderName);
}

/**
 * Create a new folder in Google Drive
 */
export async function createDriveFolder(
  accessToken: string,
  folderName: string,
  parentId?: string
): Promise<DriveFile> {
  const metadata: Record<string, any> = {
    name: folderName,
    mimeType: FOLDER_MIME_TYPE
  };

  if (parentId) {
    metadata.parents = [parentId];
  }

  const response = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(metadata)
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Gagal membuat folder di Google Drive');
  }

  return response.json();
}

/**
 * Upload a file (Text, CSV, JSON, Blob, or PDF) to Google Drive using multipart upload
 */
export async function uploadFileToDrive(
  accessToken: string,
  options: {
    name: string;
    content: string | Blob | ArrayBuffer;
    mimeType: string;
    folderId?: string;
    description?: string;
  }
): Promise<DriveFile> {
  const { name, content, mimeType, folderId, description } = options;

  const metadata: Record<string, any> = {
    name,
    mimeType
  };

  if (folderId) {
    metadata.parents = [folderId];
  }

  if (description) {
    metadata.description = description;
  }

  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  // Create multipart body
  let bodyBlob: Blob;

  const metadataPart = 'Content-Type: application/json; charset=UTF-8\r\n\r\n' + JSON.stringify(metadata);

  if (typeof content === 'string') {
    const filePartHeader = `\r\nContent-Type: ${mimeType}\r\n\r\n`;
    const multipartBody = 
      delimiter + 
      metadataPart + 
      delimiter + 
      filePartHeader + 
      content + 
      closeDelimiter;
    bodyBlob = new Blob([multipartBody], { type: `multipart/related; boundary=${boundary}` });
  } else {
    const fileHeaderBlob = new Blob(
      [delimiter + metadataPart + delimiter + `Content-Type: ${mimeType}\r\n\r\n`],
      { type: 'text/plain' }
    );
    const contentBlob = content instanceof Blob ? content : new Blob([content], { type: mimeType });
    const closeBlob = new Blob([closeDelimiter], { type: 'text/plain' });

    bodyBlob = new Blob([fileHeaderBlob, contentBlob, closeBlob], {
      type: `multipart/related; boundary=${boundary}`
    });
  }

  const response = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,webViewLink,size,createdTime,modifiedTime',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': `multipart/related; boundary=${boundary}`
      },
      body: bodyBlob
    }
  );

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `HTTP ${response.status}: Gagal mengunggah file ke Google Drive`);
  }

  return response.json();
}

/**
 * Download the raw content of a file from Google Drive
 */
export async function downloadDriveFile(
  accessToken: string,
  fileId: string,
  mimeType?: string
): Promise<{ text?: string; blob?: Blob; arrayBuffer?: ArrayBuffer }> {
  // If it's a native Google Sheet or Google Doc, export it
  let url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;

  if (mimeType === 'application/vnd.google-apps.spreadsheet') {
    url = `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=text/csv`;
  } else if (mimeType === 'application/vnd.google-apps.document') {
    url = `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=text/plain`;
  }

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `HTTP ${response.status}: Gagal mengunduh file dari Google Drive`);
  }

  const blob = await response.blob();
  const text = await blob.text();
  const arrayBuffer = await blob.arrayBuffer();

  return { text, blob, arrayBuffer };
}

/**
 * Delete a file or folder from Google Drive (Mandatory user confirmation required in UI before calling this)
 */
export async function deleteDriveFile(accessToken: string, fileId: string): Promise<void> {
  const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });

  if (!response.ok && response.status !== 204) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `HTTP ${response.status}: Gagal menghapus file dari Google Drive`);
  }
}
