import { cartItemSchema, type CartItem } from "./validation";
const key="nfc-shopping-bag-v1";
export function readCart():CartItem[]{try{const raw=JSON.parse(localStorage.getItem(key)||"[]");return cartItemSchema.array().max(20).parse(raw);}catch{return [];}}
export function writeCart(items:CartItem[]){localStorage.setItem(key,JSON.stringify(items));window.dispatchEvent(new Event("cart-updated"));}
export function addToCart(item:CartItem){const items=readCart();if(items.length>=20)throw new Error("Your bag can hold up to 20 different designs.");const found=items.find(i=>!i.logoId&&!item.logoId&&i.variantId===item.variantId);if(found)found.quantity=Math.min(50,found.quantity+item.quantity);else items.push(item);writeCart(items);}
function db():Promise<IDBDatabase>{return new Promise((resolve,reject)=>{const req=indexedDB.open("nfc-logo-drafts",1);req.onupgradeneeded=()=>req.result.createObjectStore("logos");req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(new Error("Logo storage is unavailable. Please allow browser storage."));});}
export async function saveLogo(id:string,file:Blob){const d=await db();await new Promise<void>((resolve,reject)=>{const t=d.transaction("logos","readwrite");t.objectStore("logos").put(file,id);t.oncomplete=()=>resolve();t.onerror=()=>reject(t.error);});d.close();}
export async function readLogo(id:string):Promise<Blob|undefined>{const d=await db();return new Promise((resolve,reject)=>{const r=d.transaction("logos").objectStore("logos").get(id);r.onsuccess=()=>{d.close();resolve(r.result);};r.onerror=()=>{d.close();reject(r.error);};});}
export async function removeLogo(id:string){const d=await db();const t=d.transaction("logos","readwrite");t.objectStore("logos").delete(id);t.oncomplete=()=>d.close();}

