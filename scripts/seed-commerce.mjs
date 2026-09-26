import { createClient } from '@supabase/supabase-js';
import { catalogue } from '../src/lib/shop/catalogue.ts';
import { keychains } from '../src/lib/shop/keychains.ts';
if(!process.env.NEXT_PUBLIC_SUPABASE_URL||!process.env.SUPABASE_SERVICE_ROLE_KEY)throw new Error('Load the intended environment before seeding.');
const db=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY);
const products=[...catalogue,...keychains];
const {error}=await db.from('shop_products').upsert(products.map((p,i)=>({slug:p.slug,position:i,data:p})),{onConflict:'slug',ignoreDuplicates:true});
if(error)throw new Error(error.message);
console.log(`${products.length} catalogue entries seeded. Existing product edits were preserved.`);
