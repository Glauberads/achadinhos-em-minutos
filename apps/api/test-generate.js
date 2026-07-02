const { creativeStudioService } = require('./dist/services/creative-studio.service');
const { supabaseAdmin } = require('./dist/lib/supabase');

async function test() {
  try {
    console.log("Fetching user...");
    const { data: users, error } = await supabaseAdmin.auth.admin.listUsers();
    if (error || !users.users.length) {
      console.log("No users found.", error);
      return;
    }
    const userId = users.users[0].id;
    console.log("Using user ID:", userId);

    console.log("Generating creative...");
    const url = "https://shopee.com.br/produto";
    const result = await creativeStudioService.generateFromLink(url, "Oferta Relâmpago", userId);
    
    console.log("SUCCESS:", JSON.stringify(result, null, 2));
  } catch (err) {
    console.error("FAILED!");
    console.error(err);
    if (err.response) {
      console.error("Response data:", err.response.data);
    }
  }
}

test();
