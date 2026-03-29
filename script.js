const APP_CONFIG = window.APP_CONFIG || {};

const phoneInput = document.querySelector("#phone");
const citySelect = document.querySelector("#city");
const timeSelect = document.querySelector("#time");
const consentInput = document.querySelector("#consent");
const form = document.querySelector("#lead-form");
const statusNode = document.querySelector("#form-status");
const modal = document.querySelector("#success-modal");
const whatsappLink = document.querySelector("#whatsapp-link");
const activeCitiesList = document.querySelector("#active-cities-list");
const heroActiveCitiesText = document.querySelector("#hero-active-cities-text");
const heroVideo = document.querySelector(".hero-video");
const glowCards = document.querySelectorAll(".card-glow");
const submitButton = document.querySelector('#lead-form button[type="submit"]');
const selectionDetailsCard = document.querySelector("#selection-details-card");
const selectionDetailsCity = document.querySelector("#selection-details-city");
const selectionDetailsVenue = document.querySelector("#selection-details-venue");
const selectionDetailsAddress = document.querySelector("#selection-details-address");
const chatRoot = document.querySelector("#site-chat");
const chatToggle = document.querySelector("#site-chat-toggle");
const chatPanel = document.querySelector("#site-chat-panel");
const chatClose = document.querySelector("#site-chat-close");
const chatMessages = document.querySelector("#site-chat-messages");
const chatForm = document.querySelector("#site-chat-form");
const chatInput = document.querySelector("#site-chat-input");
const chatSubmit = document.querySelector("#site-chat-submit");
let latestLeadPayload = null;
let chatHistory = [];
let chatTypingNode = null;
let cityCatalog = [];
let cityTimeCatalog = [];

setupModal();
setupCardGlowTouch();
setupHeroVideo();
setupFormGate();
setupDefaultConsent();
setupHeroModelLoop();
setupInfiniteMarquees();
setupModelsScrollLoop();
setupSchedulingOptions();
setupSiteChat();
trackInitialPageView();

if (form) form.addEventListener("submit", handleSubmit);
if (phoneInput) phoneInput.addEventListener("input", maskPhone);
if (whatsappLink) whatsappLink.addEventListener("click", handleWhatsAppClick);
if (citySelect) citySelect.addEventListener("change", handleCitySelectionChange);

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

function setupHeroVideo() {
  if (!heroVideo) return;

  heroVideo.muted = true;
  heroVideo.defaultMuted = true;
  heroVideo.setAttribute("muted", "");
  heroVideo.setAttribute("playsinline", "");
  heroVideo.setAttribute("webkit-playsinline", "");
  heroVideo.setAttribute("autoplay", "");

  const tryPlay = () => {
    const playPromise = heroVideo.play();
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch(() => {});
    }
  };

  heroVideo.addEventListener("loadeddata", tryPlay);
  heroVideo.addEventListener("canplay", tryPlay);
  window.addEventListener("load", tryPlay, { passive: true });
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) tryPlay();
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

