
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fwecgvsfbxzzobjkklul.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ3ZWNndnNmYnh6em9iamtrbHVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4MzEwMDEsImV4cCI6MjA4MzQwNzAwMX0.HfDtyf0HHQ6OSPNMUYAwnYhJRlAZuZhDpjv0ooK_ILk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testRLS() {
    console.log("Attempting to insert a test popup...");

    const testPopup = {
        title: "Test Popup From Script",
        content: "This is a test popup to check RLS policies.",
        button_text: "Test Button",
        button_link: "/",
        is_active: false
    };

    const { data, error } = await supabase
        .from("popups")
        .insert([testPopup])
        .select();

    if (error) {
        console.error("Insert Error:", error);
    } else {
        console.log("Insert Success:", data);
    }

    console.log("Reading back popups...");
    const { data: readData, error: readError } = await supabase
        .from("popups")
        .select("*");

    if (readError) {
        console.error("Read Error:", readError);
    } else {
        console.log(`Read ${readData?.length} popups after insert attempt.`);
    }
}

testRLS();
