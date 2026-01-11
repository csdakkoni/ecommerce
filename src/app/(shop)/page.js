import Link from 'next/link';
import { ArrowRight, Leaf, Truck, HeadphonesIcon, Sparkles } from 'lucide-react';

export default function HomePage() {
  const categories = [
    { name: 'Doğal İpekler', image: '/images/silk.png', slug: 'ipek', tag: 'Zarif' },
    { name: 'Organik Ketenler', image: '/images/linen.png', slug: 'keten', tag: 'Doğal' },
    { name: 'Premium Pamuklar', image: '/images/cotton.png', slug: 'pamuk', tag: 'Yumuşak' },
  ];

  return (
    <div>
      {/* Hero Section - Organic & Warm */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden">
        {/* Soft gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-secondary via-background to-accent/20" />

        {/* Organic shapes */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-20 right-20 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-20 left-10 w-80 h-80 bg-accent/10 rounded-full blur-3xl" />
        </div>

        <div className="container relative z-10 py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Text Content */}
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full">
                <Leaf className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-primary">Doğal & Sürdürülebilir</span>
              </div>

              <h1 className="text-5xl md:text-6xl lg:text-7xl font-light leading-[1.1] tracking-tight">
                Kumaşın <br />
                <span className="font-normal text-primary">Şiirsel</span><br />
                Dokunuşu
              </h1>

              <p className="text-lg text-muted-foreground max-w-md leading-relaxed">
                El emeği ve doğanın buluştuğu yerde, her dokunak bir hikaye anlatır.
                Projelerinize ruh katacak eşsiz kumaşlar.
              </p>

              <div className="flex flex-wrap gap-4 pt-4">
                <Link href="/products" className="btn btn-primary text-base px-8 py-3">
                  Koleksiyonu Keşfet
                </Link>
                <Link href="/about" className="btn btn-outline text-base px-8 py-3">
                  Hikayemiz
                </Link>
              </div>

              {/* Trust indicators mini */}
              <div className="flex items-center gap-6 pt-6 text-sm text-muted-foreground">
                <span className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" /> 500+ Kumaş Çeşidi
                </span>
                <span className="flex items-center gap-2">
                  <Leaf className="w-4 h-4 text-primary" /> %100 Doğal Seçenekler
                </span>
              </div>
            </div>

            {/* Hero Image - Organic shape */}
            <div className="relative">
              <div className="relative aspect-[4/5] rounded-[3rem] overflow-hidden shadow-2xl shadow-primary/10">
                <img
                  src="/images/hero.png"
                  alt="Premium Kumaş Koleksiyonu"
                  className="w-full h-full object-cover"
                />
                {/* Soft overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-background/20 to-transparent" />
              </div>

              {/* Floating badge */}
              <div className="absolute -bottom-6 -left-6 bg-card p-5 rounded-2xl shadow-xl border">
                <p className="text-3xl font-light text-primary">2026</p>
                <p className="text-sm text-muted-foreground">Yeni Koleksiyon</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-24 bg-muted/30">
        <div className="container">
          <div className="text-center mb-16">
            <span className="text-sm font-medium text-primary uppercase tracking-widest">Kategoriler</span>
            <h2 className="h1 mt-4">Doğanın Renkleri</h2>
            <p className="p max-w-lg mx-auto mt-4">
              Her kategoride özenle seçilmiş, kaliteden ödün vermeyen kumaşlar
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {categories.map((cat, i) => (
              <Link
                href={`/products?type=${cat.slug}`}
                key={i}
                className="group relative aspect-[3/4] rounded-3xl overflow-hidden"
              >
                <img
                  src={cat.image}
                  alt={cat.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 via-foreground/20 to-transparent" />

                {/* Content */}
                <div className="absolute bottom-0 left-0 right-0 p-8">
                  <span className="inline-block px-3 py-1 bg-background/90 backdrop-blur rounded-full text-xs font-medium mb-3">
                    {cat.tag}
                  </span>
                  <h3 className="text-2xl font-light text-white mb-2">{cat.name}</h3>
                  <span className="inline-flex items-center gap-2 text-white/80 text-sm group-hover:text-white transition-colors">
                    İncele <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Quote/Philosophy Section */}
      <section className="py-32 bg-secondary/30 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl" />
        </div>

        <div className="container relative z-10 text-center max-w-4xl mx-auto">
          <Leaf className="w-10 h-10 text-primary mx-auto mb-8 animate-gentle-pulse" />
          <blockquote className="text-3xl md:text-4xl font-light leading-relaxed text-foreground/80">
            "Her kumaş bir hikaye taşır. Biz bu hikayeleri,
            <span className="text-primary font-normal"> doğanın dokusundan </span>
            sizin ellerinize ulaştırıyoruz."
          </blockquote>
          <p className="mt-8 text-muted-foreground">— Grohn Fabrics Felsefesi</p>
        </div>
      </section>

      {/* Trust Section - Softer Design */}
      <section className="py-24">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="text-center group">
              <div className="w-20 h-20 bg-secondary rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-primary/10 transition-colors">
                <Leaf className="w-8 h-8 text-primary" />
              </div>
              <h3 className="h3 mb-3">Doğal Malzeme</h3>
              <p className="p">Sertifikalı, organik ve sürdürülebilir kaynaklardan elde edilen kumaşlar.</p>
            </div>
            <div className="text-center group">
              <div className="w-20 h-20 bg-secondary rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-primary/10 transition-colors">
                <Truck className="w-8 h-8 text-primary" />
              </div>
              <h3 className="h3 mb-3">Özenli Teslimat</h3>
              <p className="p">Kumaşlarınız özel paketleme ile güvenle kapınıza ulaşır.</p>
            </div>
            <div className="text-center group">
              <div className="w-20 h-20 bg-secondary rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-primary/10 transition-colors">
                <HeadphonesIcon className="w-8 h-8 text-primary" />
              </div>
              <h3 className="h3 mb-3">Uzman Rehberlik</h3>
              <p className="p">Kumaş seçimi ve proje danışmanlığında yanınızdayız.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter - Warm CTA */}
      <section className="py-24 bg-gradient-to-r from-primary/5 via-secondary/50 to-accent/10">
        <div className="container text-center max-w-2xl mx-auto">
          <h2 className="h2 mb-4">Yeni Kumaşlardan Haberdar Olun</h2>
          <p className="p mb-8">Özel koleksiyonlar ve sezonluk yenilikler için bültenimize katılın.</p>
          <form className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <input
              type="email"
              placeholder="E-posta adresiniz"
              className="input flex-1"
            />
            <button type="submit" className="btn btn-primary whitespace-nowrap">
              Abone Ol
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
