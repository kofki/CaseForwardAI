import { IExtractedContent } from '@/lib/db/models/Document';
import { extractPdfContent, isPdf } from './pdf';

export type SupportedMimeType = 
  | 'application/pdf'
  | 'image/png'
  | 'image/jpeg'
  | 'image/jpg'
  | 'image/gif'
  | 'image/webp'
  | 'text/plain'
  | 'text/html'
  | 'text/csv';

export async function extractContent(
  buffer: Buffer | ArrayBuffer,
  mimeType: string,
  options: {
    fileName?: string;
    uploadImageFn?: (imageBuffer: Buffer, fileName: string) => Promise<string>;
  } = {}
): Promise<IExtractedContent> {
  const normalizedMimeType = mimeType.toLowerCase().split(';')[0].trim();

  switch (normalizedMimeType) {
    case 'application/pdf':
      return extractPdfContent(buffer);

    case 'image/png':
    case 'image/jpeg':
    case 'image/jpg':
    case 'image/gif':
    case 'image/webp':
      return extractImageContent(buffer, normalizedMimeType);

    case 'text/plain':
    case 'text/html':
    case 'text/csv':
      return extractTextContent(buffer);

    default:
      if (isPdf(buffer)) {
        return extractPdfContent(buffer);
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

export function isSupportedMimeType(mimeType: string): boolean {
  const supported = [
    'application/pdf',
    'image/png',
    'image/jpeg',
    'image/jpg',
    'image/gif',
    'image/webp',
    'text/plain',
    'text/html',
    'text/csv',
  ];
  
  const normalized = mimeType.toLowerCase().split(';')[0].trim();
  return supported.includes(normalized);
}

export function getExtractionMethod(mimeType: string): string {
  const normalized = mimeType.toLowerCase().split(';')[0].trim();
  
  if (normalized === 'application/pdf') return 'pdf-parse';
  if (normalized.startsWith('image/')) return 'native'; // or 'ocr' when implemented
  if (normalized.startsWith('text/')) return 'native';
  
  return 'none';
}
