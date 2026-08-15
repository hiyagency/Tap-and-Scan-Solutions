import Image from "next/image";
import Link from "next/link";
import {
  ArrowDown,
  ArrowRight,
  AtSign,
  BadgeIndianRupee,
  BriefcaseBusiness,
  Check,
  ChefHat,
  CreditCard,
  Droplets,
  GraduationCap,
  Layers3,
  MapPinCheck,
  MessageSquareText,
  Nfc,
  PackageCheck,
  QrCode,
  ShieldCheck,
  Sparkles,
  Store,
  Wrench,
} from "lucide-react";
import { LeadForm } from "@/components/site/lead-form";

const services = [
  { icon: Sparkles, title: "U2L.AI-generated QR", copy: "Custom-designed through U2L.AI by default for high scannability, active tracking and a visual fit with your brand." },
  { icon: Droplets, title: "Waterproof builds", copy: "Made for counters, tables and real-world handling—not just a showroom photograph." },
  { icon: Nfc, title: "Premium NFC tags", copy: "One tap opens the exact action you choose, with QR available as a universal fallback." },
  { icon: Wrench, title: "Custom designed & engraved", copy: "Every stand and card is shaped around your brand, destination and physical space." },
  { icon: Layers3, title: "Backup module included", copy: "A practical backup helps you recover quickly if the primary design is damaged." },
  { icon: PackageCheck, title: "Acrylic stands", copy: "High-quality desk and table displays with a stable, durable and premium finish." },
  { icon: BadgeIndianRupee, title: "Low-cost replacements", copy: "Replace a damaged sticker or updated destination without rebuilding everything." },
  { icon: CreditCard, title: "Cards & custom formats", copy: "NFC cards, scanner cards and tailored solutions for unusual business workflows." },
];

const useCases = [
  { icon: ChefHat, label: "Restaurants & cafés", title: "The menu is one scan away.", copy: "Keep tables cleaner, update menus faster and connect diners to the right page." },
  { icon: MapPinCheck, label: "Local businesses", title: "Make genuine reviews easier.", copy: "Reduce the steps between a happy customer and your Google Maps review screen." },
  { icon: AtSign, label: "Creators & retail", title: "Turn visits into follows.", copy: "Open Instagram, catalogues or current campaigns while the customer is still engaged." },
  { icon: BriefcaseBusiness, label: "Professionals", title: "Your work, ready to share.", copy: "Let clients tap into services, portfolios, booking links, documents or contact details." },
  { icon: GraduationCap, label: "Education", title: "Material without the search.", copy: "Give learners direct access to notes, assignments, resource libraries or gated pages." },
  { icon: Store, label: "Custom workflows", title: "Build the route you need.", copy: "Events, real estate, product instructions, payment pages and tailored destinations." },
];

const process = [
  ["01", "Brief", "Tell us the physical setting, audience and action you want."],
  ["02", "Design", "We generate the U2L.AI QR, create the branded QR/NFC layout and share a proof."],
  ["03", "Build", "The approved design is printed, engraved and assembled."],
  ["04", "Deliver", "You receive the finished product, backup and setup guidance."],
  ["05", "Support", "Destinations or stickers can be updated, with optional monthly scan analytics and support."],
];

const stories = [
  { tag: "Illustrative scenario · Café", quote: "A table stand opens the current menu, while the same unit makes it easy for a satisfied guest to leave a genuine review." },
  { tag: "Illustrative scenario · Clinic", quote: "Reception visitors can scan for services, tap to save details and reach the clinic’s verified social profiles without searching." },
  { tag: "Illustrative scenario · Coach", quote: "A single NFC card opens the latest course page, private learner material or a consultation booking link." },
];

