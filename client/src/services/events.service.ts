import api from './api';

export interface Event {
  id: string;
  name: string;
  code: string;
  description: string;
  ownerId: string;
  myRole?: string;
  myTokens?: number;
  isActive: boolean;
  createdAt: string;
}

export interface EventMember {
  id: string;
  userId: string;
  name: string;
  email: string;
  tokens: number;
  role: string;
  joinedAt: string;
}

export interface Purchasable {
  id: string;
  name: string;
  description: string;
  price: number;
  isAvailable: boolean;
  stock: number;
  imageUrl?: string;
}

export interface Transaction {
  id: string;
  amount: number;
  type: string;
  description: string;
  createdAt: string;
}

export interface GlobalTransaction {
  id: string;
  userId: string;
  userName: string;
  amount: number;
  type: string;
  description: string;
  stationName: string | null;
  createdAt: string;
}

export const eventsService = {
  createEvent: async (name: string, description?: string) => {
    const response = await api.post('/events', { name, description });
    return response.data;
  },

  joinEvent: async (code: string) => {
    const response = await api.post('/events/join', { code });
    return response.data;
  },

  getMyEvents: async (): Promise<Event[]> => {
    const response = await api.get('/events/my-events');
    return response.data;
  },

  getEventDetails: async (eventId: string) => {
    const response = await api.get(`/events/${eventId}`);
    return response.data;
  },

  updateTokens: async (eventId: string, userId: string, amount: number) => {
    const response = await api.put(`/events/${eventId}/tokens`, { userId, amount });
    return response.data;
  },

  promoteMember: async (eventId: string, userId: string, role: string) => {
    const response = await api.put(`/events/${eventId}/promote`, { userId, role });
    return response.data;
  },

  createStation: async (eventId: string, name: string, price: number, description?: string, stock?: number, imageUrl?: string) => {
    const response = await api.post(`/events/${eventId}/stations`, { name, price, description, stock, imageUrl });
    return response.data;
  },

  updateStation: async (eventId: string, stationId: string, data: Partial<Purchasable>) => {
    const response = await api.put(`/events/${eventId}/stations/${stationId}`, data);
    return response.data;
  },

  deleteStation: async (eventId: string, stationId: string) => {
    const response = await api.delete(`/events/${eventId}/stations/${stationId}`);
    return response.data;
  },

  purchase: async (eventId: string, stationId: string) => {
    const response = await api.post(`/events/${eventId}/purchase`, { stationId });
    return response.data;
  },

  getTransactions: async (eventId: string): Promise<Transaction[]> => {
    const response = await api.get(`/events/${eventId}/transactions`);
    return response.data;
  },

  getAllTransactions: async (eventId: string): Promise<GlobalTransaction[]> => {
    const response = await api.get(`/events/${eventId}/transactions/all`);
    return response.data;
  },

  deleteEvent: async (eventId: string) => {
    const response = await api.delete(`/events/${eventId}`);
    return response.data;
  },
};
