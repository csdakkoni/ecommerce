import { NextRequest, NextResponse } from 'next/server';
import { ImageService } from '@/lib/media/image-service';

export const runtime = 'nodejs';

// Max file size: 15MB
const MAX_FILE_SIZE = 15 * 1024 * 1024;
const ALLOWED_TYPES = [
    'image/jpeg', 'image/png', 'image/webp', 'image/avif',
    'video/mp4', 'video/webm', 'video/quicktime'
];

/**
 * POST /api/image/upload
 * Handles image uploads, processes originals, and returns the access URL
 */
export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        // 1. Validation
        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json({ error: 'File size exceeds 15MB limit' }, { status: 400 });
        }

        if (!ALLOWED_TYPES.includes(file.type)) {
            return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 });
        }

        // 2. Read to Buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // 3. Process and Upload
        let filePath: string;
        const isVideo = file.type.startsWith('video/');

        if (isVideo) {
            // Videos are uploaded directly without Sharp processing
            const cleanName = file.name.toLowerCase().replace(/[^a-z0-9.-]/g, '-');
            const timestamp = Date.now();
            filePath = `originals/${timestamp}-${cleanName}`;

            const { error: storageError } = await (ImageService as any).getSupabase().storage
                .from('products')
                .upload(filePath, buffer, {
                    contentType: file.type,
                    cacheControl: '31536000'
                });

            if (storageError) throw storageError;
            // filePath for videos should be the full path in the bucket if we want to serve them directly or via proxy
            // But if we want consistency with /api/image/[path], we should return the path relative to originals
            filePath = `${timestamp}-${cleanName}`;
        } else {
            // Images use ImageService for normalization/stripping
            filePath = await ImageService.uploadOriginal(buffer, file.name, file.type);
        }

        // 4. Return the new URL pointing to our transformation API
        const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || '';
        const optimizedUrl = `${baseUrl}/api/image/${filePath}${isVideo ? '?type=video' : ''}`;

        return NextResponse.json({
            success: true,
            url: optimizedUrl,
            path: filePath
        });

    } catch (error: any) {
        console.error('Upload error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
