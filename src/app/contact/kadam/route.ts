const VCARD = [
  "BEGIN:VCARD",
  "VERSION:3.0",
  "FN:Kadam Shoe",
  "N:Kadam Shoe;;;;",
  "ORG:Kadam Shoe",
  "TEL;TYPE=CELL:+916263267366",
  "ADR;TYPE=WORK:;;INFRONT OF GOVERNMENT HOSPITAL BURHAR;;;;",
  "LABEL;TYPE=WORK:INFRONT OF GOVERNMENT HOSPITAL BURHAR",
  "URL:https://www.instagram.com/kadamshoemart",
  "X-SOCIALPROFILE;TYPE=instagram:https://www.instagram.com/kadamshoemart",
  "END:VCARD",
  "",
].join("\r\n");

function vcardResponse(disposition: "inline" | "attachment") {
  return new Response(VCARD, {
    status: 200,
    headers: {
      "Content-Type": "text/vcard; charset=utf-8",
      "Content-Disposition": `${disposition}; filename="Kadam-Shoe.vcf"`,
      "Cache-Control": "public, max-age=300",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export function GET(request: Request) {
  const userAgent = request.headers.get("user-agent") ?? "";
  const isIOS = /iPhone|iPad|iPod/i.test(userAgent);
  const isAndroid = /Android/i.test(userAgent);
  const isSafari = /Safari/i.test(userAgent) && !/CriOS|FxiOS|EdgiOS|OPiOS/i.test(userAgent);

  if (isIOS && isSafari) {
    return vcardResponse("inline");
  }

  if (isAndroid) {
    return vcardResponse("attachment");
  }

  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover" />
  <meta name="robots" content="noindex,nofollow" />
  <title>Save Kadam Shoe</title>
  <style>
    *{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;background:#f5f5f7;color:#111;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif;padding:24px}.card{width:min(420px,100%);background:#fff;border-radius:24px;padding:28px;box-shadow:0 10px 40px rgba(0,0,0,.08);text-align:center}.logo{width:64px;height:64px;border-radius:18px;background:#111;color:#fff;display:grid;place-items:center;margin:0 auto 18px;font-weight:800;font-size:24px}h1{font-size:26px;margin:0 0 8px}.phone{margin:0 0 10px;color:#333;font-size:17px}.address{margin:0 0 12px;color:#666;font-size:14px;line-height:1.45}.social{display:inline-block;margin:0 0 24px;color:#111;font-size:14px;font-weight:600;text-decoration:none}.btn{display:block;width:100%;padding:16px 20px;border-radius:14px;background:#111;color:#fff;text-decoration:none;font-size:17px;font-weight:700}.small{margin-top:16px;font-size:13px;color:#8a8a8a}
  </style>
</head>
<body>
  <main class="card">
    <div class="logo">KS</div>
    <h1>Kadam Shoe</h1>
    <p class="phone">+91 62632 67366</p>
    <p class="address">📍 INFRONT OF GOVERNMENT HOSPITAL BURHAR</p>
    <a class="social" href="https://www.instagram.com/kadamshoemart" target="_blank" rel="noopener noreferrer">Instagram @kadamshoemart</a>
    <a class="btn" href="/contact/kadam.vcf">Save Contact</a>
    <div class="small">One tap opens the contact file supported by your device.</div>
  </main>
</body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
