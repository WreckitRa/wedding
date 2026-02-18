import { useEffect, useRef, useState } from "react";
import { submitEarlyAccess } from "../api/client";
import { useMetaTags } from "../hooks/useMetaTags";
import { getBaseUrl } from "../utils/app";
import "./LandingPage.css";

const LANDING_TITLE = "DearGuest | Your guestlist runs itself";
const LANDING_DESCRIPTION =
  "One link. Guests RSVP, you see who opened and who's pending. Smart reminders by WhatsApp and email—no chasing. Built for weddings and events.";

export default function LandingPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalPlan, setModalPlan] = useState("");
  const [toast, setToast] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const heroCardRef = useRef<HTMLDivElement>(null);
  const kpiAnimated = useRef(false);
  const openedBarRef = useRef<HTMLElement>(null);
  const yesBarRef = useRef<HTMLElement>(null);
  const pendingBarRef = useRef<HTMLElement>(null);
  const dupBarRef = useRef<HTMLElement>(null);
  const scrollTo = (selector: string) => {
    const el = document.querySelector(selector);
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const showToast = (msg: string) => {
    setToast(msg);
    const t = setTimeout(() => setToast(""), 2200);
    return () => clearTimeout(t);
  };

  const openModal = (plan?: string) => {
    setModalPlan(plan || "");
    setModalOpen(true);
  };

  useMetaTags(LANDING_TITLE, LANDING_DESCRIPTION, {
    url: getBaseUrl().replace(/\/$/, "") || undefined,
  });

  useEffect(() => {
    const bars = [openedBarRef, yesBarRef, pendingBarRef, dupBarRef];
    const refs = bars.map((r) => r.current).filter(Boolean) as HTMLElement[];
    if (refs.length < 4) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting || kpiAnimated.current) return;
        kpiAnimated.current = true;
        const opened = 118;
        const yes = 92;
        const pending = 31;
        const dups = 7;
        const rate = Math.round((yes / 150) * 100);

        const rateEl = document.getElementById("rateText");
        const openedNum = document.getElementById("openedNum");
        const yesNum = document.getElementById("yesNum");
        const pendingNum = document.getElementById("pendingNum");
        const dupNum = document.getElementById("dupNum");
        if (rateEl) rateEl.textContent = rate + "%";
        if (openedNum) openedNum.textContent = String(opened);
        if (yesNum) yesNum.textContent = String(yes);
        if (pendingNum) pendingNum.textContent = String(pending);
        if (dupNum) dupNum.textContent = String(dups);

        requestAnimationFrame(() => {
          openedBarRef.current && (openedBarRef.current.style.width = Math.round((opened / 150) * 100) + "%");
          yesBarRef.current && (yesBarRef.current.style.width = Math.round((yes / 150) * 100) + "%");
          pendingBarRef.current && (pendingBarRef.current.style.width = Math.round((pending / 150) * 100) + "%");
          dupBarRef.current && (dupBarRef.current.style.width = Math.min(100, dups * 10) + "%");
        });
      },
      { threshold: 0.25 }
    );
    if (heroCardRef.current) observer.observe(heroCardRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const revealEls = document.querySelectorAll(".landing-page .reveal");
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && e.target.classList.add("on")),
      { threshold: 0.12 }
    );
    revealEls.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!modalOpen) return;
    document.body.style.overflow = "hidden";
    const onEscape = (e: KeyboardEvent) => e.key === "Escape" && setModalOpen(false);
    window.addEventListener("keydown", onEscape);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onEscape);
    };
  }, [modalOpen]);

  useEffect(() => {
    if (!mobileNavOpen) return;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, [mobileNavOpen]);

  const handleLeadSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const name = (form.elements.namedItem("name") as HTMLInputElement)?.value?.trim() || "";
    const email = (form.elements.namedItem("email") as HTMLInputElement)?.value?.trim() || "";
    if (!name || !email) return;
    setSubmitting(true);
    try {
      await submitEarlyAccess({ name, email });
      showToast("Thanks, " + name + ". We'll reach out soon.");
      form.reset();
      openModal("Pro");
    } catch {
      showToast("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleModalSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const name = (form.elements.namedItem("name") as HTMLInputElement)?.value?.trim() || "";
    const email = (form.elements.namedItem("email") as HTMLInputElement)?.value?.trim() || "";
    const eventType = (form.elements.namedItem("type") as HTMLSelectElement)?.value?.trim() || undefined;
    const plan = (form.elements.namedItem("plan") as HTMLSelectElement)?.value?.trim() || undefined;
    const city = (form.elements.namedItem("city") as HTMLInputElement)?.value?.trim() || undefined;
    if (!name || !email) return;
    setSubmitting(true);
    try {
      await submitEarlyAccess({ name, email, eventType, plan, city });
      showToast("Request received. We'll be in touch within 24 hours.");
      form.reset();
      setModalOpen(false);
    } catch {
      showToast("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="landing-page">
      <nav className="nav">
        <div className="wrap">
          <div className="inner">
            <a className="brand" href="#top" aria-label="DearGuest Home" onClick={() => setMobileNavOpen(false)}>
              <img src="/dearguest-logo.png" alt="" className="brand-logo" aria-hidden />
            </a>
            <button
              type="button"
              className="nav-burger"
              onClick={() => setMobileNavOpen((o) => !o)}
              aria-label={mobileNavOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileNavOpen}
            >
              <span />
              <span />
              <span />
            </button>
            <div className={`nav-menu ${mobileNavOpen ? "nav-menu-open" : ""}`} aria-hidden={!mobileNavOpen}>
              <div className="navlinks" aria-label="Primary">
                <a href="#features" onClick={() => setMobileNavOpen(false)}>Features</a>
                <a href="#how" onClick={() => setMobileNavOpen(false)}>How it works</a>
                <a href="#pricing" onClick={() => setMobileNavOpen(false)}>Pricing</a>
                <a href="#faq" onClick={() => setMobileNavOpen(false)}>FAQ</a>
              </div>
              <div className="navcta">
                <button type="button" className="btn" onClick={() => { scrollTo("#pricing"); setMobileNavOpen(false); }}>
                  See pricing
                </button>
                <button type="button" className="btn primary" onClick={() => { openModal(); setMobileNavOpen(false); }}>
                  Get early access
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main id="top" className="wrap">
        <div className="hero">
          <div className="heroGrid">
            <div className="reveal">
              <div className="badge-row">
                <span className="dot" aria-hidden="true" />
                <span>Early access — launch offer</span>
              </div>
              <h1>Your guestlist runs itself.</h1>
              <p className="sub">
                One link. Guests RSVP, you see who opened and who's pending. Smart reminders by WhatsApp and email—no chasing.
              </p>
              <div className="heroCtas">
                <button type="button" className="btn primary" onClick={() => openModal()}>
                  Get early access
                </button>
                <button type="button" className="btn" onClick={() => scrollTo("#features")}>
                  See how it works
                </button>
              </div>
              <p className="micro">No credit card · Guests use a link, no app</p>
              <div className="strip">
                <div className="logos" aria-label="Use cases">
                  <span className="tag">Weddings</span>
                  <span className="tag">Parties</span>
                  <span className="tag">Private events</span>
                </div>
              </div>
            </div>

            <div className="heroCard reveal" ref={heroCardRef} aria-label="Product preview">
              <div className="heroCardInner">
                <div className="mockTop">
                  <div className="mockTitle">
                    <strong>Sarah & Tony</strong>
                    <span>Saturday 8:30 PM • Beirut</span>
                  </div>
                  <span className="chip">
                    Response rate: <b id="rateText">0%</b>
                  </span>
                </div>
                <div className="mockGrid">
                  <div className="kpi">
                    <div className="label">Opened</div>
                    <div className="value">
                      <span id="openedNum">0</span> / 150
                    </div>
                    <div className="bar">
                      <i ref={openedBarRef} />
                    </div>
                  </div>
                  <div className="kpi">
                    <div className="label">Confirmed</div>
                    <div className="value">
                      <span id="yesNum">0</span>
                    </div>
                    <div className="bar">
                      <i ref={yesBarRef} />
                    </div>
                  </div>
                  <div className="kpi">
                    <div className="label">Pending</div>
                    <div className="value">
                      <span id="pendingNum">0</span>
                    </div>
                    <div className="bar">
                      <i ref={pendingBarRef} />
                    </div>
                  </div>
                  <div className="kpi">
                    <div className="label">Duplicates prevented</div>
                    <div className="value">
                      <span id="dupNum">0</span>
                    </div>
                    <div className="bar">
                      <i ref={dupBarRef} />
                    </div>
                  </div>
                </div>
                <div className="mockList" aria-label="Guest list preview">
                  <div className="row">
                    <div className="who">
                      <b>Maya H.</b>
                      <small>Opened • No response yet</small>
                    </div>
                    <span className="status pending">Pending</span>
                  </div>
                  <div className="row">
                    <div className="who">
                      <b>Karim A.</b>
                      <small>Confirmed +1</small>
                    </div>
                    <span className="status ok">Confirmed</span>
                  </div>
                  <div className="row">
                    <div className="who">
                      <b>Nour S.</b>
                      <small>Invite not opened</small>
                    </div>
                    <span className="status">Not opened</span>
                  </div>
                  <div className="row">
                    <div className="who">
                      <b>Rami K.</b>
                      <small>Declined</small>
                    </div>
                    <span className="status no">Declined</span>
                  </div>
                </div>
                <div className="micro" style={{ marginTop: 12 }}>
                  Smart reminders trigger automatically based on guest behavior, so you never need to follow up
                  manually.
                </div>
              </div>
            </div>
          </div>
        </div>

        <section id="features">
          <div className="sectionTitle reveal">
            <h2>Less chasing. More clarity.</h2>
            <p className="lead">
              One place for your guestlist. Automatic follow-ups, duplicate-free RSVPs, and a clear view of who’s in, who’s out, and who’s still pending.
            </p>
          </div>
          <div className="cards">
            <div className="card reveal">
              <div className="icon">AI</div>
              <h3>AI invitation that actually looks good</h3>
              <p>
                Create a clean invitation page in minutes. Smart copy, elegant layout, and the right details without
                overthinking.
              </p>
            </div>
            <div className="card reveal">
              <div className="icon">RS</div>
              <h3>Duplicate free RSVPs</h3>
              <p>One guest, one record. Prevent duplicates, track +1 rules, and keep your headcount accurate.</p>
            </div>
            <div className="card reveal">
              <div className="icon">WA</div>
              <h3>WhatsApp and email reminders</h3>
              <p>
                Not opened? Opened but no response? Confirmed? DearGuest sends the right message at the right time
                automatically.
              </p>
            </div>
            <div className="card reveal">
              <div className="icon">IN</div>
              <h3>Insights that matter</h3>
              <p>See who opened, who did not, who is pending, and your live response rate. No guessing.</p>
            </div>
            <div className="card reveal">
              <div className="icon">DO</div>
              <h3>Door friendly guestlists</h3>
              <p>Simple entrance list for organizers and venues. Fast search. Clean categories like VIP, family, tables.</p>
            </div>
            <div className="card reveal">
              <div className="icon">CL</div>
              <h3>Clarity on one screen</h3>
              <p>Stop scrolling chats. Stop updating spreadsheets. Everything lives in one calm, reliable dashboard.</p>
            </div>
          </div>
        </section>

        <section>
          <div className="twoCol">
            <div className="panel reveal">
              <h2 style={{ margin: "0 0 10px" }}>The usual chaos</h2>
              <p className="lead" style={{ fontSize: 14, margin: 0 }}>
                What organizers deal with every time.
              </p>
              <ul className="list">
                <li className="li">
                  <span className="tick x">×</span>
                  <span>Guests say “maybe” then disappear.</span>
                </li>
                <li className="li">
                  <span className="tick x">×</span>
                  <span>Duplicate names across WhatsApp groups and spreadsheets.</span>
                </li>
                <li className="li">
                  <span className="tick x">×</span>
                  <span>Manual follow ups that feel awkward and exhausting.</span>
                </li>
                <li className="li">
                  <span className="tick x">×</span>
                  <span>No clue who opened the invite and who ignored it.</span>
                </li>
                <li className="li">
                  <span className="tick x">×</span>
                  <span>Wrong headcount, wasted budget, entrance confusion.</span>
                </li>
              </ul>
            </div>
            <div className="panel reveal">
              <h2 style={{ margin: "0 0 10px" }}>How DearGuest fixes it</h2>
              <p className="lead" style={{ fontSize: 14, margin: 0 }}>One system that runs the guestlist for you.</p>
              <ul className="list">
                <li className="li">
                  <span className="tick">✓</span>
                  <span>One link for guests. Fast RSVP. No app required.</span>
                </li>
                <li className="li">
                  <span className="tick">✓</span>
                  <span>Duplicates prevented automatically. Clean guest records.</span>
                </li>
                <li className="li">
                  <span className="tick">✓</span>
                  <span>Behavior based reminders via WhatsApp and email.</span>
                </li>
                <li className="li">
                  <span className="tick">✓</span>
                  <span>Live insights: opened, pending, confirmed, declined.</span>
                </li>
                <li className="li">
                  <span className="tick">✓</span>
                  <span>Door ready list for venues and teams, with categories.</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        <section id="how">
          <div className="sectionTitle reveal center">
            <h2>Set it up once. Let it run.</h2>
          </div>
          <div className="steps">
            <div className="step reveal">
              <div className="num">1</div>
              <h3>Create your event</h3>
              <p>Add details, get a shareable invitation link.</p>
            </div>
            <div className="step reveal">
              <div className="num">2</div>
              <h3>Share the link</h3>
              <p>WhatsApp, email, or anywhere. Guests RSVP in seconds.</p>
            </div>
            <div className="step reveal">
              <div className="num">3</div>
              <h3>Watch the list fill itself</h3>
              <p>Reminders go out automatically. Dashboard shows who's in, who's pending.</p>
            </div>
          </div>
        </section>

        <section id="pricing">
          <div className="sectionTitle reveal center">
            <h2>Simple pricing. No surprises.</h2>
            <p className="lead">Pay per event or go unlimited. Start small, scale when you’re ready.</p>
          </div>
          <div className="pricing">
            <div className="priceCard reveal">
              <div className="priceTop">
                <strong>Starter</strong>
                <div className="micro" style={{ margin: "6px 0 0" }}>For small gatherings</div>
              </div>
              <div>
                <div className="price">$39</div>
                <div className="per">per event</div>
              </div>
              <ul className="feat">
                <li><span className="tick">✓</span><span>Invitation link + RSVP</span></li>
                <li><span className="tick">✓</span><span>Duplicate prevention</span></li>
                <li><span className="tick">✓</span><span>Guestlist export</span></li>
                <li><span className="tick">✓</span><span>Basic reminders (email)</span></li>
              </ul>
              <div className="spacer" />
              <button type="button" className="btn" onClick={() => openModal("Starter")}>
                Choose Starter
              </button>
            </div>
            <div className="priceCard featured reveal">
              <div className="badge">Most popular</div>
              <div className="priceTop">
                <strong>Pro</strong>
                <div className="micro" style={{ margin: "6px 0 0" }}>For weddings and serious events</div>
              </div>
              <div>
                <div className="price">$79</div>
                <div className="per">per event</div>
              </div>
              <ul className="feat">
                <li><span className="tick">✓</span><span>Everything in Starter</span></li>
                <li><span className="tick">✓</span><span>WhatsApp reminders</span></li>
                <li><span className="tick">✓</span><span>Opened and pending insights</span></li>
                <li><span className="tick">✓</span><span>VIP tags and categories</span></li>
                <li><span className="tick">✓</span><span>Door friendly list view</span></li>
              </ul>
              <div className="spacer" />
              <button type="button" className="btn primary" onClick={() => openModal("Pro")}>
                Choose Pro
              </button>
            </div>
            <div className="priceCard reveal">
              <div className="priceTop">
                <strong>Organizer</strong>
                <div className="micro" style={{ margin: "6px 0 0" }}>For planners, promoters, and teams</div>
              </div>
              <div>
                <div className="price">$169</div>
                <div className="per">per month</div>
              </div>
              <ul className="feat">
                <li><span className="tick">✓</span><span>Unlimited events</span></li>
                <li><span className="tick">✓</span><span>Team access</span></li>
                <li><span className="tick">✓</span><span>Advanced reminder rules</span></li>
                <li><span className="tick">✓</span><span>Venue ready exports</span></li>
                <li><span className="tick">✓</span><span>Priority support</span></li>
              </ul>
              <div className="spacer" />
              <button type="button" className="btn" onClick={() => openModal("Organizer")}>
                Talk to us
              </button>
            </div>
          </div>
        </section>

        <section id="faq">
          <div className="sectionTitle reveal center">
            <h2>FAQ</h2>
            <p className="lead">Everything you need to know before you start.</p>
          </div>
          <div className="faq">
            <details className="reveal">
              <summary>Do guests need an app?</summary>
              <p>No. Guests open a link, RSVP in seconds, and get updates via WhatsApp or email. No download required.</p>
            </details>
            <details className="reveal">
              <summary>How do reminders work?</summary>
              <p>
                Reminders are behavior-based: not opened → gentle nudge; opened but no response → follow-up; confirmed → day-of reminder. You set the rules once; DearGuest handles the rest.
              </p>
            </details>
            <details className="reveal">
              <summary>Can I control +1 and guest categories?</summary>
              <p>Yes. Allow or restrict +1s, and tag guests as VIP, family, table, or any category you need for the door.</p>
            </details>
            <details className="reveal">
              <summary>Is this for weddings only?</summary>
              <p>No. It works for weddings, birthdays, corporate events, private parties, and nightlife guestlists.</p>
            </details>
            <details className="reveal">
              <summary>Can I export the guestlist for the door?</summary>
              <p>Yes. Export or use a door view with fast search and clear statuses so your team knows who’s in.</p>
            </details>
          </div>
        </section>

        <section>
          <div className="cta reveal">
            <div>
              <h3>Stop chasing guests. Start hosting.</h3>
              <p>
                Get early access and a launch offer. We'll help you get your first invite live in minutes.
              </p>
            </div>
            <form className="form form-cta" onSubmit={handleLeadSubmit}>
              <input className="input" type="text" name="name" placeholder="Your name" autoComplete="name" required />
              <input className="input" type="email" name="email" placeholder="Email" autoComplete="email" required />
              <button className="btn primary" type="submit" disabled={submitting}>
                {submitting ? "Sending…" : "Get early access"}
              </button>
            </form>
          </div>
        </section>

        <footer>
          <div className="foot">
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <img src="/favicon.png" alt="" width={28} height={28} className="footer-logo" aria-hidden />
              <span>© {new Date().getFullYear()} DearGuest</span>
            </div>
            <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
              <a href="#pricing">Pricing</a>
              <a href="#faq">FAQ</a>
              <a href="#top" aria-label="Back to top">Back to top</a>
            </div>
          </div>
        </footer>
      </main>

      <div className={"toast" + (toast ? " on" : "")} role="status" aria-live="polite">
        {toast}
      </div>

      {modalOpen && (
        <div
          className="modalBackdrop"
          onClick={(e) => e.target === e.currentTarget && setModalOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          <div className="modalBox">
            <div style={{ padding: "16px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, borderBottom: "1px solid rgba(255,255,255,.08)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <img src="/favicon.png" alt="" width={30} height={30} className="modal-logo" aria-hidden />
                <div>
                  <div id="modal-title" className="modalTitle">Get early access</div>
                  <div style={{ fontSize: 12, color: "var(--paper-muted)", marginTop: 2 }}>
                    Tell us what you host. We will prioritize you.
                  </div>
                </div>
              </div>
              <button type="button" className="btn" onClick={() => setModalOpen(false)}>
                Close
              </button>
            </div>
            <div style={{ padding: 16 }}>
              <div className="pill" style={{ marginBottom: 12 }}>
                <span className="dot" aria-hidden="true" />
                <span>We keep it simple. You get a clean setup and a working invite fast.</span>
              </div>
              <form
                onSubmit={handleModalSubmit}
                className="landing-modal-form"
              >
                <input className="input" type="text" name="name" placeholder="Name" autoComplete="name" required />
                <input className="input" type="email" name="email" placeholder="Email" autoComplete="email" required />
                <div className="landing-modal-form-row">
                  <select className="input" name="type" required>
                    <option value="" disabled>Event type</option>
                    <option>Wedding</option>
                    <option>Nightlife</option>
                    <option>Corporate</option>
                    <option>Private event</option>
                    <option>Birthday</option>
                  </select>
                  <select className="input" name="plan" defaultValue={modalPlan}>
                    <option value="">Preferred plan (optional)</option>
                    <option>Starter</option>
                    <option>Pro</option>
                    <option>Organizer</option>
                  </select>
                </div>
                <input className="input" type="text" name="city" placeholder="City (optional)" autoComplete="address-level2" />
                <button className="btn primary landing-modal-submit" type="submit" disabled={submitting}>
                  {submitting ? "Sending…" : "Request access"}
                </button>
                <p className="micro" style={{ marginTop: 8, marginBottom: 0 }}>
                  We’ll reach out within 24 hours. No spam, ever.
                </p>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
