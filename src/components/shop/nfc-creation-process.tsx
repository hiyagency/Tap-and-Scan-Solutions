"use client";

import Image from "next/image";
import { useEffect, useId, useRef, useState } from "react";
import styles from "./nfc-creation-process.module.css";

const steps = [
  { title: "The NFC Base", description: "Your card starts with a clean NFC-enabled card containing the technology required for contactless interaction.", label: "Blank NFC card" },
  { title: "Your Design Is Printed", description: "Your selected design is produced as a high-quality printed layer created specifically for your card.", label: "Your printed design" },
  { title: "Applied With Precision", description: "The printed layer is carefully aligned and applied to the NFC card for a clean, edge-to-edge finished appearance.", label: "Two layers. One card." },
  { title: "Ready To Tap", description: "Your customized NFC card is finished, programmed and ready to use.", label: "Made for your next connection" },
];
const details = ["Contactless NFC functionality", "Standard wallet/card size", "Custom printed front design", "High-quality printed finish", "Always ready to tap — no battery or charging needed", "Lightweight and portable", "Custom programmed for your selected use-case", "Operating frequency: 13.56 MHz High Frequency (HF)", "Material: PCB Plastic", "Integrated circuit: NTAG213", "Memory: 180 bytes total (144 bytes user memory)", "Standards / protocols: ISO/IEC 14443 Type A · NFC Forum Type 2"];

function CardStage({ step, productImage, productName }: { step: number; productImage: string; productName: string }) {
  return <div className={styles.stage} data-step={step} aria-hidden="true">
    <div className={styles.cardAssembly}>
      <div className={styles.base}><span>NFC</span><small>YOUR CONNECTION STARTS HERE</small></div>
      <div className={styles.sticker}>
        <Image src={productImage} alt="" fill sizes="(max-width: 760px) 260px, 360px" className={styles.artwork}/>
        <div className={styles.printMask}/>
      </div>
      <div className={styles.waves}><i/><i/><i/></div>
    </div>
    <span className={styles.stageLabel}>{steps[step].label}</span>
    <span className={styles.productLabel}>{step > 0 ? productName : "NFC-enabled base"}</span>
  </div>;
}

export function NFCCreationProcess({ productImage, productName }: { productImage: string; productName: string }) {
  const [active, setActive] = useState(0);
  const section = useRef<HTMLElement>(null);
  const id = useId();
  useEffect(() => {
    const root = section.current;
    if (!root || !("IntersectionObserver" in window)) return;
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) { entry.target.setAttribute("data-visible", "true"); observer.unobserve(entry.target); }
      });
    }, { threshold: 0.25 });
    root.querySelectorAll("[data-process-step]").forEach(node => observer.observe(node));
    return () => observer.disconnect();
  }, []);
  return <section ref={section} className={styles.process} aria-labelledby={id}>
    <header className={styles.heading}><p className="shop-eyebrow">THE MAKING OF YOUR CARD</p><h2 id={id}>How Your NFC Card Is Made</h2><p>From a blank NFC card to your personalized design — see how we create your card.</p></header>
    <div className={styles.sequence}>
      <div className={styles.desktopVisual}>
        <CardStage step={active} productImage={productImage} productName={productName}/>
        <p className={styles.caption}>Layer illustration · Product artwork preview. Your final layout is confirmed before production.</p>
      </div>
      <ol className={styles.steps} aria-label="Card creation steps">
        {steps.map((step, index) => <li key={step.title} className={styles.step} data-process-step data-active={index === active}>
          <div className={styles.mobileVisual}><CardStage step={index} productImage={productImage} productName={productName}/></div>
          <div className={styles.stepText}><span className={styles.number}>{String(index + 1).padStart(2, "0")}</span><div><h3>{step.title}</h3><p>{step.description}</p><button type="button" className={styles.stepButton} aria-pressed={active === index} onClick={() => setActive(index)} aria-label={`Show step ${index + 1}: ${step.title}`}>{active === index ? "Viewing this step" : "View this step"}<span aria-hidden="true"> ↗</span></button></div></div>
        </li>)}
      </ol>
    </div>
    <p className={styles.mobileCaption}>Layer illustration · Product artwork preview. Your final layout is confirmed before production.</p>
    <div className={styles.details}><div><p className="shop-eyebrow">NFC SMART CARD</p><h2>Product Details</h2></div><ul>{details.map(detail => <li key={detail}>{detail}</li>)}</ul></div>
    <div className={styles.trust}><h3>Made For Everyday Use</h3><p>Each NFC card is individually prepared, customized and checked before dispatch.</p></div>
  </section>;
}
