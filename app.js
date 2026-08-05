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
// @name         Auto-completar Turno Consulado Francia
// @namespace    http://tampermonkey.net/
// @version      1.2
// @description  Completa el formulario de turno automáticamente
// @match        https://consulat.gouv.fr/*
// @match        https://*.consulat.gouv.fr/*
// @match        https://*vvt-simulator.vercel.app/*
// @include      *consulat.gouv.fr*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function() {
    'use strict';

    // === TUS DATOS ===
    const datos = {
        apellido: '${values.apellido}',
        nombre: '${values.nombre}',
        email: '${values.email}',
        codigoPais: '${values.codigoPais}',
        telefono: '${values.telefono}',
        fechaNacimiento: '${fechaFormatted}'
    };
    // =================

    function disparar(el, eventos = ['input', 'change', 'blur']) {
        eventos.forEach(ev => el.dispatchEvent(new Event(ev, { bubbles: true })));
    }

    function setValor(el, valor) {
        if (!el) return false;
        // Para inputs controlados por frameworks (Vue/React), seteamos así:
        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set
                    || Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value')?.set
                    || Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')?.set;
        if (setter) setter.call(el, valor);
        else el.value = valor;
        disparar(el);
        return true;
    }

    function esperarElemento(selector, timeout = 10000) {
        return new Promise((resolve, reject) => {
            const existente = document.querySelector(selector);
            if (existente) return resolve(existente);
            const inicio = Date.now();
            const intervalo = setInterval(() => {
                const el = document.querySelector(selector);
                if (el) {
                    clearInterval(intervalo);
                    resolve(el);
                } else if (Date.now() - inicio > timeout) {
                    clearInterval(intervalo);
                    reject(new Error('Timeout: ' + selector));
                }
            }, 50);
        });
    }

    function getById(id) { return document.getElementById(id); }

    async function autocompletar() {
        console.log('⚡ Iniciando autocompletado...');
        const t0 = performance.now();

        try {
            // Detectar si estamos en el simulador o en la página real
            const esSimulador = !!getById('nombre1');

            if (esSimulador) {
                // === SIMULADOR ===
                await esperarElemento('#nombre1');
                setValor(getById('nombre1'), datos.apellido);
                setValor(getById('nombre2'), datos.nombre);
                setValor(getById('email1'), datos.email);
                setValor(getById('email2'), datos.email);
                setValor(getById('phoneCode'), datos.codigoPais);
                setValor(getById('telefono'), datos.telefono);
                setValor(getById('nacimiento'), datos.fechaNacimiento);
                const slot = document.querySelector('.slot-button:not(.selected)');
                if (slot) slot.click();
                const mailSi = document.querySelector('input[name="mailVerif"][value="si"]');
                if (mailSi) { mailSi.checked = true; disparar(mailSi); }
                const fv = document.querySelector('input[name="franceVisas"][value="entiendo"]');
                if (fv) { fv.checked = true; disparar(fv); }
                setValor(getById('entiendoSelect'), 'entiendo');

            } else {
                // === PÁGINA REAL DEL CONSULADO ===
                await esperarElemento('#lastname');
                setValor(getById('lastname'), datos.apellido);
                setValor(getById('firstname'), datos.nombre);
                setValor(getById('email'), datos.email);
                setValor(getById('email-confirm'), datos.email);
                setValor(getById('phone-country-selector'), datos.codigoPais);
                setValor(getById('phone'), datos.telefono);
                setValor(getById('birthdate'), datos.fechaNacimiento);

                // Turno: primer checkbox de slot disponible
                const slot = document.querySelector('input[type="checkbox"][id^="slot-"]:not(:checked):not(:disabled)');
                if (slot) {
                    slot.checked = true;
                    slot.click(); // por si el click activa la lógica
                    disparar(slot);
                    console.log('✅ Turno seleccionado:', slot.id);
                } else {
                    console.warn('⚠️ No hay turnos disponibles');
                }

                // Selects con id dinámico (terminan en "-service-0")
                document.querySelectorAll('select[id$="-service-0"]').forEach(sel => {
                    // Buscamos la opción "Entiendo" o la primera no vacía
                    const opcion = Array.from(sel.options).find(o =>
                        /entiendo/i.test(o.textContent) || (o.value && o.value !== '')
                    );
                    if (opcion) {
                        setValor(sel, opcion.value);
                        console.log('✅ Select completado:', sel.id, '→', opcion.textContent);
                    }
                });

                // Radios con id dinámico (__BVID__): seleccionamos el PRIMERO de cada grupo
                const gruposRadio = new Set();
                document.querySelectorAll('input[type="radio"][id^="__BVID__"]').forEach(r => {
                    if (!gruposRadio.has(r.name)) {
                        gruposRadio.add(r.name);
                        r.checked = true;
                        r.click();
                        disparar(r);
                        console.log('✅ Radio marcado:', r.id, 'grupo:', r.name);
                    }
                });

                // Inputs de texto con id dinámico (probable: campo "Entiendo" tipeable)
                document.querySelectorAll('input[type="text"][id$="-service-0"]').forEach(inp => {
                    setValor(inp, 'Entiendo');
                    console.log('✅ Input texto:', inp.id);
                });
            }

            const t1 = performance.now();
            console.log(\`✅ Completado en \${(t1-t0).toFixed(0)}ms\`);

            // ⚠️ DESCOMENTAR cuando confirmes que llena bien:
            // const submit = document.querySelector('button[type="submit"], .submit-btn');
            // if (submit) submit.click();

        } catch(e) {
            console.error('❌ Error:', e.message);
        }
    }

    function agregarBoton() {
        if (document.getElementById('btn-auto-vvt')) return;
        const btn = document.createElement('button');
        btn.id = 'btn-auto-vvt';
        btn.textContent = '⚡ AUTO-COMPLETAR';
        btn.style.cssText = 'position:fixed;bottom:20px;right:20px;z-index:99999;background:#c8102e;color:white;border:none;padding:15px 25px;border-radius:30px;font-size:16px;font-weight:bold;cursor:pointer;box-shadow:0 4px 12px rgba(0,0,0,0.3);';
        btn.onclick = autocompletar;
        document.body.appendChild(btn);
    }

    if (document.body) agregarBoton();
    else document.addEventListener('DOMContentLoaded', agregarBoton);

    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.code === 'Space') {
            e.preventDefault();
            autocompletar();
        }
    });

    console.log('🟢 Script cargado en:', window.location.href);
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
