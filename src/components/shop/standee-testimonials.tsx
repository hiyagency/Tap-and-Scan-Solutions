"use client";
import Image from "next/image";
import { useRef } from "react";
import { Quote, ChevronLeft, ChevronRight } from "lucide-react";

const testimonials=[
 {name:"Dr Vinay Dwivedi",image:"/shop/standee-oro-care.webp",alt:"Oro Care standee installation",quote:"I had 10 reviews earlier. Within just one month, I gained 100 Google Maps reviews and massive Instagram followers."},
 {name:"La Pino’z",image:"/shop/standee-la-pinoz.webp",alt:"La Pino’z custom standee",quote:"Helped us rank #1 on Google Maps within two months."},
 {name:"Kidzee",image:"/shop/standee-kidzee.webp",alt:"Kidzee standee outside the preschool",quote:"Helped us rank among the top playschools in our city."},
];

export function StandeeTestimonials(){
 const row=useRef<HTMLDivElement>(null);
 const move=(direction:number)=>{
  const element=row.current;if(!element)return;
  const step=element.children.length>1?(element.children[1] as HTMLElement).offsetLeft-(element.children[0] as HTMLElement).offsetLeft:element.clientWidth;
  element.scrollBy({left:direction*step,behavior:window.matchMedia("(prefers-reduced-motion: reduce)").matches?"instant":"smooth"});
 };
 return <><div ref={row} id="standee-review-strip" className="standee-customer-stories" role="region" aria-label="Customer video and photo reviews, scroll horizontally" tabIndex={0}>
  <div className="standee-customer-video"><video src="/shop/standee-customer-film.mp4" poster="/shop/standee-review-poster.webp" controls playsInline preload="metadata" aria-label="The Outfit Store customer video review"/></div>
  {testimonials.map(review=><article className="standee-testimonial" key={review.name}>
   <Image src={review.image} alt={review.alt} width={600} height={800} sizes="(max-width:700px) 78vw, 25vw"/>
   <div><Quote size={22} aria-hidden="true"/><blockquote>{review.quote}</blockquote><p>{review.name}</p></div>
  </article>)}
 </div><div className="standee-review-controls"><button type="button" aria-label="Previous customer review" aria-controls="standee-review-strip" onClick={()=>move(-1)}><ChevronLeft size={20}/></button><button type="button" aria-label="Next customer review" aria-controls="standee-review-strip" onClick={()=>move(1)}><ChevronRight size={20}/></button></div></>;
}
