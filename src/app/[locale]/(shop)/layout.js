
import Link from 'next/link';
import ShopHeader from '@/components/ShopHeader';
import { CartProvider } from '@/context/CartContext';
import { AuthProvider } from '@/context/AuthContext';
import { FavoritesProvider } from '@/context/FavoritesContext';
import { ToastProvider } from '@/context/ToastContext';
import { AnalyticsProvider } from '@/components/AnalyticsProvider';
import LiveChatWidget from '@/components/LiveChatWidget';

export default function ShopLayout({ children }) {
    return (
        <AuthProvider>
            <ToastProvider>
                <FavoritesProvider>
                    <CartProvider>
                        <AnalyticsProvider>
                            <div className="flex flex-col min-h-screen">
                                {/* Announcement Bar */}
                                <div className="bg-zinc-900 text-white text-xs py-2 text-center tracking-widest uppercase">
                                    Türkiye'nin her yerine ücretsiz kargo — 500₺ üzeri siparişlerde
                                </div>

                                <ShopHeader />

                                {/* Main Content */}
                                <main className="flex-1">
                                    {children}
                                </main>

                                {/* Footer */}
                                <footer className="bg-muted/30 border-t border-border/50 py-16">
                                    <div className="container grid grid-cols-1 md:grid-cols-4 gap-12">
                                        <div className="space-y-4">
                                            <h3 className="text-xl font-light">
                                                <span className="text-primary font-normal">Grohn</span> Fabrics
                                            </h3>
                                            <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
                                                Doğanın dokusunu elinize ulaştırıyoruz. Kalite, estetik ve sürdürülebilirlik bir arada.
                                            </p>
                                        </div>
                                        <div>
                                            <h4 className="font-medium mb-4 text-sm uppercase tracking-wider text-primary">Koleksiyon</h4>
                                            <ul className="space-y-3 text-sm text-muted-foreground">
                                                <li><Link href="/products" className="hover:text-primary transition-colors">Tüm Kumaşlar</Link></li>
                                                <li><Link href="/products?type=ipek" className="hover:text-primary transition-colors">Doğal İpekler</Link></li>
                                                <li><Link href="/products?type=keten" className="hover:text-primary transition-colors">Organik Ketenler</Link></li>
                                                <li><Link href="/products?type=pamuk" className="hover:text-primary transition-colors">Premium Pamuklar</Link></li>
                                            </ul>
                                        </div>
                                        <div>
                                            <h4 className="font-medium mb-4 text-sm uppercase tracking-wider text-primary">Yardım</h4>
                                            <ul className="space-y-3 text-sm text-muted-foreground">
                                                <li><Link href="/about" className="hover:text-primary transition-colors">Hikayemiz</Link></li>
                                                <li><Link href="/contact" className="hover:text-primary transition-colors">İletişim</Link></li>
                                                <li><Link href="/shipping" className="hover:text-primary transition-colors">Teslimat & İade</Link></li>
                                                <li><Link href="/faq" className="hover:text-primary transition-colors">SSS</Link></li>
                                                <li><Link href="/track" className="hover:text-primary transition-colors">Sipariş Takip</Link></li>
                                            </ul>
                                        </div>
                                        <div>
                                            <h4 className="font-medium mb-4 text-sm uppercase tracking-wider text-primary">Bülten</h4>
                                            <p className="text-sm text-muted-foreground mb-4">Yeni koleksiyonların habercisi olun.</p>
                                            <form className="flex gap-2">
                                                <input type="email" placeholder="E-posta" className="input flex-1 text-sm" />
                                                <button className="btn btn-primary px-4 text-sm">Katıl</button>
                                            </form>
                                        </div>
                                    </div>
                                    <div className="container mt-12 pt-8 border-t border-border/50 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-muted-foreground">
                                        <p>© 2026 Grohn Fabrics. Doğanın Dokusu.</p>
                                        <div className="flex gap-6">
                                            <Link href="#" className="hover:text-primary transition-colors">Gizlilik</Link>
                                            <Link href="#" className="hover:text-primary transition-colors">Koşullar</Link>
                                            <Link href="#" className="hover:text-primary transition-colors">Çerezler</Link>
                                        </div>
                                    </div>
                                </footer>
                            </div>
                            <LiveChatWidget />
                        </AnalyticsProvider>
                    </CartProvider>
                </FavoritesProvider>
            </ToastProvider>
        </AuthProvider>
    );
}
