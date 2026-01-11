
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function GET() {
    try {
        // 1. Create a Category
        const { data: category, error: catError } = await supabase
            .from('categories')
            .insert({
                name: 'Premium İpek',
                slug: 'premium-ipek',
                description: 'Saf ipek kumaşlar.'
            })
            .select()
            .single();

        if (catError && catError.code !== '23505') { // Ignore duplicate error
            return NextResponse.json({ error: catError.message }, { status: 500 });
        }

        // Get the category ID (either newly created or query exiting if needed, for simplicity we assume it worked or we query it)
        let categoryId = category?.id;
        if (!categoryId) {
            const { data: existing } = await supabase.from('categories').select('id').eq('slug', 'premium-ipek').single();
            categoryId = existing?.id;
        }

        // 2. Insert Products
        const products = [
            {
                name: 'Saf İpek Şifon - Bordo',
                slug: 'saf-ipek-sifon-bordo',
                description: ' %100 Saf İpek, dökümlü ve yumuşak dokulu.',
                price: 1250.00,
                fabric_type: 'İpek',
                width_cm: 140,
                weight_gsm: 45,
                category_id: categoryId,
                is_active: true
            },
            {
                name: 'Organik Ham Keten',
                slug: 'organik-ham-keten',
                description: 'Doğal dokulu, nefes alan organik keten kumaş.',
                price: 450.00,
                fabric_type: 'Keten',
                width_cm: 150,
                weight_gsm: 220,
                category_id: categoryId, // Assigning same cat for demo simplicity or create another
                is_active: true
            },
            {
                name: 'İtalyan Kadife - Zümrüt Yeşili',
                slug: 'italyan-kadife-zumrut',
                description: 'Döşemelik ve giyim için uygun, yüksek kaliteli kadife.',
                price: 850.00,
                fabric_type: 'Kadife',
                width_cm: 140,
                weight_gsm: 300,
                category_id: categoryId,
                is_active: true
            }
        ];

        const { error: prodError } = await supabase.from('products').insert(products);

        if (prodError) {
            return NextResponse.json({ error: prodError.message }, { status: 500 });
        }

        return NextResponse.json({ status: 'success', message: 'Seed data inserted' });

    } catch (error) {
        return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
    }
}
