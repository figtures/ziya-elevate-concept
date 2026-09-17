import { Link } from "@tanstack/react-router";
import { ArrowRight, ArrowUpRight, Check, Mail, Menu, Moon, Send, Sun, X } from "lucide-react";
import { useEffect, useState, type CSSProperties, type FormEvent } from "react";
import basariBookImage from "@/assets/basari-muhendisligi-4k.webp";
import sirBookImage from "@/assets/size-bir-sir-4k.webp";
import tedxTopluluk from "@/assets/tedx-topluluk.jpg";
import tedxEtkilesim from "@/assets/tedx-etkilesim.jpg";

const portraitAsset = tedxTopluluk;
import { Button } from "@/components/ui/button";
import {
  INSTAGRAM_URL,
  LINKEDIN_URL,
  ORDER_URL,
  PRIMARY_EMAIL,
  TELEGRAM_URL,
  TEST_CC_EMAIL,
  WHATSAPP_URL,
  copy,
  shared,
  type Locale,
} from "@/lib/site-content";

const bookImages = [basariBookImage, sirBookImage];
const talkImages = [tedxTopluluk, tedxEtkilesim];

type Theme = "light" | "dark";

function useReveal() {
  useEffect(() => {
    const nodes = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal], .clip-reveal, .word-reveal"));
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      nodes.forEach((node) => node.classList.add("is-visible"));
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -10%" });
    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, []);
}

function useScrollMotion() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const bar = document.querySelector<HTMLElement>(".scroll-progress");
    const layers = Array.from(document.querySelectorAll<HTMLElement>("[data-parallax]"));
    let frame = 0;
    const update = () => {
      frame = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const progress = max > 0 ? Math.min(1, window.scrollY / max) : 0;
      bar?.style.setProperty("--progress", String(progress));
      layers.forEach((layer) => {
        const speed = Number(layer.dataset["parallax"] ?? 0.08);
        const rect = layer.getBoundingClientRect();
        const offset = (rect.top + rect.height / 2 - window.innerHeight / 2) * -speed;
        layer.style.setProperty("--parallax", `${offset.toFixed(2)}px`);
      });
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);
}

/** Animated numeric count-up that preserves the original label formatting. */
function Counter({ value }: { value: string }) {
  const [display, setDisplay] = useState(value);
  const [node, setNode] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (!node) return;
    const match = value.match(/[\d.]+/);
    if (!match || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const raw = match[0];
    const target = Number(raw.replace(/\./g, ""));
    if (!Number.isFinite(target) || target <= 0) return;
    const grouped = raw.includes(".");
    const format = (n: number) => (grouped ? n.toLocaleString("tr-TR") : String(n));
    setDisplay(value.replace(raw, format(0)));

    const observer = new IntersectionObserver((entries) => {
      if (!entries[0]?.isIntersecting) return;
      observer.disconnect();
      const duration = 1400;
      const start = performance.now();
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - t, 3);
        setDisplay(value.replace(raw, format(Math.round(target * eased))));
        if (t < 1) window.requestAnimationFrame(tick);
        else setDisplay(value);
      };
      window.requestAnimationFrame(tick);
    }, { threshold: 0.4 });
    observer.observe(node);
    return () => observer.disconnect();
  }, [node, value]);

  return <span ref={setNode}>{display}</span>;
}

/** Splits a heading into words that slide up in sequence when scrolled into view. */
function WordReveal({ text, className }: { text: string; className?: string }) {
  return (
    <span className={`word-reveal ${className ?? ""}`}>
      {text.split(" ").map((word, index) => (
        <span key={`${word}-${index}`}>
          <span style={{ "--i": index } as CSSProperties}>{word}</span>
          {index < text.split(" ").length - 1 ? "\u00A0" : null}
        </span>
      ))}
    </span>
  );
}

function ThemeControl({ locale }: { locale: Locale }) {
  const c = copy[locale];
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const stored = window.localStorage.getItem("ziya-theme");
    const selected: Theme = stored === "dark" ? "dark" : "light";
    setTheme(selected);
    document.documentElement.classList.toggle("dark", selected === "dark");
  }, []);

  const toggle = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    window.localStorage.setItem("ziya-theme", next);
    document.documentElement.classList.toggle("dark", next === "dark");
  };

  return (
    <Button variant="ghost" size="icon" onClick={toggle} aria-label={theme === "light" ? c.themeDark : c.themeLight} title={theme === "light" ? c.themeDark : c.themeLight}>
      {theme === "light" ? <Moon /> : <Sun />}
    </Button>
  );
}

