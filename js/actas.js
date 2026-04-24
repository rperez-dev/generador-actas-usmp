const state = {
  rawData: [],
  filteredData: [],
  logoBase64: null,
  logoFormat: "PNG",
};

const MODALIDAD_OPTIONS = ["PRESENCIAL", "VIRTUAL"];

const PERIODO_OPTIONS = ["2026-1", "2026-2"];

const DEFAULT_PERIODO = "2026-1";

const el = {
  excelFile: document.getElementById("excelFile"),
  logoFile: document.getElementById("logoFile"),
  cursoSelect: document.getElementById("cursoSelect"),
  carreraSelect: document.getElementById("carreraSelect"),
  seccionSelect: document.getElementById("seccionSelect"),
  alumnosSelect: document.getElementById("alumnosSelect"),
  modoManualCheck: document.getElementById("modoManualCheck"),
  alumnosManualInput: document.getElementById("alumnosManualInput"),
  alumnosSelectWrapper: document.getElementById("alumnosSelectWrapper"),
  alumnosManualWrapper: document.getElementById("alumnosManualWrapper"),
  indicadorInput: document.getElementById("indicadorInput"),
  modalidadInput: document.getElementById("modalidadInput"),
  fechaInput: document.getElementById("fechaInput"),
  periodoInput: document.getElementById("periodoInput"),
  generarBtn: document.getElementById("generarBtn"),
  limpiarBtn: document.getElementById("limpiarBtn"),
  messageBox: document.getElementById("messageBox"),
  previewBody: document.getElementById("previewBody"),
  statCurso: document.getElementById("statCurso"),
  statIndicador: document.getElementById("statIndicador"),
  statAlumnos: document.getElementById("statAlumnos"),
  usarLogoCheck: document.getElementById("usarLogoCheck"),
  logoWrapper: document.getElementById("logoWrapper"),
  watermarkType: document.getElementById("watermarkType"),
  rotuladoBtn: document.getElementById("generarRotuladoPDF"),
  aulaInput: document.getElementById("aulaInput"),
};

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function showMessage(text, type = "success") {
  el.messageBox.textContent = text;
  el.messageBox.className = `message ${type}`;
}

function clearMessage() {
  el.messageBox.textContent = "";
  el.messageBox.className = "message";
}

function uniqueSorted(values) {
  return [
    ...new Set(
      values.filter(
        (v) => v !== undefined && v !== null && String(v).trim() !== "",
      ),
    ),
  ].sort((a, b) => String(a).localeCompare(String(b), "es"));
}

function toggleLogo() {
  const activo = el.usarLogoCheck.checked;

  el.logoWrapper.classList.toggle("hidden", !activo);

  if (!activo) {
    el.logoFile.value = "";
    state.logoBase64 = null;
  } else {
    cargarLogoDefault();
  }
}

function getSelectedValues(select) {
  return Array.from(select.selectedOptions).map((opt) => opt.value);
}

function setOptions(select, values, placeholder = null) {
  select.innerHTML = "";

  if (placeholder !== null) {
    const option = document.createElement("option");
    option.value = "";
    option.textContent = placeholder;
    select.appendChild(option);
  }

  values.forEach((value) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = value;
    select.appendChild(option);
  });
}

function setOptionsPreserveSelection(
  select,
  values,
  previousSelectedValues = [],
) {
  const selectedSet = new Set(previousSelectedValues);
  select.innerHTML = "";

  values.forEach((value) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = value;
    option.selected = selectedSet.has(value);
    select.appendChild(option);
  });
}

function setSingleSelectOptions(
  select,
  values,
  selectedValue = "",
  placeholder = null,
) {
  select.innerHTML = "";

  if (placeholder !== null) {
    const option = document.createElement("option");
    option.value = "";
    option.textContent = placeholder;
    option.selected = selectedValue === "";
    select.appendChild(option);
  }

  values.forEach((value) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = value;
    option.selected = value === selectedValue;
    select.appendChild(option);
  });
}
  



