import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ONBOARDING_KEY = 'businessOnboardingComplete';

/**
 * Entry point for business: new users go to onboarding first,
 * returning users (who completed setup) go to dashboard.
 */
export default function BusinessTabsIndex() {
    const router = useRouter();

    useEffect(() => {
        let mounted = true;

        async function decideRoute() {
            try {
                const completed = await AsyncStorage.getItem(ONBOARDING_KEY);
                if (!mounted) return;
                // Only go to dashboard if onboarding was explicitly completed; otherwise setup first
                if (completed === 'true') {
                    router.replace('/business-tabs/business-dashboard');
                } else {
                    router.replace('/business-tabs/business-onboarding');
                }
            } catch {
                if (mounted) {
                    router.replace('/business-tabs/business-onboarding');
                }
            }
        }

        decideRoute();
        return () => { mounted = false; };
    }, [router]);

    return (
        <View style={styles.container}>
            <ActivityIndicator size="large" color="#1e3a8a" />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
});
