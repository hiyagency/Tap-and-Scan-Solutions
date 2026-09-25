import {readdirSync,readFileSync,writeFileSync} from 'node:fs';
import sharp from 'sharp';
function walk(dir){for(const entry of readdirSync(dir,{withFileTypes:true})){const p=dir+'/'+entry.name;if(entry.isDirectory())walk(p);else if(/\.(tsx?|css)$/.test(p)){const source=readFileSync(p,'utf8');const out=source.replaceAll('NFC BY ABHIGYAN','NFC.HIY').replaceAll('nfcbyabhigyan','nfc.hiy').replaceAll('/brand/tap-and-scan-logo.png','/brand/nfc-hiy.webp').replaceAll('<strong>NFC BY</strong><small>ABHIGYAN</small>','<strong>NFC.HIY</strong><small>POWERED BY HIY AGENCY</small>');if(out!==source)writeFileSync(p,out);}}}
walk('src');
const source=process.argv[2];
await sharp(source).resize(500,500).webp({quality:90}).toFile('public/brand/nfc-hiy.webp');
await sharp(source).extract({left:440,top:305,width:390,height:415}).resize(180,180,{fit:'contain',background:'#000'}).png().toFile('src/app/icon.png');

