# NFC.HIY redesign verification

Status: in progress, local worktree only. This is an evidence ledger, not a launch approval.
Source: user brief attachment 3ca9c6c5-d312-44c9-bde0-268dbfbb8e63, sections 1–46.

## Verified in this continuation

- Motion/visual pass (user feedback, 30 Sep): selected catalogue filters changed from near-black/yellow fill to a neutral active surface with a clear inset underline; hover now uses a neutral lift without color inversion. Browser visually checked the selected filter on desktop and at 390px.
- Homepage hero uses the real supplied All-in-One photo plus a small NFC signal badge. Its icon contrast was corrected after a screenshot showed yellow-on-yellow. Desktop receives a short intro, gentle product drift and a tap ring; collection text/cards have scroll-linked reveals where supported. Mobile keeps the product static. Browser screenshots checked desktop hero, mobile hero and collection.
- Product-page photo and purchase panel now receive short desktop-only entrance motion, with a subtle photo hover; at 390px computed animation names were `none` and there was no horizontal overflow. At 1280px both entrance animations were active; desktop settled state visually inspected.
- Existing real product media and commerce copy were retained; no generated imagery, fake urgency or fabricated social proof added. Motion uses opacity/transform and is gated by reduced-motion preference.
- Lint, TypeScript, 68 tests and the production build passed after this visual pass.

- Purchase/navigation follow-up: browser verified a direct jump to the product-page bottom reveals the mobile quick-purchase bar; adding a card updates the cart and shows feedback. Returning to the top hides the bar. The bar's measured height now controls footer clearance and analytics preferences offset; fixed a later CSS rule overriding that clearance. Supporting text increased to 12px.
- At 390px, feedback-state bar height was 92.8px, footer clearance 104.8px, with analytics preferences ending 12px above the bar. No overlap in this state. Other consent-dialog combinations remain to test.
- Mobile menu Escape closes the menu and returns focus to Open navigation. Tablet navigation visually inspected at 768px. Header search now focuses the input on same-page and cross-page navigation; cross-page check at 1024px placed input below the sticky header (85.9px versus 72px).
- Catalogue no-match message and Show all products recovery verified; Keychains filter displays four real products and opens the selected keyring.
- Unpriced products now have a working WhatsApp quote link including product, design and quantity instead of disabled purchase CTAs. No disabled purchase buttons remained on the inspected keyring. Its mobile quote/confidence layout was visually inspected at 390px. Missing parcel configuration no longer promises a checkout shipping rate. No quote message was sent.
- Lint, TypeScript, all 60 tests and production build pass after these changes. These are local checks, not proof of live authentication, rates, payment, reviews or deployment.

- About route now shares ShopShell navigation/cart/footer and storefront black/yellow tokens. Preserved real workshop images, founder, enquiry form, FAQs, services and published shipments. Primary hero CTA returns to catalogue; custom enquiry remains available.
- Empty shipment placeholder hidden when no published records exist. About videos changed from autoplay/default preload to user-initiated controls with preload=none. Browser confirmed both paused without autoplay.
- About U2L claim narrowed to supported smart-QR setups, not every product. Desktop hero, process, founder/enquiry transition visually inspected; 390px hero inspected. Caption moved below video controls after detecting overlap; founder agency link fixed from stretched panel to normal button.
- About document overflow checked at all eight required widths: none. Added anchor scroll margin for sticky header and spacing around About FAQs. Full section-by-section mobile visual pass remains pending.
- Lint, 60 tests and production build passed before the final three CSS-only spacing/button corrections.

- Account sign-in redesigned with dark explanatory panel and direct Google sign-in; desktop screenshot inspected. Mobile refinement keeps sign-in visible in the first 320×740 viewport, with privacy and shopping-return links. OAuth implementation unchanged.
- Privacy page now uses the shared storefront shell and readable legal layout; existing policy content retained. No horizontal document overflow at 320/375/390/430/768/1024/1280/1440px.
- FAQ: native summary activated with Return; expanded answer and visible keyboard focus verified at 390px.
- Order-list database error no longer falsely claims the shop is unopened. New RetryOrders client action refreshes the route and shows pending state; support link remains available. Authenticated visual/error-path verification remains pending.
- 60 tests passed and production build completed during this pass. The final retry-component adjustment then passed lint and TypeScript; repeat build before release.

- Creation process now shares one selectable illustration across desktop/mobile rather than rendering four large mobile illustrations. Removed the unused intersection-observer effect and duplicated mobile artwork/caption markup.
- Process headings use the storefront body family; green markers/background accents replaced with neutral/yellow treatment. Mobile body copy raised to 14px and stage controls to 13px with 44px minimum height.
- Browser selected step 4 successfully (`aria-pressed=true`); one illustration present. Visual pass at 390px found a label overlap, corrected by resizing/repositioning the card. Rechecked 320px with no document horizontal overflow and all four controls 44px high.
- 60 unit tests, lint and TypeScript pass following this refinement.

