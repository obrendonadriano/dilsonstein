const APP_CONFIG = window.APP_CONFIG || {};

const phoneInput = document.querySelector("#phone");
const phoneLocalInput = document.querySelector("#phone-local");
const phoneCountrySelect = document.querySelector("#phone-country");
const citySelect = document.querySelector("#city");
const timeSelect = document.querySelector("#time");
const consentInput = document.querySelector("#consent");
const form = document.querySelector("#lead-form");
const statusNode = document.querySelector("#form-status");
const modal = document.querySelector("#success-modal");
const whatsappLink = document.querySelector("#whatsapp-link");
const blockedModal = document.querySelector("#attendance-blocked-modal");
const blockedWhatsappLink = document.querySelector("#blocked-whatsapp-link");
const qualifiedWhatsappLink = document.querySelector("#qualified-whatsapp-link");
const activeCitiesList = document.querySelector("#active-cities-list");
const heroActiveCitiesText = document.querySelector("#hero-active-cities-text");
const heroVideo = document.querySelector(".hero-video");
const glowCards = document.querySelectorAll(".card-glow");
const submitButton = document.querySelector('#lead-form button[type="submit"]');
const selectionDetailsCard = document.querySelector("#selection-details-card");
const selectionDetailsCity = document.querySelector("#selection-details-city");
const selectionDetailsVenue = document.querySelector("#selection-details-venue");
const selectionDetailsAddress = document.querySelector("#selection-details-address");
const quizSteps = Array.from(document.querySelectorAll("[data-quiz-step]"));
const quizProgressFills = Array.from(document.querySelectorAll("[data-quiz-progress-fill]"));
const quizNextButtons = Array.from(document.querySelectorAll("[data-quiz-next]"));
const quizPrevButtons = Array.from(document.querySelectorAll("[data-quiz-prev]"));
const attendanceQuestion = document.querySelector("#attendance-question");
const guardianWarning = document.querySelector("#guardian-warning");
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
let whatsappNumberCatalog = [];
let currentQuizStep = 0;
let savedLeadId = null;
let isSavingProgress = false;

setupModal();
setupBlockedModal();
setupCardGlowTouch();
setupHeroVideo();
setupFormGate();
setupDefaultConsent();
setupQuizForm();
setupHeroModelLoop();
setupInfiniteMarquees();
setupModelsScrollLoop();
setupSchedulingOptions();
setupSiteChat();
setupQualifiedLeadPage();
trackInitialPageView();

if (form) form.addEventListener("submit", handleSubmit);
if (phoneLocalInput) phoneLocalInput.addEventListener("input", handlePhoneInput);
if (phoneCountrySelect) phoneCountrySelect.addEventListener("change", handlePhoneCountryChange);
if (whatsappLink) whatsappLink.addEventListener("click", handleWhatsAppClick);
if (blockedWhatsappLink) blockedWhatsappLink.addEventListener("click", handleWhatsAppClick);
if (qualifiedWhatsappLink) qualifiedWhatsappLink.addEventListener("click", handleWhatsAppClick);
if (citySelect) citySelect.addEventListener("change", handleCitySelectionChange);

function handlePhoneInput(event) {
  const countryCode = phoneCountrySelect?.value || "55";
  const digits = String(event.target.value || "").replace(/\D/g, "");

  event.target.value = formatNationalPhoneInput(countryCode, digits);
  syncPhoneValue();
}

function handlePhoneCountryChange() {
  if (phoneLocalInput) {
    phoneLocalInput.value = formatNationalPhoneInput(phoneCountrySelect?.value || "55", phoneLocalInput.value);
  }
  syncPhoneValue();
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

function setupBlockedModal() {
  if (!blockedModal) return;

  document.querySelectorAll("[data-close-blocked-modal]").forEach((node) => {
    node.addEventListener("click", closeBlockedModal);
  });

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeBlockedModal();
  });
}

function setupFormGate() {
  if (!form || !submitButton) return;

  form.addEventListener("input", updateSubmitState);
  form.addEventListener("change", updateSubmitState);
  form.addEventListener("change", handleQuizFieldChange);
  updateSubmitState();
}

