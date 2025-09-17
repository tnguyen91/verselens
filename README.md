# VerseLens

A Bible reading app (Expo / React Native), inspired by the YouVersion Bible App, featuring fast navigation, bookmarking, search, and translation exploration with dictionary integration.

## Features
- Bible reader with book/chapter navigation
- Book selection & translation modals  
- Verse component with styling
- Word definition modal with dictionary lookup (WordNet & Merriam-Webster)
- Bookmarks screen (persisted via AsyncStorage)
- Search screen (text lookup)
- Settings (theme / translation mode contexts)

## Tech Stack
- **Mobile**: Expo / React Native with TypeScript
- **Storage**: AsyncStorage for local data persistence
- **Dictionary API**: FastAPI backend with WordNet & Merriam-Webster
- **Deployment**: EAS configuration + Vercel for web builds

## Project Structure
```
.
├── README.md
├── app/                          # Main Expo/React Native application
│   ├── app.json
│   ├── eas.json
│   ├── package.json
│   ├── tsconfig.json
│   ├── metro.config.js
│   ├── vercel.json              # Web deployment config
│   ├── index.ts
│   ├── App.tsx
│   ├── assets/
│   │   ├── adaptive-icon.png
│   │   ├── favicon.png
│   │   ├── icon.png
│   │   ├── splash-icon.png
│   │   └── fonts/
│   │       └── times.ttf
│   └── src/
│       ├── VerseLensApp.tsx
│       ├── components/
│       │   ├── BibleHeader.tsx
│       │   ├── BibleNavigation.tsx
│       │   ├── BibleVerse.tsx
│       │   ├── BookSelectionModal.tsx
│       │   ├── TabNavigator.tsx
│       │   ├── TranslationModal.tsx
│       │   └── WordDefinitionModal.tsx
│       ├── contexts/
│       │   ├── BibleContext.tsx
│       │   ├── ThemeContext.tsx
│       │   ├── TranslationModeContext.tsx
│       │   └── UserDataContext.tsx
│       ├── screens/ 
│       │   ├── BibleReader.tsx
│       │   ├── Bookmarks.tsx
│       │   ├── Search.tsx
│       │   └── Settings.tsx
│       ├── services/
│       │   ├── BibleDataService.ts
│       │   └── DictionaryService.ts    # Dictionary API integration
│       ├── types/
│       │   └── bible.ts
│       └── utils/
│           └── alert.ts
├── dictionary-api/              # FastAPI dictionary backend
│   ├── main.py
│   ├── wordnet_service.py
│   ├── merriam_service.py
│   ├── requirements.txt
│   └── .env.example
└── verselens-dictionary/        # Future dictionary data
```

## Prerequisites
- Node.js (LTS recommended)
- npm (bundled with Node)
- Mobile device with Expo Go installed (iOS App Store / Google Play) for development

## Install
```bash
cd app
npm install
```

## Run (Mobile Development)
```bash
cd app
npm start        # Starts Expo dev server
# or force tunnel for network access
npx expo start --tunnel
```
Open the QR code with the Camera app or Expo Go on your mobile device.

## Run (Web Development)  
```bash
cd app
npm run web      # Starts web version
```

## Dictionary API (Optional Local Setup)
The app uses a deployed dictionary API, but for local development:

```bash
cd dictionary-api
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env      # Add your Merriam-Webster API key
python main.py            # Runs on http://localhost:8000
```

## Deployment
- **Web**: [https://verselens.vercel.app/](https://verselens.vercel.app/) - Deploy to Vercel using `app/vercel.json` configuration
- **Dictionary API**: [verselens-dictionary-production.up.railway.app](https://verselens-dictionary-production.up.railway.app/)

## Acknowledgments
- **Bible Text Data**: [jadenzaleski/BibleTranslations](https://github.com/jadenzaleski/BibleTranslations) - Multiple Bible translations in JSON format
- **Dictionary Services**: 
  - [WordNet](https://wordnet.princeton.edu/) via [NLTK](https://www.nltk.org/) - Lexical database for English
  - [Merriam-Webster Dictionary API](https://dictionaryapi.com/) - Pronunciation and definitions
---
