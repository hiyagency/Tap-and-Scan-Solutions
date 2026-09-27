import { requireOwner } from "@/lib/admin-auth";
import { commerceDb } from "@/lib/shop/server";
import { moderateReview } from "@/app/admin/review-actions";
export default async function ReviewAdmin(){
 await requireOwner();const db=commerceDb();
 const {data,error}=await db.from("shop_reviews").select("*").neq("status","uploading").order("created_at",{ascending:false}).limit(100);
 return <main className="admin-main"><h1>Product reviews</h1><p>Publish genuine reviews of every rating. Reject spam, private information or irrelevant submissions.</p>{error?<p>The reviews database update needs to be applied.</p>:!data?.length?<p>No reviews submitted yet.</p>:await Promise.all(data.map(async r=><article className="admin-panel" key={r.id}><h2>{r.product_slug} · {r.rating}/5</h2><p>{r.display_name} · {r.status}{r.verified_purchase?" · Verified purchase":""}</p><p style={{whiteSpace:"pre-wrap"}}>{r.body}</p><div className="review-photos">{await Promise.all((r.photos as string[]).map(async path=>{const {data}=await db.storage.from("review-photos").createSignedUrl(path,600);return data?<a href={data.signedUrl} key={path} target="_blank" rel="noreferrer">View customer photo</a>:null;}))}</div><form action={moderateReview}><input type="hidden" name="id" value={r.id}/><button name="status" value="approved">Publish</button> <button name="status" value="rejected">Hide / reject</button></form></article>))}</main>;
}
