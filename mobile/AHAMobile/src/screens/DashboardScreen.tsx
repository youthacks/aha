import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  RefreshControl,
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useAuth } from '../context/AuthContext';
import { eventsService, Event } from '../services/events.service';
import { authService } from '../services/api';

type DashboardScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Dashboard'>;

interface Props {
  navigation: DashboardScreenNavigationProp;
}

export default function DashboardScreen({ navigation }: Props) {
  const { user, logout } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [archivedEvents, setArchivedEvents] = useState<Event[]>([]);
  const [showArchived, setShowArchived] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [eventName, setEventName] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [joinSlug, setJoinSlug] = useState('');
  const [resendLoading, setResendLoading] = useState(false);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const data = await eventsService.getMyEvents();
      setEvents(data);
      const archivedData = await eventsService.getMyArchivedEvents();
      setArchivedEvents(archivedData);
    } catch (err) {
      console.error('Failed to load events', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadEvents();
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', onPress: async () => await logout() },
    ]);
  };

  const handleResendVerification = async () => {
    if (!user?.email) return;

    setResendLoading(true);
    try {
      await authService.resendVerification(user.email);
      Alert.alert('Success', 'Verification email sent! Please check your inbox.');
    } catch (error) {
      Alert.alert('Error', 'Failed to send verification email');
    } finally {
      setResendLoading(false);
    }
  };

  const handleCreateEvent = async () => {
    if (!eventName.trim()) {
      Alert.alert('Error', 'Please enter an event name');
      return;
    }

    try {
      await eventsService.createEvent(eventName, eventDescription);
      setShowCreateModal(false);
      setEventName('');
      setEventDescription('');
      Alert.alert('Success', 'Event created successfully!');
      loadEvents();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to create event');
    }
  };

  const handleJoinEvent = async () => {
    if (!joinSlug.trim()) {
      Alert.alert('Error', 'Please enter an event code');
      return;
    }

    try {
      await eventsService.joinEvent(joinSlug);
      setShowJoinModal(false);
      setJoinSlug('');
      Alert.alert('Success', 'Joined event successfully!');
      loadEvents();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to join event');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#667eea" />
      </View>
    );
  }

  const displayEvents = showArchived ? archivedEvents : events;

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        <View style={styles.header}>
          <Text style={styles.greeting}>
            Welcome, {user?.firstName || 'User'}! 👋
          </Text>
          {!user?.isEmailVerified && (
            <View style={styles.warningBox}>
              <Text style={styles.warningText}>⚠️ Email not verified</Text>
              <TouchableOpacity
                onPress={handleResendVerification}
                disabled={resendLoading}
              >
                <Text style={styles.resendLink}>
                  {resendLoading ? 'Sending...' : 'Resend verification email'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setShowCreateModal(true)}
          >
            <Text style={styles.actionButtonText}>➕ Create Event</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.secondaryButton]}
            onPress={() => setShowJoinModal(true)}
          >
            <Text style={styles.actionButtonText}>🔗 Join Event</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.toggleContainer}>
          <TouchableOpacity onPress={() => setShowArchived(false)}>
            <Text style={[styles.toggleButton, !showArchived && styles.activeToggle]}>
              Active Events ({events.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowArchived(true)}>
            <Text style={[styles.toggleButton, showArchived && styles.activeToggle]}>
              Archived ({archivedEvents.length})
            </Text>
          </TouchableOpacity>
        </View>

        {displayEvents.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              {showArchived ? 'No archived events' : 'No active events yet'}
            </Text>
            <Text style={styles.emptySubtext}>
              {showArchived ? '' : 'Create a new event or join an existing one!'}
            </Text>
          </View>
        ) : (
          displayEvents.map((event) => (
            <TouchableOpacity
              key={event.id}
              style={styles.eventCard}
              onPress={() => navigation.navigate('EventDetails', { eventSlug: event.slug })}
            >
              <Text style={styles.eventName}>{event.name}</Text>
              {event.description && (
                <Text style={styles.eventDescription}>{event.description}</Text>
              )}
              <View style={styles.eventMeta}>
                <Text style={styles.eventMetaText}>Code: {event.slug}</Text>
                <Text style={styles.eventMetaText}>Role: {event.myRole}</Text>
              </View>
              {event.myTokens !== undefined && (
                <Text style={styles.tokens}>💰 {event.myTokens} tokens</Text>
              )}
            </TouchableOpacity>
          ))
        )}

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Create Event Modal */}
      <Modal visible={showCreateModal} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Create New Event</Text>
            <TextInput
              style={styles.input}
              placeholder="Event Name"
              value={eventName}
              onChangeText={setEventName}
            />
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Description (optional)"
              value={eventDescription}
              onChangeText={setEventDescription}
              multiline
              numberOfLines={4}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowCreateModal(false);
                  setEventName('');
                  setEventDescription('');
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.createButton]}
                onPress={handleCreateEvent}
              >
                <Text style={styles.createButtonText}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Join Event Modal */}
      <Modal visible={showJoinModal} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Join Event</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter Event Code"
              value={joinSlug}
              onChangeText={setJoinSlug}
              autoCapitalize="none"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowJoinModal(false);
                  setJoinSlug('');
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.createButton]}
                onPress={handleJoinEvent}
              >
                <Text style={styles.createButtonText}>Join</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  warningBox: {
    backgroundColor: '#fff3cd',
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
  },
  warningText: {
    color: '#856404',
    fontWeight: '600',
  },
  resendLink: {
    color: '#667eea',
    marginTop: 5,
  },
  actions: {
    flexDirection: 'row',
    padding: 20,
    gap: 10,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#667eea',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  secondaryButton: {
    backgroundColor: '#764ba2',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  toggleContainer: {
    flexDirection: 'row',
    padding: 20,
    gap: 10,
  },
  toggleButton: {
    flex: 1,
    textAlign: 'center',
    padding: 10,
    fontSize: 16,
    color: '#666',
  },
  activeToggle: {
    color: '#667eea',
    fontWeight: 'bold',
    borderBottomWidth: 2,
    borderBottomColor: '#667eea',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 10,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
  },
  eventCard: {
    backgroundColor: '#fff',
    margin: 10,
    padding: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  eventName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  eventDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  eventMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  eventMetaText: {
    fontSize: 12,
    color: '#999',
  },
  tokens: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#667eea',
    marginTop: 8,
  },
  logoutButton: {
    margin: 20,
    padding: 16,
    backgroundColor: '#f44336',
    borderRadius: 8,
    alignItems: 'center',
  },
  logoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    width: '90%',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  modalButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#ddd',
  },
  cancelButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: 'bold',
  },
  createButton: {
    backgroundColor: '#667eea',
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

