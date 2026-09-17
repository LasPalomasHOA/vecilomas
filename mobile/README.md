# 📱 Las Palomas Resort — App Móvil (Expo Go & APK)

Contenedor nativo móvil para **Las Palomas Resort & Residences**, listo para previsualización en tiempo real mediante **Expo Go** y compilación de archivo instalable **`.apk`** para Android con **EAS Build**.

---

## 🚀 1. Previsualizar en tu Teléfono con Expo Go

### Paso A: Instalar Expo Go en tu Celular
- **Android**: Descarga [Expo Go en Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent).
- **iOS**: Descarga [Expo Go en Apple App Store](https://apps.apple.com/app/expo-go/id982107779).

### Paso B: Iniciar el servidor móvil
1. Asegúrate de que el servidor web principal esté corriendo (`npm run dev`).
2. Abre una terminal y navega a la carpeta `mobile`:
   ```bash
   cd mobile
   npm install
   npx expo start
   ```
3. Aparecerá un **código QR grande** en tu terminal.
4. **Escanea el código QR**:
   - En **Android**: Abre la app Expo Go y presiona **"Scan QR code"**.
   - En **iOS**: Abre la app Cámara de tu iPhone y toca la notificación de Expo Go.
5. ¡Listo! La aplicación se cargará en tu teléfono con soporte nativo.

> **Nota de red**: Asegúrate de que tu computadora y tu celular estén conectados a la misma red Wi-Fi (ej. `192.168.1.174`).

---

## 📦 2. Generar el archivo instalable APK para Android

Para generar un archivo **`.apk`** instalable directamente en cualquier teléfono Android (sin necesidad de subirlo a Google Play):

1. Instala el CLI de EAS de Expo de forma global:
   ```bash
   npm install -g eas-cli
   ```
2. Inicia sesión en tu cuenta gratuita de Expo:
   ```bash
   eas login
   ```
3. Configura el proyecto en tu cuenta de Expo (solo la primera vez):
   ```bash
   cd mobile
   eas build:configure
   ```
4. Genera el APK:
   ```bash
   eas build -p android --profile preview
   ```
5. Al terminar la compilación en la nube de Expo, te proporcionará un enlace directo para descargar el archivo `.apk` e instalarlo en tu dispositivo Android.
