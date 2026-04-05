const PANEL_CONFIG = window.APP_CONFIG || {};
const PANEL_SESSION_KEY = "dilson_admin_session";

const logoutButtons = document.querySelectorAll("#logout-button, #logout-button-mobile");
const homeButtons = document.querySelectorAll("#nav-home-button, #nav-home-button-mobile");
const navButtons = document.querySelectorAll("[data-view-target]");
const panelViews = document.querySelectorAll(".panel-view");
const mobileMenuToggle = document.querySelector("#panel-menu-toggle");
const mobileDrawer = document.querySelector("#panel-mobile-drawer");
const mobileOverlay = document.querySelector("#panel-mobile-overlay");
const filterCity = document.querySelector("#filter-city");
const filterTime = document.querySelector("#filter-time");
const filterDdd = document.querySelector("#filter-ddd");
const filterCityStatus = document.querySelector("#filter-city-status");
const applyFiltersButton = document.querySelector("#apply-filters");
const clearFiltersButton = document.querySelector("#clear-filters");
const exportCsvButton = document.querySelector("#export-csv");
const exportClearFiltersButton = document.querySelector("#export-clear-filters");
const cityForm = document.querySelector("#city-form");
const cityEditorForm = document.querySelector("#city-editor-form");
const cityTimeForm = document.querySelector("#city-time-form");
const cityList = document.querySelector("#city-list");
const cityTimeList = document.querySelector("#city-time-list");
const cityEditorSection = document.querySelector("#city-editor-section");
const leadsTableBody = document.querySelector("#leads-table-body");
const citySummary = document.querySelector("#city-summary");
const timeSummary = document.querySelector("#time-summary");
const alertSummary = document.querySelector("#alert-summary");
const leadDisplayLimitSelect = document.querySelector("#lead-display-limit");
const leadSearchInput = document.querySelector("#lead-search");
const newCityInput = document.querySelector("#new-city");
const newCityVenueInput = document.querySelector("#new-city-venue");
const newCityAddressInput = document.querySelector("#new-city-address");
const editorCitySelect = document.querySelector("#editor-city-select");
const editCityInput = document.querySelector("#edit-city");
const editCityVenueInput = document.querySelector("#edit-city-venue");
const editCityAddressInput = document.querySelector("#edit-city-address");
const editCityActiveInput = document.querySelector("#edit-city-active");
const newCityTimeInput = document.querySelector("#new-city-time");
const exportFilterCity = document.querySelector("#export-filter-city");
const exportFilterTime = document.querySelector("#export-filter-time");
const exportFilterDdd = document.querySelector("#export-filter-ddd");
const exportFilterCityStatus = document.querySelector("#export-filter-city-status");

const metricTotal = document.querySelector("#metric-total");
const metricCities = document.querySelector("#metric-cities");
const metricTimes = document.querySelector("#metric-times");
const metricFilter = document.querySelector("#metric-filter");
const resultsCount = document.querySelector("#results-count");

let cities = [];
let timeTemplates = [];
let cityTimes = [];
let leads = [];
let filteredLeads = [];
let selectedEditorCityId = "";
let cityTimesFeatureEnabled = true;
let activeView = "overview";

guardRoute();
refreshDashboard();
setupPanelCardTouch();
setupNavigation();

logoutButtons.forEach((button) => button.addEventListener("click", logout));
if (applyFiltersButton) applyFiltersButton.addEventListener("click", applyFilters);
if (clearFiltersButton) clearFiltersButton.addEventListener("click", clearFilters);
if (exportCsvButton) exportCsvButton.addEventListener("click", exportLeadsSpreadsheet);
if (exportClearFiltersButton) exportClearFiltersButton.addEventListener("click", clearExportFilters);
if (cityForm) cityForm.addEventListener("submit", handleCityCreate);
if (cityEditorForm) cityEditorForm.addEventListener("submit", handleCityUpdate);
if (cityTimeForm) cityTimeForm.addEventListener("submit", handleCityTimeCreate);
if (editorCitySelect) editorCitySelect.addEventListener("change", handleEditorCityChange);
if (leadDisplayLimitSelect) leadDisplayLimitSelect.addEventListener("change", renderLeadsTable);
if (leadSearchInput) leadSearchInput.addEventListener("input", applyFilters);

function setupNavigation() {
  const initialHash = window.location.hash.replace("#", "").trim();
  if (["overview", "export", "cities"].includes(initialHash)) {
    activeView = initialHash;
  }
  setActiveView(activeView, false);

  homeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      setActiveView("overview");
      closeMobileMenu();
    });
  });

  navButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const nextView = button.dataset.viewTarget || "overview";
      setActiveView(nextView);
      closeMobileMenu();
    });
  });

  if (mobileMenuToggle) {
    mobileMenuToggle.addEventListener("click", () => {
      const shouldOpen = mobileDrawer?.hidden !== false;
      setMobileMenuOpen(shouldOpen);
    });
  }

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeMobileMenu();
    }
  });

  document.addEventListener("click", handleDocumentClick);

  window.addEventListener("resize", handleViewportChange, { passive: true });

  window.addEventListener("hashchange", () => {
    const nextView = window.location.hash.replace("#", "").trim() || "overview";
    setActiveView(nextView, false);
  });
}

