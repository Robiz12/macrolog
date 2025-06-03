# CoachAI - Deployment Guide

Die App wurde erfolgreich als PWA gebaut! Hier sind deine Optionen für das Deployment:

## 🚀 Sofort verfügbar (lokal testen)

Die App läuft bereits lokal auf: **http://localhost:8080**

Du kannst sie sofort auf deinem Handy testen:
1. Gehe zu `http://[deine-ip]:8080` auf deinem Handy
2. In Safari/Chrome: "Zum Homescreen hinzufügen"
3. Die App wird wie eine native App installiert!

## 📱 PWA Installation

### iPhone (Safari):
1. Öffne die App im Browser
2. Tippe auf das Teilen-Symbol
3. Wähle "Zum Home-Bildschirm" 
4. Die App wird als Icon auf dem Homescreen installiert

### Android (Chrome):
1. Öffne die App im Browser  
2. Tippe auf die drei Punkte (Menü)
3. Wähle "App installieren" oder "Zum Startbildschirm hinzufügen"

## 🌐 Online Deployment Optionen

### Option 1: Vercel (Empfohlen)
```bash
# Terminal im Projektordner:
npx vercel --prod
# Folge den Anweisungen, wähle GitHub Account
```

### Option 2: Netlify
```bash
# Im dist/ Ordner:
npx netlify deploy --prod --dir .
```

### Option 3: GitHub Pages
1. Erstelle ein neues Repository auf GitHub
2. Pushe den Code:
```bash
git remote add origin https://github.com/DEIN_USERNAME/coachai.git
git push -u origin main
```
3. In GitHub Settings → Pages → Deploy from branch `main`

### Option 4: Surge.sh (Einfachste Option)
```bash
# Im dist/ Ordner:
npx surge . dein-app-name.surge.sh
```

## 📦 Build Info

- ✅ PWA-optimiert mit Service Worker
- ✅ Offline-Funktionalität
- ✅ App-Manifest für native Installation
- ✅ Responsive Design für mobile Geräte
- ✅ Dark Theme optimiert

## 📱 Features der PWA

- **Offline-Nutzung**: App funktioniert ohne Internet
- **Push-Benachrichtigungen**: Bereit für Erinnerungen
- **Native App-Gefühl**: Vollbild-Modus ohne Browser-UI
- **Schnelle Installation**: Direkt vom Browser installierbar
- **Background-Sync**: Daten werden synchronisiert wenn online

Die App ist production-ready und kann sofort verwendet werden! 🎉 