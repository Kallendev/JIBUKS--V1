import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Dimensions, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';

const { width } = Dimensions.get('window');

interface FamilyMember {
  id: string;
  name: string;
  role: string;
  access: string;
  email: string;
  status: string;
  isCurrentUser: boolean;
  avatar?: string;
}

import apiService from '@/services/api';

export default function FamilySetupScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const params = useLocalSearchParams();
  const [familyName, setFamilyName] = useState('');
  const [loading, setLoading] = useState(false);

  // Initialize with current user
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);

  // Fetch family data on mount
  useEffect(() => {
    loadFamilyData();
  }, [user]);

  // Check if returning from invite/add member and refresh
  useEffect(() => {
    if (params.refresh) {
      loadFamilyData();
    }
  }, [params]);

  const loadFamilyData = async () => {
    try {
      const family = await apiService.getFamily();
      console.log('🏠 Family API response:', JSON.stringify(family, null, 2));
      if (family) {
        setFamilyName(family.name || '');

        // Map users to UI model
        const members = family.users.map((u: any) => ({
          id: u.id.toString(),
          name: u.name || 'Unknown',
          role: u.role, // e.g. OWNER, PARENT
          access: ['OWNER', 'ADMIN', 'PARENT'].includes(u.role) ? 'Full Access' : 'Limited Access',
          email: u.email,
          status: 'Active',
          isCurrentUser: u.email === user?.email,
          avatar: apiService.getImageUrl(u.avatarUrl)
        }));

        setFamilyMembers(members);
      }
    } catch (error) {
      console.error('Failed to load family:', error);
    }
  };

  const handleAddMember = () => {
    // Navigate to add family member screen
    router.push('/add-family-member');
  };

  const handleContinue = async () => {
    if (!familyName.trim()) {
      alert('Please enter your family name');
      return;
    }

    try {
      setLoading(true);
      // Update family name
      await apiService.updateFamily({ name: familyName });

      // Navigate to income sources screen
      // @ts-ignore
      router.push('/income-sources');
    } catch (error) {
      alert('Failed to save family setup');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <View style={styles.container}>
      {/* Blue Header Section */}
      <LinearGradient
        colors={['#1e3a8a', '#2563eb']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={28} color="#f59e0b" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Family Setup</Text>
          <View style={styles.placeholder} />
        </View>
        <Text style={styles.subtitle}>Let's create your family space</Text>
      </LinearGradient>

      {/* White Card Section */}
      <ScrollView style={styles.card} showsVerticalScrollIndicator={false}>
        {/* Family Name Input */}
        <View style={styles.inputSection}>
          <Text style={styles.inputLabel}>What's your family name?</Text>
          <TextInput
            style={styles.input}
            placeholder="The Otieno Household"
            placeholderTextColor="#9ca3af"
            value={familyName}
            onChangeText={setFamilyName}
          />
        </View>

        {/* Meet the Family Section */}
        <View style={styles.familySection}>
          <View style={styles.familyHeader}>
            <Text style={styles.familyTitle}>Meet the Family</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={handleAddMember}
            >
              <Text style={styles.addButtonText}>+ Add</Text>
            </TouchableOpacity>
          </View>

          {/* Family Members List */}
          {familyMembers.map((member) => (
            <View key={member.id} style={styles.memberCard}>
              <View style={styles.avatarContainer}>
                {member.avatar ? (
                  <Image
                    source={{ uri: member.avatar }}
                    style={styles.avatar}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarText}>
                      {member.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.memberInfo}>
                <Text style={styles.memberName}>
                  {member.name}{member.isCurrentUser && '(You)'}
                </Text>
                <Text style={styles.memberRole}>
                  {member.role} · {member.access}
                </Text>
                <Text style={styles.memberEmail}>{member.email}</Text>
                <Text style={styles.memberStatus}>{member.status}</Text>
              </View>
            </View>
          ))}

          {/* Helper Text */}
          <Text style={styles.helperText}>
            Add everyone who'll share this family space
          </Text>
        </View>

        {/* Continue Button */}
        <TouchableOpacity
          style={styles.continueButton}
          onPress={handleContinue}
          activeOpacity={0.8}
        >
          <Text style={styles.continueButtonText}>Continue</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1e3a8a',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#f59e0b',
  },
  placeholder: {
    width: 36,
  },
  subtitle: {
    fontSize: 18,
    color: '#ffffff',
    textAlign: 'center',
  },
  card: {
    flex: 1,
    backgroundColor: '#ffffff',
    marginTop: -20,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 24,
    paddingTop: 32,
  },
  inputSection: {
    marginBottom: 32,
  },
  inputLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  input: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1f2937',
  },
  familySection: {
    marginBottom: 32,
  },
  familyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  familyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  addButton: {
    backgroundColor: '#1e3a8a',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  memberCard: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#1e3a8a',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  avatarContainer: {
    marginRight: 16,
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    overflow: 'hidden',
    backgroundColor: '#e5e7eb',
  },
  avatarPlaceholder: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#6b7280',
  },
  memberInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  memberName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#f59e0b',
    marginBottom: 4,
  },
  memberRole: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  memberEmail: {
    fontSize: 14,
    color: '#1f2937',
    marginBottom: 4,
  },
  memberStatus: {
    fontSize: 14,
    color: '#1f2937',
  },
  helperText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 8,
  },
  continueButton: {
    backgroundColor: '#1e3a8a',
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  continueButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
