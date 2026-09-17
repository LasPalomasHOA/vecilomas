import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  BackHandler,
  SafeAreaView,
  Platform,
  StatusBar,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';

// Default URL points to the running local Vite server
const DEFAULT_URL = 'http://192.168.1.174:8443';

export default function App() {
  const [url, setUrl] = useState(DEFAULT_URL);
  const [inputUrl, setInputUrl] = useState(DEFAULT_URL);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [canGoBack, setCanGoBack] = useState(false);
  const [showConfig, setShowConfig] = useState(false);

  const webViewRef = useRef<WebView>(null);

  // Handle hardware back button on Android to navigate back inside WebView
  useEffect(() => {
    if (Platform.OS === 'android') {
      const onBackPress = () => {
        if (canGoBack && webViewRef.current) {
          webViewRef.current.goBack();
          return true;
        }
        return false;
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }
  }, [canGoBack]);

  function handleReload() {
    setError(false);
    setLoading(true);
    webViewRef.current?.reload();
  }

  function handleApplyUrl() {
    let cleanUrl = inputUrl.trim();
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      cleanUrl = `http://${cleanUrl}`;
    }
    setUrl(cleanUrl);
    setShowConfig(false);
    setError(false);
    setLoading(true);
  }

  return (
    <SafeAreaView style={styles.container}>
      <ExpoStatusBar style="light" backgroundColor="#003333" />

      {/* Main WebView */}
      <View style={styles.webContainer}>
        <WebView
          ref={webViewRef}
          source={{ uri: url }}
          style={styles.webview}
          onNavigationStateChange={(navState: any) => setCanGoBack(navState.canGoBack)}
          onLoadStart={() => {
            setLoading(true);
            setError(false);
          }}
          onLoadEnd={() => setLoading(false)}
          onError={() => {
            setLoading(false);
            setError(true);
          }}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          allowsBackForwardNavigationGestures={true}
          cacheEnabled={true}
          startInLoadingState={true}
          renderLoading={() => (
            <View style={styles.loaderContainer}>
              <ActivityIndicator size="large" color="#008080" />
              <Text style={styles.loadingText}>Cargando Las Palomas Resort...</Text>
            </View>
          )}
        />
      </View>

      {/* Floating Network/Settings Toggle Button */}
      {error && (
        <View style={styles.errorOverlay}>
          <View style={styles.errorCard}>
            <Text style={styles.errorTitle}>No se pudo conectar al servidor</Text>
            <Text style={styles.errorSubtitle}>
              Asegúrate de que la computadora y el celular estén en la misma red Wi-Fi y que el servidor Vite esté activo en:
            </Text>
            <Text style={styles.errorUrl}>{url}</Text>

            <View style={styles.inputRow}>
              <TextInput
                style={styles.urlInput}
                value={inputUrl}
                onChangeText={setInputUrl}
                placeholder="Ej. http://192.168.1.174:8443"
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity style={styles.applyButton} onPress={handleApplyUrl}>
                <Text style={styles.applyButtonText}>Conectar</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.retryButton} onPress={handleReload}>
              <Text style={styles.retryButtonText}>Reintentar Conexión</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Config URL Modal/Drawer when toggled */}
      {showConfig && (
        <View style={styles.configDrawer}>
          <Text style={styles.configTitle}>Configurar URL de la Aplicación</Text>
          <TextInput
            style={styles.urlInput}
            value={inputUrl}
            onChangeText={setInputUrl}
            placeholder="http://192.168.1.174:8443"
            autoCapitalize="none"
          />
          <View style={styles.drawerButtons}>
            <TouchableOpacity style={styles.applyButton} onPress={handleApplyUrl}>
              <Text style={styles.applyButtonText}>Guardar y Recargar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowConfig(false)}
            >
              <Text style={styles.cancelButtonText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#003333',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  webContainer: {
    flex: 1,
    backgroundColor: '#f6f8fa',
  },
  webview: {
    flex: 1,
  },
  loaderContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#003333',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 14,
    color: '#a7f3d0',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
  },
  errorOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 51, 51, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
    textAlign: 'center',
  },
  errorSubtitle: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 18,
  },
  errorUrl: {
    fontSize: 13,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: '#008080',
    textAlign: 'center',
    marginVertical: 10,
    backgroundColor: '#f0fdfa',
    padding: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ccfbf1',
  },
  inputRow: {
    marginTop: 10,
    flexDirection: 'row',
    gap: 8,
  },
  urlInput: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    color: '#0f172a',
  },
  applyButton: {
    backgroundColor: '#008080',
    borderRadius: 12,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  applyButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  retryButton: {
    marginTop: 12,
    backgroundColor: '#004c4c',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  configDrawer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    elevation: 20,
  },
  configTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 12,
  },
  drawerButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#64748b',
    fontSize: 13,
    fontWeight: '600',
  },
});
