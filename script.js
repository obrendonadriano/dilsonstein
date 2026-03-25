const APP_CONFIG = window.APP_CONFIG || {};

const phoneInput = document.querySelector("#phone");
const citySelect = document.querySelector("#city");
const timeSelect = document.querySelector("#time");
const form = document.querySelector("#lead-form");
const statusNode = document.querySelector("#form-status");
const modal = document.querySelector("#success-modal");
const whatsappLink = document.querySelector("#whatsapp-link");
const glowCards = document.querySelectorAll(".card-glow");
const submitButton = document.querySelector('#lead-form button[type="submit"]');
let latestLeadPayload = null;

setupModal();
setupCardGlowTouch();
setupFormGate();
setupHeroModelLoop();
setupInfiniteMarquees();
setupSchedulingOptions();
trackInitialPageView();

if (form) form.addEventListener("submit", handleSubmit);
if (phoneInput) phoneInput.addEventListener("input", maskPhone);
if (whatsappLink) whatsappLink.addEventListener("click", handleWhatsAppClick);

function maskPhone(event) {
  const digits = event.target.value.replace(/\D/g, "").slice(0, 11);
  const parts = [];

  if (digits.length > 0) parts.push(`(${digits.slice(0, 2)}`);
  if (digits.length >= 3) parts.push(`) ${digits.slice(2, 7)}`);
  if (digits.length >= 8) parts.push(`-${digits.slice(7, 11)}`);

  event.target.value = parts.join("");
  updateSubmitState();
}

function setupCardGlowTouch() {
  glowCards.forEach((card) => {
    card.addEventListener("pointerdown", () => {
      card.classList.add("is-active");
      window.setTimeout(() => card.classList.remove("is-active"), 1000);
    });
  });
}

function setupHeroModelLoop() {
  const rotatingNode = document.querySelector(".hero-rotating-name");
  if (!rotatingNode) return;

  const phrases = JSON.parse(rotatingNode.dataset.modelPhrases || "[]");
  if (!phrases.length) return;

  if (window.matchMedia("(min-width: 821px)").matches) {
    const widestPhraseLength = phrases.reduce((max, phrase) => Math.max(max, phrase.length), 0);
    rotatingNode.style.minWidth = `${widestPhraseLength}ch`;
  } else {
    rotatingNode.style.minWidth = "0";
  }

  let phraseIndex = 0;
  let charIndex = phrases[0].length;
  let isDeleting = false;

  const tick = () => {
    const currentPhrase = phrases[phraseIndex];

    if (isDeleting) {
      charIndex -= 1;
      rotatingNode.textContent = currentPhrase.slice(0, charIndex);

      if (charIndex <= 0) {
        isDeleting = false;
        phraseIndex = (phraseIndex + 1) % phrases.length;
        window.setTimeout(tick, 120);
        return;
      }

      window.setTimeout(tick, 34);
      return;
    }

    const nextPhrase = phrases[phraseIndex];
    charIndex += 1;
    rotatingNode.textContent = nextPhrase.slice(0, charIndex);

    if (charIndex >= nextPhrase.length) {
      isDeleting = true;
      window.setTimeout(tick, 1900);
      return;
    }

    window.setTimeout(tick, 58);
  };

  rotatingNode.textContent = phrases[0];
  window.setTimeout(() => {
    isDeleting = true;
    tick();
  }, 2200);
}

function setupInfiniteMarquees() {
  const marqueeConfigs = [
    {
      motionSelector: ".mentor-marquee-motion",
      trackSelector: ".mentor-marquee-track"
    },
    {
      motionSelector: ".legacy-carousel-motion",
      trackSelector: ".legacy-carousel-track"
    },
    {
      motionSelector: ".models-marquee-motion",
      trackSelector: ".models-marquee-track"
    }
  ];

  marqueeConfigs.forEach(({ motionSelector, trackSelector }) => {
    const motion = document.querySelector(motionSelector);
    const firstTrack = motion?.querySelector(trackSelector);
    if (!motion || !firstTrack) return;

    const updateLoopDistance = () => {
      const trackWidth = firstTrack.getBoundingClientRect().width;
      if (!trackWidth) return;
      motion.style.setProperty("--marquee-loop-distance", `${trackWidth}px`);
    };

    updateLoopDistance();
    window.addEventListener("resize", updateLoopDistance, { passive: true });
    window.addEventListener("load", updateLoopDistance, { passive: true });

    if ("ResizeObserver" in window) {
      const resizeObserver = new ResizeObserver(updateLoopDistance);
      resizeObserver.observe(firstTrack);
    }
  });
}

