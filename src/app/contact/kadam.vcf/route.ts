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

export function GET() {
  return new Response(VCARD, {
    status: 200,
    headers: {
      "Content-Type": "text/vcard; charset=utf-8",
      "Content-Disposition": 'attachment; filename="Kadam-Shoe.vcf"',
      "Cache-Control": "public, max-age=300",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