function ContactForm({ locale }: { locale: Locale }) {
  const c = copy[locale];
  const [error, setError] = useState("");
  const field = "h-12 rounded-lg border border-input bg-transparent px-4 font-normal outline-none transition focus:border-foreground";

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const name = String(data.get("name") ?? "").trim();
    const email = String(data.get("email") ?? "").trim();
    const subject = String(data.get("subject") ?? "").trim();
    const message = String(data.get("message") ?? "").trim();
    const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!name || name.length > 100 || !validEmail || email.length > 254 || !subject || subject.length > 140 || !message || message.length > 2000) {
      setError(c.requiredError);
      return;
    }
    setError("");
    const body = `${c.labels.name}: ${name}\n${c.labels.email}: ${email}\n\n${message}`;
    window.location.href = `mailto:${PRIMARY_EMAIL}?cc=${encodeURIComponent(TEST_CC_EMAIL)}&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  return (
    <form data-reveal onSubmit={submit} noValidate className="grid gap-5 border-t border-border pt-8">
      <div className="grid gap-5 sm:grid-cols-2">
        {(["name", "email"] as const).map((id) => (
          <label key={id} className="grid gap-2 text-sm font-semibold">
            {c.labels[id]}
            <input name={id} type={id === "email" ? "email" : "text"} required maxLength={id === "email" ? 254 : 100} placeholder={c.placeholders[id]} className={field} />
          </label>
        ))}
      </div>
      <label className="grid gap-2 text-sm font-semibold">
        {c.labels.subject}
        <input name="subject" required maxLength={140} placeholder={c.placeholders.subject} className={field} />
      </label>
      <label className="grid gap-2 text-sm font-semibold">
        {c.labels.message}
        <textarea name="message" required maxLength={2000} rows={5} placeholder={c.placeholders.message} className="rounded-lg border border-input bg-transparent px-4 py-3 font-normal outline-none transition focus:border-foreground" />
      </label>
      {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
      <Button type="submit" size="lg" className="h-12 w-full rounded-lg sm:w-fit">
        <Mail /> {c.send}
      </Button>
      <p className="text-xs leading-relaxed text-muted-foreground">{c.formNote}</p>
    </form>
  );
}

export function HomePage({ locale }: { locale: Locale }) {
  const c = copy[locale];
  const [menuOpen, setMenuOpen] = useState(false);
  useReveal();
  useScrollMotion();

  useEffect(() => {
    document.documentElement.lang = locale === "tr" ? "tr" : "en";
  }, [locale]);

  const altPath = locale === "tr" ? "/en" : "/";
  const ids = locale === "tr"
    ? { approach: "yaklasim", programs: "programlar", books: "kitaplar", contact: "iletisim" }
    : { approach: "approach", programs: "programs", books: "books", contact: "contact" };

  return (
    <div className="min-h-screen overflow-hidden bg-background text-foreground">
      <div className="scroll-progress" aria-hidden="true" />
      <header className="sticky top-0 z-50 border-b border-border bg-background/92 backdrop-blur-xl">
        <div className="mx-auto flex h-[4.5rem] max-w-[86rem] items-center justify-between gap-6 px-5 lg:px-9">
          <a href="#top" className="flex min-w-0 items-center gap-3" aria-label="Ziya Şakir Yılmaz">
            <span className="grid size-9 shrink-0 place-items-center rounded-md bg-foreground font-display text-[0.7rem] font-extrabold text-background">ZŞY</span>
            <span className="hidden leading-tight sm:block">
              <strong className="block font-display text-sm font-extrabold">Ziya Şakir Yılmaz</strong>
              <span className="text-[0.64rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{locale === "tr" ? "Başarı Mühendisi" : "Success Engineer"}</span>
            </span>
          </a>
          <nav className="hidden items-center gap-8 text-[0.82rem] font-semibold lg:flex" aria-label="Primary">
            {c.nav.map(([label, href]) => (
              <a key={href} href={href} className="nav-link text-muted-foreground transition hover:text-foreground">{label}</a>
            ))}
          </nav>
          <div className="flex items-center gap-1">
            <Button asChild variant="ghost" size="sm" className="font-semibold"><Link to={altPath}>{c.otherLocale}</Link></Button>
            <ThemeControl locale={locale} />
            <Button asChild className="hidden rounded-lg sm:inline-flex"><a href={ORDER_URL}>{c.register}</a></Button>
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMenuOpen((open) => !open)} aria-expanded={menuOpen} aria-label={c.menu}>{menuOpen ? <X /> : <Menu />}</Button>
          </div>
        </div>
        {menuOpen ? (
          <nav className="border-t border-border bg-background px-5 py-4 lg:hidden">
            <div className="mx-auto grid max-w-[86rem] gap-1">
              {c.nav.map(([label, href]) => <a key={href} href={href} onClick={() => setMenuOpen(false)} className="rounded-lg px-3 py-3 font-semibold hover:bg-secondary">{label}</a>)}
              <Button asChild className="mt-3 rounded-lg sm:hidden"><a href={ORDER_URL}>{c.register}</a></Button>
            </div>
          </nav>
        ) : null}
      </header>

      <main id="top">
        {/* HERO */}
        <section className="border-b border-border">
          <div className="mx-auto grid max-w-[86rem] items-end gap-10 px-5 pb-12 pt-14 lg:grid-cols-[1.15fr_0.85fr] lg:gap-14 lg:px-9 lg:pb-16 lg:pt-20">
            <div className="max-w-4xl">
              <p className="intro eyebrow text-gold" style={{ "--intro-delay": "40ms" } as CSSProperties}>{c.eyebrow}</p>
              <h1 className="hero-title mt-7 font-display text-[clamp(2.6rem,6.6vw,6.2rem)] font-extrabold uppercase leading-[0.93]">
                <span className="block">{c.heroFixed}</span>
                <span className="hero-word-window mt-1 text-gold" aria-label={c.heroAria}>
                  {c.heroWords.map((word) => <span key={word} aria-hidden="true">{word}</span>)}
                </span>
              </h1>
              <p className="intro mt-8 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg" style={{ "--intro-delay": "380ms" } as CSSProperties}>{c.heroBody}</p>
              <div className="intro mt-9 flex flex-wrap items-center gap-3" style={{ "--intro-delay": "500ms" } as CSSProperties}>
                <Button asChild size="lg" className="h-12 rounded-lg px-6"><a href={ORDER_URL}>{c.register}<ArrowRight /></a></Button>
                <a href={`#${ids.programs}`} className="inline-flex h-12 items-center gap-2 border-b border-foreground/25 px-1 text-sm font-semibold transition hover:border-foreground">{c.explore}<ArrowUpRight className="size-4" /></a>
              </div>
              <p className="intro mt-7 flex items-center gap-2 text-xs font-semibold text-muted-foreground" style={{ "--intro-delay": "580ms" } as CSSProperties}><Check className="size-4" />{c.trust}</p>
            </div>
            <div className="parallax relative w-full" data-parallax="0.06">
              <div className="clip-reveal relative aspect-[4/5] overflow-hidden rounded-xl bg-secondary lg:aspect-[3/4]">
                <img src={portraitAsset} alt={c.imageAlt} width={1920} height={1080} className="h-full w-full object-cover object-[50%_30%]" />
              </div>
            </div>
          </div>

          {/* Ledger band — hairlines only */}
          <div className="border-t border-border">
            <div className="mx-auto max-w-[86rem] px-5 lg:px-9">
              <dl className="grid grid-cols-2 divide-x divide-y divide-border md:grid-cols-3 lg:grid-cols-5 lg:divide-y-0">
                {c.stats.map(([value, label], index) => (
                  <div key={label} data-reveal style={{ "--reveal-delay": `${index * 70}ms` } as CSSProperties} className="px-4 py-7 first:pl-0 lg:px-6">
                    <dt className="font-display text-[clamp(1.8rem,2.6vw,2.6rem)] font-extrabold leading-none text-gold"><Counter value={value} /></dt>
                    <dd className="mt-3 text-[0.78rem] font-semibold uppercase tracking-[0.1em] text-muted-foreground">{label}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </section>

        {/* 01 APPROACH */}
        <section id={ids.approach} className="mx-auto max-w-[86rem] px-5 py-20 lg:px-9 lg:py-28">
           <div data-reveal className="grid gap-10 lg:grid-cols-[0.34fr_1fr] lg:gap-14">
            <p className="eyebrow text-gold">{c.approachKicker}</p>
            <div>
              <h2 className="section-title max-w-4xl"><WordReveal text={c.approachTitle} /></h2>
               <p className="mt-9 max-w-2xl text-lg leading-relaxed text-muted-foreground">{c.approachBody}</p>
            </div>
          </div>
          <div className="mt-16 grid gap-px border-t border-border sm:grid-cols-2 xl:grid-cols-5">
            {c.expertise.map(([title, body], index) => (
              <article key={title} data-reveal style={{ "--reveal-delay": `${index * 60}ms` } as CSSProperties} className="border-b border-border py-8 sm:pr-8 xl:border-b-0">
                <span className="font-display text-xs font-bold text-gold">0{index + 1}</span>
                <h3 className="mt-6 font-display text-xl font-extrabold">{title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{body}</p>
              </article>
            ))}
          </div>
        </section>

        {/* 02 PROGRAMS — editorial rows, no cards */}
        <section id={ids.programs} className="border-y border-border bg-accent/50">
          <div className="mx-auto max-w-[86rem] px-5 py-20 lg:px-9 lg:py-28">
            <div data-reveal className="flex flex-wrap items-end justify-between gap-6">
              <div>
                <p className="eyebrow text-gold">{c.programsKicker}</p>
                <h2 className="section-title mt-5 max-w-3xl"><WordReveal text={c.programsTitle} /></h2>
              </div>
            </div>
            <div className="mt-14 border-t border-border">
              {c.programs.map((program, index) => (
                <a
                  key={program.title}
                  href={program.href}
                  data-reveal
                  style={{ "--reveal-delay": `${index * 80}ms` } as CSSProperties}
                  className="row-link group grid items-baseline gap-5 border-b border-border px-0 py-9 md:grid-cols-[5rem_1fr_1fr_auto] md:gap-8 md:px-4"
                >
                  <span className="font-display text-sm font-bold text-gold">0{index + 1}</span>
                  <div>
                    <p className="eyebrow text-muted-foreground">{program.type}</p>
                    <h3 className="mt-3 font-display text-2xl font-extrabold lg:text-3xl">{program.title}</h3>
                  </div>
                  <p className="max-w-md leading-relaxed text-muted-foreground">{program.body}</p>
                  <span className="inline-flex items-center gap-2 text-sm font-semibold">
                    {program.cta}
                    <span className="grid size-10 place-items-center rounded-full border border-foreground/25 transition group-hover:bg-foreground group-hover:text-background"><ArrowUpRight className="size-4" /></span>
                  </span>
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* 03 TEDX — full-bleed imagery */}
        <section id="tedx" className="mx-auto max-w-[86rem] px-5 py-20 lg:px-9 lg:py-28">
             <div data-reveal className="grid gap-10 lg:grid-cols-[0.34fr_1fr] lg:gap-14">
            <p className="eyebrow text-gold">{c.tedKicker}</p>
            <div>
              <h2 className="section-title max-w-3xl"><WordReveal text={c.tedTitle} /></h2>
               <p className="mt-9 max-w-2xl text-lg leading-relaxed text-muted-foreground">{c.tedBody}</p>
            </div>
          </div>
          <div className="mt-14 grid gap-8 lg:grid-cols-2">
            {shared.talks.map((talk, index) => (
              <a key={talk.url} href={talk.url} target="_blank" rel="noreferrer" data-reveal style={{ "--reveal-delay": `${index * 90}ms` } as CSSProperties} className="group block">
                <div className="clip-reveal aspect-[16/9] overflow-hidden rounded-xl bg-ink">
                  <img src={talkImages[index]} alt={`${talk.title} · TEDx`} loading="lazy" className="h-full w-full object-cover opacity-90 transition duration-700 group-hover:scale-[1.04] group-hover:opacity-100" />
                </div>
                <div className="mt-5 flex items-end justify-between gap-6 border-t border-border pt-5">
                  <div>
                    <p className="eyebrow text-muted-foreground">TEDx · {talk.year}</p>
                    <h3 className="mt-2 font-display text-xl font-extrabold lg:text-2xl">{talk.title}</h3>
                  </div>
                  <span className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground transition group-hover:text-foreground">{c.watch}<ArrowUpRight className="size-4" /></span>
                </div>
              </a>
            ))}
          </div>
        </section>

        {/* 04 BOOKS + NOTES */}
        <section id={ids.books} className="border-t border-border bg-ink text-ivory">
          <div className="mx-auto max-w-[86rem] px-5 py-20 lg:px-9 lg:py-28">
             <div data-reveal className="grid gap-10 lg:grid-cols-[0.34fr_1fr] lg:gap-14">
              <p className="eyebrow text-champagne">{c.booksKicker}</p>
              <h2 className="section-title max-w-3xl"><WordReveal text={c.booksTitle} /></h2>
            </div>
            <div className="mt-14 grid gap-12 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="grid gap-10 sm:grid-cols-2">
                {c.books.map(([title, body], index) => (
                  <article key={title} data-reveal style={{ "--reveal-delay": `${index * 80}ms` } as CSSProperties}>
                    <span className="book-cover clip-reveal block aspect-[2/3] w-full max-w-[16rem] overflow-hidden rounded-lg">
                      <img src={bookImages[index]} alt={`${title} kitap kapağı`} loading="lazy" className="h-full w-full object-cover" />
                    </span>
                    <p className="mt-6 eyebrow opacity-60">0{index + 1}</p>
                    <h3 className="mt-3 font-display text-xl font-extrabold">{title}</h3>
                    <p className="mt-3 max-w-sm text-sm leading-relaxed opacity-70">{body}</p>
                  </article>
                ))}
              </div>
              <aside data-reveal className="flex flex-col border-t border-ivory/20 pt-8 lg:border-l lg:border-t-0 lg:pl-10 lg:pt-0">
                <p className="eyebrow opacity-60">{c.notesTitle}</p>
                <h3 className="mt-6 font-display text-3xl font-extrabold">{c.notesTitle}</h3>
                <p className="mt-4 max-w-md leading-relaxed opacity-70">{c.notesBody}</p>
                <div className="mt-9 flex flex-wrap gap-3">
                  <Button asChild variant="secondary" className="h-11 rounded-lg"><a href={WHATSAPP_URL} target="_blank" rel="noreferrer">{c.whatsapp}<ArrowUpRight /></a></Button>
                  <Button asChild variant="outline" className="h-11 rounded-lg border-ivory/30 bg-transparent text-ivory hover:bg-ivory/10 hover:text-ivory"><a href={TELEGRAM_URL} target="_blank" rel="noreferrer"><Send />{c.telegram}</a></Button>
                </div>
              </aside>
            </div>
          </div>
        </section>

        {/* 05 CONTACT */}
        <section id={ids.contact} className="mx-auto grid max-w-[86rem] gap-12 px-5 py-20 lg:grid-cols-[0.8fr_1.2fr] lg:px-9 lg:py-28">
          <div data-reveal>
            <p className="eyebrow text-gold">{c.contactKicker}</p>
            <h2 className="section-title mt-5">{c.contactTitle}</h2>
            <p className="mt-6 max-w-md text-lg leading-relaxed text-muted-foreground">{c.contactBody}</p>
            <div className="mt-10 grid gap-3 text-sm">
              <a href={`mailto:${PRIMARY_EMAIL}`} className="font-bold hover:text-primary">{PRIMARY_EMAIL}</a>
              <a href={INSTAGRAM_URL} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-foreground">Instagram · @ziyasakir</a>
              <a href={LINKEDIN_URL} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-foreground">LinkedIn · Ziya Şakir Yılmaz</a>
            </div>
          </div>
          <ContactForm locale={locale} />
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-[86rem] flex-col gap-6 px-5 py-10 md:flex-row md:items-end md:justify-between lg:px-9">
          <div>
            <p className="font-display text-xl font-extrabold">Ziya Şakir Yılmaz</p>
            <p className="mt-2 text-sm text-muted-foreground">{c.footer}</p>
          </div>
          <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} · {c.rights}</p>
        </div>
      </footer>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 p-3 backdrop-blur-xl sm:hidden">
        <Button asChild className="h-12 w-full rounded-lg"><a href={ORDER_URL}>{c.register}<ArrowRight /></a></Button>
      </div>
    </div>
  );
}
