import api from './api';

export interface Event {
  id: string;
  name: string;
  slug: string;
  description: string;
  ownerId: string;
  myRole?: string;
  myTokens?: number;
  isActive: boolean;
  isArchived: boolean;
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

  joinEvent: async (slug: string) => {
    const response = await api.post('/events/join', { slug });
    return response.data;
  },

  getMyEvents: async (): Promise<Event[]> => {
    const response = await api.get('/events/my-events');
    return response.data;
  },

  getMyArchivedEvents: async (): Promise<Event[]> => {
    const response = await api.get('/events/my-events/archived');
    return response.data;
  },

  getEventDetails: async (eventSlug: string) => {
    const response = await api.get(`/events/${eventSlug}`);
    return response.data;
  },

  updateTokens: async (eventSlug: string, userId: string, amount: number) => {
    const response = await api.put(`/events/${eventSlug}/tokens`, { userId, amount });
    return response.data;
  },

  promoteMember: async (eventSlug: string, userId: string, role: string) => {
    const response = await api.put(`/events/${eventSlug}/promote`, { userId, role });
    return response.data;
  },

  createStation: async (eventSlug: string, name: string, price: number, description?: string, stock?: number, imageUrl?: string) => {
    const response = await api.post(`/events/${eventSlug}/stations`, { name, price, description, stock, imageUrl });
    return response.data;
  },

  updateStation: async (eventSlug: string, stationId: string, data: Partial<Purchasable>) => {
    const response = await api.put(`/events/${eventSlug}/stations/${stationId}`, data);
    return response.data;
  },

  deleteStation: async (eventSlug: string, stationId: string) => {
    const response = await api.delete(`/events/${eventSlug}/stations/${stationId}`);
    return response.data;
  },

  purchase: async (eventSlug: string, stationId: string) => {
    const response = await api.post(`/events/${eventSlug}/purchase`, { stationId });
    return response.data;
  },

  getTransactions: async (eventSlug: string): Promise<Transaction[]> => {
    const response = await api.get(`/events/${eventSlug}/transactions`);
    return response.data;
  },

  getAllTransactions: async (eventSlug: string): Promise<GlobalTransaction[]> => {
    const response = await api.get(`/events/${eventSlug}/transactions/all`);
    return response.data;
  },

  archiveEvent: async (eventSlug: string) => {
    const response = await api.put(`/events/${eventSlug}/archive`);
    return response.data;
  },

  unarchiveEvent: async (eventSlug: string) => {
    const response = await api.put(`/events/${eventSlug}/unarchive`);
    return response.data;
  },

  deleteEvent: async (eventSlug: string) => {
    const response = await api.delete(`/events/${eventSlug}`);
    return response.data;
  },
};
