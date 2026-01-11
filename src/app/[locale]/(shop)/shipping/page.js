import { Truck, RefreshCw, Clock, Shield, CreditCard, HelpCircle } from 'lucide-react';

export default function ShippingPage() {
    const shippingInfo = [
        {
            icon: Truck,
            title: 'Ücretsiz Kargo',
            description: '500₺ ve üzeri siparişlerde Türkiye\'nin her yerine ücretsiz kargo.'
        },
        {
            icon: Clock,
            title: 'Hızlı Teslimat',
            description: 'Saat 14:00\'e kadar verilen siparişler aynı gün kargoya verilir. Teslimat süresi 1-3 iş günüdür.'
        },
        {
            icon: Shield,
            title: 'Güvenli Paketleme',
            description: 'Tüm kumaşlar özel koruyucu ambalaj ile paketlenerek gönderilir.'
        }
    ];

    const returnInfo = [
        {
            icon: RefreshCw,
            title: '14 Gün İade Hakkı',
            description: 'Ürünlerimizi 14 gün içinde iade edebilirsiniz. Kullanılmamış ve orijinal ambalajında olmalıdır.'
        },
        {
            icon: CreditCard,
            title: 'Kolay Geri Ödeme',
            description: 'İade onaylandıktan sonra 3-5 iş günü içinde ödemeniz iade edilir.'
        },
        {
            icon: HelpCircle,
            title: 'Değişim İmkanı',
            description: 'Farklı renk veya desen için değişim yapabilirsiniz. Fark fatura edilir veya iade edilir.'
        }
    ];

    return (
        <div>
            {/* Hero */}
            <section className="py-24 bg-gray-50 dark:bg-zinc-900">
                <div className="container">
                    <div className="max-w-3xl">
                        <span className="text-sm font-semibold text-primary uppercase tracking-wider">Bilgi</span>
                        <h1 className="text-4xl md:text-5xl font-bold mt-4 mb-6">Teslimat & İade</h1>
                        <p className="text-xl text-muted-foreground">
                            Siparişlerinizin teslimatı ve iade süreçleri hakkında bilgi edinin.
                        </p>
                    </div>
                </div>
            </section>

            {/* Shipping */}
            <section className="py-24">
                <div className="container">
                    <h2 className="text-3xl font-bold mb-12">Teslimat Bilgileri</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
                        {shippingInfo.map((item, i) => {
                            const Icon = item.icon;
                            return (
                                <div key={i} className="card p-6">
                                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                                        <Icon className="w-6 h-6 text-primary" />
                                    </div>
                                    <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                                    <p className="text-muted-foreground">{item.description}</p>
                                </div>
                            );
                        })}
                    </div>

                    <div className="card p-8 mb-16">
                        <h3 className="font-semibold text-lg mb-4">Kargo Ücretleri</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b">
                                        <th className="py-3 font-medium">Sipariş Tutarı</th>
                                        <th className="py-3 font-medium">Kargo Ücreti</th>
                                        <th className="py-3 font-medium">Teslimat Süresi</th>
                                    </tr>
                                </thead>
                                <tbody className="text-muted-foreground">
                                    <tr className="border-b">
                                        <td className="py-3">0 - 499₺</td>
                                        <td className="py-3">29.90₺</td>
                                        <td className="py-3">1-3 iş günü</td>
                                    </tr>
                                    <tr className="border-b">
                                        <td className="py-3">500₺ ve üzeri</td>
                                        <td className="py-3 text-green-600 font-medium">Ücretsiz</td>
                                        <td className="py-3">1-3 iş günü</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </section>

            {/* Returns */}
            <section className="py-24 bg-gray-50 dark:bg-zinc-900">
                <div className="container">
                    <h2 className="text-3xl font-bold mb-12">İade & Değişim</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
                        {returnInfo.map((item, i) => {
                            const Icon = item.icon;
                            return (
                                <div key={i} className="card p-6">
                                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                                        <Icon className="w-6 h-6 text-primary" />
                                    </div>
                                    <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                                    <p className="text-muted-foreground">{item.description}</p>
                                </div>
                            );
                        })}
                    </div>

                    <div className="card p-8">
                        <h3 className="font-semibold text-lg mb-4">İade Koşulları</h3>
                        <ul className="space-y-3 text-muted-foreground">
                            <li className="flex items-start gap-2">
                                <span className="text-primary">•</span>
                                Ürün, teslim tarihinden itibaren 14 gün içinde iade edilmelidir.
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-primary">•</span>
                                Kumaş kullanılmamış, kesilmemiş ve orijinal ambalajında olmalıdır.
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-primary">•</span>
                                Özel kesim (metraj) ürünler iade edilemez.
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-primary">•</span>
                                İade kargo ücreti müşteriye aittir. Hatalı ürünlerde kargo tarafımızca karşılanır.
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-primary">•</span>
                                İade talebinizi info@grohnfabrics.com adresine e-posta ile bildirin.
                            </li>
                        </ul>
                    </div>
                </div>
            </section>
        </div>
    );
}
