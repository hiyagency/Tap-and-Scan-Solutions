import { mkdirSync, readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import sharp from 'sharp';
const source=process.argv[2];
const temp=process.argv[3];
const videos=readdirSync(source).filter(f=>/advertisement.*\.mp4$/i.test(f)).sort();
const assets=[
 ['whatsapp','238e5e4c-97e4-47e5-b358-0797a09c6988',7],
 ['multi-link-custom','b4a37b1e-3a63-4948-a2bd-396583ce8808',2],
 ['multi-link-classic','f3933847-69d9-4846-a8f7-0d1561e837b4',6],
 ['linkedin','2b4a462e-6e0c-46b9-9a4a-a23631744157',1],
 ['zomato','7584f221-c4d9-4a73-8cd4-e756d28083e9',3],
 ['instagram','5a11b56a-a16f-4d80-aa9d-a4154e88adf4',4],
 ['google-reviews','54415329-f726-4fc9-b0ef-d9f7e91ad9f3',0],
 ['facebook','a6af5f5c-206b-4964-a486-bbf366c35f61',5],
];
mkdirSync('public/shop',{recursive:true});
for(const [slug,id,index] of assets){
 await sharp(`${temp}/codex-clipboard-${id}.jpg`).resize(750,750,{fit:'inside',withoutEnlargement:true}).webp({quality:88}).toFile(`public/shop/${slug}.webp`);
 execFileSync('ffmpeg',['-y','-v','error','-i',`${source}/${videos[index]}`,'-an','-vf','scale=480:854:force_original_aspect_ratio=decrease,pad=540:960:(ow-iw)/2:(oh-ih)/2:color=0xf1f1ef,setsar=1','-c:v','libx264','-crf','25','-preset','fast','-movflags','+faststart',`public/shop/${slug}.mp4`]);
 console.log(slug);
}
