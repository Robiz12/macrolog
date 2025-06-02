# 🚀 CoachAI - Intelligente Fitness & Ernährungs PWA

Eine moderne, Apple-inspirierte Progressive Web App für personalisiertes Fitness- und Ernährungs-Coaching.

## ✨ Features

### 🎯 Kern-Funktionalitäten
- **Progressive Web App** mit Offline-Funktionalität
- **Apple-inspiriertes Dark Mode Design** - glatt, modern, responsiv
- **Personalisierte Ziele** - automatisch berechnete Kalorien- und Makro-Ziele
- **Intelligenter Coach** - KI-gestützte Empfehlungen
- **Tages-Management** - Training/Ruhe/Fasten-Tage
- **Flexible Mahlzeiten-Planung** - optimale Makro-Verteilung

### 🔥 Design-Highlights
- **Apple-like Animationen** mit Framer Motion
- **Glassmorphism Effekte** und subtile Schatten
- **Smooth Transitions** und Micro-Interactions
- **Mobile-First** responsive Design
- **Safe Area** Unterstützung für moderne Geräte

## 🛠 Tech Stack

- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS mit Apple Design Tokens
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **PWA**: Vite PWA Plugin
- **Routing**: React Router DOM

## 🚀 Getting Started

### Installation

```bash
# Dependencies installieren
npm install

# Development Server starten
npm run dev

# Für Production builden
npm run build

# Preview des Builds
npm run preview
```

### PWA Features

Die App unterstützt:
- ✅ Installation als native App
- ✅ Offline-Funktionalität
- ✅ Service Worker Auto-Update
- ✅ Apple Touch Icons
- ✅ Splash Screens

## 📱 Entwicklungs-Roadmap

### ✅ Phase 1: Foundation (Aktuell)
- [x] PWA Setup & Konfiguration
- [x] Apple-inspired Design System
- [x] Basis-Komponenten & Layouts
- [x] Welcome Screen mit Animationen
- [x] Dashboard Grundstruktur

### 🚧 Phase 2: Core Features (Nächste)
- [ ] Umfassendes Onboarding
- [ ] Personalisierte Datenerfassung
- [ ] Tag-Management System
- [ ] Makro-Berechnungen

### 🔮 Phase 3: Intelligence
- [ ] Mahlzeiten-Planungs-Engine
- [ ] Training-optimierte Timing
- [ ] Supplement-Tracking
- [ ] GPT-4o Integration

### 🎨 Phase 4: Polish
- [ ] Advanced Animationen
- [ ] Daten-Export/Import
- [ ] Push Notifications
- [ ] Cloudflare Deployment

## 🎨 Design Philosophy

### Apple-Inspired Prinzipien
- **Clarity**: Klare Hierarchie und Lesbarkeit
- **Consistency**: Einheitliche Interaktionsmuster
- **Depth**: Schichtung durch Schatten und Blur
- **Accessibility**: Optimiert für alle Nutzer

### Farb-Palette
```css
/* Dark Theme */
--primary: #000000
--secondary: #1c1c1e
--tertiary: #2c2c2e
--accent: #007AFF
--success: #30D158
--warning: #FF9F0A
--error: #FF453A
```

## 📁 Projekt-Struktur

```
src/
├── components/          # React Components
│   ├── screens/        # Haupt-Screens
│   ├── onboarding/     # Onboarding Flow
│   └── ui/             # Basis UI Components
├── hooks/              # Custom React Hooks
├── utils/              # Utility Functions
├── stores/             # State Management
└── types/              # TypeScript Definitionen
```

## 🚀 Deployment

### Cloudflare Pages (Empfohlen)
```bash
# Build erstellen
npm run build

# Dist Ordner zu Cloudflare Pages deployen
```

### Alternative Deployments
- Vercel
- Netlify
- GitHub Pages

## 🧩 Geplante Integrationen

- **GPT-4o API** - Intelligente Empfehlungen
- **Health Kit** - iOS Health Daten Sync
- **Notifications API** - Push Benachrichtigungen
- **Camera API** - Barcode Scanning für Lebensmittel

## 🤝 Contributing

Das Projekt befindet sich in aktiver Entwicklung. Feedback und Verbesserungsvorschläge sind willkommen!

## 📄 License

Private Project - All Rights Reserved

---

**Gebaut mit ❤️ und modernen Web-Technologien** 