function setActiveView(viewName, pushHash = true) {
  activeView = ["overview", "export", "cities"].includes(viewName) ? viewName : "overview";

  panelViews.forEach((section) => {
    const isCurrent = section.dataset.view === activeView;
    section.hidden = !isCurrent;
    section.classList.toggle("is-active", isCurrent);
  });

  navButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.viewTarget === activeView);
  });

  if (pushHash) {
    window.location.hash = activeView;
  }
}

function setMobileMenuOpen(isOpen) {
  if (!mobileDrawer || !mobileMenuToggle) return;
  mobileDrawer.hidden = !isOpen;
  mobileDrawer.setAttribute("aria-hidden", isOpen ? "false" : "true");
  if (mobileOverlay) mobileOverlay.hidden = !isOpen;
  mobileMenuToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
  document.body.classList.toggle("panel-menu-open", isOpen);
}

function closeMobileMenu() {
  setMobileMenuOpen(false);
}

function handleDocumentClick(event) {
  if (!mobileDrawer || mobileDrawer.hidden) return;
  const target = event.target;
  if (!(target instanceof Element)) return;
  if (mobileDrawer.contains(target) || mobileMenuToggle?.contains(target)) return;
  closeMobileMenu();
}

function handleViewportChange() {
  if (window.innerWidth > 1120) {
    closeMobileMenu();
  }
}

function setupPanelCardTouch() {
  document.querySelectorAll(".panel-card, .metric-card").forEach((card) => {
    card.addEventListener("pointerdown", () => {
      card.classList.add("is-active");
      window.setTimeout(() => card.classList.remove("is-active"), 1000);
    });
  });
}

function guardRoute() {
  if (window.localStorage.getItem(PANEL_SESSION_KEY) !== "true") {
    window.location.replace("/painel");
  }
}

function logout(event) {
  event?.preventDefault();
  window.localStorage.removeItem(PANEL_SESSION_KEY);
  window.location.replace("/painel");
}

async function refreshDashboard() {
  await Promise.all([
    loadCities(),
    loadTimeTemplates(),
    loadCityTimes(),
    loadLeads()
  ]);

  syncSelectedEditorCity();
  renderOptionLists();
  populateFilters();
  populateExportFilters();
  populateEditorCitySelect();
  await renderEditorCity();
  applyFilters();
}

async function loadCities() {
  cities = normalizeCityRecords(await fetchTable("event_cities", PANEL_CONFIG.scheduling?.defaultCities || [], {
    order: "sort_order.asc,label.asc"
  }));
}

async function loadTimeTemplates() {
  timeTemplates = normalizeTimeTemplates(await fetchTable(
    "event_times",
    PANEL_CONFIG.scheduling?.defaultTimes?.map((label, index) => ({
      id: `fallback-time-${index}`,
      label,
      sort_order: index + 1,
      active: true
    })) || [],
    { order: "sort_order.asc,label.asc" }
  ));
}

async function loadCityTimes() {
  try {
    cityTimes = normalizeCityTimes(await fetchTable("event_city_times", [], {
      order: "city_id.asc,sort_order.asc,label.asc"
    }));
    cityTimesFeatureEnabled = true;
  } catch (error) {
    console.error("Falha ao carregar event_city_times:", error);
    cityTimes = [];
    cityTimesFeatureEnabled = false;
  }
}

async function loadLeads() {
  leads = await fetchTableAll("leads", [], {
    select: "id,name,age,city,time,phone,created_at",
    order: "created_at.desc"
  });
}

async function fetchTable(tableName, fallback = [], query = {}) {
  const supabaseUrl = PANEL_CONFIG.supabase?.url;
  const supabaseKey = PANEL_CONFIG.supabase?.anonKey;

  if (!supabaseUrl || !supabaseKey) {
    return fallback;
  }

  const params = new URLSearchParams({
    select: query.select || "*"
  });

  if (query.order) params.set("order", query.order);
  if (query.activeOnly) params.set("active", "eq.true");
  if (query.extraParams) {
    Object.entries(query.extraParams).forEach(([key, value]) => params.set(key, value));
  }

  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/${tableName}?${params.toString()}`, {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`
      }
    });

    if (!response.ok) {
      throw new Error(await response.text());
    }

    return await response.json();
  } catch (error) {
    console.error(`Falha ao carregar ${tableName}:`, error);
    return fallback;
  }
}

