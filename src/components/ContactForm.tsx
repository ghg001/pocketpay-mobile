import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { useContactStore } from '@/features/contacts/contactStore';
import { X, Edit2, Trash2, Plus } from 'lucide-react-native';

interface ContactFormProps {
  visible: boolean;
  contact?: { id: string; name: string; address: string } | null;
  onSave: (name: string, address: string) => void;
  onCancel: () => void;
  onDelete?: () => void;
}

export const ContactForm: React.FC<ContactFormProps> = ({
  visible,
  contact,
  onSave,
  onCancel,
  onDelete,
}) => {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [errors, setErrors] = useState<{ name?: string; address?: string }>({});
  const { getContactByAddress } = useContactStore();

  useEffect(() => {
    if (contact) {
      setName(contact.name);
      setAddress(contact.address);
    } else {
      setName('');
      setAddress('');
    }
    setErrors({});
  }, [contact, visible]);

  const validateStellarAddress = (addr: string): boolean => {
    const trimmed = addr.trim();
    if (!trimmed.startsWith('G')) return false;
    if (trimmed.length !== 56) return false;
    if (!/^[A-Z2-7]+$/.test(trimmed)) return false;
    return true;
  };

  const validate = (): boolean => {
    const newErrors: { name?: string; address?: string } = {};

    if (!name.trim()) {
      newErrors.name = 'Name is required';
    } else if (name.trim().length > 50) {
      newErrors.name = 'Name must be 50 characters or less';
    }

    if (!address.trim()) {
      newErrors.address = 'Address is required';
    } else if (!validateStellarAddress(address.trim())) {
      newErrors.address = 'Invalid Stellar address (must start with G and be 56 characters)';
    } else {
      // Check for duplicate address (only if not editing the same contact)
      const existingContact = getContactByAddress(address.trim());
      if (existingContact && (!contact || existingContact.id !== contact.id)) {
        newErrors.address = `Address already saved as "${existingContact.name}"`;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validate()) {
      onSave(name.trim(), address.trim());
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>{contact ? 'Edit Contact' : 'Add Contact'}</Text>
            <TouchableOpacity onPress={onCancel} style={styles.closeButton}>
              <X size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.form}>
            <Input
              label="Name"
              value={name}
              onChangeText={setName}
              placeholder="Contact name"
              error={errors.name}
              maxLength={50}
            />

            <Input
              label="Stellar Address"
              value={address}
              onChangeText={setAddress}
              placeholder="G..."
              error={errors.address}
              autoCapitalize="characters"
              autoCorrect={false}
            />

            <View style={styles.buttons}>
              <Button title="Cancel" variant="outline" onPress={onCancel} />
              <Button title={contact ? 'Update' : 'Save'} onPress={handleSave} />
            </View>

            {contact && onDelete && (
              <TouchableOpacity style={styles.deleteButton} onPress={onDelete}>
                <Trash2 size={16} color="#dc2626" />
                <Text style={styles.deleteText}>Delete Contact</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
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
    fontSize: 20,
    fontWeight: '600',
  },
  closeButton: {
    padding: 8,
  },
  form: {
    padding: 20,
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 20,
    padding: 12,
  },
  deleteText: {
    color: '#dc2626',
    fontSize: 16,
    fontWeight: '500',
  },
});