function setupModelsScrollLoop() {
  const marquee = document.querySelector(".models-marquee");
  const motion = document.querySelector(".models-marquee-motion");
  const firstTrack = motion?.querySelector(".models-marquee-track");
  if (!marquee || !motion || !firstTrack) return;

  let frameId = 0;
  let previousTime = 0;
  let loopDistance = 0;
  let currentOffset = 0;

  const speed = 42;

  const measure = () => {
    const trackWidth = firstTrack.getBoundingClientRect().width;
    if (!trackWidth) return;
    loopDistance = trackWidth;
    currentOffset = currentOffset % loopDistance;
    marquee.scrollLeft = currentOffset;
  };

  const tick = (time) => {
    if (!loopDistance) {
      frameId = window.requestAnimationFrame(tick);
      return;
    }

    if (!previousTime) previousTime = time;
    const delta = (time - previousTime) / 1000;
    previousTime = time;

    currentOffset += speed * delta;
    if (currentOffset >= loopDistance) {
      currentOffset -= loopDistance;
    }

    marquee.scrollLeft = currentOffset;
    frameId = window.requestAnimationFrame(tick);
  };

  const start = () => {
    if (frameId) {
      window.cancelAnimationFrame(frameId);
      frameId = 0;
    }
    previousTime = 0;
    measure();
    frameId = window.requestAnimationFrame(tick);
  };

  start();
  window.addEventListener("load", start, { passive: true });
  window.addEventListener("resize", start, { passive: true });

  if ("ResizeObserver" in window) {
    const resizeObserver = new ResizeObserver(start);
    resizeObserver.observe(firstTrack);
  }

  motion.querySelectorAll("img").forEach((img) => {
    if (!img.complete) {
      img.addEventListener("load", start, { once: true });
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

function setupDefaultConsent() {
  if (!consentInput) return;
  consentInput.checked = true;
}

function updateSubmitState() {
  if (!form || !submitButton) return;

  const name = document.querySelector("#name")?.value.trim();
  const age = document.querySelector("#age")?.value.trim();
  const city = document.querySelector("#city")?.value.trim();
  const time = document.querySelector("#time")?.value.trim();
  const phoneDigits = document.querySelector("#phone")?.value.replace(/\D/g, "");
  const consent = consentInput?.checked;

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
    if (consentInput) consentInput.checked = true;
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

  const selectedCity = getCityRecordByLabel(payload.city);
  const rawPhone = resolveWhatsAppPhone(selectedCity?.label || payload.city || "");
  const template = APP_CONFIG.whatsapp?.message
    || "Olá! Meu nome é {nome}, tenho {idade} anos e me cadastrei para participar da seleção em {cidade}, no dia {dia}, no {hotel}, localizado no endereço {endereco}. Gostaria de receber mais informações sobre como participar.";
  const venueName = selectedCity?.venue_name || "local a confirmar";
  const address = selectedCity?.address || "endereço a confirmar";
  const firstName = splitName(payload.name || "").firstName || "";
  const cityParts = extractCityLabelParts(selectedCity?.label || payload.city || "");
  const text = normalizeWhatsAppMessage(template
    .replaceAll("{name}", payload.name || "")
    .replaceAll("{age}", payload.age || "")
    .replaceAll("{city}", payload.city || "")
    .replaceAll("{time}", payload.time || "")
    .replaceAll("{venue_name}", venueName)
    .replaceAll("{address}", address)
    .replaceAll("{location_sentence}", buildLocationSentence(selectedCity))
    .replaceAll("{nome}", firstName)
    .replaceAll("{idade}", payload.age || "")
    .replaceAll("{cidade}", cityParts.city)
    .replaceAll("{dia}", cityParts.day)
    .replaceAll("{hotel}", venueName)
    .replaceAll("{endereco}", address));
  const url = buildWhatsAppUrl(rawPhone, text);
  whatsappLink.href = url;
}

function resolveWhatsAppPhone(cityLabel) {
  const fallbackPhone = APP_CONFIG.whatsapp?.number || "5511999999999";
  const normalizedCity = String(cityLabel || "").toLowerCase();
  const numbersByCity = APP_CONFIG.whatsapp?.numbersByCity || {};

  if (normalizedCity.includes("santos") && numbersByCity.santos) {
    return numbersByCity.santos;
  }

  if (normalizedCity.includes("campinas") && numbersByCity.campinas) {
    return numbersByCity.campinas;
  }

  return fallbackPhone;
}

function extractCityLabelParts(label) {
  const normalizedLabel = String(label || "").trim();
  if (!normalizedLabel) {
    return {
      city: "",
      day: ""
    };
  }

  const dayMatch = normalizedLabel.match(/\b\d{2}\/\d{2}\b/);
  const day = dayMatch?.[0] || "";
  const city = normalizedLabel.replace(/\b\d{2}\/\d{2}\b/, "").trim();

  return {
    city,
    day
  };
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
  const cityOptions = await loadActiveCities();
  const timeOptions = await loadActiveCityTimes(cityOptions);
  cityCatalog = cityOptions;
  cityTimeCatalog = timeOptions;

  populateSelect(
    citySelect,
    cityOptions.map((item) => item.label),
    "Selecione a cidade que deseja participar da seleção"
  );

  populateTimeSelectForCity(citySelect?.value || "");

  populateActiveCities(cityOptions);
  populateHeroActiveCities(cityOptions);
  updateSelectionDetails();
}

async function loadActiveCities() {
  const supabaseUrl = APP_CONFIG.supabase?.url;
  const supabaseKey = APP_CONFIG.supabase?.anonKey;
  const normalizedFallback = normalizeCityRecords(APP_CONFIG.scheduling?.defaultCities || []);

  if (!supabaseUrl || !supabaseKey) {
    return normalizedFallback;
  }

  try {
    const response = await fetch(
      `${supabaseUrl}/rest/v1/event_cities?select=*&active=eq.true&order=sort_order.asc.nullslast,label.asc`,
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
      return normalizedFallback;
    }

    return normalizeCityRecords(items);
  } catch (error) {
    console.error("Falha ao carregar event_cities:", error);
    return normalizedFallback;
  }
}

async function loadActiveCityTimes(cityOptions) {
  const supabaseUrl = APP_CONFIG.supabase?.url;
  const supabaseKey = APP_CONFIG.supabase?.anonKey;
  const normalizedFallback = buildFallbackCityTimes(cityOptions, APP_CONFIG.scheduling?.defaultTimes || []);

  if (!supabaseUrl || !supabaseKey) {
    return normalizedFallback;
  }

  try {
    const response = await fetch(
      `${supabaseUrl}/rest/v1/event_city_times?select=*&active=eq.true&order=city_id.asc,sort_order.asc,label.asc`,
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
      return normalizedFallback;
    }

    return normalizeCityTimeRecords(items);
  } catch (error) {
    console.error("Falha ao carregar event_city_times:", error);
    return normalizedFallback;
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

function populateActiveCities(cities) {
  if (!activeCitiesList) return;

  const items = normalizeCityRecords(cities);
  activeCitiesList.innerHTML = items
    .map((city) => `
      <article class="city-card">
        <div class="city-card__head">
          <span class="city-card__badge">Cidade ativa</span>
          <strong>${escapeHtml(city.label)}</strong>
        </div>
        <p>${escapeHtml(city.venue_name || "Local a confirmar")}</p>
        <small>${escapeHtml(city.address || "Endereço em confirmação no painel admin.")}</small>
      </article>
    `)
    .join("");

  activeCitiesList.querySelectorAll(".city-card").forEach((card) => {
    card.addEventListener("pointerdown", () => {
      card.classList.add("is-active");
      window.setTimeout(() => card.classList.remove("is-active"), 1000);
    });
  });
}

function populateHeroActiveCities(cities) {
  if (!heroActiveCitiesText) return;

  const items = normalizeCityRecords(cities);
  if (!items.length) {
    heroActiveCitiesText.textContent = "Seleção presencial já confirmada nas cidades ativas.";
    return;
  }

  const visibleCities = items.slice(0, 3).map((item) => item.label);
  const cityText = visibleCities.join(", ");
  heroActiveCitiesText.textContent = ` Seleção presencial já confirmada em ${cityText}.`;
}

function handleCitySelectionChange() {
  populateTimeSelectForCity(citySelect?.value || "");
  updateSelectionDetails();
  updateSubmitState();
}

function updateSelectionDetails() {
  if (!selectionDetailsCard || !citySelect) return;

  const selectedCity = getCityRecordByLabel(citySelect.value);
  if (!selectedCity) {
    selectionDetailsCard.hidden = true;
    return;
  }

  selectionDetailsCity.textContent = selectedCity.label || "Cidade da seleção";
  selectionDetailsVenue.textContent = selectedCity.venue_name || "Local a confirmar";
  selectionDetailsAddress.textContent = selectedCity.address || "Endereço em confirmação.";
  selectionDetailsCard.hidden = false;
}

function getCityRecordByLabel(label) {
  const normalizedLabel = String(label || "").trim();
  if (!normalizedLabel) return null;
  return cityCatalog.find((item) => item.label === normalizedLabel) || null;
}

function normalizeCityRecords(items) {
  return (Array.isArray(items) ? items : [])
    .map((item, index) => {
      if (typeof item === "string") {
        return {
          id: `fallback-city-${index}`,
          label: item,
          venue_name: "",
          address: "",
          sort_order: index + 1,
          active: true
        };
      }

      if (!item || !String(item.label || "").trim()) return null;

      return {
        id: item.id ?? `city-${index}`,
        label: String(item.label || "").trim(),
        venue_name: String(item.venue_name || item.venue || "").trim(),
        address: String(item.address || item.endereco || "").trim(),
        sort_order: Number(item.sort_order || index + 1),
        active: item.active !== false
      };
    })
    .filter(Boolean)
    .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0) || a.label.localeCompare(b.label, "pt-BR"));
}

function normalizeTimeRecords(items) {
  return (Array.isArray(items) ? items : [])
    .map((item, index) => {
      if (typeof item === "string") return item;
      return String(item?.label || "").trim() || `Horário ${index + 1}`;
    })
    .filter(Boolean);
}

function normalizeCityTimeRecords(items) {
  return (Array.isArray(items) ? items : [])
    .map((item, index) => {
      if (!item || !String(item.label || "").trim()) return null;
      return {
        id: item.id ?? `city-time-${index}`,
        city_id: String(item.city_id ?? ""),
        label: String(item.label || "").trim(),
        sort_order: Number(item.sort_order || index + 1),
        active: item.active !== false
      };
    })
    .filter(Boolean)
    .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0) || a.label.localeCompare(b.label, "pt-BR"));
}

function buildFallbackCityTimes(cityOptions, defaultTimes) {
  return normalizeCityRecords(cityOptions).flatMap((city) =>
    normalizeTimeRecords(defaultTimes).map((label, index) => ({
      id: `fallback-${city.id}-${index}`,
      city_id: String(city.id),
      label,
      sort_order: index + 1,
      active: true
    }))
  );
}

function populateTimeSelectForCity(cityLabel) {
  const selectedCity = getCityRecordByLabel(cityLabel);
  const timeOptions = selectedCity
    ? cityTimeCatalog
      .filter((item) => String(item.city_id) === String(selectedCity.id) && item.active !== false)
      .map((item) => item.label)
    : [];

  populateSelect(
    timeSelect,
    timeOptions,
    selectedCity
      ? "Selecione o horário para comparecer presencialmente à seleção"
      : "Escolha a cidade para liberar os horários"
  );

  if (timeSelect) {
    timeSelect.disabled = !selectedCity;
    if (!selectedCity) {
      timeSelect.value = "";
    }
  }
}

function buildLocationSentence(cityRecord) {
  const venueName = String(cityRecord?.venue_name || "").trim();
  const address = String(cityRecord?.address || "").trim();

  if (venueName && address) return `no ${venueName}, ${address}`;
  if (venueName) return `no ${venueName}`;
  if (address) return `no endereço ${address}`;
  return "com local a confirmar";
}

function normalizeWhatsAppMessage(message) {
  return String(message || "")
    .replace(/\s+,/g, ",")
    .replace(/\s+\./g, ".")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function setupSiteChat() {
  if (!chatRoot || !chatToggle || !chatPanel || !chatMessages || !chatForm || !chatInput) return;

  setChatOpen(false);
  chatHistory = loadChatHistory();
  renderChatHistory();

  if (!chatHistory.length) {
    const welcomeMessage = "Oi, tudo bem? Eu posso te explicar como funciona a seletiva e te ajudar a concluir seu cadastro. O que você gostaria de saber?";
    appendChatMessage("model", welcomeMessage);
    persistChatHistory();
  }

  chatToggle.addEventListener("click", () => {
    const shouldOpen = chatPanel.hidden || !chatRoot.classList.contains("is-open");
    setChatOpen(shouldOpen);
  });

  chatRoot.addEventListener("click", (event) => {
    const closeTrigger = event.target.closest("[data-chat-close]");
    if (!closeTrigger) return;

    event.preventDefault();
    event.stopPropagation();
    setChatOpen(false);
  });

  chatForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const message = chatInput.value.trim();

    if (!message) return;

    appendChatMessage("user", message);
    persistChatHistory();
    chatInput.value = "";
    autoResizeChatInput();
    setChatLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message,
          history: chatHistory.slice(0, -1).slice(-8),
          leadContext: getLeadContext()
        })
      });

      const data = await response.json().catch(() => ({}));
      const reply = String(data.reply || "").trim()
        || "Posso te ajudar a seguir com o cadastro. Me conta sua dúvida.";

      appendChatMessage("model", reply);
    } catch (error) {
      console.error("Falha no chat:", error);
      appendChatMessage("model", "Tive uma instabilidade aqui agora, mas você pode seguir pelo botão de cadastro e concluir seu perfil.");
    } finally {
      setChatLoading(false);
      persistChatHistory();
      setChatOpen(true);
    }
  });

  chatInput.addEventListener("input", autoResizeChatInput);
  chatInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      chatForm.requestSubmit();
    }
  });
}