async function fetchTableAll(tableName, fallback = [], query = {}) {
  const supabaseUrl = PANEL_CONFIG.supabase?.url;
  const supabaseKey = PANEL_CONFIG.supabase?.anonKey;

  if (!supabaseUrl || !supabaseKey) {
    return fallback;
  }

  const pageSize = 1000;
  const rows = [];
  let offset = 0;

  try {
    while (true) {
      const params = new URLSearchParams({
        select: query.select || "*"
      });

      if (query.order) params.set("order", query.order);
      if (query.activeOnly) params.set("active", "eq.true");
      if (query.extraParams) {
        Object.entries(query.extraParams).forEach(([key, value]) => params.set(key, value));
      }

      const response = await fetch(`${supabaseUrl}/rest/v1/${tableName}?${params.toString()}`, {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          Range: `${offset}-${offset + pageSize - 1}`,
          Prefer: "count=exact"
        }
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const batch = await response.json();
      if (!Array.isArray(batch) || !batch.length) break;

      rows.push(...batch);

      if (batch.length < pageSize) break;
      offset += pageSize;
    }

    return rows;
  } catch (error) {
    console.error(`Falha ao carregar todos os registros de ${tableName}:`, error);
    return fallback;
  }
}

function populateFilters() {
  populateSelect(filterCity, cities.map((item) => item.label), "Todas as cidades");
  populateSelect(filterTime, buildActiveTimeLabels(), "Todos os horários");
  populateSelect(filterDdd, buildDddOptions(), "Todos os DDDs");
}

function populateExportFilters() {
  populateSelect(exportFilterCity, cities.map((item) => item.label), "Todas as cidades");
  populateSelect(exportFilterTime, buildActiveTimeLabels(), "Todos os horários");
  populateSelect(exportFilterDdd, buildDddOptions(), "Todos os DDDs");
}

function populateEditorCitySelect() {
  populateSelect(editorCitySelect, cities.map((item) => item.label), "Selecione uma cidade");
  const selectedCity = getSelectedEditorCity();
  if (selectedCity) {
    editorCitySelect.value = selectedCity.label;
  }
}

function populateSelect(node, options, placeholder) {
  if (!node) return;

  const currentValue = node.value;
  node.innerHTML = [
    `<option value="">${placeholder}</option>`,
    ...options.map((option) => `<option value="${escapeHtml(option)}">${escapeHtml(option)}</option>`)
  ].join("");

  if (options.includes(currentValue)) {
    node.value = currentValue;
  }
}

function renderOptionLists() {
  renderCityList();
}

function renderCityList() {
  if (!cityList) return;

  if (!cities.length) {
    cityList.innerHTML = `<p class="empty-state">Nenhuma cidade cadastrada.</p>`;
    return;
  }

  cityList.innerHTML = cities
    .map((item) => `
      <article class="tag-item tag-item--city">
        <div class="tag-item__content">
          <strong>${escapeHtml(item.label)}</strong>
          <p>${escapeHtml(item.venue_name || "Local a confirmar")}</p>
          <small>${escapeHtml(item.address || "Endereço em confirmação.")}</small>
        </div>
        <div class="tag-item__actions">
          <button type="button" class="ghost-button" data-action="edit-city" data-id="${item.id}">Editar</button>
          <button type="button" class="ghost-button" data-action="delete-city" data-id="${item.id}">Excluir</button>
        </div>
      </article>
    `)
    .join("");

  cityList.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", () => {
      if (button.dataset.action === "edit-city") {
        selectedEditorCityId = button.dataset.id || "";
        setActiveView("cities");
        populateEditorCitySelect();
        renderEditorCity();
        cityEditorSection?.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }

      if (button.dataset.action === "delete-city") {
        deleteCity(button.dataset.id);
      }
    });
  });
}

async function renderEditorCity() {
  const selectedCity = getSelectedEditorCity();
  if (cityEditorSection) {
    cityEditorSection.hidden = !selectedCity;
  }

  if (!selectedCity) {
    if (editCityInput) editCityInput.value = "";
    if (editCityVenueInput) editCityVenueInput.value = "";
    if (editCityAddressInput) editCityAddressInput.value = "";
    if (editCityActiveInput) editCityActiveInput.value = "true";
    if (cityTimeList) {
      cityTimeList.innerHTML = `<p class="empty-state">Selecione uma cidade para editar os horários dela.</p>`;
    }
    return;
  }

  if (editCityInput) editCityInput.value = selectedCity.label;
  if (editCityVenueInput) editCityVenueInput.value = selectedCity.venue_name;
  if (editCityAddressInput) editCityAddressInput.value = selectedCity.address;
  if (editCityActiveInput) editCityActiveInput.value = selectedCity.active === false ? "false" : "true";

  renderCityTimeList(selectedCity.id);
}

function renderCityTimeList(cityId) {
  if (!cityTimeList) return;

  const rows = getEditorCityTimes(cityId);
  if (!rows.length) {
    cityTimeList.innerHTML = `<p class="empty-state">Essa cidade ainda não tem horários configurados.</p>`;
    return;
  }

  cityTimeList.innerHTML = rows
    .map((item) => `
      <article class="tag-item tag-item--time">
        <div class="tag-item__content">
          <strong>${escapeHtml(item.label)}</strong>
          <small>${item.active === false ? "Horário inativo" : item.isTemplateFallback ? "Horário padrão" : "Horário ativo"}</small>
        </div>
        <div class="tag-item__actions">
          ${item.isTemplateFallback ? `
            <button type="button" class="ghost-button" data-action="create-template-time" data-label="${escapeHtml(item.label)}">Ativar na cidade</button>
          ` : `
            <button type="button" class="ghost-button" data-action="toggle-time" data-id="${item.id}">
              ${item.active === false ? "Ativar" : "Inativar"}
            </button>
            <button type="button" class="ghost-button" data-action="delete-time" data-id="${item.id}">Excluir</button>
          `}
        </div>
      </article>
    `)
    .join("");

  cityTimeList.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", async () => {
      const id = button.dataset.id || "";
      const label = button.dataset.label || "";

      if (button.dataset.action === "create-template-time") {
        await createCityTimeFromTemplate(label);
        return;
      }

      if (!id) return;

      if (button.dataset.action === "toggle-time") {
        await toggleCityTime(id);
        return;
      }

      if (button.dataset.action === "delete-time") {
        await deleteOption("event_city_times", id);
      }
    });
  });
}

