import { supabase } from '@/lib/supabaseClient';
import { Link } from '@/navigation';
import { Award, Users, Heart, Globe } from 'lucide-react';

// This is a dynamic page that reads content from database
export const dynamic = 'force-dynamic';

async function getPageContent(locale) {
    const { data, error } = await supabase
        .from('site_pages')
        .select('*')
        .eq('slug', 'about')
        .eq('is_published', true)
        .single();

    if (error || !data) {
        // Fallback content if database not set up
        return {
            title: locale === 'en' ? 'About Us' : 'Hakkımızda',
            content: locale === 'en'
                ? '<h2>Our Story</h2><p>Founded in Istanbul in 2015, Grohn Fabrics is a brand created by fabric enthusiasts, for fabric enthusiasts.</p>'
                : '<h2>Hikayemiz</h2><p>2015 yılında İstanbul\'da kurulan Grohn Fabrics, kumaş tutkunları tarafından, kumaş tutkunları için kurulmuş bir markadır.</p>',
        };
    }

    return {
        title: locale === 'en' ? (data.title_en || data.title) : data.title,
        content: locale === 'en' ? (data.content_en || data.content) : data.content,
        meta_title: locale === 'en' ? (data.meta_title_en || data.meta_title) : data.meta_title,
        meta_description: locale === 'en' ? (data.meta_description_en || data.meta_description) : data.meta_description,
    };
}

export default async function AboutPage({ params }) {
    const { locale } = await params;
    const page = await getPageContent(locale);

    const values = locale === 'en' ? [
        { icon: Award, title: 'Quality First', description: 'We only offer certified fabrics made from the highest quality raw materials.' },
        { icon: Users, title: 'Customer Focus', description: 'We work to understand each customer\'s needs and provide the best solution.' },
        { icon: Heart, title: 'Passion Driven', description: 'Our passion for fabrics and textiles is reflected in everything we do.' },
        { icon: Globe, title: 'Sustainability', description: 'We support environmentally conscious production processes and organic materials.' },
    ] : [
        { icon: Award, title: 'Kalite Önceliğimiz', description: 'Sadece en kaliteli hammaddelerle üretilmiş, sertifikalı kumaşları sunuyoruz.' },
        { icon: Users, title: 'Müşteri Odaklılık', description: 'Her müşterimizin ihtiyacını anlamak ve en uygun çözümü sunmak için çalışıyoruz.' },
        { icon: Heart, title: 'Tutku ile Çalışıyoruz', description: 'Kumaş ve tekstil dünyasına olan tutkumuz, yaptığımız her işe yansıyor.' },
        { icon: Globe, title: 'Sürdürülebilirlik', description: 'Çevreye duyarlı üretim süreçlerini ve organik malzemeleri destekliyoruz.' },
    ];

    return (
        <div>
            {/* Hero */}
            <section className="relative py-24 bg-gray-50 dark:bg-zinc-900">
                <div className="container">
                    <div className="max-w-3xl">
                        <span className="text-sm font-semibold text-primary uppercase tracking-wider">{page.title}</span>
                        <h1 className="text-4xl md:text-5xl font-bold mt-4 mb-6">
                            {locale === 'en' ? 'Bringing the Elegance of Fabric' : 'Kumaşın Zarafetini'} <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-600 to-rose-600">
                                {locale === 'en' ? 'To You' : 'Sizinle Buluşturuyoruz'}
                            </span>
                        </h1>
                        <p className="text-xl text-muted-foreground">
                            {locale === 'en'
                                ? 'Grohn Fabrics, as one of Turkey\'s leading fabric suppliers, offers premium quality fabrics for everyone from fashion designers to home textile enthusiasts.'
                                : 'Grohn Fabrics, Türkiye\'nin önde gelen kumaş tedarikçisi olarak, modacılardan ev tekstili meraklılarına kadar herkes için premium kalitede kumaşlar sunuyor.'
                            }
                        </p>
                    </div>
                </div>
            </section>

            {/* Dynamic Content from Database */}
            <section className="py-24">
                <div className="container">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                        <div
                            className="prose dark:prose-invert max-w-none"
                            dangerouslySetInnerHTML={{ __html: page.content }}
                        />
                        <div className="aspect-square rounded-2xl overflow-hidden">
                            <img src="/images/hero.png" alt={page.title} className="w-full h-full object-cover" />
                        </div>
                    </div>
                </div>
            </section>

            {/* Values */}
            <section className="py-24 bg-gray-50 dark:bg-zinc-900">
                <div className="container">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold mb-4">{locale === 'en' ? 'Our Values' : 'Değerlerimiz'}</h2>
                        <p className="text-muted-foreground max-w-2xl mx-auto">
                            {locale === 'en'
                                ? 'We embrace these values to provide the best service to our customers.'
                                : 'Müşterilerimize en iyi hizmeti sunmak için bu değerleri benimsiyoruz.'
                            }
                        </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {values.map((value, i) => {
                            const Icon = value.icon;
                            return (
                                <div key={i} className="card p-6 text-center">
                                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                                        <Icon className="w-6 h-6 text-primary" />
                                    </div>
                                    <h3 className="font-semibold mb-2">{value.title}</h3>
                                    <p className="text-sm text-muted-foreground">{value.description}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-24">
                <div className="container text-center">
                    <h2 className="text-3xl font-bold mb-4">
                        {locale === 'en' ? 'Explore Our Collection' : 'Koleksiyonumuzu Keşfedin'}
                    </h2>
                    <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
                        {locale === 'en'
                            ? 'Find the perfect fabric for your needs among thousands of varieties.'
                            : 'Binlerce kumaş çeşidi arasından ihtiyacınıza uygun olanı bulun.'
                        }
                    </p>
                    <Link href="/products" className="btn btn-primary h-12 px-8">
                        {locale === 'en' ? 'Start Shopping' : 'Alışverişe Başla'}
                    </Link>
                </div>
            </section>
        </div>
    );
}
