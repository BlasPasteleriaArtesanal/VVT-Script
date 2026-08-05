// Valores por defecto
const DEFAULTS = {
  apellido: 'PÉREZ',
  nombre: 'JUAN',
  email: 'juan.perez@example.com',
  codigoPais: '+54',
  telefono: '1112345678',
  fechaNacimiento: '1998-05-15'
};

// Referencias a los elementos del DOM
const inputApellido = document.getElementById('inputApellido');
const inputNombre = document.getElementById('inputNombre');
const inputEmail = document.getElementById('inputEmail');
const inputCodigoPais = document.getElementById('inputCodigoPais');
const inputTelefono = document.getElementById('inputTelefono');
const inputFechaNacimiento = document.getElementById('inputFechaNacimiento');
const codePreview = document.getElementById('code-preview');
const toastContainer = document.getElementById('toast-container');

// Dar formato DD/MM/YYYY a las fechas YYYY-MM-DD
function formatFecha(fechaStr) {
  if (!fechaStr) return '';
  if (fechaStr.includes('-')) {
    const parts = fechaStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
  }
  return fechaStr;
}

// Obtener los valores del formulario
function getFormValues() {
  return {
    apellido: inputApellido ? inputApellido.value.trim() : DEFAULTS.apellido,
    nombre: inputNombre ? inputNombre.value.trim() : DEFAULTS.nombre,
    email: inputEmail ? inputEmail.value.trim() : DEFAULTS.email,
    codigoPais: inputCodigoPais ? inputCodigoPais.value.trim() : DEFAULTS.codigoPais,
    telefono: inputTelefono ? inputTelefono.value.trim() : DEFAULTS.telefono,
    fechaNacimiento: inputFechaNacimiento ? inputFechaNacimiento.value : DEFAULTS.fechaNacimiento
  };
}

// Generador del código del Userscript para Tampermonkey / Violentmonkey
function getScriptContent(values) {
  const fechaFormatted = formatFecha(values.fechaNacimiento);

  return `// ==UserScript==
// @name         Auto-Rellenado Consulado Francia (VVT)
// @namespace    https://github.com/vvt-script
// @version      1.2.0
// @description  Autocompleta automáticamente los formularios de solicitud de cita y visados en el Consulado de Francia.
// @author       VVT Community
// @match        https://*.consulfrance.org/*
// @match        https://*.france-visas.gouv.fr/*
// @match        https://*.vfs-global.com/*
// @match        https://*.trood.fr/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=france-visas.gouv.fr
// @grant        none
// ==UserScript==

(function() {
    'use strict';

    const datos = {
        apellido: '${values.apellido}',
        nombre: '${values.nombre}',
        email: '${values.email}',
        codigoPais: '${values.codigoPais}',
        telefono: '${values.telefono}',
        fechaNacimiento: '${fechaFormatted}'
    };

    console.log('[VVT Script] Autocompletando campos para:', datos.nombre, datos.apellido);

    function fillForm() {
        const selectors = {
            apellido: ['input[name*="nom" i]', 'input[name*="lastName" i]', 'input[name*="apellido" i]', '#lastName', '#nom'],
            nombre: ['input[name*="prenom" i]', 'input[name*="firstName" i]', 'input[name*="nombre" i]', '#firstName', '#prenom'],
            email: ['input[type="email"]', 'input[name*="email" i]', 'input[name*="courriel" i]', '#email'],
            codigoPais: ['select[name*="countryCode" i]', 'input[name*="dialCode" i]', '#countryCode', 'input[name*="codigoPais" i]'],
            telefono: ['input[type="tel"]', 'input[name*="phone" i]', 'input[name*="mobile" i]', 'input[name*="telefono" i]', '#phone'],
            fechaNacimiento: ['input[type="date"]', 'input[name*="birth" i]', 'input[name*="dob" i]', '#birthDate']
        };

        for (const [key, value] of Object.entries(datos)) {
            if (!value || !selectors[key]) continue;
            for (const selector of selectors[key]) {
                const elements = document.querySelectorAll(selector);
                elements.forEach(el => {
                    if (el && !el.disabled && el.value !== value) {
                        el.value = value;
                        el.dispatchEvent(new Event('input', { bubbles: true }));
                        el.dispatchEvent(new Event('change', { bubbles: true }));
                        el.dispatchEvent(new Event('blur', { bubbles: true }));
                        el.style.border = '2px solid #22c55e';
                        el.style.backgroundColor = '#f0fdf4';
                    }
                });
            }
        }
    }

    fillForm();
    window.addEventListener('load', fillForm);
    setInterval(fillForm, 1000);
})();`;
}

// Actualizar la vista previa del código
function updatePreview() {
  const values = getFormValues();
  const content = getScriptContent(values);
  if (codePreview) {
    codePreview.textContent = content;
  }
}

// Mostrar notificaciones Toast
function showToast(msg) {
  if (!toastContainer) return;
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `<span class="toast-icon">✓</span> <span>${msg}</span>`;
  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('show');
  }, 10);

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }, 3000);
}

// Copiar al portapapeles con fallback (exacto al snippet)
async function copyToClipboard(text, msg) {
  try {
    await navigator.clipboard.writeText(text);
    showToast(msg);
  } catch (err) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    showToast(msg);
  }
}

// Inicialización de Event Listeners
[inputApellido, inputNombre, inputEmail, inputCodigoPais, inputTelefono, inputFechaNacimiento].forEach(input => {
  if (input) {
    input.addEventListener('input', updatePreview);
  }
});

document.getElementById('btn-copy-custom').addEventListener('click', () => {
  copyToClipboard(getScriptContent(getFormValues()), '¡Script copiado al portapapeles!');
});

document.getElementById('btn-copy-header').addEventListener('click', () => {
  copyToClipboard(getScriptContent(getFormValues()), '¡Código copiado!');
});

document.getElementById('btn-reset').addEventListener('click', () => {
  inputApellido.value = DEFAULTS.apellido;
  inputNombre.value = DEFAULTS.nombre;
  inputEmail.value = DEFAULTS.email;
  inputCodigoPais.value = DEFAULTS.codigoPais;
  inputTelefono.value = DEFAULTS.telefono;
  inputFechaNacimiento.value = DEFAULTS.fechaNacimiento;
  updatePreview();
  showToast('Datos restablecidos');
});

document.getElementById('btn-download').addEventListener('click', () => {
  const blob = new Blob([getScriptContent(getFormValues())], { type: 'text/javascript' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'auto-consulado-francia.user.js';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast('Descargando script...');
});

// Render inicial
updatePreview();
