import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Manual env parsing
const envPath = path.join(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    const [key, ...value] = line.split('=');
    if (key && value) env[key.trim()] = value.join('=').trim().replace(/^["']|["']$/g, '');
});

const supabaseUrl = env.PUBLIC_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || env.PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase env vars in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkGallery() {
    const { data, error } = await supabase
        .from('gallery_images')
        .select('id, image_url, active, created_at')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching gallery:', error);
        return;
    }

    console.log('--- GALLERY IMAGES ---');
    data.forEach(img => {
        console.log(`ID: ${img.id} | Date: ${img.created_at} | Active: ${img.active} | URL: ${img.image_url}`);
    });
}

checkGallery();