function setupModal() {
  if (!modal) return;

  document.querySelectorAll("[data-close-modal]").forEach((node) => {
    node.addEventListener("click", closeModal);
  });

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeModal();
  });
}

function setupFormGate() {
  if (!form || !submitButton) return;

  form.addEventListener("input", updateSubmitState);
  form.addEventListener("change", updateSubmitState);
  updateSubmitState();
}

function updateSubmitState() {
  if (!form || !submitButton) return;

  const name = document.querySelector("#name")?.value.trim();
  const age = document.querySelector("#age")?.value.trim();
  const city = document.querySelector("#city")?.value.trim();
  const time = document.querySelector("#time")?.value.trim();
  const phoneDigits = document.querySelector("#phone")?.value.replace(/\D/g, "");
  const consent = document.querySelector("#consent")?.checked;

  const isReady = Boolean(
    name &&
    age &&
    city &&
    time &&
    phoneDigits &&
    phoneDigits.length >= 10 &&
    consent
  );

  submitButton.disabled = !isReady;
  submitButton.classList.toggle("is-ready", isReady);
}

function openModal() {
  if (!modal) return;
  modal.classList.add("is-open");
  modal.setAttribute("aria-hidden", "false");
}

function closeModal() {
  if (!modal) return;
  modal.classList.remove("is-open");
  modal.setAttribute("aria-hidden", "true");
}

async function handleSubmit(event) {
  event.preventDefault();
  statusNode.textContent = "";

  if (!form.reportValidity()) {
    statusNode.textContent = "Confira os campos destacados antes de enviar.";
    return;
  }

  const payload = buildPayload(new FormData(form));
  latestLeadPayload = payload;
  submitButton.disabled = true;
  submitButton.classList.remove("is-ready");
  submitButton.querySelector("span").textContent = "Enviando...";

  try {
    const [supabaseResult, crmResult, facebookResult] = await Promise.allSettled([
      submitLeadToSupabase(payload),
      submitLeadToCRM(payload),
      trackLead(payload)
    ]);

    if (supabaseResult.status === "rejected") {
      throw supabaseResult.reason;
    }

    if (crmResult.status === "rejected") {
      throw crmResult.reason;
    }

    if (facebookResult.status === "rejected") {
      console.error("Falha ao registrar conversão do Facebook:", facebookResult.reason);
    }

    form.reset();
    statusNode.textContent = "Cadastro enviado com sucesso.";
    configureWhatsAppLink(payload);
    openModal();
  } catch (error) {
    console.error(error);
    statusNode.textContent = error.message || "Não foi possível enviar agora. Tente novamente em instantes.";
  } finally {
    updateSubmitState();
    submitButton.querySelector("span").textContent = "Quero iniciar meu cadastro";
  }
}

function buildPayload(formData) {
  const payload = Object.fromEntries(formData.entries());
  const now = new Date().toISOString();
  const pageUrl = window.location.href;
  const url = new URL(pageUrl);
  const fbclid = url.searchParams.get("fbclid") || "";
  const fbc = buildFbcValue(fbclid);
  const fbp = getCookie("_fbp") || "";
  const { firstName, lastName } = splitName(payload.name?.trim() || "");
  const externalId = buildExternalId({
    name: payload.name?.trim(),
    phone: payload.phone?.replace(/\D/g, "")
  });

  return {
    name: payload.name?.trim(),
    first_name: firstName,
    last_name: lastName,
    age: payload.age || "",
    city: payload.city?.trim() || "",
    time: payload.time?.trim() || "",
    phone: payload.phone?.replace(/\D/g, ""),
    consent: payload.consent === "on",
    source: "facebook-landing-page",
    created_at: now,
    page_url: pageUrl,
    utm_source: url.searchParams.get("utm_source") || "",
    utm_medium: url.searchParams.get("utm_medium") || "",
    utm_campaign: url.searchParams.get("utm_campaign") || "",
    utm_content: url.searchParams.get("utm_content") || "",
    utm_term: url.searchParams.get("utm_term") || "",
    fbclid,
    fbc,
    fbp,
    external_id: externalId,
    user_agent: navigator.userAgent,
    locale: navigator.language
  };
}

