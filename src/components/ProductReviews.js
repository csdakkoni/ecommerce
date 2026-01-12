'use client';

import { useState, useEffect } from 'react';
import { useLocale } from 'next-intl';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import StarRating from './StarRating';
import {
    ThumbsUp, ThumbsDown, CheckCircle, User,
    Camera, Send, MessageSquare, ChevronDown
} from 'lucide-react';

/**
 * Product Reviews Component
 * Displays reviews and allows authenticated users to submit new reviews
 */
export default function ProductReviews({ productId, productName }) {
    const locale = useLocale();
    const { user } = useAuth();
    const toast = useToast();

    const [reviews, setReviews] = useState([]);
    const [stats, setStats] = useState({ avg: 0, count: 0, distribution: {} });
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [sortBy, setSortBy] = useState('newest');
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        rating: 0,
        title: '',
        review_text: '',
        reviewer_name: '',
    });
    const [submitting, setSubmitting] = useState(false);

    const labels = {
        reviews: locale === 'tr' ? 'Değerlendirmeler' : 'Reviews',
        writeReview: locale === 'tr' ? 'Değerlendirme Yaz' : 'Write a Review',
        noReviews: locale === 'tr' ? 'Henüz değerlendirme yok. İlk yazan siz olun!' : 'No reviews yet. Be the first!',
        verifiedPurchase: locale === 'tr' ? 'Doğrulanmış Satın Alma' : 'Verified Purchase',
        helpful: locale === 'tr' ? 'Faydalı' : 'Helpful',
        sortBy: locale === 'tr' ? 'Sırala' : 'Sort by',
        newest: locale === 'tr' ? 'En Yeni' : 'Newest',
        oldest: locale === 'tr' ? 'En Eski' : 'Oldest',
        highestRated: locale === 'tr' ? 'En Yüksek Puan' : 'Highest Rated',
        lowestRated: locale === 'tr' ? 'En Düşük Puan' : 'Lowest Rated',
        mostHelpful: locale === 'tr' ? 'En Faydalı' : 'Most Helpful',
        yourRating: locale === 'tr' ? 'Puanınız' : 'Your Rating',
        reviewTitle: locale === 'tr' ? 'Başlık' : 'Title',
        yourReview: locale === 'tr' ? 'Değerlendirmeniz' : 'Your Review',
        yourName: locale === 'tr' ? 'Adınız' : 'Your Name',
        submit: locale === 'tr' ? 'Gönder' : 'Submit',
        cancel: locale === 'tr' ? 'İptal' : 'Cancel',
        thankYou: locale === 'tr' ? 'Değerlendirmeniz için teşekkürler!' : 'Thanks for your review!',
        pending: locale === 'tr' ? 'Değerlendirmeniz onay bekliyor.' : 'Your review is pending approval.',
        loadMore: locale === 'tr' ? 'Daha Fazla Göster' : 'Load More',
        basedOn: locale === 'tr' ? 'değerlendirmeye dayanarak' : 'based on reviews',
    };

    // Fetch reviews
    useEffect(() => {
        fetchReviews();
    }, [productId, sortBy, page]);

    async function fetchReviews() {
        setLoading(true);

        let query = supabase
            .from('product_reviews')
            .select('*')
            .eq('product_id', productId)
            .eq('is_approved', true);

        // Sorting
        switch (sortBy) {
            case 'oldest':
                query = query.order('created_at', { ascending: true });
                break;
            case 'highestRated':
                query = query.order('rating', { ascending: false });
                break;
            case 'lowestRated':
                query = query.order('rating', { ascending: true });
                break;
            case 'mostHelpful':
                query = query.order('helpful_count', { ascending: false });
                break;
            default:
                query = query.order('created_at', { ascending: false });
        }

        query = query.range((page - 1) * 5, page * 5 - 1);

        const { data, error } = await query;

        if (error) {
            console.error('Error fetching reviews:', error);
        } else {
            if (page === 1) {
                setReviews(data || []);
            } else {
                setReviews(prev => [...prev, ...(data || [])]);
            }
            setHasMore((data?.length || 0) === 5);
        }

        // Calculate stats
        const { data: statsData } = await supabase
            .from('product_reviews')
            .select('rating')
            .eq('product_id', productId)
            .eq('is_approved', true);

        if (statsData && statsData.length > 0) {
            const avg = statsData.reduce((sum, r) => sum + r.rating, 0) / statsData.length;
            const distribution = {};
            for (let i = 1; i <= 5; i++) {
                distribution[i] = statsData.filter(r => r.rating === i).length;
            }
            setStats({ avg, count: statsData.length, distribution });
        }

        setLoading(false);
    }

    // Submit review
    async function handleSubmit(e) {
        e.preventDefault();

        if (formData.rating === 0) {
            toast.error(locale === 'tr' ? 'Lütfen puan verin' : 'Please rate the product');
            return;
        }

        setSubmitting(true);

        const reviewData = {
            product_id: productId,
            user_id: user?.id || null,
            rating: formData.rating,
            title: formData.title || null,
            review_text: formData.review_text || null,
            reviewer_name: formData.reviewer_name || user?.user_metadata?.first_name || 'Anonim',
            reviewer_email: user?.email || null,
            is_approved: false, // Requires admin approval
        };

        const { error } = await supabase
            .from('product_reviews')
            .insert([reviewData]);

        if (error) {
            console.error('Review submit error:', error);
            toast.error(locale === 'tr' ? 'Bir hata oluştu' : 'An error occurred');
        } else {
            toast.success(labels.thankYou);
            setShowForm(false);
            setFormData({ rating: 0, title: '', review_text: '', reviewer_name: '' });
        }
        setSubmitting(false);
    }

    // Vote on review
    async function voteReview(reviewId, isHelpful) {
        const { error } = await supabase
            .from('review_votes')
            .insert([{
                review_id: reviewId,
                user_id: user?.id || null,
                is_helpful: isHelpful
            }]);

        if (!error) {
            // Update local count
            setReviews(prev => prev.map(r => {
                if (r.id === reviewId) {
                    return isHelpful
                        ? { ...r, helpful_count: (r.helpful_count || 0) + 1 }
                        : { ...r, not_helpful_count: (r.not_helpful_count || 0) + 1 };
                }
                return r;
            }));
        }
    }

    // Rating distribution bar
    const RatingBar = ({ rating, count, total }) => {
        const percentage = total > 0 ? (count / total) * 100 : 0;
        return (
            <div className="flex items-center gap-2 text-sm">
                <span className="w-4">{rating}</span>
                <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                        className="h-full bg-amber-500 rounded-full"
                        style={{ width: `${percentage}%` }}
                    />
                </div>
                <span className="w-8 text-muted-foreground">{count}</span>
            </div>
        );
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                    <MessageSquare className="w-6 h-6" />
                    {labels.reviews}
                </h2>

                <button
                    onClick={() => setShowForm(true)}
                    className="btn btn-primary"
                >
                    {labels.writeReview}
                </button>
            </div>

            {/* Stats */}
            {stats.count > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6 bg-muted/50 rounded-xl">
                    <div className="text-center md:text-left">
                        <div className="text-5xl font-bold mb-2">{stats.avg.toFixed(1)}</div>
                        <StarRating rating={stats.avg} size="large" showValue={false} />
                        <p className="text-sm text-muted-foreground mt-2">
                            {stats.count} {labels.basedOn}
                        </p>
                    </div>
                    <div className="space-y-2">
                        {[5, 4, 3, 2, 1].map(r => (
                            <RatingBar
                                key={r}
                                rating={r}
                                count={stats.distribution[r] || 0}
                                total={stats.count}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Sort */}
            {reviews.length > 0 && (
                <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">{labels.sortBy}:</span>
                    <select
                        value={sortBy}
                        onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
                        className="border rounded-md p-2 text-sm bg-background"
                    >
                        <option value="newest">{labels.newest}</option>
                        <option value="oldest">{labels.oldest}</option>
                        <option value="highestRated">{labels.highestRated}</option>
                        <option value="lowestRated">{labels.lowestRated}</option>
                        <option value="mostHelpful">{labels.mostHelpful}</option>
                    </select>
                </div>
            )}

            {/* Review Form Modal */}
            {showForm && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-background rounded-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
                        <h3 className="text-xl font-bold mb-6">{labels.writeReview}</h3>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">{labels.yourRating} *</label>
                                <StarRating
                                    rating={formData.rating}
                                    size="large"
                                    interactive
                                    onChange={(r) => setFormData(prev => ({ ...prev, rating: r }))}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">{labels.reviewTitle}</label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                    className="w-full border rounded-md p-3 bg-background"
                                    placeholder={locale === 'tr' ? 'Kısa bir başlık' : 'Brief title'}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">{labels.yourReview}</label>
                                <textarea
                                    rows={4}
                                    value={formData.review_text}
                                    onChange={(e) => setFormData(prev => ({ ...prev, review_text: e.target.value }))}
                                    className="w-full border rounded-md p-3 bg-background"
                                    placeholder={locale === 'tr' ? 'Deneyiminizi paylaşın...' : 'Share your experience...'}
                                />
                            </div>

                            {!user && (
                                <div>
                                    <label className="block text-sm font-medium mb-1">{labels.yourName}</label>
                                    <input
                                        type="text"
                                        value={formData.reviewer_name}
                                        onChange={(e) => setFormData(prev => ({ ...prev, reviewer_name: e.target.value }))}
                                        className="w-full border rounded-md p-3 bg-background"
                                    />
                                </div>
                            )}

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowForm(false)}
                                    className="btn btn-outline flex-1"
                                >
                                    {labels.cancel}
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="btn btn-primary flex-1"
                                >
                                    {submitting ? '...' : labels.submit}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Reviews List */}
            {loading && reviews.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : reviews.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                    <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>{labels.noReviews}</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {reviews.map((review) => (
                        <div key={review.id} className="border-b pb-6">
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                                    <User className="w-5 h-5 text-muted-foreground" />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <StarRating rating={review.rating} size="small" />
                                        {review.is_verified_purchase && (
                                            <span className="flex items-center gap-1 text-xs text-green-600">
                                                <CheckCircle className="w-3 h-3" />
                                                {labels.verifiedPurchase}
                                            </span>
                                        )}
                                    </div>
                                    {review.title && (
                                        <h4 className="font-semibold">{review.title}</h4>
                                    )}
                                    <p className="text-sm text-muted-foreground mt-1">
                                        {review.reviewer_name || 'Anonim'} • {new Date(review.created_at).toLocaleDateString(locale)}
                                    </p>
                                    {review.review_text && (
                                        <p className="mt-3">{review.review_text}</p>
                                    )}

                                    {/* Helpful votes */}
                                    <div className="flex items-center gap-4 mt-4 text-sm">
                                        <span className="text-muted-foreground">{labels.helpful}?</span>
                                        <button
                                            onClick={() => voteReview(review.id, true)}
                                            className="flex items-center gap-1 hover:text-green-600"
                                        >
                                            <ThumbsUp className="w-4 h-4" />
                                            {review.helpful_count || 0}
                                        </button>
                                        <button
                                            onClick={() => voteReview(review.id, false)}
                                            className="flex items-center gap-1 hover:text-red-600"
                                        >
                                            <ThumbsDown className="w-4 h-4" />
                                            {review.not_helpful_count || 0}
                                        </button>
                                    </div>

                                    {/* Admin response */}
                                    {review.admin_response && (
                                        <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                                            <p className="text-sm font-medium">Grohn Fabrics yanıtı:</p>
                                            <p className="text-sm mt-1">{review.admin_response}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}

                    {hasMore && (
                        <button
                            onClick={() => setPage(p => p + 1)}
                            className="w-full btn btn-outline"
                        >
                            <ChevronDown className="w-4 h-4 mr-2" />
                            {labels.loadMore}
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
