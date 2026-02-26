import type { APIRoute } from 'astro';
import { supabase } from '../lib/supabase';

export const prerender = false;

const SITE_URL = 'https://slccuts.es';

export const GET: APIRoute = async () => {
    try {
        // Fetch all active products
        const { data: products } = await supabase
            .from('products')
            .select('slug, updated_at')
            .eq('active', true);

        // Fetch all active categories
        const { data: categories } = await supabase
            .from('categories')
            .select('slug, updated_at');

        // Fetch all published news
        const { data: news } = await supabase
            .from('news')
            .select('slug, updated_at')
            .eq('is_published', true);

        // Static pages
        const staticPages = [
            { loc: '', priority: '1.0', changefreq: 'daily' },
            { loc: 'shop/new', priority: '0.9', changefreq: 'daily' },
            { loc: 'shop/offers', priority: '0.9', changefreq: 'daily' },
            { loc: 'services', priority: '0.8', changefreq: 'weekly' },
            { loc: 'gallery', priority: '0.7', changefreq: 'weekly' },
            { loc: 'news', priority: '0.7', changefreq: 'daily' },
            { loc: 'contact', priority: '0.6', changefreq: 'monthly' },
            { loc: 'privacy', priority: '0.3', changefreq: 'yearly' },
            { loc: 'terms', priority: '0.3', changefreq: 'yearly' },
            { loc: 'devoluciones', priority: '0.3', changefreq: 'yearly' },
        ];

        // Build XML
        let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
        xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

        // Add static pages
        staticPages.forEach(page => {
            xml += '  <url>\n';
            xml += `    <loc>${SITE_URL}/${page.loc}</loc>\n`;
            xml += `    <changefreq>${page.changefreq}</changefreq>\n`;
            xml += `    <priority>${page.priority}</priority>\n`;
            xml += '  </url>\n';
        });



        // Add categories
        categories?.forEach((category: any) => {
            xml += '  <url>\n';
            xml += `    <loc>${SITE_URL}/shop/${category.slug}</loc>\n`;
            if (category.updated_at) {
                xml += `    <lastmod>${new Date(category.updated_at).toISOString().split('T')[0]}</lastmod>\n`;
            }
            xml += '    <changefreq>daily</changefreq>\n';
            xml += '    <priority>0.8</priority>\n';
            xml += '  </url>\n';
        });

        // Add news
        news?.forEach((article: any) => {
            xml += '  <url>\n';
            xml += `    <loc>${SITE_URL}/news/${article.slug}</loc>\n`;
            if (article.updated_at) {
                xml += `    <lastmod>${new Date(article.updated_at).toISOString().split('T')[0]}</lastmod>\n`;
            }
            xml += '    <changefreq>monthly</changefreq>\n';
            xml += '    <priority>0.6</priority>\n';
            xml += '  </url>\n';
        });

        xml += '</urlset>';

        return new Response(xml, {
            status: 200,
            headers: {
                'Content-Type': 'application/xml; charset=utf-8',
                'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
            }
        });

    } catch (error) {
        console.error('Sitemap generation error:', error);
        return new Response('Error generating sitemap', { status: 500 });
    }
};
