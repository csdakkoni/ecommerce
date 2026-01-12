import sharp from 'sharp';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// Initialize Supabase Admin client if needed, or use public one if RLS allows
// For internal service, we might need a service role key if bucket is private
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const BUCKET_NAME = 'products';

export interface ImageTransformOptions {
    w?: number;
    h?: number;
    fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
    crop?: 'entropy' | 'attention' | 'center';
    q?: number;
    fm?: 'avif' | 'webp' | 'jpeg' | 'png';
    bg?: string;
}

export class ImageService {
    static getSupabase() {
        return supabase;
    }

    /**
     * Generates a deterministic cache key for a given file and transformation options
     */
    private static getCacheKey(filePath: string, options: ImageTransformOptions): string {
        const hash = crypto.createHash('sha256')
            .update(filePath)
            .update(JSON.stringify(options))
            .digest('hex')
            .substring(0, 16);

        const ext = options.fm || 'webp';
        const basename = filePath.split('/').pop()?.split('.')[0] || 'img';

        return `cache/${hash}/${basename}.${ext}`;
    }

    /**
     * Processes an image: Check cache -> Transform -> Cache -> Return
     */
    static async getOptimizedImage(filePath: string, options: ImageTransformOptions): Promise<{ data: Buffer; contentType: string }> {
        const cachePath = this.getCacheKey(filePath, options);
        const format = options.fm || 'webp';

        // 1. Try to fetch from cache
        const { data: cachedFile, error: cacheError } = await supabase.storage
            .from(BUCKET_NAME)
            .download(cachePath);

        if (!cacheError && cachedFile) {
            return {
                data: Buffer.from(await cachedFile.arrayBuffer()),
                contentType: `image/${format}`
            };
        }

        // 2. Fetch original
        // The original is stored in 'originals/' prefix
        const originalPath = `originals/${filePath}`;
        const { data: originalFile, error: originalError } = await supabase.storage
            .from(BUCKET_NAME)
            .download(originalPath);

        if (originalError || !originalFile) {
            throw new Error(`Original image not found: ${originalPath}`);
        }

        const buffer = Buffer.from(await originalFile.arrayBuffer());

        // 3. Transform using Sharp
        let pipeline = sharp(buffer);

        // Resize
        if (options.w || options.h) {
            pipeline = pipeline.resize(options.w, options.h, {
                fit: options.fit || 'cover',
                position: options.crop === 'center' ? 'centre' : (options.crop || 'centre'),
                background: options.bg || { r: 0, g: 0, b: 0, alpha: 0 }
            });
        }

        // Auto-rotate based on EXIF and then strip all metadata (default behavior)
        pipeline = pipeline.rotate();

        // Format and Quality
        const quality = options.q || 80;
        if (format === 'avif') {
            pipeline = pipeline.avif({ quality });
        } else if (format === 'webp') {
            pipeline = pipeline.webp({ quality });
        } else if (format === 'jpeg') {
            pipeline = pipeline.jpeg({ quality, progressive: true });
        } else if (format === 'png') {
            // PNG uses compressionLevel (0-9) instead of quality (0-100)
            const compressionLevel = Math.floor((100 - quality) / 10);
            pipeline = pipeline.png({ compressionLevel });
        }

        const optimizedBuffer = await pipeline.toBuffer();

        // 4. Save to cache in background (don't await for faster response if you want, but better await to ensure stability)
        await supabase.storage
            .from(BUCKET_NAME)
            .upload(cachePath, optimizedBuffer, {
                contentType: `image/${format}`,
                cacheControl: '31536000',
                upsert: true
            });

        return {
            data: optimizedBuffer,
            contentType: `image/${format}`
        };
    }

    /**
     * Uploads a new original image
     */
    static async uploadOriginal(file: Buffer, fileName: string, contentType: string): Promise<string> {
        // Normalize filename
        const cleanName = fileName.toLowerCase().replace(/[^a-z0-9.-]/g, '-');
        const timestamp = Date.now();
        const finalPath = `originals/${timestamp}-${cleanName}`;

        // Basic validation and stripping with Sharp before saving as original
        // Note: The prompt says "Normalize orientation" and "Strip EXIF" for originals too
        // Normalize orientation and strip metadata
        const processedOriginal = await sharp(file)
            .rotate()
            .toBuffer();

        const { error } = await supabase.storage
            .from(BUCKET_NAME)
            .upload(finalPath, processedOriginal, {
                contentType,
                cacheControl: '31536000',
                upsert: true
            });

        if (error) throw error;

        // Return the path within the bucket
        return `${timestamp}-${cleanName}`;
    }
}
