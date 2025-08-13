# VerseLens

A Bible reading app (Expo / React Native), inspired by the YouVersion Bible App, featuring fast navigation, bookmarking, search, and word/translation exploration.

## Features
- Bible reader with book/chapter navigation
- Book selection & translation modals
- Verse component with styling
- Word definition modal (lexical lookup UI)
- Bookmarks screen (persisted via AsyncStorage)
- Search screen (text lookup)
- Settings (theme / translation mode contexts)

## Tech Stack
- Expo / React Native
- TypeScript
- React Navigation (bottom tabs)
- AsyncStorage for local data
- EAS configuration prepared (for future builds)

## Project Structure
```
.
├── README.md
├── start-verselens-tmux.sh
└── app
  ├── app.json
  ├── eas.json
  ├── package.json
  ├── tsconfig.json
  ├── metro.config.js
  ├── index.ts
  ├── App.tsx
  ├── assets
  │   ├── adaptive-icon.png
  │   ├── favicon.png
  │   ├── icon.png
  │   ├── splash-icon.png
  │   └── fonts
  │       └── times.ttf
  └── src
    ├── VerseLensApp.tsx
    ├── components
    │   ├── BibleHeader.tsx
    │   ├── BibleNavigation.tsx
    │   ├── BibleVerse.tsx
    │   ├── BookSelectionModal.tsx
    │   ├── TabNavigator.tsx
    │   ├── TranslationModal.tsx
    │   └── WordDefinitionModal.tsx
    ├── contexts
    │   ├── BibleContext.tsx
    │   ├── ThemeContext.tsx
    │   ├── TranslationModeContext.tsx
    │   └── UserDataContext.tsx
    ├── screens 
    │   ├── BibleReader.tsx
    │   ├── Bookmarks.tsx
    │   ├── Search.tsx
    │   └── Settings.tsx
    ├── services
    │   └── BibleDataService.ts
    └── types
      └── bible.ts
```

## Prerequisites
- Node.js (LTS recommended)
- npm (bundled with Node)
- An iPhone with Expo Go installed (App Store) for development

## Install
```bash
cd app
npm install
```

## Run (standard)
```bash
npm start        # Starts Expo dev server
# or force tunnel
npx expo start --tunnel
```
Open the QR code with the Camera (or Expo Go) on your iPhone.

## Quick Start Script
A helper script exists at repository root:
```bash
./start-verselens-tmux.sh
```
This launches the dev server inside a `tmux` session named `verselens`.
- Attach: `tmux attach -t verselens`
- Detach: Ctrl+B then D
- Stop: `tmux kill-session -t verselens`
---
