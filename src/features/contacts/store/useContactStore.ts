import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { MMKV } from 'react-native-mmkv';

const storage = new MMKV();

export interface Contact {
  id: string;
  name: string;
  address: string;
  timestamp: number; // For recent sorting
}

interface ContactState {
  contacts: Contact[];
  recentRecipients: Contact[];
  addContact: (name: string, address: string) => void;
  removeContact: (id: string) => void;
  updateContact: (id: string, name: string, address: string) => void;
  addRecent: (address: string) => void;
}

export const useContactStore = create<ContactState>()(
  persist(
    (set, get) => ({
      contacts: [],
      recentRecipients: [],
      
      addContact: (name, address) => {
        const exists = get().contacts.find(c => c.address === address);
        if (exists) throw new Error('Address already exists in contacts');
        
        set({ contacts: [...get().contacts, { id: Date.now().toString(), name, address, timestamp: Date.now() }] });
      },

      removeContact: (id) => set({ contacts: get().contacts.filter(c => c.id !== id) }),

      updateContact: (id, name, address) => set({
        contacts: get().contacts.map(c => c.id === id ? { ...c, name, address } : c)
      }),

      addRecent: (address) => {
        const newRecent = { id: address, name: 'Unknown', address, timestamp: Date.now() };
        const filtered = get().recentRecipients.filter(r => r.address !== address).slice(0, 4);
        set({ recentRecipients: [newRecent, ...filtered] });
      }
    }),
    { name: 'address-book', storage: createJSONStorage(() => storage) }
  )
);
