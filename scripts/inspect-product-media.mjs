import { readdirSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import sharp from 'sharp';
const source = process.argv[2];
const files = readdirSync(source).filter(f => /advertisement.*\.mp4$/i.test(f)).sort();
mkdirSync('.cache/media-review', {recursive:true});
const tiles=[];
for (const [i,name] of files.entries()) {
  const out=`.cache/media-review/${i}.jpg`;
  execFileSync('ffmpeg',['-y','-v','error','-ss','2','-i',`${source}/${name}`,'-frames:v','1','-vf','scale=180:320',out]);
  tiles.push({input:await sharp(out).extend({top:25,bottom:0,left:0,right:0,background:'white'}).composite([{input:Buffer.from(`<svg width="180" height="25"><text x="10" y="18">VIDEO ${i}</text></svg>`),top:0,left:0}]).toBuffer(),left:(i%4)*180,top:Math.floor(i/4)*345});
  console.log(i,name);
}
await sharp({create:{width:720,height:690,channels:3,background:'white'}}).composite(tiles).jpeg().toFile('.cache/media-review/contact.jpg');
