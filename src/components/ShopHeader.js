'use client';

import { useState, useEffect } from 'react';
import { ShoppingBag, Heart, Search, User, Menu, X, Globe } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useFavorites } from '@/context/FavoritesContext';
import SearchModal from './SearchModal';
import { useTranslations, useLocale } from 'next-intl';
import { Link, usePathname, useRouter } from '@/navigation';

export default function ShopHeader() {
    const t = useTranslations('Navigation');
    const locale = useLocale();
    const router = useRouter();
    const pathname = usePathname();

    const { cartCount } = useCart();
    const { user, signOut } = useAuth();
    const { favoritesCount } = useFavorites();
    const [searchOpen, setSearchOpen] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [langMenuOpen, setLangMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Keyboard shortcut for search
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setSearchOpen(true);
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, []);

    const changeLanguage = (newLocale) => {
        router.replace(pathname, { locale: newLocale });
        setLangMenuOpen(false);
    };

    const navLinks = [
        { href: '/products', label: t('products') },
        // Category types are hardcoded for now, can be translated if mapped
        { href: '/products?type=ipek', label: locale === 'tr' ? 'İpek' : 'Silk' },
        { href: '/products?type=keten', label: locale === 'tr' ? 'Keten' : 'Linen' },
        { href: '/about', label: t('about') },
    ];

    return (
        <>
            <header className={`sticky top-0 z-40 transition-all duration-300 ${scrolled
                ? 'bg-background/95 backdrop-blur-md shadow-sm border-b border-border/50'
                : 'bg-transparent'
                }`}>
                <div className="container">
                    <div className="flex items-center justify-between h-20">
                        {/* Logo */}
                        <Link href="/" className="flex items-center gap-2 group">
                            <span className="text-2xl font-light tracking-tight">
                                <span className="text-primary font-normal">Grohn</span> Fabrics
                            </span>
                        </Link>

                        {/* Desktop Navigation */}
                        <nav className="hidden md:flex items-center gap-8">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors relative group"
                                >
                                    {link.label}
                                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full" />
                                </Link>
                            ))}
                        </nav>

                        {/* Right Actions */}
                        <div className="flex items-center gap-2">
                            {/* Language Switcher */}
                            <div className="relative">
                                <button
                                    onClick={() => setLangMenuOpen(!langMenuOpen)}
                                    className="p-2.5 rounded-full hover:bg-muted transition-colors group flex items-center gap-1"
                                >
                                    <Globe className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                                    <span className="text-xs font-medium uppercase text-muted-foreground">{locale}</span>
                                </button>

                                {langMenuOpen && (
                                    <>
                                        <div className="fixed inset-0 z-40" onClick={() => setLangMenuOpen(false)} />
                                        <div className="absolute right-0 top-12 w-32 bg-card border rounded-xl shadow-lg z-50 py-2">
                                            <button
                                                onClick={() => changeLanguage('tr')}
                                                className={`w-full text-left px-4 py-2 text-sm hover:bg-muted ${locale === 'tr' ? 'font-bold text-primary' : ''}`}
                                            >
                                                Türkçe (TR)
                                            </button>
                                            <button
                                                onClick={() => changeLanguage('en')}
                                                className={`w-full text-left px-4 py-2 text-sm hover:bg-muted ${locale === 'en' ? 'font-bold text-primary' : ''}`}
                                            >
                                                English (EN)
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Search */}
                            <button
                                onClick={() => setSearchOpen(true)}
                                className="p-2.5 rounded-full hover:bg-muted transition-colors group"
                                title="Ara (⌘K)"
                            >
                                <Search className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                            </button>

                            {/* Favorites */}
                            <Link href="/favorites" className="p-2.5 rounded-full hover:bg-muted transition-colors relative group">
                                <Heart className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                                {favoritesCount > 0 && (
                                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-accent text-accent-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
                                        {favoritesCount}
                                    </span>
                                )}
                            </Link>

                            {/* User */}
                            <div className="relative">
                                <button
                                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                                    className="p-2.5 rounded-full hover:bg-muted transition-colors group"
                                >
                                    <User className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                                </button>

                                {userMenuOpen && (
                                    <>
                                        <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                                        <div className="absolute right-0 top-12 w-48 bg-card border rounded-xl shadow-lg z-50 py-2">
                                            {user ? (
                                                <>
                                                    <div className="px-4 py-2 border-b">
                                                        <p className="text-sm font-medium truncate">{user.email}</p>
                                                    </div>
                                                    <Link href="/account" className="block px-4 py-2 text-sm hover:bg-muted" onClick={() => setUserMenuOpen(false)}>
                                                        {t('home')} {/* Fallback generic text or translation */}
                                                    </Link>
                                                    <Link href="/account/orders" className="block px-4 py-2 text-sm hover:bg-muted" onClick={() => setUserMenuOpen(false)}>
                                                        Siparişlerim
                                                    </Link>
                                                    <button onClick={() => { signOut(); setUserMenuOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-destructive hover:bg-muted">
                                                        Çıkış Yap
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    <Link href="/login" className="block px-4 py-2 text-sm hover:bg-muted" onClick={() => setUserMenuOpen(false)}>
                                                        Giriş Yap
                                                    </Link>
                                                    <Link href="/register" className="block px-4 py-2 text-sm hover:bg-muted" onClick={() => setUserMenuOpen(false)}>
                                                        Kayıt Ol
                                                    </Link>
                                                </>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Cart */}
                            <Link href="/cart" className="p-2.5 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors relative">
                                <ShoppingBag className="w-5 h-5" />
                                {cartCount > 0 && (
                                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-accent text-accent-foreground text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-background">
                                        {cartCount}
                                    </span>
                                )}
                            </Link>

                            {/* Mobile Menu Toggle */}
                            <button
                                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                className="p-2.5 rounded-full hover:bg-muted transition-colors md:hidden"
                            >
                                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile Menu */}
                {mobileMenuOpen && (
                    <div className="md:hidden border-t bg-card animate-fade-up">
                        <nav className="container py-4 space-y-1">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className="block py-3 text-base font-medium hover:text-primary transition-colors"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    {link.label}
                                </Link>
                            ))}
                        </nav>
                    </div>
                )}
            </header>

            <SearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
        </>
    );
}