function setupDefaultConsent() {
  if (!consentInput) return;
  consentInput.checked = true;
}

function setupQuizForm() {
  if (!form || !quizSteps.length) return;

  quizNextButtons.forEach((button) => {
    button.addEventListener("click", async () => {
      if (!validateQuizStep(currentQuizStep)) return;
      const saved = await saveLeadProgress(currentQuizStep + 1, button);
      if (!saved) return;
      showQuizStep(currentQuizStep + 1);
    });
  });

  quizPrevButtons.forEach((button) => {
    button.addEventListener("click", () => showQuizStep(currentQuizStep - 1));
  });

  updateGuardianWarning();
  updateAttendanceQuestion();
  showQuizStep(0);
}

function showQuizStep(stepIndex) {
  if (!quizSteps.length) return;

  currentQuizStep = Math.max(0, Math.min(stepIndex, quizSteps.length - 1));

  quizSteps.forEach((step, index) => {
    const isActive = index === currentQuizStep;
    step.classList.toggle("is-active", isActive);
    step.setAttribute("aria-hidden", String(!isActive));
  });

  const progressPercent = `${Math.round(((currentQuizStep + 1) / quizSteps.length) * 100)}%`;
  quizProgressFills.forEach((fill) => {
    fill.style.width = progressPercent;
  });

  updateSubmitState();
}

function handleQuizFieldChange(event) {
  if (event.target?.name === "guardian_authorization") {
    updateGuardianWarning();
  }

  if (event.target === citySelect) {
    updateAttendanceQuestion();
  }
}

function validateQuizStep(stepIndex) {
  const step = quizSteps[stepIndex];
  if (!step) return true;

  statusNode.textContent = "";
  statusNode.classList.remove("is-error");
  syncPhoneValue();

  const invalidField = Array.from(step.querySelectorAll("input, select, textarea"))
    .find((field) => !field.checkValidity());

  if (invalidField) {
    invalidField.reportValidity();
    statusNode.textContent = "Confira os campos destacados antes de continuar.";
    statusNode.classList.add("is-error");
    return false;
  }

  if (step.contains(phoneLocalInput)) {
    const phoneDigits = getCombinedPhoneDigits();
    if (!phoneDigits || phoneDigits.length < getPhoneMinLength()) {
      phoneLocalInput?.setCustomValidity("Informe um WhatsApp válido.");
      phoneLocalInput?.reportValidity();
      phoneLocalInput?.setCustomValidity("");
      statusNode.textContent = "Informe um WhatsApp válido para continuar.";
      statusNode.classList.add("is-error");
      return false;
    }
  }

  return true;
}

async function saveLeadProgress(stepNumber, triggerButton) {
  if (isSavingProgress) return false;

  isSavingProgress = true;
  statusNode.textContent = "";
  statusNode.classList.remove("is-error");

  const originalText = triggerButton?.querySelector("span")?.textContent || triggerButton?.textContent || "";
  setButtonLoading(triggerButton, "Salvando...");

  try {
    const payload = buildPayload(new FormData(form));
    const result = await saveLeadToSupabase(payload, {
      step: stepNumber,
      status: stepNumber >= quizSteps.length ? "completed" : "in_progress"
    });

    const savedRecord = Array.isArray(result) ? result[0] : result;
    if (savedRecord?.id) {
      savedLeadId = savedRecord.id;
    }

    return true;
  } catch (error) {
    console.error(error);
    statusNode.textContent = error.message || "Não foi possível salvar agora. Tente novamente em instantes.";
    statusNode.classList.add("is-error");
    return false;
  } finally {
    setButtonLoading(triggerButton, originalText);
    isSavingProgress = false;
    updateSubmitState();
  }
}

function setButtonLoading(button, text) {
  if (!button) return;
  button.disabled = text === "Salvando..." || text === "Enviando...";
  const label = button.querySelector("span");
  if (label) {
    label.textContent = text;
  } else {
    button.textContent = text;
  }
}

function updateGuardianWarning() {
  if (!guardianWarning) return;

  const selectedValue = form?.elements?.guardian_authorization?.value || "";
  guardianWarning.hidden = !selectedValue.includes("responsável ainda não sabe");
}

