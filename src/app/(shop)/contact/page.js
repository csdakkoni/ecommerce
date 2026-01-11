'use client';

import { useState } from 'react';
import { MapPin, Phone, Mail, Clock, Send } from 'lucide-react';

export default function ContactPage() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: ''
    });
    const [submitted, setSubmitted] = useState(false);

    const handleChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // In production, send to API
        console.log('Contact form submitted:', formData);
        setSubmitted(true);
    };

    const contactInfo = [
        {
            icon: MapPin,
            title: 'Adres',
            lines: ['Tekstilciler Caddesi No: 123', 'Merter, İstanbul 34169']
        },
        {
            icon: Phone,
            title: 'Telefon',
            lines: ['+90 (212) 123 45 67', '+90 (532) 123 45 67']
        },
        {
            icon: Mail,
            title: 'E-posta',
            lines: ['info@grohnfabrics.com', 'siparis@grohnfabrics.com']
        },
        {
            icon: Clock,
            title: 'Çalışma Saatleri',
            lines: ['Pazartesi - Cuma: 09:00 - 18:00', 'Cumartesi: 10:00 - 14:00']
        }
    ];

    return (
        <div>
            {/* Hero */}
            <section className="py-24 bg-gray-50 dark:bg-zinc-900">
                <div className="container">
                    <div className="max-w-3xl">
                        <span className="text-sm font-semibold text-primary uppercase tracking-wider">İletişim</span>
                        <h1 className="text-4xl md:text-5xl font-bold mt-4 mb-6">Bizimle İletişime Geçin</h1>
                        <p className="text-xl text-muted-foreground">
                            Sorularınız, önerileriniz veya toptan satış talepleriniz için bize ulaşın.
                            Ekibimiz size en kısa sürede dönüş yapacaktır.
                        </p>
                    </div>
                </div>
            </section>

            <section className="py-24">
                <div className="container">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                        {/* Contact Info */}
                        <div className="lg:col-span-1 space-y-8">
                            {contactInfo.map((item, i) => {
                                const Icon = item.icon;
                                return (
                                    <div key={i} className="flex gap-4">
                                        <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                                            <Icon className="w-5 h-5 text-primary" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold mb-1">{item.title}</h3>
                                            {item.lines.map((line, j) => (
                                                <p key={j} className="text-sm text-muted-foreground">{line}</p>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Contact Form */}
                        <div className="lg:col-span-2">
                            <div className="card p-8">
                                {submitted ? (
                                    <div className="text-center py-12">
                                        <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <Send className="w-8 h-8 text-green-600" />
                                        </div>
                                        <h3 className="text-xl font-bold mb-2">Mesajınız Gönderildi!</h3>
                                        <p className="text-muted-foreground mb-6">
                                            En kısa sürede size dönüş yapacağız.
                                        </p>
                                        <button
                                            onClick={() => { setSubmitted(false); setFormData({ name: '', email: '', phone: '', subject: '', message: '' }); }}
                                            className="btn btn-outline"
                                        >
                                            Yeni Mesaj Gönder
                                        </button>
                                    </div>
                                ) : (
                                    <form onSubmit={handleSubmit} className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-sm font-medium mb-2">Ad Soyad *</label>
                                                <input
                                                    type="text"
                                                    name="name"
                                                    required
                                                    value={formData.name}
                                                    onChange={handleChange}
                                                    className="w-full border rounded-md p-3 bg-background"
                                                    placeholder="Adınız Soyadınız"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium mb-2">E-posta *</label>
                                                <input
                                                    type="email"
                                                    name="email"
                                                    required
                                                    value={formData.email}
                                                    onChange={handleChange}
                                                    className="w-full border rounded-md p-3 bg-background"
                                                    placeholder="ornek@email.com"
                                                />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-sm font-medium mb-2">Telefon</label>
                                                <input
                                                    type="tel"
                                                    name="phone"
                                                    value={formData.phone}
                                                    onChange={handleChange}
                                                    className="w-full border rounded-md p-3 bg-background"
                                                    placeholder="+90 5XX XXX XX XX"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium mb-2">Konu *</label>
                                                <select
                                                    name="subject"
                                                    required
                                                    value={formData.subject}
                                                    onChange={handleChange}
                                                    className="w-full border rounded-md p-3 bg-background"
                                                >
                                                    <option value="">Seçiniz</option>
                                                    <option value="siparis">Sipariş Bilgisi</option>
                                                    <option value="urun">Ürün Hakkında</option>
                                                    <option value="toptan">Toptan Satış</option>
                                                    <option value="iade">İade/Değişim</option>
                                                    <option value="diger">Diğer</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-2">Mesajınız *</label>
                                            <textarea
                                                name="message"
                                                required
                                                rows={5}
                                                value={formData.message}
                                                onChange={handleChange}
                                                className="w-full border rounded-md p-3 bg-background"
                                                placeholder="Mesajınızı buraya yazın..."
                                            />
                                        </div>
                                        <button type="submit" className="btn btn-primary w-full h-12">
                                            <Send className="w-4 h-4 mr-2" />
                                            Mesaj Gönder
                                        </button>
                                    </form>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
