# EDGEmessage v0.1

Production-oriented Android messenger relay over GitHub Gists.

## Features
- First run: create Master Password.
- Next runs: always require login with Master Password.
- AES-256 encryption with key derived from any custom seed string via SHA-256.
- Contacts stored locally in encrypted SQLite.
- Direct HTTPS GitHub Gist relay (no middle servers).
- 2G/EDGE mode reduces polling frequency.
- UI built with React Native `StyleSheet.create` only.

## Build APK
```bash
npm install
npm run assembleRelease
```

Release artifact path after build:
`android/app/build/outputs/apk/release/app-release.apk`