function updateAttendanceQuestion() {
  if (!attendanceQuestion) return;

  const selectedCity = getCityRecordByLabel(citySelect?.value || "");
  const cityParts = getCityDisplayParts(selectedCity, citySelect?.value || "");
  const cityName = cityParts.city || "na cidade escolhida";
  const day = cityParts.day ? ` no dia ${cityParts.day}` : "";

  attendanceQuestion.textContent = `Você consegue comparecer presencialmente em ${cityName}${day}?`;
}

function updateSubmitState() {
  if (!form || !submitButton) return;

  const name = document.querySelector("#name")?.value.trim();
  const age = document.querySelector("#age")?.value.trim();
  const city = document.querySelector("#city")?.value.trim();
  const time = document.querySelector("#time")?.value.trim();
  const phoneDigits = getCombinedPhoneDigits();
  const attendance = form.elements?.attendance?.value;
  const guardianAuthorization = form.elements?.guardian_authorization?.value;
  const modelEvaluationExperience = form.elements?.model_evaluation_experience?.value;
  const consent = consentInput?.checked;
  const hasQuizFields = quizSteps.length > 0;

  const isReady = Boolean(
    name &&
    age &&
    city &&
    time &&
    phoneDigits &&
    phoneDigits.length >= getPhoneMinLength() &&
    (!hasQuizFields || (attendance && guardianAuthorization && modelEvaluationExperience)) &&
    consent
  );

  const isFinalStepActive = !quizSteps.length || currentQuizStep === quizSteps.length - 1;
  submitButton.disabled = !isFinalStepActive || !isReady;
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

function openBlockedModal() {
  if (!blockedModal) return;
  blockedModal.classList.add("is-open");
  blockedModal.setAttribute("aria-hidden", "false");
}

function closeBlockedModal() {
  if (!blockedModal) return;
  blockedModal.classList.remove("is-open");
  blockedModal.setAttribute("aria-hidden", "true");
}

async function handleSubmit(event) {
  event.preventDefault();
  statusNode.textContent = "";
  statusNode.classList.remove("is-error");

  if (quizSteps.length && currentQuizStep !== quizSteps.length - 1) {
    showQuizStep(quizSteps.length - 1);
    statusNode.textContent = "Finalize as confirmações antes de enviar.";
    statusNode.classList.add("is-error");
    return;
  }

  if (!form.reportValidity()) {
    statusNode.textContent = "Confira os campos destacados antes de enviar.";
    statusNode.classList.add("is-error");
    return;
  }

  const payload = buildPayload(new FormData(form));
  latestLeadPayload = payload;
  submitButton.disabled = true;
  submitButton.classList.remove("is-ready");
  submitButton.querySelector("span").textContent = "Enviando...";

  try {
    const attendanceValue = form.elements?.attendance?.value || "";
    if (attendanceValue === "Não consigo comparecer") {
      const blockedResult = await saveLeadToSupabase(payload, {
        step: quizSteps.length || 3,
        status: "blocked_no_attendance"
      });
      const blockedRecord = Array.isArray(blockedResult) ? blockedResult[0] : blockedResult;
      if (blockedRecord?.id) {
        savedLeadId = blockedRecord.id;
        payload.lead_id = blockedRecord.id;
      }

      configureBlockedWhatsAppLink(payload);
      openBlockedModal();
      return;
    }

    const progressResult = await saveLeadToSupabase(payload, {
      step: quizSteps.length || 3,
      status: "completed"
    });
    const savedRecord = Array.isArray(progressResult) ? progressResult[0] : progressResult;
    if (savedRecord?.id) {
      savedLeadId = savedRecord.id;
      payload.lead_id = savedRecord.id;
    }

    const [supabaseResult, crmResult, facebookResult] = await Promise.allSettled([
      Promise.resolve(progressResult),
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
    if (phoneCountrySelect) phoneCountrySelect.value = "55";
    if (phoneLocalInput) phoneLocalInput.value = "";
    savedLeadId = null;
    syncPhoneValue();
    populateTimeSelectForCity("");
    updateGuardianWarning();
    updateAttendanceQuestion();
    showQuizStep(0);
    saveQualifiedLeadPayload(payload);
    window.location.assign("/lead-qualificado");
  } catch (error) {
    console.error(error);
    statusNode.textContent = error.message || "Não foi possível enviar agora. Tente novamente em instantes.";
  } finally {
    updateSubmitState();
    submitButton.querySelector("span").textContent = "Enviar cadastro";
  }
}

function buildPayload(formData) {
  syncPhoneValue();
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
    attendance: payload.attendance || "",
    guardian_authorization: payload.guardian_authorization || "",
    model_evaluation_experience: payload.model_evaluation_experience || "",
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
    lead_id: savedLeadId,
    user_agent: navigator.userAgent,
    locale: navigator.language
  };
}

async function saveLeadToSupabase(payload, progress = {}) {
  const supabaseUrl = APP_CONFIG.supabase?.url;
  const supabaseKey = APP_CONFIG.supabase?.anonKey;
  const table = APP_CONFIG.supabase?.table || "leads";

  if (!supabaseUrl || !supabaseKey) {
    return Promise.resolve({ skipped: true });
  }

  const now = new Date().toISOString();
  const supabasePayload = {
    name: payload.name,
    age: payload.age,
    city: payload.city || null,
    time: payload.time || null,
    phone: payload.phone,
    attendance: payload.attendance || null,
    guardian_authorization: payload.guardian_authorization || null,
    model_evaluation_experience: payload.model_evaluation_experience || null,
    consent: payload.consent,
    source: payload.source,
    page_url: payload.page_url,
    utm_source: payload.utm_source,
    utm_medium: payload.utm_medium,
    utm_campaign: payload.utm_campaign,
    utm_content: payload.utm_content,
    utm_term: payload.utm_term,
    fbclid: payload.fbclid,
    fbc: payload.fbc,
    fbp: payload.fbp,
    user_agent: payload.user_agent,
    locale: payload.locale,
    registration_step: progress.step || 1,
    registration_status: progress.status || "in_progress",
    updated_at: now,
    completed_at: progress.status === "completed" ? now : null
  };

  if (!savedLeadId) {
    supabasePayload.created_at = payload.created_at;
  }

  const endpoint = savedLeadId
    ? `${supabaseUrl}/rest/v1/${table}?id=eq.${encodeURIComponent(savedLeadId)}`
    : `${supabaseUrl}/rest/v1/${table}`;

  const response = await fetch(endpoint, {
    method: savedLeadId ? "PATCH" : "POST",
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

async function submitLeadToSupabase(payload) {
  return saveLeadToSupabase(payload, {
    step: quizSteps.length || 3,
    status: "completed"
  });
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

async function trackQualifiedLead(payload) {
  const eventId = buildEventId("LeadQualificado");
  trackFacebookPixel(payload, "LeadQualificado", eventId);
  return sendFacebookConversion(payload, "LeadQualificado", eventId);
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

  if (eventName === "LeadQualificado") {
    window.fbq("trackCustom", eventName, {
      ...eventPayload,
      status: "qualified"
    }, eventId ? { eventID: eventId } : undefined);
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
        schedule_time: payload.time,
        attendance: payload.attendance || "",
        guardian_authorization: payload.guardian_authorization || "",
        model_evaluation_experience: payload.model_evaluation_experience || "",
        lead_id: payload.lead_id || ""
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
  if (!whatsappLink && !qualifiedWhatsappLink) return;

  const selectedCity = getCityRecordByLabel(payload.city);
  const rawPhone = resolveWhatsAppPhone(selectedCity || { label: payload.city || "" });
  const template = APP_CONFIG.whatsapp?.message
    || "Olá! Meu nome é {nome}, tenho {idade} anos e me cadastrei para participar da seleção em {cidade}, no dia {dia}, no {hotel}, localizado no endereço {endereco}. Gostaria de receber mais informações sobre como participar.";
  const venueName = selectedCity?.venue_name || "local a confirmar";
  const address = selectedCity?.address || "endereço a confirmar";
  const firstName = splitName(payload.name || "").firstName || "";
  const cityParts = getCityDisplayParts(selectedCity, payload.city || "");
  const quizSummary = [
    payload.attendance ? `Comparecimento: ${payload.attendance}` : "",
    payload.guardian_authorization ? `Autorização: ${payload.guardian_authorization}` : "",
    payload.model_evaluation_experience ? `Experiência: ${payload.model_evaluation_experience}` : ""
  ].filter(Boolean).join(" | ");
  const text = normalizeWhatsAppMessage(`${template
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
    .replaceAll("{horario}", payload.time || "")
    .replaceAll("{hotel}", venueName)
    .replaceAll("{endereco}", address)}${quizSummary ? ` Respostas do cadastro: ${quizSummary}.` : ""}`);
  const url = buildWhatsAppUrl(rawPhone, text);
  if (whatsappLink) whatsappLink.href = url;
  if (qualifiedWhatsappLink) qualifiedWhatsappLink.href = url;
}

function configureBlockedWhatsAppLink(payload) {
  if (!blockedWhatsappLink) return;

  const selectedCity = getCityRecordByLabel(payload.city);
  const rawPhone = resolveWhatsAppPhone(selectedCity || { label: payload.city || "" });
  const firstName = splitName(payload.name || "").firstName || payload.name || "";
  const cityParts = getCityDisplayParts(selectedCity, payload.city || "");
  const venueName = selectedCity?.venue_name || "local a confirmar";
  const address = selectedCity?.address || "endereço a confirmar";
  const text = normalizeWhatsAppMessage(
    `Olá! Meu nome é ${firstName}, tenho ${payload.age || ""} anos e me inscrevi para a seleção em ${cityParts.city}, no dia ${cityParts.day}, às ${payload.time || ""}, no ${venueName}, localizado no endereço ${address}. Eu tenho interesse, mas não consigo comparecer presencialmente ao evento. Gostaria de falar com a equipe para entender se existe alguma alternativa.`
  );

  blockedWhatsappLink.href = buildWhatsAppUrl(rawPhone, text);
}

function saveQualifiedLeadPayload(payload) {
  try {
    sessionStorage.setItem("qualifiedLeadPayload", JSON.stringify(payload));
  } catch (error) {
    console.error("Falha ao salvar lead qualificado na sessão:", error);
  }
}

function getQualifiedLeadPayload() {
  try {
    const rawPayload = sessionStorage.getItem("qualifiedLeadPayload");
    return rawPayload ? JSON.parse(rawPayload) : null;
  } catch (error) {
    console.error("Falha ao ler lead qualificado da sessão:", error);
    return null;
  }
}

function setupQualifiedLeadPage() {
  if (!qualifiedWhatsappLink) return;

  const payload = getQualifiedLeadPayload();
  if (!payload) {
    qualifiedWhatsappLink.href = "/cadastro-formulario";
    return;
  }

  latestLeadPayload = payload;
  configureWhatsAppLink(payload);
  trackQualifiedLead(payload).catch((error) => {
    console.error("Falha ao registrar LeadQualificado:", error);
  });
}

function syncPhoneValue() {
  if (!phoneInput) return;
  phoneInput.value = getCombinedPhoneDigits();
}

function getCombinedPhoneDigits() {
  const countryCode = String(phoneCountrySelect?.value || "55").replace(/\D/g, "");
  const nationalDigits = String(phoneLocalInput?.value || "").replace(/\D/g, "");
  if (!countryCode && !nationalDigits) return "";
  return `${countryCode}${nationalDigits}`;
}

function getPhoneMinLength() {
  const countryCode = String(phoneCountrySelect?.value || "55").replace(/\D/g, "");
  return countryCode === "55" ? 12 : 8;
}

function formatNationalPhoneInput(countryCode, rawValue) {
  const digits = String(rawValue || "").replace(/\D/g, "");

  if (String(countryCode || "") === "55") {
    const trimmed = digits.slice(0, 11);
    if (!trimmed) return "";
    if (trimmed.length < 3) return `(${trimmed}`;
    if (trimmed.length < 8) return `(${trimmed.slice(0, 2)}) ${trimmed.slice(2)}`;
    return `(${trimmed.slice(0, 2)}) ${trimmed.slice(2, 7)}-${trimmed.slice(7)}`;
  }

  return digits.slice(0, 15);
}

function resolveWhatsAppPhone(cityRecord) {
  const fallbackPhone = APP_CONFIG.whatsapp?.number || "5511999999999";
  const cityNumberId = String(cityRecord?.whatsapp_number_id || "");
  const linkedNumber = whatsappNumberCatalog.find((item) => String(item.id) === cityNumberId && item.active !== false);
  if (linkedNumber?.phone) {
    return linkedNumber.phone;
  }

  const normalizedCity = String(cityRecord?.label || "").toLowerCase();
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
  return getCityDisplayParts(null, label);
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
  const numberOptions = await loadActiveWhatsappNumbers();
  const timeOptions = await loadActiveCityTimes(cityOptions);
  cityCatalog = cityOptions;
  whatsappNumberCatalog = numberOptions;
  cityTimeCatalog = timeOptions;

  populateSelect(
    citySelect,
    cityOptions.map((item) => getCityDisplayLabel(item)),
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

async function loadActiveWhatsappNumbers() {
  const supabaseUrl = APP_CONFIG.supabase?.url;
  const supabaseKey = APP_CONFIG.supabase?.anonKey;
  const normalizedFallback = buildFallbackWhatsappNumbers();

  if (!supabaseUrl || !supabaseKey) {
    return normalizedFallback;
  }

  try {
    const response = await fetch(
      `${supabaseUrl}/rest/v1/event_whatsapp_numbers?select=*&active=eq.true&order=sort_order.asc.nullslast,label.asc`,
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

    return normalizeWhatsappNumberRecords(items);
  } catch (error) {
    console.error("Falha ao carregar event_whatsapp_numbers:", error);
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
          <strong>${escapeHtml(getCityDisplayLabel(city))}</strong>
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

  const visibleCities = items.slice(0, 3).map((item) => getCityDisplayLabel(item));
  const cityText = visibleCities.join(", ");
  heroActiveCitiesText.textContent = ` Seleção presencial já confirmada em ${cityText}.`;
}

function handleCitySelectionChange() {
  populateTimeSelectForCity(citySelect?.value || "");
  updateSelectionDetails();
  updateAttendanceQuestion();
  updateSubmitState();
}

function updateSelectionDetails() {
  if (!selectionDetailsCard || !citySelect) return;

  const selectedCity = getCityRecordByLabel(citySelect.value);
  if (!selectedCity) {
    selectionDetailsCard.hidden = true;
    return;
  }

  selectionDetailsCity.textContent = getCityDisplayLabel(selectedCity) || "Cidade da seleção";
  selectionDetailsVenue.textContent = selectedCity.venue_name || "Local a confirmar";
  selectionDetailsAddress.textContent = selectedCity.address || "Endereço em confirmação.";
  selectionDetailsCard.hidden = false;
}

function getCityRecordByLabel(label) {
  const normalizedLabel = String(label || "").trim();
  if (!normalizedLabel) return null;
  return cityCatalog.find((item) => {
    const rawLabel = String(item.label || "").trim();
    const legacyLabel = String(item.legacy_label || "").trim();
    const displayLabel = getCityDisplayLabel(item);
    return normalizedLabel === displayLabel || normalizedLabel === rawLabel || normalizedLabel === legacyLabel;
  }) || null;
}

function normalizeCityRecords(items) {
  return (Array.isArray(items) ? items : [])
    .map((item, index) => {
      if (typeof item === "string") {
        const parsedCity = parseCityLabelParts(item);
        return {
          id: `fallback-city-${index}`,
          label: parsedCity.city,
          legacy_label: String(item || "").trim(),
          venue_name: "",
          address: "",
          event_date: parsedCity.eventDate,
          whatsapp_number_id: null,
          sort_order: index + 1,
          active: true
        };
      }

      if (!item || !String(item.label || "").trim()) return null;
      const parsedCity = parseCityLabelParts(item.label);

      return {
        id: item.id ?? `city-${index}`,
        label: parsedCity.city,
        legacy_label: String(item.label || "").trim(),
        venue_name: String(item.venue_name || item.venue || "").trim(),
        address: String(item.address || item.endereco || "").trim(),
        event_date: normalizeEventDate(item.event_date || "") || parsedCity.eventDate,
        whatsapp_number_id: item.whatsapp_number_id ?? null,
        sort_order: Number(item.sort_order || index + 1),
        active: item.active !== false
      };
    })
    .filter(Boolean)
    .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0) || a.label.localeCompare(b.label, "pt-BR"));
}

function normalizeWhatsappNumberRecords(items) {
  return (Array.isArray(items) ? items : [])
    .map((item, index) => {
      if (!item) return null;

      return {
        id: item.id ?? `whatsapp-number-${index}`,
        label: String(item.label || "").trim(),
        phone: normalizeWhatsappTarget(item.phone || ""),
        sort_order: Number(item.sort_order || index + 1),
        active: item.active !== false
      };
    })
    .filter((item) => item && item.phone)
    .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0) || String(a.label || "").localeCompare(String(b.label || ""), "pt-BR"));
}

function buildFallbackWhatsappNumbers() {
  const fallbackNumbers = [];
  const defaultNumber = normalizeWhatsappTarget(APP_CONFIG.whatsapp?.number || "");
  if (defaultNumber) {
    fallbackNumbers.push({
      id: "fallback-default-whatsapp",
      label: "Número principal",
      phone: defaultNumber,
      sort_order: 1,
      active: true
    });
  }

  Object.entries(APP_CONFIG.whatsapp?.numbersByCity || {}).forEach(([cityKey, phone], index) => {
    const normalizedPhone = normalizeWhatsappTarget(phone || "");
    if (!normalizedPhone || fallbackNumbers.some((item) => item.phone === normalizedPhone)) return;
    fallbackNumbers.push({
      id: `fallback-whatsapp-${cityKey}`,
      label: `Número ${cityKey}`,
      phone: normalizedPhone,
      sort_order: index + 2,
      active: true
    });
  });

  return fallbackNumbers;
}

function normalizeWhatsappTarget(phone) {
  const digits = String(phone || "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("00") && digits.length > 4) return digits.slice(2);
  if (digits.length < 10) return "";
  if (digits.length >= 12) return digits;
  if (digits.length === 10 || digits.length === 11) return `55${digits}`;
  return digits;
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
  const activeCities = cityCatalog.map((item) => getCityDisplayLabel(item)).filter(Boolean);

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

function parseCityLabelParts(value) {
  const normalizedValue = String(value || "").trim();
  const dayMatch = normalizedValue.match(/\b(\d{2})\/(\d{2})\b/);
  const day = dayMatch?.[0] || "";
  const city = normalizedValue.replace(/\b\d{2}\/\d{2}\b/, "").trim();
  const currentYear = new Date().getFullYear();
  const eventDate = dayMatch ? `${currentYear}-${dayMatch[2]}-${dayMatch[1]}` : "";

  return {
    city: city || normalizedValue,
    day,
    eventDate
  };
}

function normalizeEventDate(value) {
  const normalizedValue = String(value || "").trim();
  if (!normalizedValue) return "";

  if (/^\d{4}-\d{2}-\d{2}$/.test(normalizedValue)) {
    return normalizedValue;
  }

  const slashMatch = normalizedValue.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (slashMatch) {
    return `${slashMatch[3]}-${slashMatch[2]}-${slashMatch[1]}`;
  }

  return "";
}

function formatEventDateShort(value) {
  const normalizedValue = normalizeEventDate(value);
  if (!normalizedValue) return "";
  const [, month, day] = normalizedValue.split("-");
  return day && month ? `${day}/${month}` : "";
}

function getCityDisplayLabel(city) {
  const cityName = String(city?.label || "").trim();
  const day = formatEventDateShort(city?.event_date || "");
  return day ? `${cityName} ${day}`.trim() : cityName;
}

function getCityDisplayParts(city, fallbackLabel = "") {
  if (city) {
    return {
      city: String(city.label || "").trim(),
      day: formatEventDateShort(city.event_date || ""),
      displayCity: getCityDisplayLabel(city)
    };
  }

  const parsed = parseCityLabelParts(fallbackLabel);
  return {
    city: parsed.city,
    day: formatEventDateShort(parsed.eventDate || "") || parsed.day,
    displayCity: [parsed.city, parsed.day].filter(Boolean).join(" ").trim()
  };
}
