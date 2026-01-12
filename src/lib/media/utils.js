/**
 * Media Utility
 * Helper functions to handle image transformations for the frontend
 */

/**
 * Appends transformation parameters to a media URL if it is hosted on our local pipeline
 * 
 * @param {string} url - The original media URL
 * @param {Object} options - Transformation options (w, h, q, fm, ar, fit, crop)
 * @returns {string} - The transformed URL
 */
export function getOptimizedImageUrl(url, options = {}) {
    if (!url || !url.startsWith('/api/image/')) {
        return url;
    }

    const [baseUrl, existingParams] = url.split('?');
    const params = new URLSearchParams(existingParams || '');

    if (options.w) params.set('w', options.w.toString());
    if (options.h) params.set('h', options.h.toString());
    if (options.q) params.set('q', options.q.toString());
    if (options.fm) params.set('fm', options.fm);
    if (options.ar) params.set('ar', options.ar);
    if (options.fit) params.set('fit', options.fit);
    if (options.crop) params.set('crop', options.crop);

    const queryString = params.toString();
    return queryString ? `${baseUrl}?${queryString}` : baseUrl;
}