function setChatOpen(isOpen) {
  if (!chatPanel || !chatToggle || !chatRoot) return;

  if (isOpen) {
    chatRoot.classList.add("is-open");
    chatPanel.hidden = false;
    chatPanel.setAttribute("aria-hidden", "false");
    chatToggle.hidden = true;
    chatToggle.setAttribute("aria-expanded", "true");

    window.setTimeout(() => {
      chatMessages.scrollTop = chatMessages.scrollHeight;
      chatInput?.focus();
    }, 30);
    return;
  }

  chatRoot.classList.remove("is-open");
  chatPanel.hidden = true;
  chatPanel.setAttribute("aria-hidden", "true");
  chatToggle.hidden = false;
  chatToggle.setAttribute("aria-expanded", "false");
  chatInput?.blur();
}

function setChatLoading(isLoading) {
  if (!chatSubmit) return;

  chatSubmit.disabled = isLoading;
  chatInput.disabled = isLoading;

  if (isLoading) {
    chatTypingNode = document.createElement("div");
    chatTypingNode.className = "site-chat-message site-chat-message--bot site-chat-message--typing";
    chatTypingNode.textContent = "Digitando...";
    chatMessages.appendChild(chatTypingNode);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    return;
  }

  if (chatTypingNode) {
    chatTypingNode.remove();
    chatTypingNode = null;
  }
}

