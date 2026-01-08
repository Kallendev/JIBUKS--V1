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
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { FamilySettings as FamilySettingsType, FamilyMemberDetailed, PendingInvitation } from '@/types/family';
import apiService from '@/services/api';

export default function FamilySettings() {
  const router = useRouter();
  const [settings, setSettings] = useState<FamilySettingsType | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string>('');

  useEffect(() => {
    loadFamilySettings();
  }, []);

  const loadFamilySettings = async () => {
    try {
      setLoading(true);
      const [settingsData, userData] = await Promise.all([
        apiService.getFamilySettings(),
        apiService.getCurrentUser()
      ]);

      setSettings(settingsData);
      setCurrentUserId(userData.id.toString());
    } catch (error: any) {
      console.error('Error loading family settings:', error);
      Alert.alert('Error', error.error || 'Failed to load family settings');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const handleResendInvitation = (invitationId: number) => {
    // TODO: Implement API call to resend invitation
    // POST /api/family/invitations/:id/resend
    Alert.alert('Success', 'Invitation resent successfully!');
  };

  const handleCancelInvitation = (invitationId: number) => {
    Alert.alert(
      'Cancel Invitation',
      'Are you sure you want to cancel this invitation?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: () => {
            // TODO: Implement API call to cancel invitation
            // DELETE /api/family/invitations/:id
            if (!settings) return;
            setSettings({
              ...settings,
              pendingInvitations: settings.pendingInvitations.filter(inv => inv.id !== invitationId)
            });
            Alert.alert('Success', 'Invitation cancelled');
          }
        }
      ]
    );
  };

  const handleLeaveFamily = () => {
    Alert.alert(
      'Leave Family',
      'Are you sure you want to leave this family? You will lose access to all family data.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiService.leaveFamily();
              Alert.alert('Success', 'You have left the family');
              router.replace('/welcome');
            } catch (error: any) {
              Alert.alert('Error', error.error || 'Failed to leave family');
            }
          }
        }
      ]
    );
  };

  const handleDeleteFamily = () => {
    Alert.alert(
      'Delete Family',
      'Are you sure you want to delete this family? This action cannot be undone and all data will be permanently lost.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Forever',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiService.deleteFamily();
              Alert.alert('Success', 'Family deleted');
              router.replace('/welcome');
            } catch (error: any) {
              Alert.alert('Error', error.error || 'Failed to delete family');
            }
          }
        }
      ]
    );
  };

  const renderPermissionIcons = (permissions: any) => {
    return (
      <View style={styles.permissionIcons}>
        {permissions.canView && (
          <View style={styles.permissionIcon}>
            <Ionicons name="eye" size={14} color="#10b981" />
          </View>
        )}
        {permissions.canEdit && (
          <View style={styles.permissionIcon}>
            <Ionicons name="create" size={14} color="#f59e0b" />
          </View>
        )}
        {permissions.canDelete && (
          <View style={styles.permissionIcon}>
            <Ionicons name="trash" size={14} color="#ef4444" />
          </View>
        )}
      </View>
    );
  };

  if (loading) {
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
            <Text style={styles.headerTitle}>Family Settings</Text>
            <View style={styles.placeholder} />
          </View>
        </LinearGradient>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={{ marginTop: 16, color: '#64748b' }}>Loading family settings...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!settings) {
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
            <Text style={styles.headerTitle}>Family Settings</Text>
            <View style={styles.placeholder} />
          </View>
        </LinearGradient>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Ionicons name="alert-circle" size={64} color="#ef4444" />
          <Text style={{ marginTop: 16, color: '#64748b', fontSize: 16 }}>Failed to load family settings</Text>
          <TouchableOpacity
            onPress={loadFamilySettings}
            style={{ marginTop: 16, backgroundColor: '#2563eb', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 }}
          >
            <Text style={{ color: '#fff', fontWeight: '600' }}>Retry</Text>
          </TouchableOpacity>
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
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Family Settings</Text>
          <View style={styles.placeholder} />
        </View>
      </LinearGradient>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Family Profile Section */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Family Profile</Text>

          <View style={styles.profileSection}>
            <TouchableOpacity
              style={styles.avatarContainer}
              onPress={() => router.push('/edit-family-profile')}
            >
              {settings.family.avatar ? (
                <Image source={{ uri: apiService.getImageUrl(settings.family.avatar) }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Ionicons name="people" size={40} color="#2563eb" />
                </View>
              )}
              <View style={styles.cameraIcon}>
                <Ionicons name="camera" size={16} color="#fff" />
              </View>
            </TouchableOpacity>

            <View style={styles.profileInfo}>
              <View style={styles.familyNameRow}>
                <Text style={styles.familyName}>{settings.family.name}</Text>
                <TouchableOpacity onPress={() => router.push('/edit-family-profile')}>
                  <Ionicons name="create-outline" size={20} color="#f59e0b" />
                </TouchableOpacity>
              </View>

              <View style={styles.statsRow}>
                <View style={styles.stat}>
                  <Text style={styles.statValue}>{settings.family.totalMembers}</Text>
                  <Text style={styles.statLabel}>Members</Text>
                </View>
                <View style={styles.stat}>
                  <Text style={styles.statValue}>{formatDate(settings.family.createdAt)}</Text>
                  <Text style={styles.statLabel}>Join Date</Text>
                </View>
                <View style={styles.stat}>
                  <Text style={styles.statValue}>{settings.family.activeGoals}</Text>
                  <Text style={styles.statLabel}>Goals</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Family Members Section */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Family Members</Text>

          {settings.members.map((member) => (
            <TouchableOpacity
              key={member.id}
              style={styles.memberCard}
              onPress={() => {
                // Current user cannot edit their own permissions
                if (member.id !== currentUserId) {
                  router.push({
                    pathname: '/edit-member-permissions',
                    params: { memberId: member.id }
                  });
                }
              }}
              disabled={member.id === currentUserId}
            >
              <View style={styles.memberLeft}>
                {member.avatar ? (
                  <Image source={{ uri: apiService.getImageUrl(member.avatar) }} style={styles.memberAvatar} />
                ) : (
                  <View style={styles.memberAvatarPlaceholder}>
                    <Text style={styles.memberAvatarText}>
                      {member.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}
                <View style={styles.memberInfo}>
                  <Text style={styles.memberName}>
                    {member.name}
                    {member.id === currentUserId && <Text style={styles.youBadge}> (You)</Text>}
                  </Text>
                  <Text style={styles.memberEmail}>{member.email}</Text>
                  <View style={styles.memberMeta}>
                    <View style={[styles.roleBadge, getRoleBadgeStyle(member.role)]}>
                      <Text style={styles.roleText}>{member.role}</Text>
                    </View>
                    <View style={[styles.statusBadge, getStatusBadgeStyle(member.status)]}>
                      <Text style={styles.statusText}>{member.status}</Text>
                    </View>
                  </View>
                </View>
              </View>
              <View style={styles.memberRight}>
                {renderPermissionIcons(member.permissions)}
                {member.id !== currentUserId && (
                  <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Pending Invitations Section */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Pending Invitations</Text>

          {settings.pendingInvitations.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="mail-outline" size={48} color="#cbd5e1" />
              <Text style={styles.emptyStateText}>No pending invitations</Text>
            </View>
          ) : (
            settings.pendingInvitations.map((invitation) => (
              <View key={invitation.id} style={styles.invitationCard}>
                <View style={styles.invitationInfo}>
                  <Text style={styles.invitationEmail}>{invitation.email}</Text>
                  <Text style={styles.invitationMeta}>
                    {invitation.role} • Sent {formatDate(invitation.sentAt)}
                  </Text>
                </View>
                <View style={styles.invitationActions}>
                  <TouchableOpacity
                    style={styles.iconButton}
                    onPress={() => handleResendInvitation(invitation.id)}
                  >
                    <Ionicons name="refresh" size={20} color="#2563eb" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.iconButton}
                    onPress={() => handleCancelInvitation(invitation.id)}
                  >
                    <Ionicons name="close-circle" size={20} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Danger Zone Section */}
        <View style={styles.card}>
          <Text style={[styles.cardTitle, { color: '#ef4444' }]}>Danger Zone</Text>

          <TouchableOpacity
            style={styles.dangerButton}
            onPress={handleLeaveFamily}
          >
            <Ionicons name="exit-outline" size={20} color="#ef4444" />
            <Text style={styles.dangerButtonText}>Leave Family</Text>
          </TouchableOpacity>

          {settings.family.creatorId.toString() === currentUserId && (
            <TouchableOpacity
              style={[styles.dangerButton, styles.dangerButtonSolid]}
              onPress={handleDeleteFamily}
            >
              <Ionicons name="trash-outline" size={20} color="#fff" />
              <Text style={[styles.dangerButtonText, { color: '#fff' }]}>Delete Family</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
}

function getRoleBadgeStyle(role: string) {
  switch (role) {
    case 'Parent':
      return { backgroundColor: '#dbeafe', borderColor: '#2563eb' };
    case 'Child':
      return { backgroundColor: '#fed7aa', borderColor: '#f59e0b' };
    case 'Guardian':
      return { backgroundColor: '#d1fae5', borderColor: '#10b981' };
    default:
      return { backgroundColor: '#f1f5f9', borderColor: '#64748b' };
  }
}

function getStatusBadgeStyle(status: string) {
  switch (status) {
    case 'Active':
      return { backgroundColor: '#d1fae5', borderColor: '#10b981' };
    case 'Pending':
      return { backgroundColor: '#fed7aa', borderColor: '#f59e0b' };
    default:
      return { backgroundColor: '#f1f5f9', borderColor: '#94a3b8' };
  }
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
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 16,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#dbeafe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#f59e0b',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  profileInfo: {
    flex: 1,
  },
  familyNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  familyName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginRight: 8,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  statLabel: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  memberLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  memberAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  memberAvatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#dbeafe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberAvatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  memberInfo: {
    marginLeft: 12,
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  youBadge: {
    fontSize: 14,
    color: '#2563eb',
    fontWeight: '500',
  },
  memberEmail: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
  memberMeta: {
    flexDirection: 'row',
    marginTop: 6,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    marginRight: 8,
  },
  roleText: {
    fontSize: 11,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  memberRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  permissionIcons: {
    flexDirection: 'row',
    marginRight: 8,
  },
  permissionIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  invitationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  invitationInfo: {
    flex: 1,
  },
  invitationEmail: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1e293b',
  },
  invitationMeta: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
  invitationActions: {
    flexDirection: 'row',
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 12,
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#ef4444',
    marginTop: 12,
  },
  dangerButtonSolid: {
    backgroundColor: '#ef4444',
    borderColor: '#ef4444',
  },
  dangerButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ef4444',
    marginLeft: 8,
  },
  bottomPadding: {
    height: 40,
  },
});
