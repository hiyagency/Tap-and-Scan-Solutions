import { createHash,timingSafeEqual } from "node:crypto";
const sha=(v:string)=>createHash("sha512").update(v).digest("hex");
export function payuRequestHash(fields:Record<string,string>,salt:string){return sha([fields.key,fields.txnid,fields.amount,fields.productinfo,fields.firstname,fields.email,...[1,2,3,4,5].map(n=>fields["udf"+n]||""),"","","","","",salt].join("|"));}
export function payuResponseHash(fields:Record<string,string>,salt:string){const parts=[salt,fields.status,"","","","","",...[5,4,3,2,1].map(n=>fields["udf"+n]||""),fields.email,fields.firstname,fields.productinfo,fields.amount,fields.txnid,fields.key];if(fields.additionalCharges)parts.unshift(fields.additionalCharges);return sha(parts.join("|"));}
export function validPayuHash(fields:Record<string,string>,salt:string){const expected=payuResponseHash(fields,salt);const actual=fields.hash||"";return /^[a-f0-9]{128}$/i.test(actual)&&timingSafeEqual(Buffer.from(actual.toLowerCase()),Buffer.from(expected));}
export function commandHash(key:string,command:string,value:string,salt:string){return sha([key,command,value,salt].join("|"));}
export function amountToPaise(value:string){if(!/^\d+(\.\d{1,2})?$/.test(value))throw new Error("Invalid payment amount");const [r,p=""]=value.split(".");const result=Number(r)*100+Number(p.padEnd(2,"0"));if(!Number.isSafeInteger(result))throw new Error("Invalid payment amount");return result;}

