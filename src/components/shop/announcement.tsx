import Link from "next/link";
import { CARD_OFFER } from "@/lib/shop/offers";
export function ShopAnnouncement(){if(!CARD_OFFER.enabled)return null;return <div className="commerce-bar" role="region" aria-label="Shop offer"><strong>{CARD_OFFER.title}</strong><span>{CARD_OFFER.description}</span><Link href="/#collection">Explore cards</Link></div>;}