function abreviarCarrera(nombre = "") {
  return String(nombre)
    .replace(/Vers.*/i, "")
    .replace(/-semi/gi, "")
    .replace(/\(.*?\)/g, "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p.slice(0, 3).toUpperCase())
    .join(" ");
}

function getCiclo(cursoCodigo = "") {
  const texto = String(cursoCodigo);
  return texto.length >= 8 ? texto.slice(6, 8) : "";
}

function validateColumns(data) {
  const required = [
    "Descrip. Curso",
    "Denom. Plan",
    "Nom Sección",
    "Nombre resumen",
    "Curso",
    "Id sección",
    "Número Matrícula",
  ];

  if (!data.length) return "El Excel no contiene filas.";

  const missing = required.filter((col) => !(col in data[0]));
  return missing.length
    ? `Faltan columnas requeridas: ${missing.join(", ")}`
    : null;
}

function normalizarTexto(valor = "") {
  return String(valor)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\u00A0/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
}

function obtenerListadoManual() {
  return el.alumnosManualInput.value
    .split(/\r?\n/)
    .map((item) => normalizarTexto(item))
    .filter(Boolean);
}

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

async function cargarLogoDefault() {
  try {
    const response = await fetch("./img/logo.png");
    const blob = await response.blob();

    state.logoBase64 = await blobToBase64(blob);
    state.logoFormat = "PNG";
  } catch (err) {
    console.warn("No se pudo cargar logo por defecto");
  }
}

function onlyDigits(text = "") {
  return String(text).replace(/\D/g, "");
}

function formatearFechaInput(valor = "") {
  const digits = onlyDigits(valor).slice(0, 8);
  const parts = [];

  if (digits.length >= 2) parts.push(digits.slice(0, 2));
  else if (digits.length > 0) parts.push(digits);

  if (digits.length >= 4) parts.push(digits.slice(2, 4));
  else if (digits.length > 2) parts.push(digits.slice(2));

  if (digits.length > 4) parts.push(digits.slice(4, 8));

  return parts.join("/");
}

function esFechaValidaDDMMYYYY(valor = "") {
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(valor)) return false;

  const [dd, mm, yyyy] = valor.split("/").map(Number);
  const fecha = new Date(yyyy, mm - 1, dd);

  return (
    fecha.getFullYear() === yyyy &&
    fecha.getMonth() === mm - 1 &&
    fecha.getDate() === dd
  );
}

function getFechaActualFormateada() {
  const hoy = new Date();
  const dia = String(hoy.getDate()).padStart(2, "0");
  const mes = String(hoy.getMonth() + 1).padStart(2, "0");
  const anio = hoy.getFullYear();
  return `${dia}/${mes}/${anio}`;
}

function setEnabled(elements, enabled) {
  elements.forEach((element) => {
    if (element) element.disabled = !enabled;
  });
}

function getSeccionValue(row) {
  return String(row["Nom Sección"] ?? "").trim();
}

function getSeccionLabel(row) {
  return String(row["Nom Sección"] ?? "").trim();
}

function updateUIState() {
  const hasExcel = state.rawData.length > 0;
  const hasCurso = !!el.cursoSelect.value;
  const hasCarreras = getSelectedValues(el.carreraSelect).length > 0;
  const hasSecciones = getSelectedValues(el.seccionSelect).length > 0;

  setEnabled([el.logoFile], true);
  setEnabled([el.cursoSelect], hasExcel);
  setEnabled([el.carreraSelect], hasExcel && hasCurso);
  setEnabled([el.seccionSelect], hasExcel && hasCurso && hasCarreras);

  const enableLower = hasExcel && hasCurso && hasCarreras && hasSecciones;

  setEnabled(
    [
      el.alumnosSelect,
      el.modoManualCheck,
      el.alumnosManualInput,
      el.indicadorInput,
      el.modalidadInput,
      el.fechaInput,
      el.periodoInput,
      el.generarBtn,
    ],
    enableLower,
  );

  if (!enableLower) {
    el.alumnosManualInput.disabled = true;
  } else if (el.modoManualCheck.checked) {
    el.alumnosManualInput.disabled = false;
    el.alumnosSelect.disabled = true;
  }
}

async function readExcel(file) {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  return XLSX.utils.sheet_to_json(sheet, { defval: "" });
}

async function onLogoChange(event) {
  const file = event.target.files[0];

  if (!file) {
    state.logoBase64 = null;
    state.logoFormat = "PNG";
    return;
  }

  try {
    state.logoBase64 = await blobToBase64(file);

    if (file.type.includes("svg")) state.logoFormat = "SVG";
    else if (file.type.includes("png")) state.logoFormat = "PNG";
    else if (file.type.includes("jpeg") || file.type.includes("jpg"))
      state.logoFormat = "JPEG";
    else if (file.type.includes("webp")) state.logoFormat = "WEBP";
    else state.logoFormat = "PNG";

    showMessage("Logo cargado correctamente.", "success");
  } catch (error) {
    console.error(error);
    state.logoBase64 = null;
    showMessage("No se pudo cargar el logo seleccionado.", "error");
  }
}

