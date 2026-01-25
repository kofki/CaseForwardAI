/**
 * CaseForward Cloudflare Worker
 * Handles file upload, download, and deletion from R2 storage
 */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    // Auth check
    const auth = request.headers.get('X-Internal-Auth');
    if (auth !== env.INTERNAL_API_KEY) {
      return new Response('Unauthorized', { status: 401 });
    }

    // ============================================
    // POST / - Upload file
    // ============================================
    if (request.method === 'POST' && url.pathname === '/') {
      try {
        const contentType = request.headers.get('Content-Type') || '';
        
        // Handle JSON body with action
        if (contentType.includes('application/json')) {
          const body = await request.json();
          
          // GET action - retrieve file
          if (body.action === 'get' && body.objectKey) {
            const object = await env.BUCKET.get(body.objectKey);
            
            if (!object) {
              return new Response('File not found', { status: 404 });
            }
            
            const headers = new Headers();
            headers.set('Content-Type', object.httpMetadata?.contentType || 'application/octet-stream');
            headers.set('Content-Length', object.size.toString());
            
            return new Response(object.body, { headers });
          }
          
          return new Response('Invalid action', { status: 400 });
        }
        
        // Handle FormData upload
        const formData = await request.formData();
        const file = formData.get('file');
        const folder = formData.get('folder') || 'documents';
        
        if (!file) {
          return Response.json({ success: false, error: 'No file provided' }, { status: 400 });
        }
        
        const objectKey = `${folder}/${crypto.randomUUID()}-${file.name}`;
        
        await env.BUCKET.put(objectKey, file.stream(), {
          httpMetadata: { contentType: file.type },
        });

        return Response.json({
          success: true,
          objectKey,
          size: file.size,
          contentType: file.type,
        });
      } catch (error) {
        return Response.json({ success: false, error: error.message }, { status: 500 });
      }
    }

    // ============================================
    // GET /file/:key - Retrieve file by key
    // ============================================
    if (request.method === 'GET' && url.pathname.startsWith('/file/')) {
      const objectKey = decodeURIComponent(url.pathname.replace('/file/', ''));
      
      const object = await env.BUCKET.get(objectKey);
      
      if (!object) {
        return new Response('File not found', { status: 404 });
      }
      
      const headers = new Headers();
      headers.set('Content-Type', object.httpMetadata?.contentType || 'application/octet-stream');
      headers.set('Content-Length', object.size.toString());
      headers.set('Cache-Control', 'private, max-age=3600');
      
      return new Response(object.body, { headers });
    }

    // ============================================
    // GET /download/:key - Download file with attachment header
    // ============================================
    if (request.method === 'GET' && url.pathname.startsWith('/download/')) {
      const objectKey = decodeURIComponent(url.pathname.replace('/download/', ''));
      
      const object = await env.BUCKET.get(objectKey);
      
      if (!object) {
        return new Response('File not found', { status: 404 });
      }
      
      // Extract filename from objectKey
      const fileName = objectKey.split('/').pop() || 'document';
      
      const headers = new Headers();
      headers.set('Content-Type', object.httpMetadata?.contentType || 'application/octet-stream');
      headers.set('Content-Length', object.size.toString());
      headers.set('Content-Disposition', `attachment; filename="${fileName}"`);
      
      return new Response(object.body, { headers });
    }

    // ============================================
    // POST /signed-url - Generate signed URL (placeholder)
    // ============================================
    if (request.method === 'POST' && url.pathname === '/signed-url') {
      const { objectKey, expiresIn } = await request.json();
      // R2 doesn't have native signed URLs, return direct path
      return Response.json({ 
        url: `/file/${encodeURIComponent(objectKey)}`,
        expiresIn: expiresIn || 3600,
      });
    }

    // ============================================
    // DELETE /delete - Delete file
    // ============================================
    if (request.method === 'DELETE' && url.pathname === '/delete') {
      const { objectKey } = await request.json();
      await env.BUCKET.delete(objectKey);
      return Response.json({ success: true });
    }

    // ============================================
    // GET /list - List files (optional, useful for debugging)
    // ============================================
    if (request.method === 'GET' && url.pathname === '/list') {
      const prefix = url.searchParams.get('prefix') || '';
      const listed = await env.BUCKET.list({ prefix, limit: 100 });
      
      return Response.json({
        objects: listed.objects.map(obj => ({
          key: obj.key,
          size: obj.size,
          uploaded: obj.uploaded,
        })),
        truncated: listed.truncated,
      });
    }

    return new Response('Not Found', { status: 404 });
  },
};
