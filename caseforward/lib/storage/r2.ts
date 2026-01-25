export interface R2UploadResult {
  success: boolean;
  objectKey?: string;
  size?: number;
  contentType?: string;
  error?: string;
}

export interface R2DownloadResult {
  success: boolean;
  data?: ArrayBuffer;
  contentType?: string;
  error?: string;
}

export async function uploadToR2(
  file: File | Blob,
  fileName: string,
  options: {
    folder?: string;
    contentType?: string;
  } = {}
): Promise<R2UploadResult> {
  const workerUrl = process.env.CF_WORKER_UPLOAD_URL;
  const apiKey = process.env.INTERNAL_API_KEY;

  if (!workerUrl || !apiKey) {
    return {
      success: false,
      error: 'R2 configuration missing: CF_WORKER_UPLOAD_URL or INTERNAL_API_KEY',
    };
  }

  try {
    const formData = new FormData();
    formData.append('file', file, fileName);
    
    if (options.folder) {
      formData.append('folder', options.folder);
    }

    const response = await fetch(workerUrl, {
      method: 'POST',
      headers: {
        'X-Internal-Auth': apiKey,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('R2 upload error:', errorText);
      return {
        success: false,
        error: `Upload failed: ${response.status} ${response.statusText}`,
      };
    }

    const result = await response.json();
    
    return {
      success: true,
      objectKey: result.objectKey,
      size: result.size,
      contentType: result.contentType,
    };
  } catch (error) {
    console.error('R2 upload exception:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function getSignedUrl(
  objectKey: string,
  expiresInSeconds: number = 3600
): Promise<string | null> {
  const workerUrl = process.env.CF_WORKER_URL;
  const apiKey = process.env.INTERNAL_API_KEY;

  if (!workerUrl || !apiKey) {
    console.error('R2 configuration missing');
    return null;
  }

  try {
    const response = await fetch(`${workerUrl}/signed-url`, {
      method: 'POST',
      headers: {
        'X-Internal-Auth': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        objectKey,
        expiresIn: expiresInSeconds,
      }),
    });

    if (!response.ok) {
      console.error('Failed to get signed URL:', response.statusText);
      return null;
    }

    const result = await response.json();
    return result.signedUrl;
  } catch (error) {
    console.error('Error getting signed URL:', error);
    return null;
  }
}

export async function deleteFromR2(objectKey: string): Promise<boolean> {
  const workerUrl = process.env.CF_WORKER_URL;
  const apiKey = process.env.INTERNAL_API_KEY;

  if (!workerUrl || !apiKey) {
    console.error('R2 configuration missing');
    return false;
  }

  try {
    const response = await fetch(`${workerUrl}/delete`, {
      method: 'DELETE',
      headers: {
        'X-Internal-Auth': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ objectKey }),
    });

    return response.ok;
  } catch (error) {
    console.error('Error deleting from R2:', error);
    return false;
  }
}

export async function computeFileHash(file: File | Blob | ArrayBuffer): Promise<string> {
  const buffer = file instanceof ArrayBuffer 
    ? file 
    : await (file as Blob).arrayBuffer();
  
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