async function submitLeadToSupabase(payload) {
  const supabaseUrl = APP_CONFIG.supabase?.url;
  const supabaseKey = APP_CONFIG.supabase?.anonKey;
  const table = APP_CONFIG.supabase?.table || "leads";

  if (!supabaseUrl || !supabaseKey) {
    return Promise.resolve({ skipped: true });
  }

  const {
    external_id,
    first_name,
    last_name,
    ...supabasePayload
  } = payload;

  const response = await fetch(`${supabaseUrl}/rest/v1/${table}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      Prefer: "return=representation"
    },
    body: JSON.stringify(supabasePayload)
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Falha ao enviar para o Supabase: ${text}`);
  }

  return response.json();
}

async function submitLeadToCRM(payload) {
  const endpoint = APP_CONFIG.crm?.endpoint;
  const apiKey = APP_CONFIG.crm?.apiKey;

  if (!endpoint) {
    return Promise.resolve({ skipped: true });
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {})
    },
    body: JSON.stringify({
      lead: payload,
      metadata: {
        integration: "dilson-stein-landing",
        received_at: new Date().toISOString()
      }
    })
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Falha ao enviar para o CRM: ${text}`);
  }

  return response.json().catch(() => ({}));
}

async function trackLead(payload) {
  const eventId = buildEventId("Lead");
  trackFacebookPixel(payload, "Lead", eventId);
  return sendFacebookConversion(payload, "Lead", eventId);
}

function trackFacebookPixel(payload, eventName = "Lead", eventId = "") {
  if (typeof window.fbq !== "function") return;

  const eventPayload = {
    content_name: "Cadastro Dilson Stein",
    status: "started",
    lead_source: payload.source,
    age: payload.age,
    city: payload.city,
    schedule_time: payload.time,
    first_name: payload.first_name || "",
    last_name: payload.last_name || "",
    phone: payload.phone || ""
  };

  if (eventName === "PageView") {
    window.fbq("track", "PageView", eventPayload, eventId ? { eventID: eventId } : undefined);
    return;
  }

  window.fbq("track", eventName, eventPayload, eventId ? { eventID: eventId } : undefined);
}

async function sendFacebookConversion(payload, eventName = "Lead", eventId = "") {
  const endpoint = APP_CONFIG.facebook?.conversionProxyUrl;

  if (!endpoint) {
    return Promise.resolve({ skipped: true });
  }

  const response = await fetch(endpoint, {
    method: "POST",
    keepalive: true,
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      event_name: eventName,
      event_id: eventId || undefined,
      event_time: Math.floor(Date.now() / 1000),
      action_source: "website",
      event_source_url: window.location.href,
      test_event_code: APP_CONFIG.facebook?.testEventCode || "",
      user_data: {
        fn: payload.first_name || "",
        ln: payload.last_name || "",
        ph: payload.phone,
        ct: payload.city,
        country: "br",
        external_id: payload.external_id || "",
        client_user_agent: payload.user_agent,
        fbc: payload.fbc,
        fbp: payload.fbp
      },
      custom_data: {
        source: payload.source,
        age: payload.age,
        city: payload.city,
        schedule_time: payload.time
      }
    })
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Falha ao registrar conversao no Facebook: ${text}`);
  }

  return response.json().catch(() => ({}));
}

async function handleWhatsAppClick(event) {
  if (!latestLeadPayload) return;

  event.preventDefault();
  const targetUrl = whatsappLink?.href;

  if (!targetUrl || targetUrl === "#") {
    return;
  }

  try {
    const eventId = buildEventId("Contact");
    trackFacebookPixel(latestLeadPayload, "Contact", eventId);
    sendFacebookConversion(latestLeadPayload, "Contact", eventId).catch((error) => {
      console.error("Falha ao registrar conversão do WhatsApp:", error);
    });
  } catch (error) {
    console.error("Falha ao registrar conversão do WhatsApp:", error);
  }

  window.location.assign(targetUrl);
}

function configureWhatsAppLink(payload) {
  if (!whatsappLink) return;

  const rawPhone = APP_CONFIG.whatsapp?.number || "5511999999999";
  const template = APP_CONFIG.whatsapp?.message
    || "Olá, meu nome é {name}, tenho {age} anos e me cadastrei para participar da seleção em {city}. Gostaria de mais informações sobre como participar.";
  const text = template
    .replaceAll("{name}", payload.name || "")
    .replaceAll("{age}", payload.age || "")
    .replaceAll("{city}", payload.city || "")
    .replaceAll("{time}", payload.time || "");
  const url = buildWhatsAppUrl(rawPhone, text);
  whatsappLink.href = url;
}

