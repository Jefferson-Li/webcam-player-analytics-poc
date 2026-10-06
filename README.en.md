# Webcam Player Analytics POC

Webcam mini-games frontend plus an anonymous analytics admin dashboard (demographics, playtime, daily users, attempt counts).

中文版：[README.md](./README.md)

## Features

| Path | Description |
|------|-------------|
| `/` | Landing / navigation |
| `/play` | **Face Catch**: catch stars with your face; **Emotion Match**: follow expression prompts |
| `/admin` | Charts: most time spent, most attempts, daily users, gender / age / expressions |
| `/api/sessions` | Session API (in-memory; cleared on process/container restart) |

Each round uploads: `gameId`, anonymous `playerId`, age/gender/expression estimates, score, and `durationMs`.

## Privacy

- Face inference runs in the **browser** (`@vladmandic/face-api`)
- **No video or photos** are uploaded — only anonymous stats
- `playerId` lives in browser `localStorage` for daily-active estimates only — not real identity
- Model output is approximate and for **POC / demo use only** — not identity verification

## Accuracy tips

The pipeline uses landmark alignment, higher resolution, EMA smoothing, and outlier filtering. For best results:

- Face the camera with good lighting
- Keep your face roughly ≥ 25% of the frame
- Avoid extreme profiles, backlight, masks, or sunglasses

## Local development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

```bash
npm run build   # uses webpack (see package.json)
npm start
```

## Docker

```bash
docker compose up --build
```

- Player: http://localhost:3000/play  
- Admin: http://localhost:3000/admin  

Stop with `docker compose down`.

Use `http://localhost:3000` in the browser (secure context) for camera access. Do not test webcam over insecure non-localhost HTTP.

## Model weights

The **`.bin` weights and manifests under `public/models/` do not need to be committed** (they are gitignored).  
They are copied from `@vladmandic/face-api` on install / build:

```bash
npm install          # postinstall → copy:models
npm run copy:models  # sync manually
```

Required nets: `tiny_face_detector`, `face_landmark_68`, `age_gender`, `face_expression`.

## Security / Git

Do not commit secrets, PII, recordings, or session dumps. `.gitignore` already excludes, among others:

- Env files: `.env`, `.env.*` (keeps `.env.example`)
- Credentials / keys: `*.pem`, `*.key`, `credentials*.json`, `service-account*.json`
- Media / face captures: `*.webm`, `*.mp4`, `captures/`, `recordings/`, face image dumps, etc.
- Analytics exports: `sessions*.json`, `analytics*.json`, `*.csv`, DB files

Copy `.env.example` to `.env.local` for local overrides — never commit real secrets.