- Gallery now caps the supplied card photo at 500 CSS pixels and requests an appropriately sized zoom image rather than a 750px enlargement. Browser verified background scroll lock, Escape close, restored body overflow and restored image-trigger focus.
- Short-height cart drawers use a single scrollable surface instead of allowing the fixed summary to squeeze the item list out. At 390×480, browser screenshot confirmed Checkout and Continue shopping reachable after scrolling; no document horizontal overflow. Many-item/error variants remain to test.
- Lint and TypeScript passed after these gallery/drawer changes. No deployment performed.

- Follow-up pass: 60 tests and lint pass. Production build passes, including TypeScript.
- Final CTA now contains supplied product imagery; desktop rendering inspected in browser.
- Homepage FAQ uses the shared FAQ component. Offer copy and calculation share CARD_OFFER in src/lib/shop/offers.ts.
- NEXT_PUBLIC_CARD_OFFER_ENABLED=false disables the offer and its related FAQ on the next build/deployment. Default preserves the currently approved offer. This is a public non-secret build setting, not a live admin toggle.
- New offer tests verify disabled discounts, eligibility and FAQ visibility; enabled configuration retains the ₹299 discount for three cards.
- Product Add to Cart validates accumulated quantities before storing logo/cart data. Related suggestions hide sold-out items and empty suggestion sections.
- Browser: photo zoom moves focus to Close; Escape restores focus to the image trigger.
- Browser: selecting Product film renders a paused video with controls, without autoplay.
- Browser: Custom Logo → Buy now preserves that design in the checkout dialog, at ₹352.82 before shipping for one card.
- Browser: Back to product closes the dialog, retains Custom Logo and restores focus to Buy now.
- Conditional homepage reviews now query only approved reviews for active catalogue slugs, capped at the latest three. They disappear on an empty/error result. Four tests cover approved filtering, empty catalogue, database error and timeout. Live published-review rendering remains unverified.

- ESLint and 54 unit tests pass. Eight new tests cover shared inventory across designs, unavailable products/variants and missing prices.
- Production build passed after the homepage spotlight/comparison, cart readiness checks, checkout summary and product FAQ changes.
- Later footer/sticky-feedback changes passed lint/tests; final build should be repeated before release.
- Browser: 390px cart drawer shows three cards at ₹897, discount ₹299, subtotal ₹598, tax ₹107.64.
- Browser: checkout preserves that selection and shows ₹705.64 before shipping, not an unknown-price placeholder.
- Browser: checkout has no document horizontal overflow at 320, 375, 390, 430, 768, 1024, 1280 and 1440px.
- Browser: entering PIN 123 produces the six-digit PIN validation message.
- Browser: drawer quantity change from 3 to 4 updates the underlying cart page without refresh. Escape returns focus to the cart button.
- Visual inspection: desktop spotlight and comparison, mobile comparison, mobile cart drawer.
- These checks do not prove all routes, all viewport layouts, authenticated checkout or live providers.

## Requirement ledger

