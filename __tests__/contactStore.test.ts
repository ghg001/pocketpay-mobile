import { useContactStore } from '@/features/contacts/contactStore';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
  multiGet: jest.fn(),
  multiSet: jest.fn(),
  clear: jest.fn(),
}));

describe('ContactStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useContactStore.setState({ contacts: [], recentRecipients: [] });
  });

  describe('addContact', () => {
    it('adds a new contact with trimmed values', () => {
      const store = useContactStore.getState();
      const contact = store.addContact('  Alice  ', '  GABC123  ');

      expect(contact.name).toBe('Alice');
      expect(contact.address).toBe('GABC123');
      expect(contact.id).toBeDefined();
      expect(contact.createdAt).toBeDefined();

      const { contacts } = useContactStore.getState();
      expect(contacts).toHaveLength(1);
      expect(contacts[0]).toEqual(contact);
    });

    it('adds multiple contacts', () => {
      const store = useContactStore.getState();
      store.addContact('Alice', 'GABC123');
      store.addContact('Bob', 'GDEF456');

      const { contacts } = useContactStore.getState();
      expect(contacts).toHaveLength(2);
    });
  });

  describe('updateContact', () => {
    it('updates existing contact with trimmed values', () => {
      const store = useContactStore.getState();
      const contact = store.addContact('Alice', 'GABC123');

      store.updateContact(contact.id, '  Bob  ', '  GDEF456  ');

      const { contacts } = useContactStore.getState();
      expect(contacts[0].name).toBe('Bob');
      expect(contacts[0].address).toBe('GDEF456');
    });

    it('does not update non-existent contact', () => {
      const store = useContactStore.getState();
      store.addContact('Alice', 'GABC123');

      store.updateContact('non-existent', 'Bob', 'GDEF456');

      const { contacts } = useContactStore.getState();
      expect(contacts).toHaveLength(1);
      expect(contacts[0].name).toBe('Alice');
    });
  });

  describe('deleteContact', () => {
    it('deletes contact by id', () => {
      const store = useContactStore.getState();
      const contact = store.addContact('Alice', 'GABC123');

      store.deleteContact(contact.id);

      const { contacts } = useContactStore.getState();
      expect(contacts).toHaveLength(0);
    });

    it('does not delete non-existent contact', () => {
      const store = useContactStore.getState();
      store.addContact('Alice', 'GABC123');

      store.deleteContact('non-existent');

      const { contacts } = useContactStore.getState();
      expect(contacts).toHaveLength(1);
    });
  });

  describe('addRecentRecipient', () => {
    it('adds address to recent recipients', () => {
      const store = useContactStore.getState();
      store.addRecentRecipient('GABC123');

      const { recentRecipients } = useContactStore.getState();
      expect(recentRecipients).toEqual(['GABC123']);
    });

    it('moves duplicate address to front', () => {
      const store = useContactStore.getState();
      store.addRecentRecipient('GABC123');
      store.addRecentRecipient('GDEF456');
      store.addRecentRecipient('GABC123');

      const { recentRecipients } = useContactStore.getState();
      expect(recentRecipients).toEqual(['GABC123', 'GDEF456']);
    });

    it('limits to 10 recent recipients', () => {
      const store = useContactStore.getState();
      
      for (let i = 0; i < 15; i++) {
        store.addRecentRecipient(`GABC${i}`);
      }

      const { recentRecipients } = useContactStore.getState();
      expect(recentRecipients).toHaveLength(10);
    });

    it('maintains most recent first order', () => {
      const store = useContactStore.getState();
      store.addRecentRecipient('FIRST');
      store.addRecentRecipient('SECOND');
      store.addRecentRecipient('THIRD');

      const { recentRecipients } = useContactStore.getState();
      expect(recentRecipients).toEqual(['THIRD', 'SECOND', 'FIRST']);
    });
  });

  describe('getContactByAddress', () => {
    it('returns contact with matching address', () => {
      const store = useContactStore.getState();
      const contact = store.addContact('Alice', 'GABC123');

      const result = store.getContactByAddress('GABC123');
      expect(result).toEqual(contact);
    });

    it('returns undefined for non-existent address', () => {
      const store = useContactStore.getState();
      store.addContact('Alice', 'GABC123');

      const result = store.getContactByAddress('GXYZ789');
      expect(result).toBeUndefined();
    });

    it('returns undefined when no contacts exist', () => {
      const store = useContactStore.getState();
      const result = store.getContactByAddress('GABC123');
      expect(result).toBeUndefined();
    });
  });

  describe('persistence', () => {
    it('initializes with empty state', () => {
      const { contacts, recentRecipients } = useContactStore.getState();
      expect(contacts).toEqual([]);
      expect(recentRecipients).toEqual([]);
    });

    it('persists state changes', async () => {
      const store = useContactStore.getState();
      store.addContact('Alice', 'GABC123');

      // Verify AsyncStorage was called
      expect(AsyncStorage.setItem).toHaveBeenCalled();
    });
  });
});
