"use client";
import Image from "next/image";
import "./standee-media.css";
import { useState } from "react";
import { ChevronLeft, ChevronRight, Play } from "lucide-react";

const slides = [
  { type:"image", src:"/shop/standee-kidzee-studio-v1.webp", label:"Kidzee", alt:"Studio presentation of the yellow Kidzee NFC and smart QR standee" },
  { type:"image", src:"/shop/standee-la-pinoz-studio-v1.webp", label:"La Pino’z Pizza", alt:"Studio presentation of the La Pino’z Pizza NFC standee" },
  { type:"image", src:"/shop/standee-fursat-studio-v1.webp", label:"Fursat café", alt:"Studio presentation of the Fursat café acrylic standee" },
  { type:"image", src:"/shop/standee-oro-care-studio-v1.webp", label:"Oro Care", alt:"Studio presentation of the Oro Care NFC and QR standee" },
  { type:"image", src:"/shop/standee-tos-studio-v1.webp", label:"The Outfit Store", alt:"Studio presentation of the pink Outfit Store NFC and QR standee" },
  { type:"video", src:"/shop/smart-nfc-standee.mp4", poster:"/shop/standee-kidzee.webp", label:"Kidzee standee film", alt:"Short film of the Kidzee standee" },
] as const;

export function StandeeGallery(){
 const [index,setIndex]=useState(0);const slide=slides[index];
 const change=(next:number)=>setIndex((next+slides.length)%slides.length);
 return <section className="product-media standee-gallery" aria-label="Smart NFC Standee media">
  <div className="standee-stage" key={slide.src}>
   {slide.type==="image"?<Image src={slide.src} alt={slide.alt} width={1200} height={900} priority={index===0} sizes="(max-width:700px) 90vw, 50vw"/>:<video src={slide.src} poster={slide.poster} controls playsInline preload="none" aria-label={slide.alt}/>}
   <span className="standee-stage-label">{String(index+1).padStart(2,"0")} / {String(slides.length).padStart(2,"0")} · {slide.label}</span>
  </div>
  <div className="standee-gallery-controls"><div className="standee-gallery-tabs" role="group" aria-label="Select standee media">{slides.map((item,i)=><button key={item.src} type="button" aria-label={item.label} aria-pressed={index===i} onClick={()=>change(i)}>{item.type==="video"?<Play size={16}/>:<Image src={item.src} width={52} height={52} alt=""/>}<span>{item.label}</span></button>)}</div><div className="standee-gallery-arrows"><button type="button" aria-label="Previous media" onClick={()=>change(index-1)}><ChevronLeft/></button><button type="button" aria-label="Next media" onClick={()=>change(index+1)}><ChevronRight/></button></div></div>
  <p>AI-enhanced catalogue presentations based on our installations. Artwork and QR patterns are illustrative; your final design is confirmed before production.</p>
  <details className="standee-originals"><summary>See the original installation photos</summary><div>{["kidzee","la-pinoz","fursat","oro-care","tos"].map(name=><a key={name} href={"/shop/standee-"+name+".webp"} target="_blank" rel="noreferrer"><Image src={"/shop/standee-"+name+".webp"} width={180} height={240} alt={name.replaceAll("-"," ")+" original installation"} loading="lazy"/></a>)}</div><a href="https://www.instagram.com/p/DcL_Kt8mNNV/" target="_blank" rel="noreferrer">Original Instagram post</a></details>
 </section>;
}
