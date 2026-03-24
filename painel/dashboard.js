const PANEL_CONFIG = window.APP_CONFIG || {};
const PANEL_SESSION_KEY = "dilson_admin_session";

const logoutButton = document.querySelector("#logout-button");
const filterCity = document.querySelector("#filter-city");
const filterTime = document.querySelector("#filter-time");
const applyFiltersButton = document.querySelector("#apply-filters");
const clearFiltersButton = document.querySelector("#clear-filters");
const exportCsvButton = document.querySelector("#export-csv");
const cityForm = document.querySelector("#city-form");
const timeForm = document.querySelector("#time-form");
const cityList = document.querySelector("#city-list");
const timeList = document.querySelector("#time-list");
const leadsTableBody = document.querySelector("#leads-table-body");
const citySummary = document.querySelector("#city-summary");
const timeSummary = document.querySelector("#time-summary");

const metricTotal = document.querySelector("#metric-total");
const metricCities = document.querySelector("#metric-cities");
const metricTimes = document.querySelector("#metric-times");
const metricFilter = document.querySelector("#metric-filter");
const resultsCount = document.querySelector("#results-count");

let cities = [];
let times = [];
let leads = [];
let filteredLeads = [];

guardRoute();
refreshDashboard();

if (logoutButton) logoutButton.addEventListener("click", logout);
if (applyFiltersButton) applyFiltersButton.addEventListener("click", applyFilters);
if (clearFiltersButton) clearFiltersButton.addEventListener("click", clearFilters);
if (exportCsvButton) exportCsvButton.addEventListener("click", exportLeadsSpreadsheet);
if (cityForm) cityForm.addEventListener("submit", handleCityCreate);
if (timeForm) timeForm.addEventListener("submit", handleTimeCreate);

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
    loadTimes(),
    loadLeads()
  ]);

  renderOptionLists();
  populateFilters();
  applyFilters();
}

async function loadCities() {
  cities = await fetchTable("event_cities", PANEL_CONFIG.scheduling?.defaultCities?.map((label, index) => ({
    id: `fallback-city-${index}`,
    label,
    sort_order: index + 1,
    active: true
  })) || [], {
    order: "sort_order.asc,label.asc"
  });
}

async function loadTimes() {
  times = await fetchTable("event_times", PANEL_CONFIG.scheduling?.defaultTimes?.map((label, index) => ({
    id: `fallback-time-${index}`,
    label,
    sort_order: index + 1,
    active: true
  })) || [], {
    order: "sort_order.asc,label.asc"
  });
}

