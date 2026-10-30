import '@expo/metro-runtime';

import { LoadSkiaWeb } from '@shopify/react-native-skia/lib/module/web';
import { App } from 'expo-router/build/qualified-entry';
import { renderRootComponent } from 'expo-router/build/renderRootComponent';

// Skia reads the CanvasKit global when it is first imported, so routes must not
// render until the WebAssembly module (copied to public/ on install) is ready.
void LoadSkiaWeb({ locateFile: (file: string) => `/${file}` }).then(() => {
  renderRootComponent(App);
});