function toggleModoManual() {
  const activo = el.modoManualCheck.checked;

  el.alumnosSelectWrapper.classList.toggle("hidden", activo);
  el.alumnosManualWrapper.classList.toggle("hidden", !activo);

  if (activo) {
    Array.from(el.alumnosSelect.options).forEach((opt) => {
      opt.selected = false;
    });
    el.alumnosSelect.disabled = true;
    el.alumnosManualInput.disabled = false;
  } else {
    el.alumnosManualInput.value = "";
    el.alumnosManualInput.disabled = true;
  }

  updateUIState();
  applyFilters();
}

function normalizarCursoClave(valor = "") {
  return String(valor)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\u00A0/g, " ")
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
}

function generarMapaCursosSeguro(data) {
  const mapa = new Map();

  data.forEach((row) => {
    const original = row["Descrip. Curso"];
    const clave = normalizarCursoClave(original);

    if (!mapa.has(clave)) {
      mapa.set(clave, original);
    }
  });

  return mapa;
}

function actualizarCarreras() {
  const curso = el.cursoSelect.value;

  setOptions(el.carreraSelect, []);
  setOptions(el.seccionSelect, []);
  setOptions(el.alumnosSelect, []);
  state.filteredData = [];
  renderPreview([]);

  if (!curso) {
    updateUIState();
    return;
  }

  const carreras = uniqueSorted(
    state.rawData
      .filter((row) => row["Descrip. Curso"] === curso)
      .map((row) => row["Denom. Plan"]),
  );

  setOptions(el.carreraSelect, carreras);
  updateUIState();
}

function actualizarSecciones() {
  const curso = el.cursoSelect.value;
  const carrerasSeleccionadas = getSelectedValues(el.carreraSelect);

  setOptions(el.seccionSelect, []);
  setOptions(el.alumnosSelect, []);
  state.filteredData = [];
  renderPreview([]);

  if (!curso || !carrerasSeleccionadas.length) {
    updateUIState();
    return;
  }

  const carrerasSet = new Set(carrerasSeleccionadas);

  const secciones = uniqueSorted(
    state.rawData
      .filter(
        (row) =>
          row["Descrip. Curso"] === curso &&
          carrerasSet.has(row["Denom. Plan"]),
      )
      .map((row) => getSeccionLabel(row)),
  );

  setOptions(el.seccionSelect, secciones);
  updateUIState();
}

function actualizarAlumnos() {
  const curso = el.cursoSelect.value;
  const carrerasSeleccionadas = getSelectedValues(el.carreraSelect);
  const seccionesSeleccionadas = getSelectedValues(el.seccionSelect);
  const previousSelectedAlumnos = getSelectedValues(el.alumnosSelect);

  if (
    !curso ||
    !carrerasSeleccionadas.length ||
    !seccionesSeleccionadas.length
  ) {
    setOptions(el.alumnosSelect, []);
    state.filteredData = [];
    renderPreview([]);
    updateUIState();
    return;
  }

  const carrerasSet = new Set(carrerasSeleccionadas);
  const seccionesSet = new Set(seccionesSeleccionadas);

  const data = state.rawData.filter(
    (row) =>
      row["Descrip. Curso"] === curso &&
      carrerasSet.has(row["Denom. Plan"]) &&
      seccionesSet.has(getSeccionValue(row)),
  );

  const alumnos = uniqueSorted(data.map((row) => row["Nombre resumen"]));

  setOptionsPreserveSelection(
    el.alumnosSelect,
    alumnos,
    previousSelectedAlumnos,
  );

  updateUIState();
  applyFilters();
}

function normalizarCursoClave(valor = "") {
  return String(valor)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\u00A0/g, " ")
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
}

