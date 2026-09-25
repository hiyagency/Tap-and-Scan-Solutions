"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
export function RefreshOrder({id,paid,shipped}:{id:string;paid:boolean;shipped:boolean}){const [busy,setBusy]=useState(false),[message,setMessage]=useState("");const router=useRouter();return <><button className="shop-button" disabled={busy||paid&&!shipped} onClick={async()=>{setBusy(true);try{const r=await fetch("/api/shop/orders/"+id+"/refresh",{method:"POST"});const d=await r.json();if(!r.ok)throw new Error(d.error);setMessage("Updates checked.");router.refresh();}catch(e){setMessage((e as Error).message);}finally{setBusy(false);}}}>{busy?"Checking…":"Refresh status"}</button>{message&&<p role="status">{message}</p>}</>;}