async function handleCityCreate(event) {
  event.preventDefault();
  const label = newCityInput?.value.trim();
  const venueName = newCityVenueInput?.value.trim();
  const address = newCityAddressInput?.value.trim();
  if (!label || !venueName || !address) return;

  const createdRows = await mutateSupabase("event_cities", "POST", {
    label,
    venue_name: venueName,
    address,
    sort_order: cities.length + 1,
    active: true
  });

  const createdCity = normalizeCityRecords(createdRows)[0];
  if (createdCity) {
    if (cityTimesFeatureEnabled) {
      try {
        await seedCityTimes(createdCity);
      } catch (error) {
        console.error("Falha ao criar horários iniciais da cidade:", error);
        cityTimesFeatureEnabled = false;
      }
    }
    selectedEditorCityId = String(createdCity.id);
  }

  if (newCityInput) newCityInput.value = "";
  if (newCityVenueInput) newCityVenueInput.value = "";
  if (newCityAddressInput) newCityAddressInput.value = "";
  await refreshDashboard();
}

async function handleCityUpdate(event) {
  event.preventDefault();
  const selectedCity = getSelectedEditorCity();
  if (!selectedCity) return;

  const label = editCityInput?.value.trim();
  const venueName = editCityVenueInput?.value.trim();
  const address = editCityAddressInput?.value.trim();
  const active = editCityActiveInput?.value !== "false";
  if (!label || !venueName || !address) return;

  await mutateSupabase(`event_cities?id=eq.${selectedCity.id}`, "PATCH", {
    label,
    venue_name: venueName,
    address,
    active
  });

  await refreshDashboard();
}

async function handleCityTimeCreate(event) {
  event.preventDefault();
  const selectedCity = getSelectedEditorCity();
  const label = newCityTimeInput?.value.trim();
  if (!selectedCity || !label) return;
  if (!cityTimesFeatureEnabled) {
    alert("Os horários por cidade ainda não estão disponíveis no Supabase. Rode o SQL de atualização e tente novamente.");
    return;
  }

  await mutateSupabase("event_city_times", "POST", {
    city_id: selectedCity.id,
    label,
    sort_order: getCityTimes(selectedCity.id).length + 1,
    active: true
  });

  if (newCityTimeInput) newCityTimeInput.value = "";
  await refreshDashboard();
}

async function createCityTimeFromTemplate(label) {
  const selectedCity = getSelectedEditorCity();
  const normalizedLabel = String(label || "").trim();
  if (!selectedCity || !normalizedLabel) return;
  if (!cityTimesFeatureEnabled) {
    alert("Os horários por cidade ainda não estão disponíveis no Supabase. Rode o SQL de atualização e tente novamente.");
    return;
  }

  await mutateSupabase("event_city_times", "POST", {
    city_id: selectedCity.id,
    label: normalizedLabel,
    sort_order: getNextCityTimeSortOrder(selectedCity.id),
    active: true
  });

  await refreshDashboard();
}

async function handleEditorCityChange() {
  const selectedLabel = editorCitySelect?.value || "";
  const city = cities.find((item) => item.label === selectedLabel);
  selectedEditorCityId = city ? String(city.id) : "";
  await renderEditorCity();
}

async function seedCityTimes(city) {
  const templateRows = timeTemplates.length
    ? timeTemplates
    : normalizeTimeTemplates(PANEL_CONFIG.scheduling?.defaultTimes?.map((label, index) => ({
      label,
      sort_order: index + 1,
      active: true
    })) || []);

  for (const time of templateRows) {
    await mutateSupabase("event_city_times", "POST", {
      city_id: city.id,
      label: time.label,
      sort_order: time.sort_order,
      active: time.active !== false
    });
  }
}

async function deleteCity(id) {
  if (cityTimesFeatureEnabled) {
    try {
      await mutateSupabase(`event_city_times?city_id=eq.${id}`, "DELETE");
    } catch (error) {
      console.error("Falha ao excluir horários da cidade:", error);
    }
  }
  await mutateSupabase(`event_cities?id=eq.${id}`, "DELETE");
  if (selectedEditorCityId === String(id)) {
    selectedEditorCityId = "";
  }
  await refreshDashboard();
}

async function toggleCityTime(id) {
  const row = cityTimes.find((item) => String(item.id) === String(id));
  if (!row) return;
  if (!cityTimesFeatureEnabled) {
    alert("Os horários por cidade ainda não estão disponíveis no Supabase. Rode o SQL de atualização e tente novamente.");
    return;
  }

  await mutateSupabase(`event_city_times?id=eq.${id}`, "PATCH", {
    active: row.active === false
  });

  await refreshDashboard();
}

async function deleteOption(tableName, id) {
  if (tableName === "event_city_times" && !cityTimesFeatureEnabled) {
    alert("Os horários por cidade ainda não estão disponíveis no Supabase. Rode o SQL de atualização e tente novamente.");
    return;
  }
  await mutateSupabase(`${tableName}?id=eq.${id}`, "DELETE");
  await refreshDashboard();
}

