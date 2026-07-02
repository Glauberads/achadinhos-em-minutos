const url = 'https://shopee.com.br/Panela-de-Press%C3%A3o-El%C3%A9trica-Digital-5-6-litros-Preta-ou-Inox-kian-i.563110312.22694663438?extraParam=123';
fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } })
  .then(res => res.text())
  .then(html => {
     const titleMatch = html.match(/<title>([^<]+)<\/title>/i) || html.match(/<meta property=\"og:title\" content=\"([^\"]+)\"/i);
     console.log('Title:', titleMatch ? titleMatch[1] : null);
     const imageMatch = html.match(/<meta property=\"og:image\" content=\"([^\"]+)\"/i) || html.match(/<meta name=\"twitter:image\" content=\"([^\"]+)\"/i);
     console.log('Image:', imageMatch ? imageMatch[1] : null);
  })
  .catch(console.error);
