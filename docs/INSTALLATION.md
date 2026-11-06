# Guía de Instalación y Configuración — Argon Bridge

Esta guía describe los requisitos y pasos para instalar y verificar Argon Bridge en entornos Linux (Mint, Ubuntu, Debian, Fedora, Arch).

---

## 1. Requisitos Previos

1. **Sistema Operativo:** Linux x86_64 o ARM64.
2. **Node.js:** Versión 22.5.0+ o versión 24.x+ (recomendado Node.js 24 para soporte nativo de `node:sqlite`).
3. **npm:** Versión 10+ u 11+.
4. **Navegador:** Google Chrome o Chromium.
5. **Google Antigravity:** Instalado en el sistema con soporte MCP (`~/.gemini/config/mcp_config.json`).

---

## 2. Instalación en Un Paso (Sin permisos Root)

Ejecuta el script de instalación automatizado:

```bash
cd /home/darwinsin/argon-bridge
bash scripts/install-linux.sh
```

El instalador realiza las siguientes acciones:
1. Comprueba la versión de Node.js y la disponibilidad de `node:sqlite`.
2. Instala dependencias npm requeridas.
3. Compila el código fuente TypeScript en `dist/`.
4. Crea la carpeta de almacenamiento de base de datos en `~/.argon-bridge/`.
5. Registra el manifiesto de Native Messaging en:
   `~/.config/google-chrome/NativeMessagingHosts/com.darwinsin.argon_bridge.json`
6. Registra el servidor MCP en `~/.gemini/config/mcp_config.json`.
7. Enlaza el CLI `argon-cli` en `~/.local/bin/argon-cli`.
8. Ejecuta el diagnóstico de verificación.

---

## 3. Instalación de la Extensión en Google Chrome

1. Abre Google Chrome y ve a `chrome://extensions/`.
2. Activa el modo de desarrollador con el interruptor en la esquina superior derecha.
3. Haz clic en **Cargar descomprimida** (Load unpacked).
4. Selecciona la carpeta:
   `/home/darwinsin/argon-bridge/extension`
5. Abre el icono de la extensión en la barra de herramientas de Chrome para confirmar que el estado muestra:
   `Conectado (v1.0.0)` en verde.

---

## 4. Verificación de Antigravity MCP

Para verificar que Antigravity reconoce Argon Bridge:
1. Abre o reinicia Google Antigravity.
2. Las 14 herramientas que comienzan con `argon_` estarán listadas en los servidores MCP disponibles.
3. Puedes ejecutar desde Antigravity:
   - `argon_status` con el ID de tu proyecto.
   - `argon_create_project` para inicializar un nuevo proyecto.

---

## 5. Diagnóstico y Comprobación del Sistema

Para ejecutar un chequeo en cualquier momento:

```bash
bash scripts/doctor.sh
# o también:
argon-cli doctor
```

---

## 6. Desinstalación

Para desinstalar de forma limpia:

```bash
bash scripts/uninstall-linux.sh
```

El desinstalador conserva la base de datos de proyectos (`~/.argon-bridge`) a menos que el usuario confirme explícitamente su eliminación.
