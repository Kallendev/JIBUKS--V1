import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import apiService from '@/services/api';

const { width } = Dimensions.get('window');

interface FamilyMember {
  id: number;
  name: string;
  email: string;
}

export default function FamilyDreamsScreen() {
  const router = useRouter();
  const [goalName, setGoalName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [monthlyContribution, setMonthlyContribution] = useState('');
  const [selectedMember, setSelectedMember] = useState<number | null>(null);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadFamilyMembers();
  }, []);

  const loadFamilyMembers = async () => {
    try {
      const family = await apiService.getFamily();
      if (family && family.users) {
        setFamilyMembers(family.users);
      }
    } catch (error) {
      console.error('Failed to load family members:', error);
    }
  };

  const handleCreateGoal = async () => {
    if (!goalName.trim()) {
      alert('Please enter a goal name');
      return;
    }

    if (!monthlyContribution.trim()) {
      alert('Please enter a monthly contribution amount');
      return;
    }

    try {
      setLoading(true);
      await apiService.createGoal({
        name: goalName,
        targetAmount: parseFloat(targetAmount),
        targetDate: targetDate, // Ideally use a date picker, but text is fine for prototype if backend handles it or we ensure format
        monthlyContribution: parseFloat(monthlyContribution),
        assignedUserId: selectedMember
      });

      // Navigate to success screen
      // @ts-ignore
      router.push('/goal-success');
    } catch (error) {
      console.error(error);
      alert('Failed to create goal');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    router.replace('/(tabs)');
  };

  const handleBack = () => {
    router.back();
  };

  const updateAmount = (value: string, setter: (val: string) => void) => {
    // Only allow numbers
    const numericAmount = value.replace(/[^0-9]/g, '');
    setter(numericAmount);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Blue Header Section */}
      <LinearGradient
        colors={['#1e3a8a', '#2563eb']}
        style={styles.header}
      >
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={28} color="#f59e0b" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleSkip}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.headerTitle}>Family Dreams</Text>
        <Text style={styles.subtitle}>Let's create you saving goals</Text>
      </LinearGradient>

      {/* White Card Section */}
      <View style={styles.card}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Goal Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Goal Name</Text>
            <TextInput
              style={styles.input}
              placeholder="New car fund"
              placeholderTextColor="#d1d5db"
              value={goalName}
              onChangeText={setGoalName}
            />
          </View>

          {/* Target Amount */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Target Amount</Text>
            <TextInput
              style={styles.input}
              placeholder="kES 500 000"
              placeholderTextColor="#d1d5db"
              value={targetAmount ? `kES ${targetAmount}` : ''}
              onChangeText={(text) => updateAmount(text, setTargetAmount)}
              keyboardType="numeric"
            />
          </View>

          {/* Target Date */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Target Date</Text>
            <TextInput
              style={styles.input}
              placeholder="December 2026"
              placeholderTextColor="#d1d5db"
              value={targetDate}
              onChangeText={setTargetDate}
            />
          </View>

          {/* Monthly Contribution */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Monthly contribution</Text>
            <TextInput
              style={styles.input}
              placeholder="kES 20 000"
              placeholderTextColor="#d1d5db"
              value={monthlyContribution ? `kES ${monthlyContribution}` : ''}
              onChangeText={(text) => updateAmount(text, setMonthlyContribution)}
              keyboardType="numeric"
            />
          </View>

          {/* Monthly Contribution - Assign to Member */}
          {familyMembers.length > 0 && (
            <View style={styles.membersSection}>
              <Text style={styles.label}>Monthly contribution</Text>
              {familyMembers.map((member) => (
                <TouchableOpacity
                  key={member.id}
                  style={styles.memberItem}
                  onPress={() => setSelectedMember(member.id)}
                  activeOpacity={0.7}
                >
                  <View style={[
                    styles.radio,
                    selectedMember === member.id && styles.radioSelected
                  ]}>
                    {selectedMember === member.id && (
                      <View style={styles.radioDot} />
                    )}
                  </View>
                  <Text style={styles.memberName}>{member.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Create Goal Button */}
          <TouchableOpacity
            style={styles.createButton}
            onPress={handleCreateGoal}
            activeOpacity={0.8}
            disabled={loading}
          >
            <Text style={styles.createButtonText}>
              {loading ? 'Creating...' : 'Create Goal'}
            </Text>
          </TouchableOpacity>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Powered by Apbc</Text>
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
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
    paddingBottom: 40,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  backButton: {
    padding: 4,
  },
  skipText: {
    fontSize: 16,
    color: '#ffffff',
    textDecorationLine: 'underline',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#f59e0b',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#ffffff',
  },
  card: {
    flex: 1,
    backgroundColor: '#ffffff',
    marginTop: -20,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1f2937',
  },
  membersSection: {
    marginBottom: 32,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  radio: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#1f2937',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  radioSelected: {
    borderColor: '#1e3a8a',
  },
  radioDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#1e3a8a',
  },
  memberName: {
    fontSize: 16,
    color: '#1f2937',
  },
  createButton: {
    backgroundColor: '#1e3a8a',
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  createButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  footer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  footerText: {
    fontSize: 12,
    color: '#6b7280',
  },
});
