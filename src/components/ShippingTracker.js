'use client';

import { useState, useEffect } from 'react';
import { useLocale } from 'next-intl';
import { CARRIERS, SHIPPING_STATUS, getTrackingUrl, getEstimatedDelivery } from '@/lib/shipping';
import { Package, Truck, MapPin, CheckCircle, Clock, ExternalLink } from 'lucide-react';

/**
 * Shipping Tracker Component
 * Shows order shipping status and tracking information
 */
export default function ShippingTracker({
    trackingNumber,
    carrier,
    status = 'pending',
    shippedAt,
    estimatedDelivery,
    steps = []
}) {
    const locale = useLocale();

    const carrierInfo = CARRIERS[carrier?.toLowerCase()] || null;
    const statusInfo = SHIPPING_STATUS[status] || SHIPPING_STATUS.pending;

    const labels = {
        trackingNumber: locale === 'tr' ? 'Takip Numarası' : 'Tracking Number',
        carrier: locale === 'tr' ? 'Kargo Firması' : 'Carrier',
        status: locale === 'tr' ? 'Durum' : 'Status',
        estimatedDelivery: locale === 'tr' ? 'Tahmini Teslimat' : 'Estimated Delivery',
        trackOnCarrier: locale === 'tr' ? 'Kargo Sitesinde Takip Et' : 'Track on Carrier Site',
        shippedOn: locale === 'tr' ? 'Kargoya Verildi' : 'Shipped on',
    };

    // Default timeline steps if not provided
    const defaultSteps = [
        { status: 'processing', label: locale === 'tr' ? 'Sipariş Hazırlanıyor' : 'Processing', completed: ['processing', 'shipped', 'in_transit', 'out_for_delivery', 'delivered'].includes(status) },
        { status: 'shipped', label: locale === 'tr' ? 'Kargoya Verildi' : 'Shipped', completed: ['shipped', 'in_transit', 'out_for_delivery', 'delivered'].includes(status) },
        { status: 'in_transit', label: locale === 'tr' ? 'Yolda' : 'In Transit', completed: ['in_transit', 'out_for_delivery', 'delivered'].includes(status) },
        { status: 'delivered', label: locale === 'tr' ? 'Teslim Edildi' : 'Delivered', completed: status === 'delivered' },
    ];

    const timelineSteps = steps.length > 0 ? steps : defaultSteps;
    const trackingUrl = carrierInfo && trackingNumber ? getTrackingUrl(carrier, trackingNumber) : null;

    // Status color mapping
    const statusColors = {
        gray: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
        blue: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
        yellow: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
        orange: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
        purple: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
        green: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
        red: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
    };

    return (
        <div className="border rounded-xl p-6 bg-card">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <Truck className="w-5 h-5 text-primary" />
                </div>
                <div>
                    <h3 className="font-semibold">{labels.trackingNumber}</h3>
                    <p className="font-mono text-lg">{trackingNumber || '-'}</p>
                </div>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {/* Status */}
                <div>
                    <p className="text-xs text-muted-foreground mb-1">{labels.status}</p>
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${statusColors[statusInfo.color]}`}>
                        {statusInfo.label[locale] || statusInfo.label.tr}
                    </span>
                </div>

                {/* Carrier */}
                {carrierInfo && (
                    <div>
                        <p className="text-xs text-muted-foreground mb-1">{labels.carrier}</p>
                        <p className="font-medium">{carrierInfo.name}</p>
                    </div>
                )}

                {/* Shipped Date */}
                {shippedAt && (
                    <div>
                        <p className="text-xs text-muted-foreground mb-1">{labels.shippedOn}</p>
                        <p className="font-medium">{new Date(shippedAt).toLocaleDateString(locale)}</p>
                    </div>
                )}

                {/* Estimated Delivery */}
                {estimatedDelivery && (
                    <div>
                        <p className="text-xs text-muted-foreground mb-1">{labels.estimatedDelivery}</p>
                        <p className="font-medium">{estimatedDelivery}</p>
                    </div>
                )}
            </div>

            {/* Timeline */}
            <div className="relative mb-6">
                <div className="flex justify-between">
                    {timelineSteps.map((step, index) => (
                        <div key={index} className="flex flex-col items-center flex-1">
                            <div className={`
                                w-8 h-8 rounded-full flex items-center justify-center z-10
                                ${step.completed
                                    ? 'bg-green-500 text-white'
                                    : 'bg-muted text-muted-foreground'}
                            `}>
                                {step.completed ? (
                                    <CheckCircle className="w-4 h-4" />
                                ) : (
                                    <Clock className="w-4 h-4" />
                                )}
                            </div>
                            <p className={`text-xs mt-2 text-center ${step.completed ? '' : 'text-muted-foreground'}`}>
                                {step.label}
                            </p>
                        </div>
                    ))}
                </div>
                {/* Progress line */}
                <div className="absolute top-4 left-0 right-0 h-0.5 bg-muted -z-0">
                    <div
                        className="h-full bg-green-500 transition-all duration-500"
                        style={{
                            width: `${(timelineSteps.filter(s => s.completed).length - 1) / (timelineSteps.length - 1) * 100}%`
                        }}
                    />
                </div>
            </div>

            {/* Track Button */}
            {trackingUrl && (
                <a
                    href={trackingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-outline w-full flex items-center justify-center gap-2"
                >
                    <ExternalLink className="w-4 h-4" />
                    {labels.trackOnCarrier}
                </a>
            )}
        </div>
    );
}
