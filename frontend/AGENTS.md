# 🤖 Agent Developer Guidelines — Pyari Pari Frontend

> [!IMPORTANT]
> This is an **Expo SDK 58 / React Native 0.88** mobile application. Always prioritize mobile-first design patterns, 60fps gesture performance, and strict TypeScript types.

---

## ⚠️ Modern Expo Guidelines (Do Not Rely on Outdated Training Data)

Expo evolves rapidly across major releases. APIs, lifecycle hooks, and configuration options change frequently. Before writing code touching Expo, React Native, or EAS APIs:

1. **Verify the SDK Version**: Check the `"expo"` version in `package.json` (`~58.0.21`).
2. **Consult Official Versioned Docs**: Refer to `https://docs.expo.dev/versions/v58.0.0/`.
3. **Check LLMs Index**: Review [Expo LLMs Reference](https://docs.expo.dev/llms.txt) for documented corrections to common AI hallucinations. Always verify APIs against official documentation rather than generating from memory.

---

## 🛠️ Essential Commands

> [!TIP]
> If a `bun.lock` file is present, use `bunx` instead of `npx`. Otherwise, use standard `npx` / `npm`.

```bash
# Package Installation (ALWAYS use expo install to resolve SDK-compatible peer versions)
npx expo install <package-name>

# Development Server
npx expo start

# Verification & Diagnostics (Run before declaring any task complete)
npm run lint         # npx expo lint
npm run typecheck    # tsc --noEmit
npx expo-doctor      # Diagnose configuration and dependency conflicts
npx expo install --fix # Align mismatched package versions
```

---

## 🧭 Navigation & Routing (Expo Router)

* **File-Based Routing**: All screens and route layouts live exclusively under `src/app/`.
  * Every `.tsx` file in `src/app/` represents a route.
  * `_layout.tsx` files define root navigators, providers, or tab wrappers.
* **Separation of Concerns**: Keep non-route logic (custom hooks, UI components, business logic, state stores) strictly outside `src/app/` inside `src/features/`, `src/components/`, or `src/services/`.
* **Navigation Utilities**: Import `Link`, `router`, and `useLocalSearchParams` directly from `expo-router`.
* **Documentation**: See [Expo Router Documentation](https://docs.expo.dev/router/introduction/).

---

## 📦 Native Builds & CNG (Continuous Native Generation)

* **Config Plugins & App Config**:
  * Native behavior must be declared in `app.json` and via Expo Config Plugins whenever possible.
  * If native changes are required, avoid manual edits to `android/` or `ios/` unless directly troubleshooting prebuild outputs.
* **Native Modules & Development Builds**:
  * Libraries with custom native code (e.g. `expo-audio`, `@shopify/react-native-skia`) cannot run inside bare Expo Go.
  * Always test with a development build:
    ```bash
    npx expo run:android   # or npx expo run:ios
    ```
* **Cloud Builds via EAS**:
  * Use EAS Build for cloud signing and packaging: `npx eas-cli@latest build --profile development`.
  * Documentation: [EAS Build Guide](https://docs.expo.dev/eas/index.md).

---

## 📐 Architecture & Coding Standards

1. **Strict i18n Typing**: Every user-facing UI string must be sourced through `useStrings()` from [`src/i18n/strings/`](src/i18n/strings/). The string interface is strictly typed; missing translations in any of the 11 supported languages will fail TypeScript compilation.
2. **Financial Units**:
   * Internal frontend states and UI formats deal with paise / rupees cleanly. Convert backend response types via [`src/services/`](src/services/).
3. **Verification**: Always execute `npm run typecheck` and `npm run lint` before committing any code changes.
