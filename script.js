const APP_CONFIG = window.APP_CONFIG || {};

const phoneInput = document.querySelector("#phone");
const form = document.querySelector("#lead-form");
const statusNode = document.querySelector("#form-status");
const modal = document.querySelector("#success-modal");
const whatsappLink = document.querySelector("#whatsapp-link");
const topbar = document.querySelector(".topbar");
const glowCards = document.querySelectorAll(".card-glow");
const submitButton = document.querySelector('#lead-form button[type="submit"]');
let latestLeadPayload = null;

setupModal();
setupTopbarProgress();
setupCardGlowTouch();
setupFormGate();
setupTypingTitle();

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

function setupTopbarProgress() {
  if (!topbar) return;

  const updateProgress = () => {
    const firstScreen = Math.max(1, window.innerHeight * 0.92);
    const progress = Math.min(1, Math.max(0, window.scrollY / firstScreen));
    const fillWidth = 56 + (progress * 44);
    const mobileFillWidth = 66 + (progress * 34);
    const desktopD = 47 + (progress * 49);
    const mobileD = 56 + (progress * 32);

    topbar.style.setProperty("--topbar-fill-width", `${fillWidth}%`);
    topbar.style.setProperty("--topbar-d-left", `${desktopD}%`);
    topbar.style.setProperty("--topbar-fill-width-mobile", `${mobileFillWidth}%`);
    topbar.style.setProperty("--topbar-d-left-mobile", `${mobileD}%`);
  };

  updateProgress();
  window.addEventListener("scroll", updateProgress, { passive: true });
  window.addEventListener("resize", updateProgress);
}

function setupCardGlowTouch() {
  glowCards.forEach((card) => {
    card.addEventListener("pointerdown", () => {
      card.classList.add("is-active");
      window.setTimeout(() => card.classList.remove("is-active"), 1000);
    });
  });
}

function setupTypingTitle() {
  const title = document.querySelector(".typing-title");
  if (!title) return;

  const dynamicNode = title.querySelector(".typing-dynamic");
  const prefixNode = title.querySelector(".typing-prefix");
  if (!dynamicNode || !prefixNode) return;

  const prefix = title.dataset.prefix || "";
  const phrases = JSON.parse(title.dataset.phrases || "[]");
  if (!phrases.length) return;

  let phraseIndex = 0;
  let charIndex = phrases[0].length;
  let isDeleting = false;

  const tick = () => {
    const currentPhrase = phrases[phraseIndex];

    if (isDeleting) {
      charIndex -= 1;
      prefixNode.textContent = prefix;
      dynamicNode.textContent = currentPhrase.slice(0, charIndex);

      if (charIndex <= 0) {
        isDeleting = false;
        phraseIndex = (phraseIndex + 1) % phrases.length;
        window.setTimeout(tick, 120);
        return;
      }

      window.setTimeout(tick, 42);
      return;
    }

    const nextPhrase = phrases[phraseIndex];
    charIndex += 1;
    prefixNode.textContent = prefix;
    dynamicNode.textContent = nextPhrase.slice(0, charIndex);

    if (charIndex >= nextPhrase.length) {
      isDeleting = true;
      window.setTimeout(tick, 1100);
      return;
    }

    window.setTimeout(tick, 74);
  };

  prefixNode.textContent = prefix;
  dynamicNode.textContent = phrases[0];
  charIndex = phrases[0].length;
  window.setTimeout(() => {
    isDeleting = true;
    tick();
  }, 1600);
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
  const phoneDigits = document.querySelector("#phone")?.value.replace(/\D/g, "");
  const consent = document.querySelector("#consent")?.checked;

  const isReady = Boolean(
    name &&
    age &&
    city &&
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
    await Promise.all([
      submitLeadToSupabase(payload),
      submitLeadToCRM(payload),
      trackLead(payload)
    ]);

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
  const fbc = url.searchParams.get("fbclid") || getCookie("_fbc") || "";
  const fbp = getCookie("_fbp") || "";

  return {
    name: payload.name?.trim(),
    age: payload.age || "",
    city: payload.city?.trim() || "",
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
    fbclid: url.searchParams.get("fbclid") || "",
    fbc,
    fbp,
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

  const response = await fetch(`${supabaseUrl}/rest/v1/${table}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      Prefer: "return=representation"
    },
    body: JSON.stringify(payload)
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
  trackFacebookPixel(payload, "Lead");
  return sendFacebookConversion(payload, "Lead");
}

function trackFacebookPixel(payload, eventName = "Lead") {
  if (typeof window.fbq !== "function") return;

  window.fbq("track", eventName, {
    content_name: "Cadastro Dilson Stein",
    status: "started",
    lead_source: payload.source,
    age: payload.age,
    city: payload.city
  });
}

async function sendFacebookConversion(payload, eventName = "Lead") {
  const endpoint = APP_CONFIG.facebook?.conversionProxyUrl;

  if (!endpoint) {
    return Promise.resolve({ skipped: true });
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      event_name: eventName,
      event_time: Math.floor(Date.now() / 1000),
      action_source: "website",
      event_source_url: window.location.href,
      test_event_code: APP_CONFIG.facebook?.testEventCode || "",
      user_data: {
        ph: payload.phone,
        ct: payload.city,
        country: "br",
        client_user_agent: payload.user_agent,
        fbc: payload.fbc,
        fbp: payload.fbp
      },
      custom_data: {
        source: payload.source,
        age: payload.age,
        city: payload.city
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

  try {
    trackFacebookPixel(latestLeadPayload, "Contact");
    await sendFacebookConversion(latestLeadPayload, "Contact");
  } catch (error) {
    console.error("Falha ao registrar conversão do WhatsApp:", error);
  } finally {
    window.open(whatsappLink.href, "_blank", "noopener,noreferrer");
  }
}

function configureWhatsAppLink(payload) {
  if (!whatsappLink) return;

  const rawPhone = APP_CONFIG.whatsapp?.number || "5511999999999";
  const template = APP_CONFIG.whatsapp?.message
    || "Olá, meu nome é {name}. Acabei de preencher o cadastro da Dilson Stein, tenho {age} anos e moro em {city}. Gostaria de marcar meu horário para finalizar meu atendimento.";
  const text = template
    .replaceAll("{name}", payload.name || "")
    .replaceAll("{age}", payload.age || "")
    .replaceAll("{city}", payload.city || "");
  const url = `https://wa.me/${rawPhone}?text=${encodeURIComponent(text)}`;
  whatsappLink.href = url;
}

function getCookie(name) {
  const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
  return match ? decodeURIComponent(match[2]) : "";
}
