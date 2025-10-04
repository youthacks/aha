import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Modal,
  TextInput,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import { eventsService, EventMember, Purchasable, Transaction } from '../services/events.service';

type EventDetailsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'EventDetails'>;
type EventDetailsScreenRouteProp = RouteProp<RootStackParamList, 'EventDetails'>;

interface Props {
  navigation: EventDetailsScreenNavigationProp;
  route: EventDetailsScreenRouteProp;
}

export default function EventDetailsScreen({ navigation, route }: Props) {
  const { eventSlug } = route.params;
  const [event, setEvent] = useState<any>(null);
  const [members, setMembers] = useState<EventMember[]>([]);
  const [purchasables, setPurchasables] = useState<Purchasable[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [myRole, setMyRole] = useState('');
  const [myTokens, setMyTokens] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // Modals
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<EventMember | null>(null);
  const [tokenAmount, setTokenAmount] = useState('');

  const [showStationModal, setShowStationModal] = useState(false);
  const [stationName, setStationName] = useState('');
  const [stationPrice, setStationPrice] = useState('');
  const [stationDescription, setStationDescription] = useState('');
  const [stationStock, setStationStock] = useState('');

  useEffect(() => {
    loadEventData();
    const interval = setInterval(() => loadEventData(true), 5000);
    return () => clearInterval(interval);
  }, [eventSlug]);

  const loadEventData = async (silent = false) => {
    try {
      const data = await eventsService.getEventDetails(eventSlug);
      setEvent(data.event);
      setMembers(data.members);
      setPurchasables(data.stations);
      setMyRole(data.myRole);
      setMyTokens(data.myTokens);

      const txns = await eventsService.getTransactions(eventSlug);
      setTransactions(txns);
    } catch (err) {
      if (!silent) {
        Alert.alert('Error', 'Failed to load event data');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadEventData();
  };

  const handleUpdateTokens = async () => {
    if (!selectedMember || !tokenAmount) return;

    try {
      await eventsService.updateTokens(eventSlug, selectedMember.userId, parseInt(tokenAmount));
      Alert.alert('Success', `Updated tokens for ${selectedMember.name}`);
      setShowTokenModal(false);
      setTokenAmount('');
      setSelectedMember(null);
      loadEventData(true);
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to update tokens');
    }
  };

  const handleCreateStation = async () => {
    if (!stationName || !stationPrice) {
      Alert.alert('Error', 'Please fill in required fields');
      return;
    }

    try {
      await eventsService.createStation(
        eventSlug,
        stationName,
        parseInt(stationPrice),
        stationDescription,
        stationStock ? parseInt(stationStock) : undefined
      );
      Alert.alert('Success', 'Purchasable created!');
      setShowStationModal(false);
      setStationName('');
      setStationPrice('');
      setStationDescription('');
      setStationStock('');
      loadEventData(true);
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to create purchasable');
    }
  };

  const handlePurchase = async (station: Purchasable) => {
    Alert.alert(
      'Confirm Purchase',
      `Purchase ${station.name} for ${station.price} tokens?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Purchase',
          onPress: async () => {
            try {
              await eventsService.purchase(eventSlug, station.id);
              Alert.alert('Success', 'Purchase successful!');
              loadEventData(true);
            } catch (err: any) {
              Alert.alert('Error', err.response?.data?.message || 'Purchase failed');
            }
          },
        },
      ]
    );
  };

  const handleArchive = async () => {
    Alert.alert('Archive Event', 'Are you sure you want to archive this event?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Archive',
        style: 'destructive',
        onPress: async () => {
          try {
            await eventsService.archiveEvent(eventSlug);
            Alert.alert('Success', 'Event archived');
            navigation.goBack();
          } catch (err: any) {
            Alert.alert('Error', err.response?.data?.message || 'Failed to archive event');
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#667eea" />
      </View>
    );
  }

  const isAdmin = myRole === 'admin';
  const isManager = myRole === 'manager' || isAdmin;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.eventTitle}>{event?.name}</Text>
        <Text style={styles.eventCode}>Code: {event?.slug}</Text>
        <Text style={styles.myTokens}>💰 My Tokens: {myTokens}</Text>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity onPress={() => setActiveTab('overview')}>
          <Text style={[styles.tab, activeTab === 'overview' && styles.activeTab]}>Overview</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setActiveTab('shop')}>
          <Text style={[styles.tab, activeTab === 'shop' && styles.activeTab]}>Shop</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setActiveTab('members')}>
          <Text style={[styles.tab, activeTab === 'members' && styles.activeTab]}>Members</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        {activeTab === 'overview' && (
          <View>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Event Information</Text>
              {event?.description && <Text style={styles.description}>{event.description}</Text>}
              <Text style={styles.role}>Your Role: {myRole}</Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Recent Transactions</Text>
              {transactions.slice(0, 5).map((tx) => (
                <View key={tx.id} style={styles.transactionItem}>
                  <Text style={styles.transactionDesc}>{tx.description}</Text>
                  <Text style={[styles.transactionAmount, tx.amount > 0 ? styles.positive : styles.negative]}>
                    {tx.amount > 0 ? '+' : ''}{tx.amount}
                  </Text>
                </View>
              ))}
            </View>

            {isAdmin && (
              <View style={styles.section}>
                <TouchableOpacity style={styles.dangerButton} onPress={handleArchive}>
                  <Text style={styles.dangerButtonText}>Archive Event</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {activeTab === 'shop' && (
          <View>
            {isManager && (
              <TouchableOpacity
                style={styles.createButton}
                onPress={() => setShowStationModal(true)}
              >
                <Text style={styles.createButtonText}>➕ Create Purchasable</Text>
              </TouchableOpacity>
            )}

            {purchasables.map((station) => (
              <View key={station.id} style={styles.stationCard}>
                <Text style={styles.stationName}>{station.name}</Text>
                {station.description && (
                  <Text style={styles.stationDescription}>{station.description}</Text>
                )}
                <Text style={styles.stationPrice}>💰 {station.price} tokens</Text>
                {station.stock > 0 && (
                  <Text style={styles.stationStock}>Stock: {station.stock}</Text>
                )}
                {station.isAvailable ? (
                  <TouchableOpacity
                    style={styles.purchaseButton}
                    onPress={() => handlePurchase(station)}
                  >
                    <Text style={styles.purchaseButtonText}>Purchase</Text>
                  </TouchableOpacity>
                ) : (
                  <Text style={styles.unavailable}>Unavailable</Text>
                )}
              </View>
            ))}

            {purchasables.length === 0 && (
              <Text style={styles.emptyText}>No purchasables available</Text>
            )}
          </View>
        )}

        {activeTab === 'members' && (
          <View>
            {members.map((member) => (
              <View key={member.id} style={styles.memberCard}>
                <View style={styles.memberInfo}>
                  <Text style={styles.memberName}>{member.name}</Text>
                  <Text style={styles.memberEmail}>{member.email}</Text>
                  <Text style={styles.memberRole}>Role: {member.role}</Text>
                </View>
                <Text style={styles.memberTokens}>💰 {member.tokens}</Text>
                {isManager && (
                  <TouchableOpacity
                    style={styles.updateButton}
                    onPress={() => {
                      setSelectedMember(member);
                      setShowTokenModal(true);
                    }}
                  >
                    <Text style={styles.updateButtonText}>Update Tokens</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Token Update Modal */}
      <Modal visible={showTokenModal} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Update Tokens</Text>
            <Text style={styles.modalSubtitle}>{selectedMember?.name}</Text>
            <TextInput
              style={styles.input}
              placeholder="Token amount (+ or -)"
              value={tokenAmount}
              onChangeText={setTokenAmount}
              keyboardType="numeric"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowTokenModal(false);
                  setTokenAmount('');
                  setSelectedMember(null);
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.submitButton]}
                onPress={handleUpdateTokens}
              >
                <Text style={styles.submitButtonText}>Update</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Create Station Modal */}
      <Modal visible={showStationModal} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <ScrollView contentContainerStyle={styles.modalScrollContent}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Create Purchasable</Text>
              <TextInput
                style={styles.input}
                placeholder="Name *"
                value={stationName}
                onChangeText={setStationName}
              />
              <TextInput
                style={styles.input}
                placeholder="Price *"
                value={stationPrice}
                onChangeText={setStationPrice}
                keyboardType="numeric"
              />
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Description (optional)"
                value={stationDescription}
                onChangeText={setStationDescription}
                multiline
              />
              <TextInput
                style={styles.input}
                placeholder="Stock (optional)"
                value={stationStock}
                onChangeText={setStationStock}
                keyboardType="numeric"
              />
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => {
                    setShowStationModal(false);
                    setStationName('');
                    setStationPrice('');
                    setStationDescription('');
                    setStationStock('');
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.submitButton]}
                  onPress={handleCreateStation}
                >
                  <Text style={styles.submitButtonText}>Create</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
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
  header: {
    backgroundColor: '#667eea',
    padding: 20,
  },
  eventTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  eventCode: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
  },
  myTokens: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 10,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  tab: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    fontSize: 16,
    color: '#666',
  },
  activeTab: {
    color: '#667eea',
    borderBottomWidth: 2,
    borderBottomColor: '#667eea',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: '#fff',
    margin: 10,
    padding: 15,
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  role: {
    fontSize: 14,
    color: '#667eea',
    fontWeight: '600',
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  transactionDesc: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  transactionAmount: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  positive: {
    color: '#4caf50',
  },
  negative: {
    color: '#f44336',
  },
  stationCard: {
    backgroundColor: '#fff',
    margin: 10,
    padding: 15,
    borderRadius: 8,
  },
  stationName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  stationDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  stationPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#667eea',
    marginBottom: 5,
  },
  stationStock: {
    fontSize: 12,
    color: '#999',
    marginBottom: 10,
  },
  purchaseButton: {
    backgroundColor: '#667eea',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  purchaseButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  unavailable: {
    color: '#999',
    fontStyle: 'italic',
  },
  memberCard: {
    backgroundColor: '#fff',
    margin: 10,
    padding: 15,
    borderRadius: 8,
  },
  memberInfo: {
    marginBottom: 10,
  },
  memberName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  memberEmail: {
    fontSize: 14,
    color: '#666',
  },
  memberRole: {
    fontSize: 12,
    color: '#999',
  },
  memberTokens: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#667eea',
    marginBottom: 10,
  },
  updateButton: {
    backgroundColor: '#764ba2',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  updateButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  createButton: {
    backgroundColor: '#667eea',
    margin: 10,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  dangerButton: {
    backgroundColor: '#f44336',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  dangerButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    padding: 20,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 15,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 15,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  modalButton: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#ddd',
  },
  cancelButtonText: {
    color: '#333',
    fontWeight: 'bold',
  },
  submitButton: {
    backgroundColor: '#667eea',
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