function appendChatMessage(role, text) {
  const normalizedRole = role === "user" ? "user" : "model";
  const trimmedText = String(text || "").trim();
  if (!trimmedText || !chatMessages) return;

  chatHistory.push({ role: normalizedRole, text: trimmedText });
  chatHistory = chatHistory.slice(-20);

  const messageNode = document.createElement("div");
  messageNode.className = `site-chat-message site-chat-message--${normalizedRole === "user" ? "user" : "bot"}`;
  messageNode.textContent = trimmedText;
  chatMessages.appendChild(messageNode);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function renderChatHistory() {
  if (!chatMessages) return;
  chatMessages.innerHTML = "";

  chatHistory.forEach((entry) => {
    const messageNode = document.createElement("div");
    messageNode.className = `site-chat-message site-chat-message--${entry.role === "user" ? "user" : "bot"}`;
    messageNode.textContent = entry.text;
    chatMessages.appendChild(messageNode);
  });
}

function loadChatHistory() {
  try {
    const raw = window.localStorage.getItem("dilson_site_chat_history");
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map((entry) => ({
        role: entry?.role === "user" ? "user" : "model",
        text: String(entry?.text || "").trim()
      }))
      .filter((entry) => entry.text)
      .slice(-20);
  } catch {
    return [];
  }
}

function persistChatHistory() {
  try {
    window.localStorage.setItem("dilson_site_chat_history", JSON.stringify(chatHistory.slice(-20)));
  } catch {
    // Ignora falha de armazenamento local.
  }
}

function autoResizeChatInput() {
  if (!chatInput) return;
  chatInput.style.height = "auto";
  chatInput.style.height = `${Math.min(chatInput.scrollHeight, 120)}px`;
}

function getLeadContext() {
  const activeCities = cityCatalog.map((item) => item.label).filter(Boolean);

  return {
    page: window.location.pathname,
    name: document.querySelector("#name")?.value.trim() || "",
    age: document.querySelector("#age")?.value.trim() || "",
    city: document.querySelector("#city")?.value.trim() || "",
    time: document.querySelector("#time")?.value.trim() || "",
    activeCities,
    activeCitiesSource: "Cidades ativas para quem quer viver essa oportunidade de perto."
  };
}
