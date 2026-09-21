import { useEffect, useRef, useState } from 'react';
import { sendMessage } from '../lib/api.js';
import { validateMessage } from '../lib/portfolio-data.js';
import { safeWebUrl, useProfile } from '../lib/profile-context.js';
import SiteNav from '../components/SiteNav.jsx';
import SiteFooter from '../components/SiteFooter.jsx';
import DiveLamp from '../components/DiveLamp.jsx';
import WaterBackdrop from '../components/WaterBackdrop.jsx';
import './contact.css';

const EMPTY = { name: '', email: '', message: '', website: '' };

export default function Contact() {
  const { profile } = useProfile();
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [state, setState] = useState('idle');
  const [problem, setProblem] = useState('');
  const pending = useRef(false);
  const active = useRef(true);
  const controller = useRef(null);
  const nameInput = useRef(null);
  const emailInput = useRef(null);
  const messageInput = useRef(null);
  useEffect(() => () => { active.current = false; controller.current?.abort(); }, []);

  const email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile?.socials?.email || '') ? profile.socials.email : null;
  const github = safeWebUrl(profile?.socials?.github);
  const linkedin = safeWebUrl(profile?.socials?.linkedin);
  const links = [
    email && { label: 'Email', value: email, href: `mailto:${email}` },
    github && { label: 'GitHub', value: profile.socials.github.replace(/^https?:\/\//, ''), href: github },
    linkedin && { label: 'LinkedIn', value: profile.socials.linkedin.replace(/^https?:\/\//, ''), href: linkedin },
    profile?.location && { label: 'Location', value: profile.location },
  ].filter(Boolean);

  const change = key => event => {
    setForm(current => ({ ...current, [key]: event.target.value }));
    setErrors(current => ({ ...current, [key === 'message' ? 'body' : key]: undefined }));
    if (state === 'error') { setState('idle'); setProblem(''); }
  };

  const submit = async event => {
    event.preventDefault();
    if (pending.current) return;
    const checked = validateMessage({ name: form.name, email: form.email, subject: '', body: form.message, website: form.website });
    setErrors(checked.errors);
    if (Object.keys(checked.errors).length) {
      const firstInvalid = ['name', 'email', 'body'].find(key => checked.errors[key]);
      ({ name: nameInput, email: emailInput, body: messageInput }[firstInvalid])?.current?.focus();
      return;
    }
    pending.current = true;
    controller.current = new AbortController();
    const timer = setTimeout(() => controller.current?.abort(), 15000);
    setState('sending'); setProblem('');
    try {
      await sendMessage(checked.message, { signal: controller.current.signal });
      if (active.current) { setState('sent'); setForm(EMPTY); }
    } catch (error) {
      if (active.current) {
        setState('error');
        setProblem(controller.current.signal.aborted ? 'We couldn’t confirm whether the message arrived. Your text is still here.' : error.status === 429 ? 'Too many messages have been sent recently. Please try again later.' : error.status === 400 ? (error.message || 'Please check the message and try again.') : 'We couldn’t confirm whether the message arrived. Your text is still here.');
      }
    } finally { clearTimeout(timer); pending.current = false; }
  };

  return <div className="pm-page contact-page">
    <WaterBackdrop lightX="50%" motes={2} /><DiveLamp /><SiteNav />
    <div className="pm-shell contact-body">
      <div className="contact-intro"><div className="pm-eyebrow"><span className="contact-ping"><span className="contact-ping__ring" /><span className="contact-ping__core" /></span><span className="pm-eyebrow__label">04 / Contact · 84 m</span></div><h1 className="pm-h1 contact-title">Let’s talk</h1><p className="contact-lead">Internships, project work, or a question about the machine — send a signal from here.</p>
        {profile?.availability?.available && <div className="contact-badge"><span className="contact-badge__dot" /><span>{profile.availability.text || 'Available for work'}</span></div>}
        {links.length > 0 && <ul className="contact-links">{links.map(link => {
          const external = link.href && !link.href.startsWith('mailto:');
          return <li key={link.label} className="pm-slab pm-slab--slide contact-link">{link.href ? <a href={link.href} target={external ? '_blank' : undefined} rel={external ? 'noopener noreferrer' : undefined} aria-label={external ? `${link.label}: ${link.value} (opens in a new tab)` : undefined}><span className="contact-link__label">{link.label}</span><span className="contact-link__value">{link.value}</span><span className="contact-link__arrow" aria-hidden="true">↗</span></a> : <span className="contact-link__static"><span className="contact-link__label">{link.label}</span><span className="contact-link__value">{link.value}</span></span>}</li>;
        })}</ul>}
      </div>
      <div className="contact-card"><span className="pm-figure__edge" /><div className="contact-card__inner">{state === 'sent' ? <div className="contact-done" role="status"><span className="contact-done__icon">↑</span><h2 className="contact-done__title">Message received.</h2><p className="contact-done__body">Thank you for getting in touch. I’ll reply as soon as I can.</p><button type="button" className="pm-link-quiet" onClick={() => setState('idle')}>Send another</button></div> : <form aria-label="Contact form" onSubmit={submit} noValidate><div className="contact-form__label">Send a message</div><fieldset className="contact-fields" disabled={state === 'sending'}>
        <label className="contact-field"><span className="contact-field__label">Name</span><input ref={nameInput} aria-label="Name" type="text" name="name" autoComplete="name" maxLength="100" value={form.name} onChange={change('name')} placeholder="Your name" aria-invalid={!!errors.name} aria-describedby={errors.name ? 'contact-name-error' : undefined} />{errors.name && <span id="contact-name-error" className="contact-error">{errors.name}</span>}</label>
        <label className="contact-field"><span className="contact-field__label">Email</span><input ref={emailInput} aria-label="Email" type="email" name="email" autoComplete="email" value={form.email} onChange={change('email')} placeholder="Where to reply" aria-invalid={!!errors.email} aria-describedby={errors.email ? 'contact-email-error' : undefined} />{errors.email && <span id="contact-email-error" className="contact-error">{errors.email}</span>}</label>
        <label className="contact-field"><span className="contact-field__label">Message</span><textarea ref={messageInput} aria-label="Message" name="message" rows="4" minLength="10" maxLength="3000" value={form.message} onChange={change('message')} placeholder="What’s on your mind" aria-invalid={!!errors.body} aria-describedby={errors.body ? 'contact-message-error contact-message-count' : 'contact-message-count'} />{errors.body && <span id="contact-message-error" className="contact-error">{errors.body}</span>}<span id="contact-message-count" className="contact-field__count">{form.message.length} / 3,000</span></label>
        <div hidden><label>Leave this field empty<input name="website" value={form.website} onChange={change('website')} tabIndex="-1" autoComplete="off" /></label></div>
        {state === 'error' && <p className="contact-error" role="alert">{problem}{email && <> You can also email me at <a href={`mailto:${email}`}>{email}</a>.</>}</p>}
        <span className="sr-only" role="status" aria-live="polite">{state === 'sending' ? 'Sending message…' : ''}</span>
        <button type="submit" className="pm-btn contact-send" disabled={state === 'sending'}><span className="pm-btn__icon" aria-hidden="true">↑</span><span className="pm-btn__label">{state === 'sending' ? 'Sending…' : 'Send message'}</span></button>
      </fieldset></form>}</div></div>
    </div>
    <SiteFooter label="Contact" cta="home" />
  </div>;
}
