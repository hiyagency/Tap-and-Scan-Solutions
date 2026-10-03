import "server-only";
import { commandHash,payuRequestHash,validPayuHash,amountToPaise } from "./payu-hash";
import { commerceDb } from "./server";
function config(){const key=process.env.PAYU_KEY,salt=process.env.PAYU_SALT;if(!key||!salt)throw new Error("Payments are not configured.");return {key,salt,live:process.env.PAYU_ENV==="production"};}
export function paymentForm(order:{id:string;total_paise:number;email:string;address:{name:string;phone:string}},origin:string){const {key,salt,live}=config();const fields:Record<string,string>={key,txnid:order.id.replaceAll("-",""),amount:(order.total_paise/100).toFixed(2),productinfo:"NFC.HIY order",firstname:order.address.name,email:order.email,phone:order.address.phone,surl:origin+"/api/shop/payu/callback",furl:origin+"/api/shop/payu/callback",udf1:order.id};fields.hash=payuRequestHash(fields,salt);return {action:live?"https://secure.payu.in/_payment":"https://test.payu.in/_payment",fields};}
export async function reconcilePayment(txnid:string){const {key,salt,live}=config();const db=commerceDb();const {data:payment}=await db.from("shop_payments").select("order_id").eq("txnid",txnid).eq("provider","payu").maybeSingle();if(!payment)throw new Error("Unknown payment.");
 const body=new URLSearchParams({key,command:"verify_payment",var1:txnid,hash:commandHash(key,"verify_payment",txnid,salt)});
 const res=await fetch(live?"https://info.payu.in/merchant/postservice?form=2":"https://test.payu.in/merchant/postservice.php?form=2",{method:"POST",body,cache:"no-store",signal:AbortSignal.timeout(15000)});
 if(!res.ok)throw new Error("Payment verification is temporarily unavailable.");
 const result=await res.json();const verified=result.transaction_details?.[txnid];
 if(!verified||String(result.status)!=="1")throw new Error("Payment verification is pending.");
 if(verified.status==="success"){
  if(verified.txnid&&verified.txnid!==txnid)throw new Error("Payment reference mismatch.");
  const provider=String(verified.mihpayid||"");if(!provider)throw new Error("Missing payment reference.");
  const amount=amountToPaise(String(verified.amt??verified.amount));
  const {error}=await db.rpc("shop_confirm_payment",{p_txnid:txnid,p_provider_id:provider,p_amount:amount});if(error)throw new Error("Payment reconciliation requires support.");
 } else if(["failure","failed"].includes(verified.status)){
  await db.from("shop_orders").update({payment_status:"failed"}).eq("id",payment.order_id).eq("payment_status","pending");
 }
 return payment.order_id as string;
}
export async function processCallback(fields:Record<string,string>){const {key,salt}=config();if(fields.key!==key||!validPayuHash(fields,salt))throw new Error("Invalid payment signature.");return reconcilePayment(fields.txnid);}