function buildWhatsAppUrl(phone, text) {
  const encodedText = encodeURIComponent(text || "");
  const normalizedPhone = String(phone || "").replace(/\D/g, "");

  if (isMobileDevice()) {
    return `whatsapp://send?phone=${normalizedPhone}&text=${encodedText}`;
  }

  return `https://web.whatsapp.com/send?phone=${normalizedPhone}&text=${encodedText}`;
}

function isMobileDevice() {
  const ua = navigator.userAgent || "";
  return /Android|iPhone|iPad|iPod|Windows Phone|Opera Mini|IEMobile/i.test(ua);
}

function getCookie(name) {
  const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
  return match ? decodeURIComponent(match[2]) : "";
}

function buildFbcValue(fbclid = "") {
  const existingFbc = getCookie("_fbc") || "";
  if (existingFbc) return existingFbc;
  if (!fbclid) return "";
  return `fb.1.${Date.now()}.${fbclid}`;
}

function splitName(fullName) {
  const parts = String(fullName || "").trim().split(/\s+/).filter(Boolean);
  const firstName = parts[0] || "";
  const lastName = parts.length > 1 ? parts.slice(1).join(" ") : "";
  return { firstName, lastName };
}

function buildEventId(eventName) {
  const random = Math.random().toString(36).slice(2, 10);
  return `dilson-${eventName.toLowerCase()}-${Date.now()}-${random}`;
}

function buildExternalId({ name = "", phone = "" } = {}) {
  const normalizedPhone = String(phone || "").replace(/\D/g, "");
  const normalizedName = String(name || "").trim().toLowerCase().replace(/\s+/g, "-");

  if (normalizedPhone) {
    return `lead-${normalizedPhone}`;
  }

  if (normalizedName) {
    return `lead-${normalizedName}`;
  }

  try {
    const existing = window.localStorage.getItem("dilson_external_id");
    if (existing) return existing;
    const generated = `visitor-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    window.localStorage.setItem("dilson_external_id", generated);
    return generated;
  } catch {
    return `visitor-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  }
}

function trackInitialPageView() {
  const eventId = buildEventId("PageView");
  const pagePayload = {
    source: "facebook-landing-page",
    first_name: "",
    last_name: "",
    age: "",
    city: "",
    time: "",
    phone: "",
    external_id: buildExternalId(),
    user_agent: navigator.userAgent,
    fbc: buildFbcValue(new URL(window.location.href).searchParams.get("fbclid") || ""),
    fbp: getCookie("_fbp") || ""
  };

  try {
    trackFacebookPixel(pagePayload, "PageView", eventId);
    sendFacebookConversion(pagePayload, "PageView", eventId).catch((error) => {
      console.error("Falha ao registrar PageView no Facebook:", error);
    });
  } catch (error) {
    console.error("Falha ao disparar PageView:", error);
  }
}

async function setupSchedulingOptions() {
  const cityOptions = await loadSchedulingOptions("event_cities", APP_CONFIG.scheduling?.defaultCities || []);
  const timeOptions = await loadSchedulingOptions("event_times", APP_CONFIG.scheduling?.defaultTimes || []);

  populateSelect(
    citySelect,
    cityOptions,
    "Selecione a cidade que deseja participar da seleção"
  );

  populateSelect(
    timeSelect,
    timeOptions,
    "Selecione o horário para comparecer presencialmente à seleção"
  );
}

async function loadSchedulingOptions(tableName, fallbackOptions) {
  const supabaseUrl = APP_CONFIG.supabase?.url;
  const supabaseKey = APP_CONFIG.supabase?.anonKey;

  if (!supabaseUrl || !supabaseKey) {
    return fallbackOptions;
  }

  try {
    const response = await fetch(
      `${supabaseUrl}/rest/v1/${tableName}?select=label,sort_order,active&active=eq.true&order=sort_order.asc.nullslast,label.asc`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`
        }
      }
    );

    if (!response.ok) {
      throw new Error(await response.text());
    }

    const items = await response.json();
    if (!Array.isArray(items) || !items.length) {
      return fallbackOptions;
    }

    return items.map((item) => item.label).filter(Boolean);
  } catch (error) {
    console.error(`Falha ao carregar ${tableName}:`, error);
    return fallbackOptions;
  }
}

function populateSelect(selectNode, options, placeholder) {
  if (!selectNode) return;

  const currentValue = selectNode.value;
  const optionMarkup = [
    `<option value="">${placeholder}</option>`,
    ...options.map((option) => `<option value="${escapeHtml(option)}">${escapeHtml(option)}</option>`)
  ];

  selectNode.innerHTML = optionMarkup.join("");

  if (options.includes(currentValue)) {
    selectNode.value = currentValue;
  }
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
