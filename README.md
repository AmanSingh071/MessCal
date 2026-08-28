# 🍽️ MessCal

> **Your mess menu, directly in your calendar.**

🌐 **Live website:** https://messcal.vercel.app

MessCal turns a monthly college mess-menu PDF into a clean, date-based calendar. Students can upload and review their menu, search for dishes, preview the month, and send meals directly to a dedicated **Mess Menu** calendar in Google Calendar.

## ✨ Features

- 📄 Monthly PDF upload
- 🤖 AI-assisted menu extraction
- ✏️ Review and edit extracted meals
- 📅 Automatic weekday-to-date mapping
- 🗓️ Monthly calendar preview
- 🔎 **Food search** — find when a dish is served during the month
- 🔐 Google OAuth and Google Calendar sync
- 📱 Works with the Google Calendar mobile app
- 📥 `.ics` calendar export
- 🗑️ Remove the dedicated Mess Menu calendar
- 🔌 Disconnect Google Calendar
- 🌙 **Dark-mode interface**
- ☁️ Vercel deployment

## 🛠️ Tech stack

- Frontend: HTML, CSS, JavaScript
- Backend: Node.js + Express
- PDF processing: `pdf-parse`
- AI extraction: Anthropic Claude API (optional)
- Calendar: Google Calendar API + OAuth 2.0
- Deployment: Vercel

## 🚀 Run locally

```bash
npm install
npm start
```

Open `http://localhost:3000`.

For local Google Calendar testing, copy `.env.example` to `.env` and configure the required OAuth values and `SESSION_SECRET`.

## 🔐 Security

Never commit `.env` or real API keys. Use Vercel Environment Variables for production credentials.

## 🌐 Live demo

**https://messcal.vercel.app**

## 👤 Author

**Aman Singh** — `AmanSingh071`
