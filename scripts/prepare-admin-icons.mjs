import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
await mkdir('public/admin/icons', { recursive: true });
for (const [name, size, inset] of [['icon-192',192,24],['icon-512',512,64],['maskable-512',512,104],['apple-touch-icon',180,24]]) {
  const mark = await sharp('src/app/icon.png').resize(size-inset*2,size-inset*2,{fit:'contain',background:'#000'}).png().toBuffer();
  await sharp({create:{width:size,height:size,channels:4,background:'#000'}}).composite([{input:mark,gravity:'center'}]).png().toFile(`public/admin/icons/${name}.png`);
}
