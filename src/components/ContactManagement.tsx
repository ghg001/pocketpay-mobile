import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useContactStore } from '@/features/contacts/contactStore';
import { ContactForm } from '@/components/ContactForm';
import { useConfirm } from '@/hooks/useConfirm';
import { User, Edit2, Trash2, Plus } from 'lucide-react-native';

export const ContactManagement: React.FC = () => {
  const { contacts, addContact, updateContact, deleteContact } = useContactStore();
  const { confirm, confirmationDialog } = useConfirm();
  const [showForm, setShowForm] = useState(false);
  const [editingContact, setEditingContact] = useState<{
    id: string;
    name: string;
    address: string;
  } | null>(null);

  const handleAdd = () => {
    setEditingContact(null);
    setShowForm(true);
  };

  const handleEdit = (contact: { id: string; name: string; address: string }) => {
    setEditingContact(contact);
    setShowForm(true);
  };

  const handleDelete = (contact: { id: string; name: string; address: string }) => {
    // Truncate address for readability if needed, but prefer the name
    const displayName = contact.name ||
        (contact.address ? `${contact.address.slice(0, 8)}...${contact.address.slice(-6)}` : 'this contact');

    void confirm({
      title: 'Delete Contact',
      message: `Are you sure you want to delete "${displayName}"? This action cannot be undone.`,
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
      destructive: true,
      onConfirm: () => deleteContact(contact.id),
    });
  };

  const handleSave = (name: string, address: string) => {
    if (editingContact) {
      updateContact(editingContact.id, name, address);
    } else {
      addContact(name, address);
    }
    setShowForm(false);
    setEditingContact(null);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingContact(null);
  };

  return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Contacts</Text>
          <TouchableOpacity style={styles.addButton} onPress={handleAdd}>
            <Plus size={24} color="#0066cc" />
          </TouchableOpacity>
        </View>

        {contacts.length === 0 ? (
            <View style={styles.emptyState}>
              <User size={64} color="#ccc" />
              <Text style={styles.emptyTitle}>No contacts yet</Text>
              <Text style={styles.emptyText}>
                Add contacts to quickly send payments to your friends and family.
              </Text>
            </View>
        ) : (
            <ScrollView style={styles.list}>
              {contacts.map((contact) => (
                  <View key={contact.id} style={styles.contactCard}>
                    <View style={styles.contactHeader}>
                      <View style={styles.icon}>
                        <User size={24} color="#666" />
                      </View>
                      <View style={styles.contactInfo}>
                        <Text style={styles.contactName}>{contact.name}</Text>
                        <Text style={styles.contactAddress} numberOfLines={1}>
                          {contact.address}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.actions}>
                      <TouchableOpacity
                          style={styles.actionButton}
                          onPress={() => handleEdit(contact)}
                      >
                        <Edit2 size={20} color="#0066cc" />
                      </TouchableOpacity>
                      <TouchableOpacity
                          style={styles.actionButton}
                          onPress={() => handleDelete(contact)}
                      >
                        <Trash2 size={20} color="#dc2626" />
                      </TouchableOpacity>
                    </View>
                  </View>
              ))}
            </ScrollView>
        )}

        <ContactForm
            visible={showForm}
            contact={editingContact}
            onSave={handleSave}
            onCancel={handleCancel}
        />

        {confirmationDialog}
      </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
  },
  addButton: {
    padding: 8,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  list: {
    flex: 1,
    padding: 20,
  },
  contactCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  contactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  icon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#e5e5e5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 18,
    fontWeight: '500',
    marginBottom: 4,
  },
  contactAddress: {
    fontSize: 14,
    color: '#666',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  actionButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#fff',
  },
});