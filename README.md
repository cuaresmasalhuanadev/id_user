# 🛒 Biegs Frits Store

App full-stack para **Biegs Frits Store** — Tienda pública + Panel Administrador.

**Stack:** Angular 17 · Node.js (Express) · MongoDB Atlas · Nginx  
**Docker Hub:** `cuaresmasalhuanadev/biegsfrits-store:latest`  
**Puerto público:** `8084`

---

## 🚀 Despliegue en Koyeb desde Docker Hub

### 1. Construir y subir imagen

```bash
# Desde la raíz del proyecto
docker build -t cuaresmasalhuanadev/biegsfrits-store:latest .

# Subir a Docker Hub
docker login
docker push cuaresmasalhuanadev/biegsfrits-store:latest
```

### 2. Variables de entorno en Koyeb

En el panel de Koyeb, configura estas variables de entorno:

| Variable | Valor |
|----------|-------|
| `MONGODB_URI` | `mongodb+srv://victorcuaresmadevs:victorcuaresmadevs@victorcuaresmadevs.twwwqv6.mongodb.net/biegsfritsstore?retryWrites=true&w=majority&appName=victorcuaresmadevs` |
| `JWT_SECRET` | `biegsfritsstore-super-secret-key-2026-lima-peru-v1` |
| `PORT` | `3000` |
| `ADMIN_EMAIL` | `peabodycuaresmasalhuana@yahoo.com` |
| `ADMIN_WHATSAPP` | `+51917360503` |
| `ADMIN_REFERRAL_CODE` | `2026@Body26feb` |

### 3. Configurar servicio en Koyeb

- **Source:** Docker Hub → `cuaresmasalhuanadev/biegsfrits-store:latest`
- **Puerto expuesto:** `8084`
- **Health check:** `GET /health`

---

## 🧪 Prueba local

```bash
# Copia y edita variables de entorno
cp backend-node/.env.example backend-node/.env

# Levanta con docker-compose
docker-compose up --build

# Abre en el navegador
http://localhost:8084        # Tienda pública
http://localhost:8084/admin  # Panel admin
```

---

## 📁 Estructura

```
id_user/
├── frontend/           # Angular 17 app
├── backend-node/       # Node.js Express API (puerto 3000)
├── nginx.conf          # Nginx proxy (puerto 8084 → 3000)
├── docker-entrypoint.sh
├── Dockerfile          # Imagen única para Docker Hub
└── docker-compose.yml  # Para pruebas locales
```

---

## 🔐 Credenciales Admin

| Campo | Valor |
|-------|-------|
| Email | `peabodycuaresmasalhuana@yahoo.com` |
| WhatsApp | `+51917360503` |
| Código referido | `2026@Body26feb` |

---

## 📱 WhatsApp soportados

`+51` PE · `+1` USA · `+52` MX · `+54` AR · `+55` BR · `+56` CL · `+57` CO · `+58` VE · `+591` BO · `+593` EC · `+595` PY · `+598` UY