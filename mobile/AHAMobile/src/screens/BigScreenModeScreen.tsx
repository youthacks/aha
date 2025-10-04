import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import { eventsService, GlobalTransaction } from '../services/events.service';

type BigScreenModeScreenRouteProp = RouteProp<RootStackParamList, 'BigScreenMode'>;

interface Props {
  route: BigScreenModeScreenRouteProp;
}

export default function BigScreenModeScreen({ route }: Props) {
  const { eventSlug } = route.params;
  const [transactions, setTransactions] = useState<GlobalTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadTransactions();
    const interval = setInterval(() => loadTransactions(true), 3000);
    return () => clearInterval(interval);
  }, [eventSlug]);

  const loadTransactions = async (silent = false) => {
    try {
      const data = await eventsService.getAllTransactions(eventSlug);
      setTransactions(data);
    } catch (err) {
      console.error('Failed to load transactions', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadTransactions();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#667eea" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>📊 Live Transaction Feed</Text>
        <Text style={styles.subtitle}>Real-time event activity</Text>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        {transactions.length === 0 ? (
          <Text style={styles.emptyText}>No transactions yet</Text>
        ) : (
          transactions.map((tx) => (
            <View key={tx.id} style={styles.transactionCard}>
              <View style={styles.transactionHeader}>
                <Text style={styles.userName}>{tx.userName}</Text>
                <Text style={[styles.amount, tx.amount > 0 ? styles.positive : styles.negative]}>
                  {tx.amount > 0 ? '+' : ''}{tx.amount} 💰
                </Text>
              </View>
              <Text style={styles.description}>{tx.description}</Text>
              {tx.stationName && (
                <Text style={styles.station}>🏪 {tx.stationName}</Text>
              )}
              <Text style={styles.time}>
                {new Date(tx.createdAt).toLocaleString()}
              </Text>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
  },
  header: {
    backgroundColor: '#667eea',
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
  },
  content: {
    flex: 1,
    padding: 10,
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    padding: 40,
    fontSize: 18,
  },
  transactionCard: {
    backgroundColor: '#16213e',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#667eea',
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  amount: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  positive: {
    color: '#4caf50',
  },
  negative: {
    color: '#f44336',
  },
  description: {
    fontSize: 16,
    color: '#e0e0e0',
    marginBottom: 5,
  },
  station: {
    fontSize: 14,
    color: '#667eea',
    marginBottom: 5,
  },
  time: {
    fontSize: 12,
    color: '#999',
  },
});