function applyFilters() {
  const curso = el.cursoSelect.value;
  const carrerasSeleccionadas = getSelectedValues(el.carreraSelect);
  const seccionesSeleccionadas = getSelectedValues(el.seccionSelect);
  const alumnos = getSelectedValues(el.alumnosSelect);
  const usarModoManual = el.modoManualCheck.checked;
  const listadoManual = obtenerListadoManual();

  let data = [...state.rawData];

  if (curso) {
    data = data.filter((row) => row["Descrip. Curso"] === curso);
  }

  if (carrerasSeleccionadas.length) {
    const carrerasSet = new Set(carrerasSeleccionadas);
    data = data.filter((row) => carrerasSet.has(row["Denom. Plan"]));
  }

  if (seccionesSeleccionadas.length) {
    const seccionesSet = new Set(seccionesSeleccionadas);
    data = data.filter((row) => seccionesSet.has(getSeccionValue(row)));
  } else {
    data = [];
  }

  if (usarModoManual) {
    if (listadoManual.length) {
      const listadoSet = new Set(listadoManual);

      data = data.filter((row) => listadoSet.has(row["alumno_normalizado"]));
    }
  } else if (alumnos.length) {
    data = data.filter((row) => alumnos.includes(row["Nombre resumen"]));
  }

  data.sort((a, b) =>
    String(a["Nombre resumen"]).localeCompare(
      String(b["Nombre resumen"]),
      "es",
    ),
  );

  state.filteredData = data;
  renderPreview(data);
}

function renderPreview(data) {
  el.statCurso.textContent = el.cursoSelect.value || "-";
  el.statIndicador.textContent = el.indicadorInput.value || "-";
  el.statAlumnos.textContent = data.length;

  if (!data.length) {
    el.previewBody.innerHTML = `
      <tr>
        <td colspan="5" class="empty-row">No hay datos para los filtros seleccionados.</td>
      </tr>
    `;
    return;
  }

  el.previewBody.innerHTML = data
    .slice(0, 300)
    .map(
      (row, idx) => `
      <tr>
        <td>${idx + 1}</td>
        <td>${abreviarCarrera(row["Denom. Plan"])}</td>
        <td>${row["Número Matrícula"] ?? ""}</td>
        <td>${row["Nombre resumen"] ?? ""}</td>
        <td>${row["Nom Sección"] ?? ""}</td>
      </tr>
    `,
    )
    .join("");
}

function onIndicadorInput() {
  const inicio = el.indicadorInput.selectionStart;
  const fin = el.indicadorInput.selectionEnd;
  el.indicadorInput.value = String(el.indicadorInput.value || "").toUpperCase();
  el.indicadorInput.setSelectionRange(inicio, fin);
  renderPreview(state.filteredData);
}

function onFechaInput() {
  el.fechaInput.value = formatearFechaInput(el.fechaInput.value);
}

function validarFormulario() {
  if (!state.filteredData.length)
    return "Uno o más alumnos no pertenecen a la carrera seleccionada.";
  if (!el.modalidadInput.value) return "Selecciona una modalidad.";
  if (!el.fechaInput.value) return "Ingresa una fecha.";
  if (!esFechaValidaDDMMYYYY(el.fechaInput.value)) {
    return "La fecha debe tener formato DD/MM/AAAA y ser válida.";
  }
  if (!el.periodoInput.value) return "Selecciona un periodo.";
  return null;
}

function generarPDF() {
  clearMessage();

  const error = validarFormulario();
  if (error) {
    showMessage(error, "error");
    return;
  }

  if (
    !window.PDFGenerator ||
    typeof window.PDFGenerator.generate !== "function"
  ) {
    showMessage(
      "No se encontró el generador de PDF. Verifica pdf-generator.js.",
      "error",
    );
    return;
  }

  const seccionesSeleccionadas = getSelectedValues(el.seccionSelect);

  const primeraSeccion = seccionesSeleccionadas.length
    ? [seccionesSeleccionadas[0]]
    : [];

  const config = {
    logoBase64: state.logoBase64,
    logoFormat: state.logoFormat,
    seleccion: state.filteredData,
    curso: el.cursoSelect.value || "",
    planes: getSelectedValues(el.carreraSelect),
    secciones: primeraSeccion,
    ciclo: getCiclo(state.filteredData[0]["Curso"]),
    indicador: el.indicadorInput.value || "",
    modalidad: el.modalidadInput.value || "",
    fecha: el.fechaInput.value || "",
    periodo: el.periodoInput.value || DEFAULT_PERIODO,
    abreviarCarrera,
    watermark: el.watermarkType.value,
    aula: el.aulaInput.value || "",
  };

  try {
    window.PDFGenerator.generate(config);
    showMessage("PDF generado correctamente.", "success");
  } catch (err) {
    console.error(err);
    showMessage(`Error al generar PDF: ${err.message}`, "error");
  }
}

