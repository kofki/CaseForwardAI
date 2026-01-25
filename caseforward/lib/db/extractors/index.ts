import { IExtractedContent } from '@/lib/db/models/Document';
import { extractPdfContent, isPdf } from './pdf';

export type SupportedMimeType = 
  | 'application/pdf'
  | 'image/png'
  | 'image/jpeg'
  | 'image/jpg'
  | 'image/gif'
  | 'image/webp'
  | 'image/heic'
  | 'image/heif'
  | 'text/plain'
  | 'text/html'
  | 'text/csv'
  | 'text/markdown'
  | 'text/rtf'
  | 'application/rtf'
  | 'application/msword'
  | 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

// File extension to MIME type mapping for better detection
export const EXTENSION_MIME_MAP: Record<string, string> = {
  '.pdf': 'application/pdf',
  '.txt': 'text/plain',
  '.text': 'text/plain',
  '.md': 'text/markdown',
  '.markdown': 'text/markdown',
  '.csv': 'text/csv',
  '.html': 'text/html',
  '.htm': 'text/html',
  '.rtf': 'application/rtf',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.heic': 'image/heic',
  '.heif': 'image/heif',
};

export function getMimeTypeFromExtension(fileName: string): string | undefined {
  const ext = fileName.toLowerCase().match(/\.[^.]+$/)?.[0];
  return ext ? EXTENSION_MIME_MAP[ext] : undefined;
}

export async function extractContent(
  buffer: Buffer | ArrayBuffer,
  mimeType: string,
  options: {
    fileName?: string;
    uploadImageFn?: (imageBuffer: Buffer, fileName: string) => Promise<string>;
  } = {}
): Promise<IExtractedContent> {
  // Try to get mime type from filename if provided and current mime is generic
  let normalizedMimeType = mimeType.toLowerCase().split(';')[0].trim();
  
  if (options.fileName && (normalizedMimeType === 'application/octet-stream' || !normalizedMimeType)) {
    const detectedMime = getMimeTypeFromExtension(options.fileName);
    if (detectedMime) {
      normalizedMimeType = detectedMime;
    }
  }

  switch (normalizedMimeType) {
    case 'application/pdf':
      return extractPdfContent(buffer);

    case 'image/png':
    case 'image/jpeg':
    case 'image/jpg':
    case 'image/gif':
    case 'image/webp':
    case 'image/heic':
    case 'image/heif':
      return extractImageContent(buffer, normalizedMimeType);

    case 'text/plain':
    case 'text/html':
    case 'text/csv':
    case 'text/markdown':
      return extractTextContent(buffer);
    
    case 'text/rtf':
    case 'application/rtf':
      return extractRtfContent(buffer);
    
    case 'application/msword':
    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      return extractWordContent(buffer, normalizedMimeType);

    default:
      // Fallback: try to detect PDF by magic bytes
      if (isPdf(buffer)) {
        return extractPdfContent(buffer);
      }
      
      // Fallback: try text extraction for unknown types
      try {
        const textResult = await extractTextContent(buffer);
        if (textResult.textLength > 0) {
          return textResult;
        }
      } catch {
        // Fall through to error
      }

      return {
        text: '',
        textLength: 0,
        images: [],
        pageCount: 0,
        hasImages: false,
        extractedAt: new Date(),
        extractionMethod: 'none',
        extractionError: `Unsupported mime type: ${mimeType}`,
      };
  }
}

async function extractImageContent(
  buffer: Buffer | ArrayBuffer,
  mimeType: string
): Promise<IExtractedContent> {
  // TODO: Add OCR support using Tesseract.js or cloud OCR service
  return {
    text: '',
    textLength: 0,
    images: [],
    pageCount: 1,
    hasImages: true,
    extractedAt: new Date(),
    extractionMethod: 'native',
    extractionError: undefined,
  };
}

async function extractTextContent(
  buffer: Buffer | ArrayBuffer
): Promise<IExtractedContent> {
  try {
    const text = buffer instanceof ArrayBuffer
      ? new TextDecoder().decode(buffer)
      : buffer.toString('utf-8');

    return {
      text,
      textLength: text.length,
      images: [],
      pageCount: 1,
      hasImages: false,
      extractedAt: new Date(),
      extractionMethod: 'native',
    };
  } catch (error) {
    return {
      text: '',
      textLength: 0,
      images: [],
      pageCount: 0,
      hasImages: false,
      extractedAt: new Date(),
      extractionMethod: 'none',
      extractionError: error instanceof Error ? error.message : 'Failed to decode text',
    };
  }
}