export default function Home() {
  return (
    <main>
      <header className="site-header">
        <Link className="brand" href="#top" aria-label="TAP AND SCAN SOLUTIONS home">
          <Image src="/brand/tap-and-scan-logo.png" alt="" width={64} height={64} priority />
          <span><strong>TAP AND SCAN</strong><small>SOLUTIONS</small></span>
        </Link>
        <nav aria-label="Primary navigation">
          <Link href="#technology">U2L.AI</Link>
          <Link href="#solutions">Solutions</Link>
          <Link className="nav-cta" href="#enquire">Start a project</Link>
        </nav>
      </header>

      <section className="hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow"><span /> U2L.AI QR intelligence · built in by default</p>
          <h1>Turn one <em>tap</em> into the next customer action.</h1>
          <p className="hero-intro">Every custom QR code starts with U2L.AI for high scannability and active tracking, then moves people to your menu, reviews, Instagram, portfolio or private material—instantly.</p>
          <div className="hero-actions">
            <Link className="button button-primary" href="#enquire">Get a custom setup <ArrowDown aria-hidden="true" size={18} /></Link>
            <a className="text-link" href="tel:+916261565667">Talk to Abhigyan</a>
          </div>
          <div className="hero-proof" aria-label="Product highlights">
            <span><Sparkles aria-hidden="true" /> U2L.AI generated + tracked</span>
            <span><ShieldCheck aria-hidden="true" /> Waterproof builds</span>
          </div>
        </div>

        <div className="hero-media">
          <video autoPlay muted loop playsInline poster="/media/workshop-poster.jpg" aria-label="A phone tapping a custom TAP AND SCAN product">
            <source src="/media/workshop-loop.webm" type="video/webm" />
            <source src="/media/workshop-loop.mp4" type="video/mp4" />
          </video>
          <div className="media-stamp"><strong>01</strong><span>Designed<br />to be used</span></div>
          <p className="media-caption">Real product footage · no stock imagery</p>
        </div>
      </section>

      <section className="preview-strip" aria-label="Core promise">
        <p>One physical touchpoint.</p>
        <p>Every important destination.</p>
      </section>

      <section className="u2l-system" id="technology">
        <div className="u2l-layout section-shell">
          <header className="u2l-intro">
            <div className="u2l-lockup">
              <span className="u2l-logo-frame"><Image src="/brand/u2l-ai-logo.png" alt="U2L.AI official logo" width={128} height={128} /></span>
              <span><strong>U2L.AI</strong><small>QR intelligence layer</small></span>
            </div>
            <p className="eyebrow"><span /> The system behind the product</p>
            <h2>AI is already behind every scan.</h2>
            <p>U2L.AI is not an optional styling effect added at the end. It is the default QR generation and tracking layer behind every TAP AND SCAN setup.</p>
          </header>

          <div className="u2l-specs" aria-label="U2L.AI QR capabilities">
            <article><span>01 / Generate</span><h3>Custom AI QR design</h3><p>Generated around the intended destination and visual identity, then checked for dependable real-world scanning.</p></article>
            <article><span>02 / Track</span><h3>Active from day one</h3><p>Tracking is built into the QR setup by default, so scan activity can become useful business information.</p></article>
            <article><span>03 / Understand</span><h3>See what gets scanned</h3><p>Add monthly analytics access for scan counts, activity trends and performance across tracked QR touchpoints.</p></article>
          </div>

          <aside className="u2l-analytics">
            <div><small>Separate monthly service</small><strong>Scan analytics</strong></div>
            <p>Clients can access ongoing QR scan analytics for a small monthly fee. The physical setup remains a one-time charge.</p>
            <ul><li><Check aria-hidden="true" /> Number of QR scans</li><li><Check aria-hidden="true" /> Period and activity trends</li><li><Check aria-hidden="true" /> Per-code performance visibility</li></ul>
            <Link href="#enquire">Ask for tracked QR analytics <ArrowRight aria-hidden="true" size={17} /></Link>
          </aside>
        </div>
      </section>

      <section className="problem-section section-shell" id="work">
        <div className="section-kicker"><span>02</span><p>The friction</p></div>
        <div className="problem-copy">
          <h2>Your customer is ready. The link is buried.</h2>
          <p>Menus hide in PDFs. Review pages take four searches. Instagram handles get mistyped. Important material sits inside a long message thread.</p>
        </div>
        <div className="problem-list" aria-label="Common customer friction">
          <p><span>01</span> Search for the business</p>
          <p><span>02</span> Find the correct profile</p>
          <p><span>03</span> Locate the right action</p>
          <p className="problem-answer"><span><Check aria-hidden="true" /></span> Or simply tap.</p>
        </div>
      </section>

      <section className="tap-story">
        <div className="tap-heading section-shell">
          <p className="eyebrow light"><span /> One touch, one clear route</p>
          <h2>Physical presence.<br /><em>Digital momentum.</em></h2>
        </div>
        <div className="action-path section-shell">
          <article><span className="action-icon"><Nfc aria-hidden="true" /></span><small>01</small><h3>Tap or scan</h3><p>The interaction is immediate and familiar.</p></article>
          <ArrowRight className="path-arrow" aria-hidden="true" />
          <article><span className="action-icon"><QrCode aria-hidden="true" /></span><small>02</small><h3>Open the right page</h3><p>No searching, typing or explaining where to go.</p></article>
          <ArrowRight className="path-arrow" aria-hidden="true" />
          <article><span className="action-icon"><MessageSquareText aria-hidden="true" /></span><small>03</small><h3>Complete the action</h3><p>View, follow, review, book, learn or contact.</p></article>
        </div>
      </section>

      <section className="proof-section section-shell">
        <div className="proof-grid">
          <figure className="proof-main">
            <Image src="/media/workshop-process.jpg" alt="A TAP AND SCAN product being designed at the workshop" width={1400} height={788} sizes="(max-width: 900px) 100vw, 66vw" />
            <figcaption><span>Designed in-house</span><p>The route starts with your business, not a template.</p></figcaption>
          </figure>
          <figure className="proof-side">
            <Image src="/media/acrylic-build.jpg" alt="A custom acrylic QR and NFC stand in production" width={900} height={1600} sizes="(max-width: 900px) 100vw, 32vw" />
            <figcaption><span>Built to be handled</span><p>Printed, fitted and finished for real counters and tables.</p></figcaption>
          </figure>
        </div>
      </section>

      <section className="services-section section-shell" id="solutions">
        <div className="section-heading split-heading">
          <div><div className="section-kicker"><span>03</span><p>The build</p></div><h2>Useful details,<br />built in.</h2></div>
          <p>From the first scan to replacement support, the product is designed as a working system—not a decorative QR print.</p>
        </div>
        <div className="services-grid">
          {services.map((service, index) => {
            const Icon = service.icon;
            return <article key={service.title}><div><Icon aria-hidden="true" /><span>{String(index + 1).padStart(2, "0")}</span></div><h3>{service.title}</h3><p>{service.copy}</p></article>;
          })}
        </div>
      </section>

      <section className="material-break">
        <div className="material-media">
          <Image src="/media/product-range.jpg" alt="A range of real custom QR and NFC cards" fill sizes="100vw" />
          <p>Real builds · custom destinations · practical backups</p>
        </div>
      </section>

      <section className="use-cases section-shell">
        <div className="section-heading">
          <div className="section-kicker"><span>04</span><p>Where it works</p></div>
          <h2>Put the next step<br />within reach.</h2>
        </div>
        <div className="case-grid">
          {useCases.map((item) => {
            const Icon = item.icon;
            return <article key={item.label}><Icon aria-hidden="true" /><p className="case-label">{item.label}</p><h3>{item.title}</h3><p>{item.copy}</p><ArrowRight aria-hidden="true" className="case-arrow" /></article>;
          })}
        </div>
      </section>

      <section className="pricing-model section-shell">
        <div className="pricing-card one-time">
          <small>Physical solutions</small><strong>One-time</strong><p>Custom design, QR/NFC setup, acrylic product and agreed backup module.</p><ul><li><Check /> Quote-based</li><li><Check /> Replacement options</li><li><Check /> Custom formats</li></ul>
        </div>
        <div className="pricing-card monthly">
          <small>Separate optional services</small><strong>Monthly</strong><p>Low monthly plans unlock U2L.AI scan analytics and, when selected, responsible AI assistance for genuine customer feedback.</p><ul><li><Check /> Scan counts & activity trends</li><li><Check /> Per-code tracking visibility</li><li><Check /> Customer-approved feedback drafts</li></ul>
        </div>
      </section>

      <section className="ai-section section-shell">
        <div className="ai-mark"><Sparkles aria-hidden="true" /><span>AI, with a human decision</span></div>
        <div><p className="eyebrow"><span /> Monthly add-on</p><h2>Help customers say what they genuinely mean.</h2></div>
        <div className="ai-copy"><p>Our AI-assisted review service can turn real feedback into a useful draft. The customer reviews the wording, decides the rating and posts it themselves.</p><p className="policy-note"><ShieldCheck aria-hidden="true" /> Designed around genuine, unbiased customer experiences—not manufactured ratings.</p></div>
      </section>

      <section className="process-section section-shell">
        <div className="section-heading split-heading">
          <div><div className="section-kicker"><span>05</span><p>The process</p></div><h2>From brief<br />to first tap.</h2></div>
          <p>A clear approval process keeps the destination, physical format and final design aligned before production.</p>
        </div>
        <div className="process-list">
          {process.map(([number, title, copy]) => <article key={number}><span>{number}</span><h3>{title}</h3><p>{copy}</p></article>)}
        </div>
      </section>

      <section className="story-proof section-shell">
        <div className="story-media">
          <video muted loop playsInline controls poster="/media/product-spread.jpg" aria-label="Real TAP AND SCAN product range footage"><source src="/media/product-loop.mp4" type="video/mp4" /></video>
          <span>Tap to see the actual range</span>
        </div>
        <div className="story-copy">
          <p className="eyebrow"><span /> What this can look like</p>
          <h2>Example outcomes,<br />not invented endorsements.</h2>
          <div className="story-list">
            {stories.map((story) => <blockquote key={story.tag}><small>{story.tag}</small><p>“{story.quote}”</p></blockquote>)}
          </div>
        </div>
      </section>

      <section className="trust-section section-shell">
        <Image src="/brand/tap-and-scan-logo.png" alt="TAP AND SCAN SOLUTIONS official logo" width={260} height={260} />
        <div><p className="eyebrow"><span /> The people behind the product</p><h2>Backed by HIY Agency.</h2><p>TAP AND SCAN SOLUTIONS is led by sole proprietor <strong>Abhigyan Pandey</strong> and backed by the practical digital experience of HIY Agency.</p></div>
        <a className="button button-outline" href="mailto:hello@hiy.agency">hello@hiy.agency <ArrowRight aria-hidden="true" size={18} /></a>
      </section>

      <section className="enquiry-section" id="enquire">
        <div className="section-shell enquiry-grid">
          <div className="enquiry-copy">
            <div className="section-kicker inverse"><span>06</span><p>Your setup</p></div>
            <h2>Where should the tap take your customer?</h2>
            <p>Share the business and destination. We will suggest the right U2L.AI QR, NFC and physical format, with optional monthly scan analytics.</p>
            <div className="direct-links">
              <a href="tel:+916261565667"><span>Call</span>+91 62615 65667</a>
              <a href="https://wa.me/916261565667" target="_blank" rel="noreferrer"><span>WhatsApp</span>Start a chat</a>
              <a href="https://instagram.com/tapandscan.solutions" target="_blank" rel="noreferrer"><span>Instagram</span>@tapandscan.solutions</a>
            </div>
          </div>
          <LeadForm />
        </div>
      </section>

      <footer className="site-footer section-shell">
        <div className="brand footer-brand"><Image src="/brand/tap-and-scan-logo.png" alt="" width={64} height={64} /><span><strong>TAP AND SCAN</strong><small>SOLUTIONS</small></span></div>
        <p>U2L.AI-generated tracked QR, NFC and acrylic solutions for the moment your customer is ready to act.</p>
        <div><a href="mailto:hello@hiy.agency">hello@hiy.agency</a><a href="/privacy">Privacy</a><a href="/admin/login">Owner login</a></div>
        <small>© {new Date().getFullYear()} TAP AND SCAN SOLUTIONS · Sole proprietor Abhigyan Pandey</small>
      </footer>
    </main>
  );
}
