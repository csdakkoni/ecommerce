'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Eye, EyeOff, Mail, Lock, User } from 'lucide-react';

export default function RegisterPage() {
    const router = useRouter();
    const { signUp } = useAuth();
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        // Validate passwords match
        if (formData.password !== formData.confirmPassword) {
            setError('Şifreler eşleşmiyor');
            setLoading(false);
            return;
        }

        // Validate password length
        if (formData.password.length < 6) {
            setError('Şifre en az 6 karakter olmalıdır');
            setLoading(false);
            return;
        }

        const { error } = await signUp(formData.email, formData.password, {
            first_name: formData.firstName,
            last_name: formData.lastName,
        });

        if (error) {
            setError(error.message);
        } else {
            setSuccess(true);
        }
        setLoading(false);
    };

    if (success) {
        return (
            <div className="min-h-[80vh] flex items-center justify-center py-12">
                <div className="w-full max-w-md mx-auto px-4 text-center">
                    <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Mail className="w-8 h-8 text-green-600" />
                    </div>
                    <h1 className="text-2xl font-bold mb-4">Kayıt Başarılı!</h1>
                    <p className="text-muted-foreground mb-8">
                        E-posta adresinize bir doğrulama bağlantısı gönderdik.
                        Lütfen e-postanızı kontrol edin ve hesabınızı doğrulayın.
                    </p>
                    <Link href="/login" className="btn btn-primary">
                        Giriş Sayfasına Git
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-[80vh] flex items-center justify-center py-12">
            <div className="w-full max-w-md mx-auto px-4">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold mb-2">Hesap Oluştur</h1>
                    <p className="text-muted-foreground">Alışverişe başlamak için kayıt olun</p>
                </div>

                <div className="card p-8">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {error && (
                            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 text-red-700 dark:text-red-400 text-sm">
                                {error}
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">Ad</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                    <input
                                        type="text"
                                        name="firstName"
                                        value={formData.firstName}
                                        onChange={handleChange}
                                        required
                                        placeholder="Adınız"
                                        className="w-full pl-10 pr-4 py-3 border rounded-lg bg-background"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">Soyad</label>
                                <input
                                    type="text"
                                    name="lastName"
                                    value={formData.lastName}
                                    onChange={handleChange}
                                    required
                                    placeholder="Soyadınız"
                                    className="w-full px-4 py-3 border rounded-lg bg-background"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">E-posta</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                    placeholder="ornek@email.com"
                                    className="w-full pl-10 pr-4 py-3 border rounded-lg bg-background"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Şifre</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                    placeholder="En az 6 karakter"
                                    className="w-full pl-10 pr-12 py-3 border rounded-lg bg-background"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Şifre Tekrar</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    required
                                    placeholder="Şifrenizi tekrar girin"
                                    className="w-full pl-10 pr-4 py-3 border rounded-lg bg-background"
                                />
                            </div>
                        </div>

                        <div className="text-sm text-muted-foreground">
                            <label className="flex items-start gap-2">
                                <input type="checkbox" required className="mt-1 rounded" />
                                <span>
                                    <Link href="/terms" className="text-primary hover:underline">Kullanım Koşulları</Link> ve{' '}
                                    <Link href="/privacy" className="text-primary hover:underline">Gizlilik Politikası</Link>'nı
                                    okudum ve kabul ediyorum.
                                </span>
                            </label>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn btn-primary w-full h-12 text-base"
                        >
                            {loading ? 'Kayıt yapılıyor...' : 'Kayıt Ol'}
                        </button>
                    </form>

                    <div className="mt-6 text-center text-sm">
                        <span className="text-muted-foreground">Zaten hesabınız var mı? </span>
                        <Link href="/login" className="text-primary font-medium hover:underline">
                            Giriş Yap
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