async function extractRtfContent(
  buffer: Buffer | ArrayBuffer
): Promise<IExtractedContent> {
  try {
    // Simple RTF text extraction - strips RTF control codes
    const rawText = buffer instanceof ArrayBuffer
      ? new TextDecoder().decode(buffer)
      : buffer.toString('utf-8');
    
    // Basic RTF stripping - removes control words and groups
    const text = rawText
      .replace(/\{\\[^{}]*\}/g, '') // Remove control groups
      .replace(/\\[a-z]+\d* ?/gi, '') // Remove control words
      .replace(/[{}]/g, '') // Remove remaining braces
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();

    return {
      text,
      textLength: text.length,
      images: [],
      pageCount: 1,
      hasImages: false,
      extractedAt: new Date(),
      extractionMethod: 'native',
    };
  } catch (error) {
    return {
      text: '',
      textLength: 0,
      images: [],
      pageCount: 0,
      hasImages: false,
      extractedAt: new Date(),
      extractionMethod: 'none',
      extractionError: error instanceof Error ? error.message : 'Failed to parse RTF',
    };
  }
}

async function extractWordContent(
  buffer: Buffer | ArrayBuffer,
  mimeType: string
): Promise<IExtractedContent> {
  // For Word documents, we'd ideally use a library like mammoth.js
  // For now, return a placeholder that indicates Word support is limited
  // TODO: Add mammoth.js for proper Word extraction
  
  return {
    text: '[Word document - content extraction requires additional processing]',
    textLength: 0,
    images: [],
    pageCount: 1,
    hasImages: false,
    extractedAt: new Date(),
    extractionMethod: 'none',
    extractionError: 'Word document extraction not yet implemented. Please upload as PDF.',
  };
}

export function isSupportedMimeType(mimeType: string): boolean {
  const supported = [
    'application/pdf',
    'image/png',
    'image/jpeg',
    'image/jpg',
    'image/gif',
    'image/webp',
    'image/heic',
    'image/heif',
    'text/plain',
    'text/html',
    'text/csv',
    'text/markdown',
    'text/rtf',
    'application/rtf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];
  
  const normalized = mimeType.toLowerCase().split(';')[0].trim();
  return supported.includes(normalized);
}

/**
 * Check if a file is supported based on filename extension
 */
export function isSupportedFile(fileName: string): boolean {
  const ext = fileName.toLowerCase().match(/\.[^.]+$/)?.[0];
  return ext ? ext in EXTENSION_MIME_MAP : false;
}

export function getExtractionMethod(mimeType: string): string {
  const normalized = mimeType.toLowerCase().split(';')[0].trim();
  
  if (normalized === 'application/pdf') return 'pdf-parse';
  if (normalized.startsWith('image/')) return 'native'; // or 'ocr' when implemented
  if (normalized.startsWith('text/')) return 'native';
  if (normalized.includes('rtf')) return 'native';
  if (normalized.includes('word')) return 'word-parse';
  
  return 'none';
}

/**
 * Get a human-readable file type description
 */
export function getFileTypeDescription(mimeType: string, fileName?: string): string {
  const normalized = mimeType.toLowerCase().split(';')[0].trim();
  
  const descriptions: Record<string, string> = {
    'application/pdf': 'PDF Document',
    'image/png': 'PNG Image',
    'image/jpeg': 'JPEG Image',
    'image/jpg': 'JPEG Image',
    'image/gif': 'GIF Image',
    'image/webp': 'WebP Image',
    'image/heic': 'HEIC Image',
    'image/heif': 'HEIF Image',
    'text/plain': 'Text File',
    'text/html': 'HTML Document',
    'text/csv': 'CSV Spreadsheet',
    'text/markdown': 'Markdown Document',
    'text/rtf': 'Rich Text Document',
    'application/rtf': 'Rich Text Document',
    'application/msword': 'Word Document (Legacy)',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Word Document',
  };
  
  return descriptions[normalized] || 'Document';
}
