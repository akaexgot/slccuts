
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fwecgvsfbxzzobjkklul.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ3ZWNndnNmYnh6em9iamtrbHVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4MzEwMDEsImV4cCI6MjA4MzQwNzAwMX0.HfDtyf0HHQ6OSPNMUYAwnYhJRlAZuZhDpjv0ooK_ILk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkPopups() {
    console.log("Checking popups...");
    const { data, error } = await supabase
        .from("popups")
        .select("*");

    if (error) {
        console.error("Error fetching popups:", error);
    } else {
        console.log(`Found ${data?.length} popups.`);
        if (data && data.length > 0) {
            console.log("First popup details:", JSON.stringify(data[0], null, 2));
            const activePopups = data.filter(p => p.is_active);
            console.log(`Active popups count: ${activePopups.length}`);
        } else {
            console.log("No popups found in database.");
        }
    }
}

checkPopups();
