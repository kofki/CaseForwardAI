import { IExtractedContent, IExtractedImage } from '@/lib/db/models/Document';

// need to npm install pdf-parse

export async function extractPdfContent(
  pdfBuffer: Buffer | ArrayBuffer
): Promise<IExtractedContent> {
  const startTime = Date.now();
  
  try {
    const pdfParseModule = await import('pdf-parse');
    const pdfParse = (pdfParseModule as any).default ?? (pdfParseModule as any);
    
    const buffer = pdfBuffer instanceof ArrayBuffer 
      ? Buffer.from(pdfBuffer) 
      : pdfBuffer;
    
    const data = await pdfParse(buffer);
    
    const extractedContent: IExtractedContent = {
      text: data.text || '',
      textLength: data.text?.length || 0,
      images: [], 
      pageCount: data.numpages || 0,
      hasImages: false,
      extractedAt: new Date(),
      extractionMethod: 'pdf-parse',
    };

    return extractedContent;
  } catch (error) {
    console.error('PDF extraction error:', error);
    return {
      text: '',
      textLength: 0,
      images: [],
      pageCount: 0,
      hasImages: false,
      extractedAt: new Date(),
      extractionMethod: 'none',
      extractionError: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function extractPdfImages(
  pdfBuffer: Buffer | ArrayBuffer,
  uploadImageFn: (imageBuffer: Buffer, fileName: string) => Promise<string>
): Promise<IExtractedImage[]> {
  // TODO: Implement image extraction using pdf.js or similar
  // For now, return empty array
  console.log('PDF image extraction not yet implemented');
  return [];
}

export function isPdf(buffer: Buffer | ArrayBuffer): boolean {
  const bytes = buffer instanceof ArrayBuffer 
    ? new Uint8Array(buffer) 
    : buffer;
  
  return (
    bytes[0] === 0x25 && 
    bytes[1] === 0x50 && 
    bytes[2] === 0x44 && 
    bytes[3] === 0x46    
  );
}

export async function getPdfMetadata(
  pdfBuffer: Buffer | ArrayBuffer
): Promise<{
  pageCount: number;
  title?: string;
  author?: string;
  creationDate?: Date;
}> {
  try {
    const pdfParseModule = await import('pdf-parse');
    const pdfParse = (pdfParseModule as any).default ?? (pdfParseModule as any);
    
    const buffer = pdfBuffer instanceof ArrayBuffer 
      ? Buffer.from(pdfBuffer) 
      : pdfBuffer;
    
    const data = await pdfParse(buffer, {
      max: 1, 
    });
    
    return {
      pageCount: data.numpages || 0,
      title: data.info?.Title,
      author: data.info?.Author,
      creationDate: data.info?.CreationDate 
        ? new Date(data.info.CreationDate) 
        : undefined,
    };
  } catch (error) {
    console.error('PDF metadata extraction error:', error);
    return { pageCount: 0 };
  }
}
