"use client";
import { Player } from "@remotion/player";
import { ProductShowcase } from "@/remotion/product-showcase";
export default function ShowcasePlayer(){return <Player component={ProductShowcase} compositionWidth={800} compositionHeight={640} durationInFrames={240} fps={30} autoPlay loop initiallyMuted controls style={{width:"100%"}} acknowledgeRemotionLicense/>;}
