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
  if (typeof XLSX === "undefined") {
    alert("A biblioteca de exportação ainda não carregou. Tente novamente em alguns segundos.");
    return;
  }

  const rows = filteredLeads.map((lead) => ({
    nome: lead.name || "",
    idade: lead.age || "",
    cidade: lead.city || "",
    horario: lead.time || "",
    whatsapp: formatPhone(lead.phone || ""),
    cadastrado_em: formatDateTime(lead.created_at)
  }));

  const workbook = XLSX.utils.book_new();
  const worksheet = buildWorkbookSheet(rows);
  XLSX.utils.book_append_sheet(workbook, worksheet, "Agendamentos");
  XLSX.writeFile(workbook, buildExportFilename(), { compression: true });
}

function buildExportFilename() {
  const city = (filterCity?.value || "todas-cidades").replaceAll(/\s+/g, "-").toLowerCase();
  const time = (filterTime?.value || "todos-horarios").replaceAll(/\s+/g, "-").toLowerCase();
  return `agendamentos-${city}-${time}.xlsx`;
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

function buildWorkbookSheet(rows) {
  const selectedCity = filterCity?.value || "Todas as cidades";
  const selectedTime = filterTime?.value || "Todos os horários";
  const generatedAt = new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(new Date());
  const sheetRows = [
    ["DILSON STEIN", "", "", "", "", ""],
    [],
    [`Cidade filtrada: ${selectedCity}`, "", "", `Horário filtrado: ${selectedTime}`, "", ""],
    [`Total de agendamentos: ${rows.length}`, "", "", `Exportado em: ${generatedAt}`, "", ""],
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
    XLSX.utils.decode_range("A3:C3"),
    XLSX.utils.decode_range("D3:F3"),
    XLSX.utils.decode_range("A4:C4"),
    XLSX.utils.decode_range("D4:F4")
  ];

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

  ["A3", "D3", "A4", "D4"].forEach((address) => {
    setCellStyle(address, {
      font: { bold: true, color: { rgb: text }, sz: 11 },
      fill: { fgColor: { rgb: soft } },
      border: buildBorder(border),
      alignment: { horizontal: "left", vertical: "center" }
    });
  });

  ["A6", "B6", "C6", "D6", "E6", "F6"].forEach((address) => {
    setCellStyle(address, {
      font: { bold: true, color: { rgb: white }, sz: 11 },
      fill: { fgColor: { rgb: gold } },
      border: buildBorder(border),
      alignment: { horizontal: "left", vertical: "center" }
    });
  });

  for (let row = 7; row < 7 + Math.max(rowCount, 1); row += 1) {
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
