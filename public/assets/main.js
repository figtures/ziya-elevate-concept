/* ziyasakiryilmaz.com — ortak etkileşimler */
(function(){
  "use strict";

  /* Menü: scroll durumu */
  var header = document.querySelector("header.site");
  function onScroll(){
    if (!header) return;
    header.classList.toggle("scrolled", window.scrollY > 24);
  }
  window.addEventListener("scroll", onScroll, { passive:true });
  onScroll();

  /* Accessible mobile navigation; desktop remains a normal link list. */
  var hamb = document.querySelector(".hamb");
  var navigation = document.querySelector(".main-navigation");
  if (hamb && navigation){
    var mobile = matchMedia("(max-width: 1280px)");
    var backdrop = header.querySelector("[data-close-menu]");
    var toggleLabel = hamb.querySelector(".menu-toggle-label");
    var backgroundState = new Map();
    function setMenu(open, restoreFocus){
      open = open && mobile.matches;
      navigation.classList.toggle("open", open);
      header.classList.toggle("menu-expanded", open);
      document.body.classList.toggle("menu-open", open);
      hamb.setAttribute("aria-expanded", String(open));
      hamb.setAttribute("aria-label", open ? "Menüyü kapat" : "Menüyü aç");
      hamb.querySelector("use")?.setAttribute("href", "/assets/icons.svg#" + (open ? "x" : "menu"));
      navigation.inert = mobile.matches && !open;
      if (backdrop) backdrop.hidden = !open;
      if (toggleLabel) toggleLabel.textContent = open ? "Kapat" : "Menü";
      if (open && !backgroundState.size) {
        Array.from(document.body.children).forEach(function(el){
          if (el === header || /^(SCRIPT|STYLE|LINK)$/.test(el.tagName)) return;
          backgroundState.set(el, el.inert);
          el.inert = true;
        });
      } else if (!open) {
        backgroundState.forEach(function(wasInert, el){el.inert = wasInert;});
        backgroundState.clear();
      }
      if (restoreFocus) hamb.focus();
    }
    hamb.addEventListener("click", function(){
      var open = hamb.getAttribute("aria-expanded") !== "true";
      setMenu(open, false);
      if (open) navigation.querySelector("a").focus();
    });
    if (backdrop) backdrop.addEventListener("click", function(){setMenu(false, true);});
    navigation.addEventListener("click", function(e){
      if (e.target.closest("a")) setMenu(false, mobile.matches);
    });
    document.addEventListener("keydown", function(e){
      if (hamb.getAttribute("aria-expanded") !== "true") return;
      if (e.key === "Escape") { e.preventDefault();setMenu(false, true); }
      if (e.key === "Tab") {
        var items = Array.from(header.querySelectorAll("a,button")).filter(function(el){return el.tabIndex >= 0 && !el.disabled && el.getClientRects().length;});
        var first = items[0], last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) {e.preventDefault();last.focus();}
        else if (!e.shiftKey && document.activeElement === last) {e.preventDefault();first.focus();}
      }
    });
    mobile.addEventListener("change", function(){setMenu(false, false);});
    setMenu(false, false);
  }

  /* Scroll reveal */
  var revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && revealEls.length){
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(en){
        if (en.isIntersecting){
          en.target.classList.add("visible");
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.14 });
    revealEls.forEach(function(el){ io.observe(el); });
  } else {
    revealEls.forEach(function(el){ el.classList.add("visible"); });
  }
  /* Güvenlik ağı: her koşulda 5 sn sonra tüm bölümler görünür olsun
     (gözlemci herhangi bir nedenle tetiklenmezse sayfa asla boş kalmaz) */
  setTimeout(function(){
    revealEls.forEach(function(el){ el.classList.add("visible"); });
  }, 5000);

  /* The rendered, CMS-editable number is the source of truth. Keep it readable
     without JavaScript and until the counter actually enters the viewport. */
  var counterMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  var counters = document.querySelectorAll("[data-counter], [data-count]");
  var counterStates = [];
  var cio;
  function finishCounter(state){
    if (state.frame) cancelAnimationFrame(state.frame);
    state.frame = 0;
    if (state.finalText !== undefined) state.el.textContent = state.finalText;
    state.done = true;
  }
  function animateCounter(state){
    if (state.done || state.started) return;
    state.started = true;
    state.finalText = state.el.textContent.trim();
    // Turkish grouping and optional decimal comma; never fall back to stale
    // data-count attributes after an editor changes the visible number.
    var parts = state.finalText.match(/^([^\d]*)(\d[\d.]*(?:,\d+)?)(.*)$/);
    if (!parts || counterMotion.matches) { finishCounter(state); return; }
    var target = Number(parts[2].replace(/\./g, "").replace(",", "."));
    if (!Number.isFinite(target) || target < 0 || target > Number.MAX_SAFE_INTEGER) { finishCounter(state); return; }
    var decimals = (parts[2].split(",")[1] || "").length;
    var accessible = document.createElement("span");
    accessible.className = "counter-accessible";
    accessible.textContent = state.finalText;
    var visual = document.createElement("span");
    visual.setAttribute("aria-hidden", "true");
    // The accessible text remains the final value throughout the animation.
    // It is generated from current content, not a second editable aria-label.
    state.el.replaceChildren(accessible, visual);
    var start = null, duration = 1600;
    function display(value){
      visual.textContent = parts[1] + value.toLocaleString("tr-TR", { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) + parts[3];
    }
    display(0);
    function step(timestamp){
      if (state.done) return;
      if (counterMotion.matches) { finishCounter(state); return; }
      if (start === null) start = timestamp;
      var progress = Math.min((timestamp - start) / duration, 1);
      if (progress >= 1) { finishCounter(state); return; }
      var value = target * (1 - Math.pow(1 - progress, 3));
      display(decimals ? value : Math.round(value));
      state.frame = requestAnimationFrame(step);
    }
    state.frame = requestAnimationFrame(step);
  }
  if (counters.length && "IntersectionObserver" in window && !counterMotion.matches){
    cio = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if (!entry.isIntersecting) return;
        var state = counterStates.find(function(item){ return item.el === entry.target; });
        if (state) animateCounter(state);
        cio.unobserve(entry.target);
      });
    }, { threshold: 0.6 });
    counters.forEach(function(el){
      counterStates.push({ el: el, started: false, done: false, frame: 0 });
      cio.observe(el);
    });
    counterMotion.addEventListener("change", function(){
      if (!counterMotion.matches) return;
      cio.disconnect();
      counterStates.forEach(finishCounter);
    });
  }

  var noMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  /* Başarı Mühendisliği blueprint — görünür olunca bir kez kurulur */
  var bps = document.querySelectorAll(".bp-draw");
  if (bps.length && "IntersectionObserver" in window && !noMotion){
    var bio = new IntersectionObserver(function(entries){
      entries.forEach(function(en){
        if (en.isIntersecting){
          en.target.classList.add("built");
          bio.unobserve(en.target);
        }
      });
    }, { threshold: 0.45 });
    bps.forEach(function(el){ bio.observe(el); });
  } else {
    bps.forEach(function(el){ el.classList.add("built"); });
  }

})();
