import { NextRequest, NextResponse } from 'next/server';
import { ImageService, ImageTransformOptions } from '@/lib/media/image-service';

export const runtime = 'nodejs';

/**
 * GET /api/image/[...path]
 * Serves optimized images with dynamic transformations
 */
export async function GET(
    request: NextRequest,
    context: { params: Promise<{ path: string[] }> }
) {
    const { path: pathSegments } = await context.params;
    const searchParams = request.nextUrl.searchParams;

    // Reconstruct the file path from segments
    const filePath = pathSegments.join('/');
    const isVideo = searchParams.get('type') === 'video';

    if (isVideo) {
        try {
            const { data: videoFile, error } = await ImageService.getSupabase().storage
                .from('products')
                .download(`originals/${filePath}`);

            if (error || !videoFile) throw new Error('Video not found');

            return new NextResponse(videoFile, {
                headers: {
                    'Content-Type': videoFile.type || 'video/mp4',
                    'Cache-Control': 'public, max-age=31536000, immutable',
                },
            });
        } catch (e) {
            return new NextResponse('Video not found', { status: 404 });
        }
    }

    // Parse transformation options
    const options: ImageTransformOptions = {
        w: searchParams.get('w') ? parseInt(searchParams.get('w')!) : undefined,
        h: searchParams.get('h') ? parseInt(searchParams.get('h')!) : undefined,
        fit: (searchParams.get('fit') as any) || undefined,
        crop: (searchParams.get('crop') as any) || undefined,
        q: searchParams.get('q') ? parseInt(searchParams.get('q')!) : undefined,
        fm: (searchParams.get('fm') as any) || undefined,
        bg: searchParams.get('bg') || undefined,
    };

    try {
        const { data, contentType } = await ImageService.getOptimizedImage(filePath, options);

        return new NextResponse(new Uint8Array(data), {
            headers: {
                'Content-Type': contentType,
                'Cache-Control': 'public, max-age=31536000, immutable',
                'X-Image-Generated': 'self-hosted',
            },
        });
    } catch (error: any) {
        console.error('Image optimization error:', error);

        // Return 404 if not found or other errors
        if (error.message?.includes('not found')) {
            return new NextResponse('Image not found', { status: 404 });
        }

        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
