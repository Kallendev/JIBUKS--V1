import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function SettingsScreen() {
  const router = useRouter();
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = React.useState(false);

  const settingsCategories = [
    {
      title: 'FAMILY & MEMBERS',
      items: [
        { id: 1, name: 'Family Members', icon: 'people', route: '/family-settings', color: '#122f8a' },
        { id: 2, name: 'Permissions', icon: 'shield-checkmark', route: '/family-settings', color: '#10b981' },
      ],
    },
    {
      title: 'ACCOUNT SETUP',
      items: [
        { id: 3, name: 'Bank Accounts', icon: 'card', route: '/banking', color: '#2563eb' },
        { id: 4, name: 'Mobile Money', icon: 'phone-portrait', route: '/banking', color: '#10b981' },
        { id: 5, name: 'Wallet Setup', icon: 'wallet', route: '/banking', color: '#fe9900' },
      ],
    },
    {
      title: 'PREFERENCES',
      items: [
        { id: 6, name: 'App Theme', icon: 'color-palette', route: null, color: '#8b5cf6', hasSwitch: true },
        { id: 7, name: 'Notifications', icon: 'notifications', route: null, color: '#f59e0b', hasSwitch: true },
        { id: 8, name: 'Language', icon: 'language', route: '/manage', color: '#06b6d4' },
      ],
    },
    {
      title: 'SECURITY',
      items: [
        { id: 9, name: 'Security Options', icon: 'lock-closed', route: '/manage', color: '#ef4444' },
        { id: 10, name: 'Change Password', icon: 'key', route: '/forgot-password', color: '#f59e0b' },
        { id: 11, name: 'Two-Factor Auth', icon: 'finger-print', route: '/manage', color: '#10b981' },
      ],
    },
    {
      title: 'SUPPORT',
      items: [
        { id: 12, name: 'Help Center', icon: 'help-circle', route: '/manage', color: '#6366f1' },
        { id: 13, name: 'Contact Support', icon: 'mail', route: '/manage', color: '#ec4899' },
        { id: 14, name: 'About JIBUKS', icon: 'information-circle', route: '/manage', color: '#64748b' },
      ],
    },
  ];

  const renderSettingItem = (item: any) => {
    if (item.hasSwitch) {
      const isEnabled = item.id === 7 ? notificationsEnabled : darkModeEnabled;
      const setEnabled = item.id === 7 ? setNotificationsEnabled : setDarkModeEnabled;

      return (
        <View key={item.id} style={styles.settingItem}>
          <View style={[styles.settingIconContainer, { backgroundColor: `${item.color}15` }]}>
            <Ionicons name={item.icon as any} size={22} color={item.color} />
          </View>
          <Text style={styles.settingName}>{item.name}</Text>
          <Switch
            value={isEnabled}
            onValueChange={setEnabled}
            trackColor={{ false: '#d1d5db', true: '#122f8a' }}
            thumbColor={isEnabled ? '#fe9900' : '#f3f4f6'}
          />
        </View>
      );
    }

    return (
      <TouchableOpacity
        key={item.id}
        style={styles.settingItem}
        onPress={() => item.route && router.push(item.route as any)}
      >
        <View style={[styles.settingIconContainer, { backgroundColor: `${item.color}15` }]}>
          <Ionicons name={item.icon as any} size={22} color={item.color} />
        </View>
        <Text style={styles.settingName}>{item.name}</Text>
        <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Ionicons name="settings" size={24} color="#ffffff" />
          <Text style={styles.headerTitle}>Settings</Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.profileCard}
            onPress={() => router.push('/profile' as any)}
          >
            <View style={styles.profileAvatar}>
              <Ionicons name="person" size={32} color="#122f8a" />
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>Your Name</Text>
              <Text style={styles.profileEmail}>email@example.com</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#9ca3af" />
          </TouchableOpacity>
        </View>

        {/* Settings Categories */}
        {settingsCategories.map((category, index) => (
          <View key={index} style={styles.section}>
            <Text style={styles.sectionTitle}>{category.title}</Text>
            <View style={styles.categoryCard}>
              {category.items.map((item, itemIndex) => (
                <View key={item.id}>
                  {renderSettingItem(item)}
                  {itemIndex < category.items.length - 1 && <View style={styles.divider} />}
                </View>
              ))}
            </View>
          </View>
        ))}

        {/* Logout Button */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={() => router.push('/login' as any)}
          >
            <Ionicons name="log-out" size={20} color="#ef4444" />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>

        {/* App Version */}
        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>JIBUKS v1.0.0</Text>
        </View>

        {/* Bottom Spacing */}
        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f4f8',
  },
  header: {
    backgroundColor: '#122f8a',
    paddingHorizontal: 16,
    paddingVertical: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  content: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 16,
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#122f8a',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  profileAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: '#6b7280',
  },
  categoryCard: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 4,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  settingIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  settingName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: '#1f2937',
  },
  divider: {
    height: 1,
    backgroundColor: '#f3f4f6',
    marginLeft: 64,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#ef4444',
    gap: 8,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ef4444',
  },
  versionContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  versionText: {
    fontSize: 12,
    color: '#9ca3af',
  },
});
