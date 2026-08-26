import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Contact {
  id: string;
  name: string;
  address: string;
}

interface ContactState {
  contacts: Contact[];
  recentRecipients: string[]; // Array of addresses
  addContact: (name: string, address: string) => void;
  updateContact: (id: string, name: string, address: string) => void;
  deleteContact: (id: string) => void;
  addRecentRecipient: (address: string) => void;
  getContactByAddress: (address: string) => Contact | undefined;
}

export const useContactStore = create<ContactState>()(
  persist(
    (set, get) => ({
      contacts: [],
      recentRecipients: [],

      addContact: (name, address) => {
        const normalizedAddress = address.trim();
        // DUPLICATE PREVENTION
        const exists = get().contacts.some(
          (c) => c.address.toLowerCase() === normalizedAddress.toLowerCase()
        );
        if (exists) return;

        const newContact = {
          id: Math.random().toString(36).substring(7),
          name,
          address: normalizedAddress,
        };
        set({ contacts: [newContact, ...get().contacts] });
      },

      updateContact: (id, name, address) => set({
        contacts: get().contacts.map(c => c.id === id ? { ...c, name, address } : c)
      }),

      deleteContact: (id) => set({
        contacts: get().contacts.filter(c => c.id !== id)
      }),

      addRecentRecipient: (address) => {
        const current = get().recentRecipients;
        // Move to front if exists, otherwise add to front and slice to 5
        const filtered = current.filter(a => a !== address);
        set({ recentRecipients: [address, ...filtered].slice(0, 5) });
      },

      getContactByAddress: (address) => 
        get().contacts.find(c => c.address.toLowerCase() === address.toLowerCase()),
    }),
    {
      name: 'pocketpay-contacts',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
