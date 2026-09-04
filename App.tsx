import React, { useCallback } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts, ZenKakuGothicNew_400Regular, ZenKakuGothicNew_500Medium, ZenKakuGothicNew_700Bold, ZenKakuGothicNew_900Black } from '@expo-google-fonts/zen-kaku-gothic-new';
import { Barlow_600SemiBold, Barlow_700Bold } from '@expo-google-fonts/barlow';
import { BarlowCondensed_700Bold, BarlowCondensed_700Bold_Italic } from '@expo-google-fonts/barlow-condensed';

import { AppStateProvider, useAppState } from './src/state/AppState';
import { colors } from './src/theme/tokens';
import { PinScreen } from './src/screens/PinScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { CategoryScreen } from './src/screens/CategoryScreen';
import { WorkoutScreen } from './src/screens/WorkoutScreen';
import { CompleteScreen } from './src/screens/CompleteScreen';
import { CalendarScreen } from './src/screens/CalendarScreen';
import { BottomNav } from './src/screens/components/BottomNav';
import { SettingsSheet } from './src/screens/components/SettingsSheet';

SplashScreen.preventAutoHideAsync().catch(() => {});

function Root() {
  const { state, actions } = useAppState();

  if (state.screen === 'loading' || !state.hydrated) {
    return (
      <View style={styles.loading}>
        <Text style={styles.loadingText}>読み込み中…</Text>
      </View>
    );
  }

  const showNav = state.screen === 'home' || state.screen === 'cat' || state.screen === 'cal';

  return (
    <View style={styles.flex}>
      <View style={styles.flex}>
        {state.screen === 'pin' || state.screen === 'pin-setup' ? <PinScreen /> : null}
        {state.screen === 'home' ? <HomeScreen /> : null}
        {state.screen === 'cat' ? <CategoryScreen /> : null}
        {state.screen === 'exec' ? <WorkoutScreen /> : null}
        {state.screen === 'complete' ? <CompleteScreen /> : null}
        {state.screen === 'cal' ? <CalendarScreen /> : null}
      </View>
      {showNav ? <BottomNav screen={state.screen} onNavigate={actions.setScreen} onSettings={actions.openSettings} /> : null}
      <SettingsSheet
        visible={state.settingsOpen}
        onClose={actions.closeSettings}
        dailyTimeCapMinutes={state.settings.dailyTimeCapMinutes}
        onChangeDailyCap={actions.updateDailyCap}
        onResetAll={actions.resetAllData}
      />
    </View>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    ZenKakuGothicNew_400Regular,
    ZenKakuGothicNew_500Medium,
    ZenKakuGothicNew_700Bold,
    ZenKakuGothicNew_900Black,
    Barlow_600SemiBold,
    Barlow_700Bold,
    BarlowCondensed_700Bold,
    BarlowCondensed_700Bold_Italic,
  });

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) await SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safe} onLayout={onLayoutRootView} edges={['top', 'bottom']}>
        <AppStateProvider>
          <Root />
        </AppStateProvider>
        <StatusBar style="light" />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  loadingText: { color: colors.textDim2, fontSize: 12 },
});