async function mutateSupabase(path, method, body) {
  const supabaseUrl = PANEL_CONFIG.supabase?.url;
  const supabaseKey = PANEL_CONFIG.supabase?.anonKey;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Supabase não configurado.");
  }

  const response = await fetch(`${supabaseUrl}/rest/v1/${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      Prefer: "return=representation"
    },
    body: body ? JSON.stringify(body) : undefined
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return response.text().then((text) => text ? JSON.parse(text) : []);
}

function applyFilters() {
  const {
    selectedCity,
    selectedTime,
    selectedDdd,
    selectedCityStatus
  } = getCurrentFilters();
  const searchTerm = normalizeSearchTerm(leadSearchInput?.value || "");

  filteredLeads = leads.filter((lead) => {
    const cityMatch = !selectedCity || lead.city === selectedCity;
    const timeMatch = !selectedTime || lead.time === selectedTime;
    const dddMatch = !selectedDdd || extractDdd(lead.phone) === selectedDdd;
    const cityStatusMatch = !selectedCityStatus || matchCityStatus(lead.city, selectedCityStatus);
    const searchMatch = !searchTerm || matchLeadSearch(lead, searchTerm);
    return cityMatch && timeMatch && dddMatch && cityStatusMatch && searchMatch;
  });

  renderLeadsTable();
  renderSummaries();
  renderAlerts();
  updateMetrics(selectedCity, selectedTime, selectedDdd, selectedCityStatus);
}

function clearFilters() {
  if (filterCity) filterCity.value = "";
  if (filterTime) filterTime.value = "";
  if (filterDdd) filterDdd.value = "";
  if (filterCityStatus) filterCityStatus.value = "";
  if (leadSearchInput) leadSearchInput.value = "";
  applyFilters();
}

function clearExportFilters() {
  if (exportFilterCity) exportFilterCity.value = "";
  if (exportFilterTime) exportFilterTime.value = "";
  if (exportFilterDdd) exportFilterDdd.value = "";
  if (exportFilterCityStatus) exportFilterCityStatus.value = "";
}

function renderLeadsTable() {
  if (!leadsTableBody) return;
  const visualLimit = Number(leadDisplayLimitSelect?.value || 10);
  const visibleLeads = filteredLeads.slice(0, Math.max(1, visualLimit));

  if (!filteredLeads.length) {
    leadsTableBody.innerHTML = `
      <tr>
        <td colspan="7" class="empty-state">Nenhum agendamento encontrado para o filtro atual.</td>
      </tr>
    `;
    resultsCount.textContent = "0 registros";
    return;
  }

  leadsTableBody.innerHTML = visibleLeads
    .map((lead) => `
      <tr>
        <td>${escapeHtml(lead.name || "-")}</td>
        <td>${escapeHtml(lead.age || "-")}</td>
        <td>${escapeHtml(lead.city || "-")}</td>
        <td>${escapeHtml(lead.time || "-")}</td>
        <td>${formatPhone(lead.phone || "-")}</td>
        <td>${formatDateTime(lead.created_at)}</td>
        <td>
          <div class="lead-time-editor">
            <select data-action="lead-time-select" data-id="${escapeHtml(lead.id)}">
              ${buildLeadTimeOptions(lead)}
            </select>
            <button type="button" class="ghost-button" data-action="save-lead-time" data-id="${escapeHtml(lead.id)}">Salvar</button>
          </div>
        </td>
      </tr>
    `)
    .join("");

  leadsTableBody.querySelectorAll('[data-action="save-lead-time"]').forEach((button) => {
    button.addEventListener("click", async () => {
      const leadId = button.dataset.id || "";
      const select = [...leadsTableBody.querySelectorAll('[data-action="lead-time-select"]')]
        .find((node) => node.dataset.id === leadId);
      const nextTime = select?.value || "";
      if (!leadId || !nextTime) return;
      await updateLeadTime(leadId, nextTime, button);
    });
  });

  resultsCount.textContent = `${visibleLeads.length} de ${filteredLeads.length} registros`;
}

function renderSummaries() {
  renderSummaryList(citySummary, countBy(filteredLeads, "city"), "Nenhum agendamento por cidade ainda.");
  renderSummaryList(timeSummary, countBy(filteredLeads, "time"), "Nenhum agendamento por horário ainda.");
}

function renderAlerts() {
  if (!alertSummary) return;

  const activeCities = cities.filter((item) => item.active !== false);
  if (!activeCities.length) {
    alertSummary.innerHTML = `<p class="empty-state alert-empty">Cadastre cidades para acompanhar a lotação.</p>`;
    return;
  }

  alertSummary.innerHTML = activeCities
    .map((city) => {
      const cityRows = getCityTimes(city.id).filter((item) => item.active !== false);
      if (!cityRows.length) {
        return `
          <article class="alert-city">
            <h3>
              <span>${escapeHtml(city.label)}</span>
              <b>${countCityRegistrations(city.label)}</b>
            </h3>
            <p class="empty-state">Nenhum horário ativo configurado para essa cidade.</p>
          </article>
        `;
      }

      const timeRows = cityRows
        .map((time) => {
          const total = leads.filter((lead) => lead.city === city.label && lead.time === time.label).length;
          let stateClass = "";
          let stateLabel = "normal";

          if (total >= 500) {
            stateClass = "is-danger";
            stateLabel = "lotado";
          } else if (total >= 400) {
            stateClass = "is-warning";
            stateLabel = "atenção";
          }

          return `
            <div class="alert-time ${stateClass}">
              <div>
                <strong>${escapeHtml(time.label)}</strong>
                <span>${stateLabel}</span>
              </div>
              <b>${total}</b>
            </div>
          `;
        })
        .join("");

      return `
        <article class="alert-city">
          <h3>
            <span>${escapeHtml(city.label)}</span>
            <b>${countCityRegistrations(city.label)}</b>
          </h3>
          <div class="alert-times">
            ${timeRows}
          </div>
        </article>
      `;
    })
    .join("");
}

function renderSummaryList(container, rows, emptyText) {
  if (!container) return;

  if (!rows.length) {
    container.innerHTML = `<p class="empty-state">${emptyText}</p>`;
    return;
  }

  container.innerHTML = rows
    .map(([label, total]) => `
      <div class="summary-row">
        <span>${escapeHtml(label || "Não informado")}</span>
        <strong>${total}</strong>
      </div>
    `)
    .join("");
}

function updateMetrics(selectedCity, selectedTime, selectedDdd, selectedCityStatus) {
  metricTotal.textContent = String(filteredLeads.length);
  metricCities.textContent = String(cities.filter((item) => item.active !== false).length);
  metricTimes.textContent = String(cityTimes.filter((item) => item.active !== false).length);
  const activeFilters = [
    selectedCity || "",
    selectedTime || "",
    selectedDdd ? `DDD ${selectedDdd}` : "",
    selectedCityStatus === "active" ? "Cidades ativas" : "",
    selectedCityStatus === "inactive" ? "Cidades inativas" : ""
  ].filter(Boolean);

  metricFilter.textContent = activeFilters.join(" • ") || "Todos";
}

function syncSelectedEditorCity() {
  if (selectedEditorCityId && cities.some((item) => String(item.id) === selectedEditorCityId)) return;
  selectedEditorCityId = "";
}

function getSelectedEditorCity() {
  return cities.find((item) => String(item.id) === String(selectedEditorCityId)) || null;
}

function getCityTimes(cityId) {
  const linkedTimes = cityTimes
    .filter((item) => String(item.city_id) === String(cityId))
    .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0) || String(a.label).localeCompare(String(b.label), "pt-BR"));

  if (linkedTimes.length) {
    return linkedTimes;
  }

  return timeTemplates
    .map((item, index) => ({
      id: `template-${cityId}-${index}`,
      city_id: cityId,
      label: item.label,
      sort_order: item.sort_order || index + 1,
      active: item.active !== false,
      isTemplateFallback: true
    }))
    .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0) || String(a.label).localeCompare(String(b.label), "pt-BR"));
}

function getEditorCityTimes(cityId) {
  const linkedTimes = getCityTimes(cityId);
  const linkedLabels = new Set(linkedTimes.map((item) => item.label));
  const templateFallbacks = timeTemplates
    .filter((item) => !linkedLabels.has(item.label))
    .map((item, index) => ({
      id: `template-only-${cityId}-${index}`,
      city_id: cityId,
      label: item.label,
      sort_order: item.sort_order || index + 1,
      active: item.active !== false,
      isTemplateFallback: true
    }));

  return [...linkedTimes, ...templateFallbacks]
    .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0) || String(a.label).localeCompare(String(b.label), "pt-BR"));
}

function getNextCityTimeSortOrder(cityId) {
  const rows = getEditorCityTimes(cityId);
  const lastSortOrder = rows.reduce((max, item) => Math.max(max, Number(item.sort_order || 0)), 0);
  return lastSortOrder + 1;
}

function buildActiveTimeLabels() {
  return [...new Set(cityTimes.filter((item) => item.active !== false).map((item) => item.label))]
    .sort((a, b) => a.localeCompare(b, "pt-BR"));
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

function normalizeTimeTemplates(items) {
  return (Array.isArray(items) ? items : [])
    .map((item, index) => {
      if (typeof item === "string") {
        return {
          id: `fallback-time-${index}`,
          label: item,
          sort_order: index + 1,
          active: true
        };
      }

      if (!item || !String(item.label || "").trim()) return null;
      return {
        id: item.id ?? `time-${index}`,
        label: String(item.label || "").trim(),
        sort_order: Number(item.sort_order || index + 1),
        active: item.active !== false
      };
    })
    .filter(Boolean);
}

function normalizeCityTimes(items) {
  return (Array.isArray(items) ? items : [])
    .map((item, index) => {
      if (!item || !String(item.label || "").trim()) return null;
      return {
        id: item.id ?? `city-time-${index}`,
        city_id: item.city_id,
        label: String(item.label || "").trim(),
        sort_order: Number(item.sort_order || index + 1),
        active: item.active !== false
      };
    })
    .filter(Boolean);
}

function countBy(items, key) {
  const counts = new Map();
  items.forEach((item) => {
    const value = item[key] || "Não informado";
    counts.set(value, (counts.get(value) || 0) + 1);
  });
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || String(a[0]).localeCompare(String(b[0])));
}

async function exportLeadsSpreadsheet() {
  if (typeof XLSX === "undefined") {
    alert("A biblioteca de exportação ainda não carregou. Tente novamente em alguns segundos.");
    return;
  }

  const exportFilters = getExportFilters();
  const exportRows = getLeadsByFilters(exportFilters);
  const rows = exportRows.map((lead) => ({
    nome: lead.name || "",
    idade: lead.age || "",
    cidade: lead.city || "",
    horario: lead.time || "",
    whatsapp: formatPhone(lead.phone || ""),
    cadastrado_em: formatDateTime(lead.created_at)
  }));

  const workbook = XLSX.utils.book_new();
  const worksheet = buildWorkbookSheet(rows, exportFilters);
  XLSX.utils.book_append_sheet(workbook, worksheet, "Agendamentos");
  XLSX.writeFile(workbook, buildExportFilename(exportFilters), { compression: true });
}

async function updateLeadTime(leadId, nextTime, button) {
  const lead = leads.find((item) => String(item.id) === String(leadId));
  if (!lead || !nextTime || lead.time === nextTime) return;
  const originalText = button?.textContent || "Salvar";

  try {
    if (button) {
      button.disabled = true;
      button.textContent = "Salvando...";
    }

    await mutateSupabase(`leads?id=eq.${leadId}`, "PATCH", {
      time: nextTime
    });

    lead.time = nextTime;
    filteredLeads = filteredLeads.map((item) =>
      String(item.id) === String(leadId) ? { ...item, time: nextTime } : item
    );
    renderLeadsTable();

    if (button) {
      button.textContent = "Salvo";
      button.classList.add("is-success");
    }

    await refreshDashboard();

    window.setTimeout(() => {
      if (!button) return;
      button.textContent = originalText;
      button.classList.remove("is-success");
      button.disabled = false;
    }, 1200);
  } catch (error) {
    console.error("Falha ao atualizar horário do lead:", error);
    if (button) {
      button.disabled = false;
      button.textContent = originalText;
      button.classList.remove("is-success");
    }
    alert("Não foi possível atualizar o horário agora. Verifique o Supabase e tente novamente.");
  }
}

function buildExportFilename(filters) {
  const city = (filters.selectedCity || "todas-cidades").replaceAll(/\s+/g, "-").toLowerCase();
  const time = (filters.selectedTime || "todos-horarios").replaceAll(/\s+/g, "-").toLowerCase();
  const ddd = (filters.selectedDdd || "todos-ddds").replaceAll(/\s+/g, "-").toLowerCase();
  const cityStatus = (filters.selectedCityStatus || "ativas-inativas").replaceAll(/\s+/g, "-").toLowerCase();
  return `agendamentos-${city}-${time}-${ddd}-${cityStatus}.xlsx`;
}

function formatPhone(phone) {
  const digits = String(phone || "").replace(/\D/g, "");
  if (!digits) return "-";
  if (digits.length === 11) return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  if (digits.length === 13 && digits.startsWith("55")) return `+55 (${digits.slice(2, 4)}) ${digits.slice(4, 9)}-${digits.slice(9)}`;
  if (digits.length > 11) return `+${digits.slice(0, digits.length - 11)} ${formatPhone(digits.slice(-11))}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

function formatDateTime(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(date);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function buildWorkbookSheet(rows, filters) {
  const selectedCity = filters.selectedCity || "Todas as cidades";
  const selectedTime = filters.selectedTime || "Todos os horários";
  const selectedDdd = filters.selectedDdd || "Todos os DDDs";
  const selectedCityStatus =
    filters.selectedCityStatus === "active"
      ? "Somente ativas"
      : filters.selectedCityStatus === "inactive"
        ? "Somente inativas"
        : "Ativas e inativas";
  const generatedAt = new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(new Date());
  const sheetRows = [
    ["DILSON STEIN", "", "", "", "", ""],
    [],
    ["Cidade filtrada:", selectedCity, "", "Horário filtrado:", selectedTime, ""],
    ["Total de agendamentos:", String(rows.length), "", "Exportado em:", generatedAt, ""],
    ["DDD filtrado:", selectedDdd, "", "Status da cidade:", selectedCityStatus, ""],
    [],
    ["Nome", "Idade", "Cidade", "Horário", "WhatsApp", "Cadastrado em"]
  ];

  if (rows.length) {
    rows.forEach((row) => {
      sheetRows.push([
        row.nome,
        row.idade,
        row.cidade,
        row.horario,
        row.whatsapp,
        row.cadastrado_em
      ]);
    });
  } else {
    sheetRows.push(["Nenhum agendamento encontrado para os filtros aplicados.", "", "", "", "", ""]);
  }

  const worksheet = XLSX.utils.aoa_to_sheet(sheetRows);
  worksheet["!cols"] = [
    { wch: 28 },
    { wch: 10 },
    { wch: 24 },
    { wch: 16 },
    { wch: 22 },
    { wch: 22 }
  ];

  worksheet["!merges"] = [
    XLSX.utils.decode_range("A1:F1"),
    XLSX.utils.decode_range("B3:C3"),
    XLSX.utils.decode_range("E3:F3"),
    XLSX.utils.decode_range("B4:C4"),
    XLSX.utils.decode_range("E4:F4"),
    XLSX.utils.decode_range("B5:C5"),
    XLSX.utils.decode_range("E5:F5"),
    XLSX.utils.decode_range("B6:F6")
  ];
  worksheet["!sheetViews"] = [{ showGridLines: false }];

  applySheetStyles(worksheet, rows.length);
  return worksheet;
}

function applySheetStyles(worksheet, rowCount) {
  const gold = "A18742";
  const dark = "0B0F17";
  const border = "D6DCE5";
  const soft = "EEF2F7";
  const white = "FFFFFF";
  const text = "132033";

  const setCellStyle = (address, style) => {
    if (!worksheet[address]) return;
    worksheet[address].s = style;
  };

  setCellStyle("A1", {
    font: { bold: true, color: { rgb: gold }, sz: 18 },
    fill: { fgColor: { rgb: dark } },
    alignment: { horizontal: "left", vertical: "center" }
  });

  [
    "A3", "B3", "C3", "D3", "E3", "F3",
    "A4", "B4", "C4", "D4", "E4", "F4",
    "A5", "B5", "C5", "D5", "E5", "F5",
    "A6", "B6", "C6", "D6", "E6", "F6"
  ].forEach((address) => {
    setCellStyle(address, {
      font: { bold: true, color: { rgb: text }, sz: 11 },
      fill: { fgColor: { rgb: soft } },
      border: buildBorder(border),
      alignment: { horizontal: "left", vertical: "center" }
    });
  });

  ["A8", "B8", "C8", "D8", "E8", "F8"].forEach((address) => {
    setCellStyle(address, {
      font: { bold: true, color: { rgb: white }, sz: 11 },
      fill: { fgColor: { rgb: gold } },
      border: buildBorder(border),
      alignment: { horizontal: "left", vertical: "center" }
    });
  });

  for (let row = 9; row < 9 + Math.max(rowCount, 1); row += 1) {
    const fillColor = row % 2 === 0 ? soft : white;
    ["A", "B", "C", "D", "E", "F"].forEach((column) => {
      setCellStyle(`${column}${row}`, {
        font: { color: { rgb: text }, sz: 11 },
        fill: { fgColor: { rgb: fillColor } },
        border: buildBorder(border),
        alignment: { horizontal: "left", vertical: "center" }
      });
    });
  }
}

function buildBorder(color) {
  return {
    top: { style: "thin", color: { rgb: color } },
    right: { style: "thin", color: { rgb: color } },
    bottom: { style: "thin", color: { rgb: color } },
    left: { style: "thin", color: { rgb: color } }
  };
}

function getCurrentFilters() {
  return {
    selectedCity: filterCity?.value || "",
    selectedTime: filterTime?.value || "",
    selectedDdd: filterDdd?.value || "",
    selectedCityStatus: filterCityStatus?.value || ""
  };
}

function getLeadsByFilters(filters) {
  return leads.filter((lead) => {
    const cityMatch = !filters.selectedCity || lead.city === filters.selectedCity;
    const timeMatch = !filters.selectedTime || lead.time === filters.selectedTime;
    const dddMatch = !filters.selectedDdd || extractDdd(lead.phone) === filters.selectedDdd;
    const cityStatusMatch = !filters.selectedCityStatus || matchCityStatus(lead.city, filters.selectedCityStatus);
    return cityMatch && timeMatch && dddMatch && cityStatusMatch;
  });
}

function getExportFilters() {
  return {
    selectedCity: exportFilterCity?.value || "",
    selectedTime: exportFilterTime?.value || "",
    selectedDdd: exportFilterDdd?.value || "",
    selectedCityStatus: exportFilterCityStatus?.value || ""
  };
}

function buildLeadTimeOptions(lead) {
  const cityRecord = cities.find((item) => item.label === lead.city);
  const options = cityRecord ? getCityTimes(cityRecord.id) : [];
  const labels = options
    .filter((item) => item.active !== false)
    .map((item) => item.label);

  if (lead.time && !labels.includes(lead.time)) {
    labels.unshift(lead.time);
  }

  const uniqueLabels = [...new Set(labels)];
  if (!uniqueLabels.length && lead.time) uniqueLabels.push(lead.time);

  return uniqueLabels
    .map((label) => `<option value="${escapeHtml(label)}" ${label === lead.time ? "selected" : ""}>${escapeHtml(label)}</option>`)
    .join("");
}

function normalizeSearchTerm(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function matchLeadSearch(lead, searchTerm) {
  const normalizedName = normalizeSearchTerm(lead.name || "");
  const normalizedPhone = String(lead.phone || "").replace(/\D/g, "");
  const phoneQuery = String(searchTerm).replace(/\D/g, "");

  return normalizedName.includes(searchTerm) || (phoneQuery && normalizedPhone.includes(phoneQuery));
}

function buildDddOptions() {
  return [...new Set(leads.map((lead) => extractDdd(lead.phone)).filter(Boolean))]
    .sort((a, b) => Number(a) - Number(b));
}

function extractDdd(phone) {
  const digits = String(phone || "").replace(/\D/g, "");
  if (digits.length >= 13 && digits.startsWith("55")) return digits.slice(2, 4);
  if (digits.length >= 10 && digits.length <= 11) return digits.slice(0, 2);
  return "";
}

function extractStateFromCity(city) {
  const text = String(city || "").trim();
  const stateMatch = text.match(/(?:^|[\s\-\/])([A-Z]{2})$/);
  return stateMatch ? stateMatch[1] : "";
}

function matchCityStatus(cityLabel, selectedStatus) {
  const cityRecord = cities.find((item) => item.label === cityLabel);
  const isActive = cityRecord ? cityRecord.active !== false : false;
  if (selectedStatus === "active") return isActive;
  if (selectedStatus === "inactive") return !isActive;
  return true;
}

function countCityRegistrations(cityLabel) {
  return leads.filter((lead) => lead.city === cityLabel).length;
}
