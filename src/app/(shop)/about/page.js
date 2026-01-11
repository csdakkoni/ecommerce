import Link from 'next/link';
import { Award, Users, Heart, Globe } from 'lucide-react';

export default function AboutPage() {
    const values = [
        {
            icon: Award,
            title: 'Kalite Önceliğimiz',
            description: 'Sadece en kaliteli hammaddelerle üretilmiş, sertifikalı kumaşları sunuyoruz.'
        },
        {
            icon: Users,
            title: 'Müşteri Odaklılık',
            description: 'Her müşterimizin ihtiyacını anlamak ve en uygun çözümü sunmak için çalışıyoruz.'
        },
        {
            icon: Heart,
            title: 'Tutku ile Çalışıyoruz',
            description: 'Kumaş ve tekstil dünyasına olan tutkumuz, yaptığımız her işe yansıyor.'
        },
        {
            icon: Globe,
            title: 'Sürdürülebilirlik',
            description: 'Çevreye duyarlı üretim süreçlerini ve organik malzemeleri destekliyoruz.'
        }
    ];

    return (
        <div>
            {/* Hero */}
            <section className="relative py-24 bg-gray-50 dark:bg-zinc-900">
                <div className="container">
                    <div className="max-w-3xl">
                        <span className="text-sm font-semibold text-primary uppercase tracking-wider">Hakkımızda</span>
                        <h1 className="text-4xl md:text-5xl font-bold mt-4 mb-6">
                            Kumaşın Zarafetini <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-600 to-rose-600">
                                Sizinle Buluşturuyoruz
                            </span>
                        </h1>
                        <p className="text-xl text-muted-foreground">
                            Grohn Fabrics, Türkiye'nin önde gelen kumaş tedarikçisi olarak, modacılardan ev tekstili meraklılarına
                            kadar herkes için premium kalitede kumaşlar sunuyor.
                        </p>
                    </div>
                </div>
            </section>

            {/* Story */}
            <section className="py-24">
                <div className="container">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                        <div>
                            <h2 className="text-3xl font-bold mb-6">Hikayemiz</h2>
                            <div className="space-y-4 text-muted-foreground">
                                <p>
                                    2015 yılında İstanbul'da kurulan Grohn Fabrics, kumaş tutkunları tarafından,
                                    kumaş tutkunları için kurulmuş bir markadır.
                                </p>
                                <p>
                                    Yılların tecrübesiyle, dünyanın dört bir yanından en kaliteli kumaşları
                                    Türkiye'ye getiriyor ve sizlere sunuyoruz. İtalya'nın zarif ipeklerinden,
                                    Belçika'nın dayanıklı ketenlerine kadar geniş bir yelpazede ürün sunuyoruz.
                                </p>
                                <p>
                                    Amacımız sadece kumaş satmak değil, yaratıcılığınıza ilham vermek ve
                                    projelerinizi hayata geçirmenize yardımcı olmaktır.
                                </p>
                            </div>
                        </div>
                        <div className="aspect-square rounded-2xl overflow-hidden">
                            <img src="/images/hero.png" alt="Grohn Fabrics Hikayesi" className="w-full h-full object-cover" />
                        </div>
                    </div>
                </div>
            </section>

            {/* Values */}
            <section className="py-24 bg-gray-50 dark:bg-zinc-900">
                <div className="container">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold mb-4">Değerlerimiz</h2>
                        <p className="text-muted-foreground max-w-2xl mx-auto">
                            Müşterilerimize en iyi hizmeti sunmak için bu değerleri benimsiyoruz.
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
                    <h2 className="text-3xl font-bold mb-4">Koleksiyonumuzu Keşfedin</h2>
                    <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
                        Binlerce kumaş çeşidi arasından ihtiyacınıza uygun olanı bulun.
                    </p>
                    <Link href="/products" className="btn btn-primary h-12 px-8">
                        Alışverişe Başla
                    </Link>
                </div>
            </section>
        </div>
    );
}