async function loadLeads() {
  leads = await fetchTable("leads", [], {
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

function populateFilters() {
  populateSelect(filterCity, cities.map((item) => item.label), "Todas as cidades");
  populateSelect(filterTime, times.map((item) => item.label), "Todos os horários");
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
  renderTagList(cityList, cities, "event_cities");
  renderTagList(timeList, times, "event_times");
}

function renderTagList(container, items, tableName) {
  if (!container) return;

  if (!items.length) {
    container.innerHTML = `<p class="empty-state">Nenhum item cadastrado.</p>`;
    return;
  }

  container.innerHTML = items
    .map((item) => `
      <div class="tag-item">
        <span>${escapeHtml(item.label)}</span>
        <button type="button" data-table="${tableName}" data-id="${item.id}">Excluir</button>
      </div>
    `)
    .join("");

  container.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", () => deleteOption(button.dataset.table, button.dataset.id));
  });
}

async function handleCityCreate(event) {
  event.preventDefault();
  const input = document.querySelector("#new-city");
  const label = input?.value.trim();
  if (!label) return;

  await createOption("event_cities", label, cities.length + 1);
  input.value = "";
}

async function handleTimeCreate(event) {
  event.preventDefault();
  const input = document.querySelector("#new-time");
  const label = input?.value.trim();
  if (!label) return;

  await createOption("event_times", label, times.length + 1);
  input.value = "";
}

async function createOption(tableName, label, sortOrder) {
  await mutateSupabase(tableName, "POST", {
    label,
    sort_order: sortOrder,
    active: true
  });

  await refreshDashboard();
}

async function deleteOption(tableName, id) {
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
  const selectedCity = filterCity?.value || "";
  const selectedTime = filterTime?.value || "";

  filteredLeads = leads.filter((lead) => {
    const cityMatch = !selectedCity || lead.city === selectedCity;
    const timeMatch = !selectedTime || lead.time === selectedTime;
    return cityMatch && timeMatch;
  });

  renderLeadsTable();
  renderSummaries();
  updateMetrics(selectedCity, selectedTime);
}

function clearFilters() {
  if (filterCity) filterCity.value = "";
  if (filterTime) filterTime.value = "";
  applyFilters();
}

function renderLeadsTable() {
  if (!leadsTableBody) return;

  if (!filteredLeads.length) {
    leadsTableBody.innerHTML = `
      <tr>
        <td colspan="6" class="empty-state">Nenhum agendamento encontrado para o filtro atual.</td>
      </tr>
    `;
    resultsCount.textContent = "0 registros";
    return;
  }

  leadsTableBody.innerHTML = filteredLeads
    .map((lead) => `
      <tr>
        <td>${escapeHtml(lead.name || "-")}</td>
        <td>${escapeHtml(lead.age || "-")}</td>
        <td>${escapeHtml(lead.city || "-")}</td>
        <td>${escapeHtml(lead.time || "-")}</td>
        <td>${formatPhone(lead.phone || "-")}</td>
        <td>${formatDateTime(lead.created_at)}</td>
      </tr>
    `)
    .join("");

  resultsCount.textContent = `${filteredLeads.length} registros`;
}

function renderSummaries() {
  renderSummaryList(citySummary, countBy(filteredLeads, "city"), "Nenhum agendamento por cidade ainda.");
  renderSummaryList(timeSummary, countBy(filteredLeads, "time"), "Nenhum agendamento por horário ainda.");
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

function updateMetrics(selectedCity, selectedTime) {
  metricTotal.textContent = String(filteredLeads.length);
  metricCities.textContent = String(cities.length);
  metricTimes.textContent = String(times.length);
  metricFilter.textContent = [
    selectedCity || "Todas as cidades",
    selectedTime || "Todos os horários"
  ].join(" • ");
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
  const rows = filteredLeads.map((lead) => ({
    nome: lead.name || "",
    idade: lead.age || "",
    cidade: lead.city || "",
    horario: lead.time || "",
    whatsapp: formatPhone(lead.phone || ""),
    cadastrado_em: formatDateTime(lead.created_at)
  }));

  const logoDataUrl = await loadLogoDataUrl();
  const html = buildExcelHtml(rows, logoDataUrl);
  const blob = new Blob(["\uFEFF", html], { type: "application/vnd.ms-excel;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.href = url;
  link.download = buildExportFilename();
  link.click();
  URL.revokeObjectURL(url);
}

function buildExportFilename() {
  const city = (filterCity?.value || "todas-cidades").replaceAll(/\s+/g, "-").toLowerCase();
  const time = (filterTime?.value || "todos-horarios").replaceAll(/\s+/g, "-").toLowerCase();
  return `agendamentos-${city}-${time}.xls`;
}

function formatPhone(phone) {
  const digits = String(phone || "").replace(/\D/g, "");
  if (digits.length !== 11) return escapeHtml(phone || "-");
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

async function loadLogoDataUrl() {
  try {
    const response = await fetch("/img/logo-dourada.png");
    const blob = await response.blob();
    return await blobToDataUrl(blob);
  } catch (error) {
    console.error("Falha ao carregar logo para exportação:", error);
    return "";
  }
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function buildExcelHtml(rows, logoDataUrl = "") {
  const selectedCity = filterCity?.value || "Todas as cidades";
  const selectedTime = filterTime?.value || "Todos os horários";
  const generatedAt = new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(new Date());

  const headerRow = `
    <tr>
      <th>Nome</th>
      <th>Idade</th>
      <th>Cidade</th>
      <th>Horário</th>
      <th>WhatsApp</th>
      <th>Cadastrado em</th>
    </tr>
  `;

  const bodyRows = rows.length
    ? rows.map((row) => `
        <tr>
          <td>${escapeHtml(row.nome)}</td>
          <td>${escapeHtml(row.idade)}</td>
          <td>${escapeHtml(row.cidade)}</td>
          <td>${escapeHtml(row.horario)}</td>
          <td>${escapeHtml(row.whatsapp)}</td>
          <td>${escapeHtml(row.cadastrado_em)}</td>
        </tr>
      `).join("")
    : `<tr><td colspan="6">Nenhum agendamento encontrado para os filtros aplicados.</td></tr>`;

  return `
    <html xmlns:o="urn:schemas-microsoft-com:office:office"
          xmlns:x="urn:schemas-microsoft-com:office:excel"
          xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="UTF-8">
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>Agendamentos</x:Name>
                <x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>
              </x:ExcelWorksheet>
            </x:ExcelWorksheets>
          </x:ExcelWorkbook>
        </xml>
        <![endif]-->
        <style>
          body { font-family: Arial, sans-serif; color: #132033; }
          .sheet { width: 100%; }
          .brand-wrap { background: #0b0f17; color: #ffffff; }
          .brand-cell { padding: 20px 24px; }
          .brand-logo { height: 44px; }
          .title { font-size: 22px; font-weight: bold; color: #A18742; }
          .meta { font-size: 12px; color: #4a5568; }
          .meta strong { color: #132033; }
          .spacer { height: 14px; }
          table { border-collapse: collapse; width: 100%; }
          th { background: #A18742; color: #ffffff; font-weight: bold; text-align: left; padding: 10px 12px; border: 1px solid #d6dce5; }
          td { padding: 10px 12px; border: 1px solid #d6dce5; background: #ffffff; }
          .alt td { background: #f5f7fb; }
          .summary-box { padding: 10px 12px; background: #eef2f7; border: 1px solid #d6dce5; }
        </style>
      </head>
      <body>
        <table class="sheet">
          <tr class="brand-wrap">
            <td class="brand-cell" colspan="6">
              ${logoDataUrl ? `<img class="brand-logo" src="${logoDataUrl}" alt="Dilson Stein">` : `<span class="title">DILSON STEIN</span>`}
            </td>
          </tr>
          <tr><td colspan="6" class="spacer"></td></tr>
          <tr>
            <td colspan="3" class="summary-box"><strong>Cidade filtrada:</strong> ${escapeHtml(selectedCity)}</td>
            <td colspan="3" class="summary-box"><strong>Horário filtrado:</strong> ${escapeHtml(selectedTime)}</td>
          </tr>
          <tr>
            <td colspan="3" class="summary-box"><strong>Total de agendamentos:</strong> ${rows.length}</td>
            <td colspan="3" class="summary-box"><strong>Exportado em:</strong> ${escapeHtml(generatedAt)}</td>
          </tr>
          <tr><td colspan="6" class="spacer"></td></tr>
        </table>
        <table>
          <thead>${headerRow}</thead>
          <tbody>${bodyRows}</tbody>
        </table>
      </body>
    </html>
  `;
}
