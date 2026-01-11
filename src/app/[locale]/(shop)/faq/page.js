'use client';

import { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';

export default function FAQPage() {
    const [openIndex, setOpenIndex] = useState(null);

    const faqs = [
        {
            category: 'Sipariş & Ödeme',
            questions: [
                {
                    q: 'Nasıl sipariş verebilirim?',
                    a: 'Beğendiğiniz ürünü sepete ekleyin, ardından ödeme sayfasına geçin. Adres bilgilerinizi girdikten sonra güvenli ödeme yöntemlerinden birini seçerek siparişinizi tamamlayabilirsiniz.'
                },
                {
                    q: 'Hangi ödeme yöntemlerini kabul ediyorsunuz?',
                    a: 'Kredi kartı, banka kartı ve havale/EFT ile ödeme kabul ediyoruz. Tüm kart ödemeleri 256-bit SSL şifreleme ile korunmaktadır.'
                },
                {
                    q: 'Taksitli ödeme yapabilir miyim?',
                    a: 'Evet, anlaşmalı bankaların kredi kartlarına 3, 6 ve 9 taksit seçenekleri sunuyoruz. Taksit seçenekleri ödeme sayfasında görüntülenir.'
                },
                {
                    q: 'Fatura kesilecek mi?',
                    a: 'Evet, tüm siparişler için e-fatura düzenlenmektedir. Fatura, sipariş tamamlandığında e-posta adresinize gönderilir.'
                }
            ]
        },
        {
            category: 'Teslimat',
            questions: [
                {
                    q: 'Kargo ücreti ne kadar?',
                    a: '500₺ ve üzeri siparişlerde kargo ücretsizdir. 500₺ altı siparişlerde 29.90₺ kargo ücreti uygulanır.'
                },
                {
                    q: 'Siparişim ne zaman teslim edilir?',
                    a: 'Saat 14:00\'e kadar verilen siparişler aynı gün kargoya verilir. Teslimat süresi 1-3 iş günüdür.'
                },
                {
                    q: 'Siparişimi nasıl takip edebilirim?',
                    a: 'Kargoya verildikten sonra, takip numarası e-posta ile gönderilir. Ayrıca sitemizin "Sipariş Takip" sayfasından da takip edebilirsiniz.'
                },
                {
                    q: 'Yurt dışına teslimat yapıyor musunuz?',
                    a: 'Şu an için sadece Türkiye içine teslimat yapılmaktadır. Yurt dışı siparişleri için bizimle iletişime geçebilirsiniz.'
                }
            ]
        },
        {
            category: 'İade & Değişim',
            questions: [
                {
                    q: 'İade şartları nelerdir?',
                    a: 'Ürünlerinizi 14 gün içinde iade edebilirsiniz. Kumaş kullanılmamış, kesilmemiş ve orijinal ambalajında olmalıdır.'
                },
                {
                    q: 'Özel kesim ürünler iade edilebilir mi?',
                    a: 'Hayır, özel kesim (metraj) ürünler iade edilemez. Standart ölçüler dışında kesilen kumaşlar iade kapsamı dışındadır.'
                },
                {
                    q: 'İade kargo ücreti kime ait?',
                    a: 'Müşteri kaynaklı iadelerde kargo ücreti müşteriye aittir. Hatalı veya hasarlı ürün iadelarinde kargo tarafımızca karşılanır.'
                },
                {
                    q: 'Para iadesi ne zaman yapılır?',
                    a: 'İade onaylandıktan sonra 3-5 iş günü içinde ödemeniz, ödeme yaptığınız yönteme göre iade edilir.'
                }
            ]
        },
        {
            category: 'Ürünler',
            questions: [
                {
                    q: 'Kumaş numunesi alabilir miyim?',
                    a: 'Evet, çoğu ürünümüz için numune gönderimi yapıyoruz. Numune talebi için iletişim sayfasından bize ulaşabilirsiniz.'
                },
                {
                    q: 'Toptan satış yapıyor musunuz?',
                    a: 'Evet, toptan alımlar için özel fiyatlandırma sunuyoruz. Toptan talepleriniz için info@grohnfabrics.com adresine e-posta gönderebilirsiniz.'
                },
                {
                    q: 'Kumaşların bakım talimatları var mı?',
                    a: 'Evet, her ürün sayfasında detaylı bakım talimatları bulunur. Genel olarak, doğal kumaşları düşük sıcaklıkta yıkamanızı öneriyoruz.'
                }
            ]
        }
    ];

    const toggleQuestion = (index) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    let globalIndex = 0;

    return (
        <div>
            {/* Hero */}
            <section className="py-24 bg-gray-50 dark:bg-zinc-900">
                <div className="container">
                    <div className="max-w-3xl">
                        <span className="text-sm font-semibold text-primary uppercase tracking-wider">Yardım</span>
                        <h1 className="text-4xl md:text-5xl font-bold mt-4 mb-6">Sıkça Sorulan Sorular</h1>
                        <p className="text-xl text-muted-foreground">
                            En çok merak edilen soruların cevaplarını burada bulabilirsiniz.
                        </p>
                    </div>
                </div>
            </section>

            {/* FAQ List */}
            <section className="py-24">
                <div className="container max-w-4xl">
                    {faqs.map((section, sectionIndex) => (
                        <div key={sectionIndex} className="mb-12">
                            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                                <HelpCircle className="w-5 h-5 text-primary" />
                                {section.category}
                            </h2>
                            <div className="space-y-3">
                                {section.questions.map((item, qIndex) => {
                                    const currentIndex = globalIndex++;
                                    const isOpen = openIndex === currentIndex;
                                    return (
                                        <div key={qIndex} className="card overflow-hidden">
                                            <button
                                                onClick={() => toggleQuestion(currentIndex)}
                                                className="w-full p-4 text-left flex justify-between items-center hover:bg-muted/50 transition-colors"
                                            >
                                                <span className="font-medium pr-4">{item.q}</span>
                                                <ChevronDown className={`w-5 h-5 text-muted-foreground flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                                            </button>
                                            {isOpen && (
                                                <div className="px-4 pb-4 text-muted-foreground">
                                                    {item.a}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Contact CTA */}
            <section className="py-16 bg-gray-50 dark:bg-zinc-900">
                <div className="container text-center">
                    <h2 className="text-2xl font-bold mb-4">Sorunuz Burada Yok mu?</h2>
                    <p className="text-muted-foreground mb-6">
                        Aklınıza takılan her şey için bize ulaşabilirsiniz.
                    </p>
                    <a href="/contact" className="btn btn-primary">
                        İletişime Geçin
                    </a>
                </div>
            </section>
        </div>
    );
}
