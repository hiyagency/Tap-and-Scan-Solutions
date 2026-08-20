"use client";

import { FormEvent, useState } from "react";
import { ArrowLeft, ArrowRight, Check, LoaderCircle } from "lucide-react";
import { solutionOptions, type LeadPayload } from "@/lib/validation";

type FormState = Omit<LeadPayload, "consent"> & { consent: boolean };

const initialState: FormState = {
  name: "",
  businessName: "",
  phone: "",
  email: "",
  city: "",
  businessType: "",
  interests: [],
  quantity: "",
  timeline: "",
  message: "",
  consent: false,
  website: "",
};

export function LeadForm() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormState>(initialState);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ leadId: string } | null>(null);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function continueToDetails() {
    setError("");
    if (form.name.trim().length < 2 || form.businessName.trim().length < 2) {
      setError("Add your name and business name to continue.");
      return;
    }
    if (!/^[+\d][\d\s-]{8,17}$/.test(form.phone.trim())) {
      setError("Enter a valid phone or WhatsApp number.");
      return;
    }
    setStep(2);
  }

  function toggleInterest(value: (typeof solutionOptions)[number]) {
    update(
      "interests",
      form.interests.includes(value)
        ? form.interests.filter((item) => item !== value)
        : [...form.interests, value],
    );
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (!form.consent) {
      setError("Please allow us to contact you about this enquiry.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const payload = (await response.json()) as { leadId?: string; persisted?: boolean; error?: string };
      if (!response.ok || !payload.leadId) throw new Error(payload.error ?? "We could not submit your enquiry.");
      setResult({ leadId: payload.leadId });
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "We could not submit your enquiry.");
    } finally {
      setSubmitting(false);
    }
  }

  if (result) {
    return (
      <div className="form-success" role="status">
        <span className="success-icon"><Check aria-hidden="true" /></span>
        <p className="eyebrow">Enquiry received</p>
        <h3>We have your brief.</h3>
        <p>
          Your reference is <strong>{result.leadId}</strong>. We will contact you on the number provided.
        </p>
        <button className="text-button" type="button" onClick={() => { setForm(initialState); setResult(null); setStep(1); }}>
          Send another enquiry
        </button>
      </div>
    );
  }

  return (
    <form className="lead-form" onSubmit={submit} noValidate>
      <div className="form-progress" aria-label={`Step ${step} of 2`}>
        <span className={step >= 1 ? "active" : ""}>01 Contact</span>
        <i />
        <span className={step >= 2 ? "active" : ""}>02 Details</span>
      </div>

      {step === 1 ? (
        <fieldset>
          <legend>Let&apos;s start with you.</legend>
          <p className="form-help">Three quick details. No sales maze.</p>
          <div className="form-grid">
            <label>
              Your name <span>*</span>
              <input autoComplete="name" value={form.name} onChange={(event) => update("name", event.target.value)} placeholder="Abhigyan Pandey" />
            </label>
            <label>
              Business name <span>*</span>
              <input autoComplete="organization" value={form.businessName} onChange={(event) => update("businessName", event.target.value)} placeholder="Your café, clinic or brand" />
            </label>
            <label className="full-field">
              Phone / WhatsApp <span>*</span>
              <input inputMode="tel" autoComplete="tel" value={form.phone} onChange={(event) => update("phone", event.target.value)} placeholder="+91 98765 43210" />
            </label>
          </div>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="button button-gold form-next" type="button" onClick={continueToDetails}>
            Continue <ArrowRight aria-hidden="true" size={18} />
          </button>
        </fieldset>
      ) : (
        <fieldset>
          <legend>What should the tap unlock?</legend>
          <p className="form-help">Optional details help us suggest the right build.</p>
          <div className="form-grid">
            <label>Email<input type="email" autoComplete="email" value={form.email} onChange={(event) => update("email", event.target.value)} placeholder="name@business.com" /></label>
            <label>City<input autoComplete="address-level2" value={form.city} onChange={(event) => update("city", event.target.value)} placeholder="Bhopal" /></label>
            <label>Business type<input value={form.businessType} onChange={(event) => update("businessType", event.target.value)} placeholder="Restaurant, clinic, coach…" /></label>
            <label>Approx. quantity<input value={form.quantity} onChange={(event) => update("quantity", event.target.value)} placeholder="e.g. 10 table stands" /></label>
            <label className="full-field">Ideal timeline<input value={form.timeline} onChange={(event) => update("timeline", event.target.value)} placeholder="This month / just exploring" /></label>
          </div>

          <div className="interest-group">
            <p>Interested in</p>
            <div className="interest-options">
              {solutionOptions.map((option) => (
                <label key={option}>
                  <input type="checkbox" checked={form.interests.includes(option)} onChange={() => toggleInterest(option)} />
                  <span>{option}</span>
                </label>
              ))}
            </div>
          </div>

          <label className="message-field">Anything else?<textarea rows={4} value={form.message} onChange={(event) => update("message", event.target.value)} placeholder="Tell us where the product will be used or where it should send people." /></label>
          <label className="consent-field">
            <input type="checkbox" checked={form.consent} onChange={(event) => update("consent", event.target.checked)} />
            <span>I agree that NFC BY ABHIGYAN may contact me about this enquiry. <a href="/privacy">Privacy details</a>.</span>
          </label>
          <label className="honey-field" aria-hidden="true">Website<input tabIndex={-1} autoComplete="off" value={form.website} onChange={(event) => update("website", event.target.value)} /></label>
          {error && <p className="form-error" role="alert">{error}</p>}
          <div className="form-actions">
            <button className="button button-ghost" type="button" onClick={() => { setError(""); setStep(1); }}><ArrowLeft aria-hidden="true" size={18} /> Back</button>
            <button className="button button-gold" type="submit" disabled={submitting}>
              {submitting ? <><LoaderCircle className="spin" aria-hidden="true" size={18} /> Sending</> : <>Send enquiry <ArrowRight aria-hidden="true" size={18} /></>}
            </button>
          </div>
        </fieldset>
      )}
    </form>
  );
}
