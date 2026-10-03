import Link from "next/link";
import { ArrowUpRight, Star } from "lucide-react";
import type { FeaturedReview } from "@/lib/shop/reviews";
import type { Product } from "@/lib/shop/catalogue";

export function FeaturedReviews({reviews,products}:{reviews:FeaturedReview[];products:Product[]}){
 if(!reviews.length)return null;
 return <section className="featured-reviews" aria-labelledby="featured-reviews-title">
  <div className="featured-reviews-heading"><p className="shop-eyebrow">FROM THE COMMUNITY</p><h2 id="featured-reviews-title">Real experiences.<br/>In their own words.</h2><p>Recent published reviews from our customers.</p></div>
  <div className="featured-reviews-grid">{reviews.map(review=>{
   const product=products.find(product=>product.slug===review.product_slug);
   if(!product)return null;
   return <article key={review.id}>
    <div className="review-stars" aria-label={review.rating+" out of 5 stars"}>{[1,2,3,4,5].map(star=><Star key={star} size={17} fill={star<=review.rating?"currentColor":"none"} aria-hidden="true"/>)}</div>
    <blockquote>{review.body}</blockquote>
    <p><strong>{review.display_name}</strong>{review.verified_purchase&&<small>Verified purchase</small>}</p>
    <Link href={"/products/"+product.slug+"#reviews-title"}>{product.name}<ArrowUpRight size={17}/></Link>
   </article>;
  })}</div>
 </section>;
}
