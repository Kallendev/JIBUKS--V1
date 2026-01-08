import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Image,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Picker } from '@react-native-picker/picker';
import { FamilyRole, MemberPermissions } from '@/types/family';
import apiService from '@/services/api';

export default function EditMemberPermissions() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const memberId = params.memberId as string;

  const [member, setMember] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState<FamilyRole>('MEMBER');
  const [permissions, setPermissions] = useState<MemberPermissions>({
    canView: true,
    canAdd: false,
    canEdit: false,
    canDelete: false,
    canViewBudgets: true,
    canEditBudgets: false,
    canViewGoals: true,
    canContributeGoals: false,
    canInvite: false,
    canRemove: false,
  });
  const [hasChanges, setHasChanges] = useState(false);

  const roles: FamilyRole[] = ['PARENT', 'CHILD', 'MEMBER', 'ADMIN'];

  useEffect(() => {
    loadMemberDetails();
  }, [memberId]);

  const loadMemberDetails = async () => {
    try {
      setLoading(true);
      const data = await apiService.getMemberDetails(memberId);
      setMember(data);
      setSelectedRole(data.role);
      setPermissions(data.permissions);
    } catch (error: any) {
      console.error('Error loading member details:', error);
      Alert.alert('Error', error.error || 'Failed to load member details');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = (role: FamilyRole) => {
    setSelectedRole(role);
    setHasChanges(true);

    // Auto-adjust permissions based on role
    if (role === 'ADMIN') {
      setPermissions({
        canView: true,
        canAdd: true,
        canEdit: true,
        canDelete: true,
        canViewBudgets: true,
        canEditBudgets: true,
        canViewGoals: true,
        canContributeGoals: true,
        canInvite: true,
        canRemove: false,
      });
    } else if (role === 'PARENT') {
      setPermissions({
        canView: true,
        canAdd: true,
        canEdit: true,
        canDelete: false,
        canViewBudgets: true,
        canEditBudgets: true,
        canViewGoals: true,
        canContributeGoals: true,
        canInvite: false,
        canRemove: false,
      });
    } else if (role === 'CHILD') {
      setPermissions({
        canView: true,
        canAdd: false,
        canEdit: false,
        canDelete: false,
        canViewBudgets: true,
        canEditBudgets: false,
        canViewGoals: true,
        canContributeGoals: true,
        canInvite: false,
        canRemove: false,
      });
    } else {
      // Default / USER / MEMBER
      setPermissions({
        canView: true,
        canAdd: false,
        canEdit: false,
        canDelete: false,
        canViewBudgets: true,
        canEditBudgets: false,
        canViewGoals: true,
        canContributeGoals: false,
        canInvite: false,
        canRemove: false,
      });
    }
  };

  const togglePermission = (key: keyof MemberPermissions) => {
    setPermissions({ ...permissions, [key]: !permissions[key] });
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      setLoading(true);

      // Update role if changed
      if (selectedRole !== member.role) {
        await apiService.updateMemberRole(memberId, selectedRole);
      }

      // Update permissions
      await apiService.updateMemberPermissions(memberId, permissions);

      Alert.alert('Success', 'Member permissions updated successfully!', [
        {
          text: 'OK',
          onPress: () => router.back()
        }
      ]);
    } catch (error: any) {
      console.error('Error saving permissions:', error);
      Alert.alert('Error', error.error || 'Failed to update permissions');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = () => {
    Alert.alert(
      'Remove Member',
      `Are you sure you want to remove ${member.name} from the family? They will lose access to all family data.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiService.removeFamilyMember(memberId);
              Alert.alert('Success', 'Member removed from family', [
                {
                  text: 'OK',
                  onPress: () => router.back()
                }
              ]);
            } catch (error: any) {
              Alert.alert('Error', error.error || 'Failed to remove member');
            }
          }
        }
      ]
    );
  };

  const renderPermissionToggle = (
    label: string,
    description: string,
    key: keyof MemberPermissions,
    icon: string
  ) => {
    return (
      <View style={styles.permissionRow}>
        <View style={styles.permissionLeft}>
          <View style={styles.permissionIconContainer}>
            <Ionicons name={icon as any} size={20} color="#2563eb" />
          </View>
          <View style={styles.permissionText}>
            <Text style={styles.permissionLabel}>{label}</Text>
            <Text style={styles.permissionDescription}>{description}</Text>
          </View>
        </View>
        <Switch
          value={permissions[key]}
          onValueChange={() => togglePermission(key)}
          trackColor={{ false: '#cbd5e1', true: '#93c5fd' }}
          thumbColor={permissions[key] ? '#2563eb' : '#f1f5f9'}
          ios_backgroundColor="#cbd5e1"
        />
      </View>
    );
  };

  if (loading || !member) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={['#1e3a8a', '#2563eb']}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Loading...</Text>
            <View style={styles.placeholder} />
          </View>
        </LinearGradient>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={{ marginTop: 16, color: '#64748b' }}>Loading member details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Blue Gradient Header */}
      <LinearGradient
        colors={['#1e3a8a', '#2563eb']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            onPress={() => {
              if (hasChanges) {
                Alert.alert(
                  'Unsaved Changes',
                  'You have unsaved changes. Are you sure you want to go back?',
                  [
                    { text: 'Stay', style: 'cancel' },
                    { text: 'Discard', style: 'destructive', onPress: () => router.back() }
                  ]
                );
              } else {
                router.back();
              }
            }}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{member.name}</Text>
          <View style={styles.placeholder} />
        </View>
      </LinearGradient>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Member Info Card */}
        <View style={styles.card}>
          <View style={styles.memberInfo}>
            {member.avatar ? (
              <Image source={{ uri: apiService.getImageUrl(member.avatar) }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>
                  {member.name.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            <View style={styles.memberDetails}>
              <Text style={styles.memberName}>{member.name}</Text>
              <Text style={styles.memberEmail}>{member.email}</Text>
            </View>
          </View>
        </View>

        {/* Role Selector */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Member Role</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={selectedRole}
              onValueChange={handleRoleChange}
              style={styles.picker}
            >
              {roles.map((role) => (
                <Picker.Item key={role} label={role} value={role} />
              ))}
            </Picker>
          </View>
        </View>

        {/* Transaction Permissions */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Transaction Permissions</Text>
          {renderPermissionToggle(
            'View Transactions',
            'Can see all family transactions',
            'canView',
            'eye'
          )}
          {renderPermissionToggle(
            'Add Transactions',
            'Can create new transactions',
            'canAdd',
            'add-circle'
          )}
          {renderPermissionToggle(
            'Edit Transactions',
            'Can modify existing transactions',
            'canEdit',
            'create'
          )}
          {renderPermissionToggle(
            'Delete Transactions',
            'Can remove transactions',
            'canDelete',
            'trash'
          )}
        </View>

        {/* Budget Permissions */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Budget Permissions</Text>
          {renderPermissionToggle(
            'View Budgets',
            'Can see all family budgets',
            'canViewBudgets',
            'wallet'
          )}
          {renderPermissionToggle(
            'Edit Budgets',
            'Can modify budget allocations',
            'canEditBudgets',
            'pencil'
          )}
        </View>

        {/* Goal Permissions */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Goal Permissions</Text>
          {renderPermissionToggle(
            'View Goals',
            'Can see all family goals',
            'canViewGoals',
            'trophy'
          )}
          {renderPermissionToggle(
            'Contribute to Goals',
            'Can add money to goals',
            'canContributeGoals',
            'cash'
          )}
        </View>

        {/* Member Management Permissions */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Member Management</Text>
          {renderPermissionToggle(
            'Invite Members',
            'Can invite new family members',
            'canInvite',
            'person-add'
          )}
          {renderPermissionToggle(
            'Remove Members',
            'Can remove family members',
            'canRemove',
            'person-remove'
          )}
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveButton, !hasChanges && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={!hasChanges}
        >
          <LinearGradient
            colors={hasChanges ? ['#2563eb', '#1e3a8a'] : ['#cbd5e1', '#94a3b8']}
            style={styles.saveButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Ionicons name="save" size={20} color="#fff" />
            <Text style={styles.saveButtonText}>Save Changes</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Remove Member Button */}
        <TouchableOpacity
          style={styles.removeButton}
          onPress={handleRemoveMember}
        >
          <Ionicons name="person-remove" size={20} color="#fff" />
          <Text style={styles.removeButtonText}>Remove from Family</Text>
        </TouchableOpacity>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 16,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 16,
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#dbeafe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  memberDetails: {
    marginLeft: 16,
  },
  memberName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  memberEmail: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  permissionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  permissionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  permissionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#dbeafe',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  permissionText: {
    flex: 1,
  },
  permissionLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1e293b',
  },
  permissionDescription: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  saveButton: {
    marginHorizontal: 16,
    marginTop: 24,
    borderRadius: 12,
    overflow: 'hidden',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 8,
  },
  removeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    marginTop: 16,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#ef4444',
  },
  removeButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 8,
  },
  bottomPadding: {
    height: 40,
  },
});