function generarRotuladoPDF() {
  clearMessage();

  if (!state.filteredData.length) {
    showMessage("No hay datos para generar el rotulado.", "error");
    return;
  }

  if (!window.PDFGeneratorRotulado) {
    showMessage("No existe PDFGeneratorRotulado.", "error");
    return;
  }

  const config = {
    curso: el.cursoSelect.value || "",
    indicador: el.indicadorInput.value || "",
    fecha: el.fechaInput.value || "",
    total: state.filteredData.length,
  };

  try {
    window.PDFGeneratorRotulado.generate(config);
    showMessage("Rotulado generado correctamente.", "success");
  } catch (err) {
    console.error(err);
    showMessage("Error al generar rotulado.", "error");
  }
}

async function limpiarTodo(limpiarArchivo = true, limpiarMensaje = true) {
  if (limpiarArchivo) {
    el.excelFile.value = "";
    state.rawData = [];
  }

  el.logoFile.value = "";
  await cargarLogoDefault();
  state.logoFormat = "PNG";

  el.cursoSelect.value = "";
  setOptions(el.carreraSelect, []);
  setOptions(el.seccionSelect, []);
  setOptions(el.alumnosSelect, []);
  el.modoManualCheck.checked = false;
  el.alumnosManualInput.value = "";
  el.alumnosSelectWrapper.classList.remove("hidden");
  el.alumnosManualWrapper.classList.add("hidden");
  el.indicadorInput.value = "";
  el.fechaInput.value = getFechaActualFormateada();
  state.filteredData = [];
  el.aulaInput.value = "";

  setSingleSelectOptions(el.modalidadInput, MODALIDAD_OPTIONS, "");
  setSingleSelectOptions(el.periodoInput, PERIODO_OPTIONS, DEFAULT_PERIODO);

  renderPreview([]);
  if (limpiarMensaje) {
    clearMessage();
  }
  updateUIState();
}

async function onExcelChange(event) {
  const file = event.target.files[0];
  if (!file) return;

  clearMessage();

  try {
    el.logoFile.disabled = true;

    el.messageBox.innerHTML = `
      <div style="display:flex;align-items:center;gap:10px;">
        <div class="loader"></div>
        <span>Procesando archivo Excel...</span>
      </div>
    `;
    el.messageBox.className = "message success";

    const data = await readExcel(file);
    const validationError = validateColumns(data);

    if (validationError) {
      showMessage(validationError, "error");
      return;
    }

    data.forEach((row) => {
      row["alumno_normalizado"] = normalizarTexto(row["Nombre resumen"]);
    });

    state.rawData = data;

    const cursos = uniqueSorted(data.map((row) => row["Descrip. Curso"]));

    await limpiarTodo(false, false);
    state.rawData = data;

    setOptions(el.cursoSelect, cursos, "Seleccione un curso");

    updateUIState();

    showMessage(
      `Archivo cargado correctamente. Registros detectados: ${data.length}.`,
      "success",
    );
  } catch (error) {
    console.error(error);
    showMessage("No se pudo leer el archivo Excel.", "error");
  }
}

function inicializarCamposFijos() {
  setSingleSelectOptions(el.modalidadInput, MODALIDAD_OPTIONS, "");
  setSingleSelectOptions(el.periodoInput, PERIODO_OPTIONS, DEFAULT_PERIODO);
  el.fechaInput.placeholder = "DD/MM/AAAA";
  el.fechaInput.maxLength = 10;
  el.fechaInput.value = getFechaActualFormateada();
}

function initEvents() {
  el.excelFile.addEventListener("change", onExcelChange);
  el.logoFile.addEventListener("change", onLogoChange);
  el.cursoSelect.addEventListener("change", actualizarCarreras);
  el.carreraSelect.addEventListener("change", actualizarSecciones);
  el.seccionSelect.addEventListener("change", actualizarAlumnos);
  el.alumnosSelect.addEventListener("change", applyFilters);
  el.modoManualCheck.addEventListener("change", toggleModoManual);
  el.alumnosManualInput.addEventListener("input", applyFilters);
  el.indicadorInput.addEventListener("input", onIndicadorInput);
  el.fechaInput.addEventListener("input", onFechaInput);
  el.generarBtn.addEventListener("click", generarPDF);
  el.rotuladoBtn.addEventListener("click", generarRotuladoPDF);
  el.limpiarBtn.addEventListener("click", () => limpiarTodo(true));
  el.usarLogoCheck.addEventListener("change", toggleLogo);
}

async function init() {
  inicializarCamposFijos();
  initEvents();
  toggleModoManual();
  updateUIState();
  await cargarLogoDefault();
  el.usarLogoCheck.checked = false;
  toggleLogo();
}

document.addEventListener("DOMContentLoaded", init);