| Brief | Current implementation evidence | Remaining proof/work |
| --- | --- | --- |
| 1 Brand direction | premium-home, premium-shop and product-story styles | Full page-by-page visual audit |
| 2 Color system | #090909 and sampled #FAD81D; scoped status/action tokens | Contrast audit; verify logo sample provenance before release |
| 3 Typography | Compact sans hierarchy in storefront overrides | Review remaining inherited display fonts and small labels |
| 4 Design system | Shared buttons, confidence grid, drawer, FAQ, header | Consolidate duplicated tokens; final touch-target audit |
| 5 Header | Sticky/shrinking header, search link, account, cart count, mobile menu | Keyboard menu/search flow at tablet widths |
| 6 Commerce bar | Non-marquee offer and shared build-time offer setting | Preview verification with disabled setting |
| 7 Hero | Asymmetric dark hero with real product visual and two CTAs | Final motion/reduced-motion and mobile first-fold review |
| 8 Benefit strip | Four factual product/setup benefits | Verify legibility at 320px |
| 9 Collection | Real imagery, pricing, descriptions, filters/search and actions | Real rating summaries on cards when available; hover/touch audit |
| 10 Purchase confidence | Availability, shipping, compatibility, personal setup | Add only configured delivery/payment/policy signals; verify selected variant |
| 11 Delivery urgency | No fabricated cutoff or delivery date | Show real estimate only if a provider/configuration supplies one |
| 12 Stock | Real/unknown states; shared-stock cart readiness guard | Live stock integration proof; product CTA accumulated quantity test |
| 13 Product redesign | Gallery/purchase split, primary Add to Cart, secondary Buy Now | Comprehensive desktop/mobile purchase-panel audit |
| 14 Gallery | Photo zoom, film control, swipe, fallback, offscreen pause | Keyboard/gesture/media-error testing; avoid source-image upscaling |
| 15 Price hierarchy | Dynamic prices, explicit tax and shipping | Audit all missing-price contexts; no invented compare-at prices |
| 16 Why NFC | Tap/open/connect explanation and labelled illustration | Visual review at all required sizes |
| 17 How it works | Three steps with numbered progression | Mobile typography/spacing audit |
| 18 Use cases | Three outcomes linked to real products | Verify links and no unsupported claims |
| 19 Comparison | Factual printed-only vs NFC+QR table | 320px screenshot/readability review |
| 20 Social proof | Product review summary/distribution; conditional latest approved homepage reviews | Live real-data rendering and card-level ratings |
| 21 Why buy here | Design approval, direct support, smart QR update section | Final visual review |
| 22 FAQ | Shared factual FAQ on home/help/product pages | Policy questions only when approved; keyboard accordion audit |
| 23 Final CTA | Dark section, yellow collection action and supplied product image | Mobile visual audit |
| 24 Footer | Logo, collection/help/story/tracking/privacy/contact/social; conditional policies | Final visual/link audit |
| 25 Mobile CRO | Responsive layout, sticky product purchase bar with feedback | Check all sticky overlaps and feedback states at small widths |
| 26 Cart drawer | Item controls, subtotal, offer, tax, checkout, readiness warnings | Short-height/many-item/error-state testing |
| 27 Checkout transition | Preserved route/modal; upfront mobile summary, honest payment state | Authenticated end-to-end and provider verification |
| 28 Micro-interactions | Subtle button/image/nav/drawer transitions | Audit remaining motion, focus and reduced-motion coverage |
| 29 Visual rhythm | Alternating dark/light, asymmetric sections and comparison | Whole-home visual review; avoid repetitive copy |
| 30 Iconography | Lucide family reused | Full icon consistency pass |
| 31 Imagery | Supplied actual product assets | Asset resolution/performance audit |
| 32 Copy | Outcome-led product/use-case copy | Remaining template/duplicated copy audit |
| 33 Red urgency | Low-stock uses actual quantity; no random urgency added | All-route search and rendered status checks |
| 34 Yellow action | Buttons, selected states, header accents | Remaining inherited green/accent audit |
| 35 Conversion hierarchy | Price/tax/stock/compatibility near purchase; summary before form | First-time-user route audit; no measured conversion lift claim |
| 36 Performance | Lazy images; selected video only; server catalogue reuse | Production Lighthouse/CWV and network/media loading checks |
| 37 Accessibility | Native dialogs, labelled controls, focus styles, reduced-motion rules | Keyboard sweep, contrast, target sizes, zoom, screen-reader order |
| 38 No demo/template feel | xxx replaced; fabricated delivery/view counts absent from new UI | Full source/rendered-content audit, broken-link checks |
| 39 Configurability | Database prices/variants/stock preserved; conditional policies | Offer/message configuration and optional commerce signals |
| 40 Architecture | Reusable header/drawer/confidence/FAQ/story/cart-state | Avoid unnecessary duplication; document final design system |
| 41 Responsive | Checkout overflow verified at all eight sizes | Visual screenshots for home/product/cart/account/about at each breakpoint |
| 42 Homepage order | Hero/benefits/catalogue/explainer/steps/use-cases/spotlight/comparison/conditional reviews/support/FAQ/CTA | Full-page visual audit |
| 43 Product order | Purchase, creation/details, reviews, FAQ, related products | Review technical/compatibility/use-case placement and keychains |
| 44 Visual audit | Selected desktop/mobile sections inspected | Every section not yet inspected |
| 45 CRO audit | Search, drawer, quantity, offer, checkout transition checked | Full checklist remains open |
| 46 Implementation/preservation | Existing Next/Supabase/cart/providers/URLs retained; tests/build passing | Auth/admin/reviews/integrations regression and preview deployment |

## External gates

- Latest Supabase connector query returned permission denied for production project iygzppdphcmmjimsdumo. Do not claim abandoned-cart database activation.
- Local environment previously points to a different Supabase project than production. Verify environment mapping without printing secrets before live integration tests.
- PayU remains intentionally disabled pending verified credentials and policies. Do not place or claim real paid orders.
- Changes are uncommitted and undeployed. Preserve unrelated workspace changes when preparing a release.
- Do not mark the persistent goal complete until every applicable row has direct current evidence.
