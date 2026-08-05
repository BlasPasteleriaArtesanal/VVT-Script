# Generador de Script Auto-Consulado Francia (VVT)

Aplicación web interactiva para configurar y generar automáticamente Userscripts (`.user.js`) compatibles con **Tampermonkey** y **Violentmonkey**, diseñados para autocompletar formularios de turnos y solicitud de visados en los portales consulares de Francia.

## 🚀 Características
- **Edición en tiempo real**: Configura tu apellido, nombre, email, teléfono y fecha de nacimiento.
- **Formato dinámico de objeto**: Exportación en formato `const datos = { ... }` con fecha en formato `DD/MM/YYYY`.
- **Descarga & Copiado rápido**: Botón para descargar el archivo `.user.js` o copiar el código directamente al portapapeles.
- **Interfaz sobria y limpia**: Tema oscuro slate sin distracciones.

## 📄 Archivos del Proyecto
- `index.html`: Estructura e interfaz principal de la aplicación.
- `styles.css`: Estilos visuales adaptables y tema oscuro slate.
- `app.js`: Lógica de interacción y generador de código userscript.

## 💻 Uso Local
Puedes abrir directamente `index.html` en cualquier navegador web o servir el proyecto con un servidor local:

```bash
python -m http.server 8000
```
Navega a `http://localhost:8000`.
