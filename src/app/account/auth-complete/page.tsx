"use client";
import { useEffect } from "react";
import Link from "next/link";
export default function AuthComplete(){useEffect(()=>{if(window.opener){window.opener.postMessage({type:"nfc-google-signed-in"},location.origin);window.close();}},[]);return <main style={{padding:40}}><h1>You’re signed in.</h1><p>You can close this window and continue your checkout.</p><Link href="/checkout">Continue checkout</Link></main>;}
