import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { ContactPicker } from '../src/components/ContactPicker';
import { ContactManagement } from '../src/components/ContactManagement';
import { useContactStore } from '../src/features/contacts/contactStore';
import { useConfirm } from '../src/hooks/useConfirm';

// Mock the stores and hooks
jest.mock('../src/features/contacts/contactStore');
jest.mock('../src/hooks/useConfirm');

const mockContact = {
    id: '123',
    name: 'Test User',
    address: 'GABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890',
};

describe('Contact Delete Confirmation', () => {
    beforeEach(() => {
        jest.clearAllMocks();

        // Mock useConfirm
        (useConfirm as jest.Mock).mockReturnValue({
            confirm: jest.fn().mockResolvedValue(true),
            confirmationDialog: null,
            isVisible: false,
        });

        // Mock useContactStore
        (useContactStore as jest.Mock).mockReturnValue({
            contacts: [mockContact],
            recentRecipients: [],
            getContactByAddress: jest.fn(),
            deleteContact: jest.fn(),
            addContact: jest.fn(),
            updateContact: jest.fn(),
        });
    });

    it('shows confirmation dialog when deleting a contact', async () => {
        const mockConfirm = jest.fn().mockResolvedValue(true);
        (useConfirm as jest.Mock).mockReturnValue({
            confirm: mockConfirm,
            confirmationDialog: null,
            isVisible: false,
        });

        const { getByText, getByTestId } = render(<ContactPicker
            visible={true}
            onSelect={jest.fn()}
            onCancel={jest.fn()}
            onAddNew={jest.fn()}
            onEdit={jest.fn()}
        />);

        // Find and press delete button
        const deleteButton = getByTestId('delete-contact-123');
        fireEvent.press(deleteButton);

        await waitFor(() => {
            expect(mockConfirm).toHaveBeenCalledWith({
                title: 'Delete Contact',
                message: expect.stringContaining(mockContact.name),
                confirmLabel: 'Delete',
                cancelLabel: 'Cancel',
                destructive: true,
                onConfirm: expect.any(Function),
            });
        });
    });

    it('identifies contact by name in confirmation message', async () => {
        const mockConfirm = jest.fn();
        (useConfirm as jest.Mock).mockReturnValue({
            confirm: mockConfirm,
            confirmationDialog: null,
            isVisible: false,
        });

        const { getByTestId } = render(<ContactManagement />);

        // Find and press delete button
        const deleteButton = getByTestId('delete-contact-123');
        fireEvent.press(deleteButton);

        await waitFor(() => {
            expect(mockConfirm).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: expect.stringContaining(mockContact.name),
                })
            );
        });
    });

    it('handles cancel action without deleting contact', async () => {
        const mockDeleteContact = jest.fn();
        const mockConfirm = jest.fn().mockResolvedValue(false);

        (useContactStore as jest.Mock).mockReturnValue({
            contacts: [mockContact],
            recentRecipients: [],
            getContactByAddress: jest.fn(),
            deleteContact: mockDeleteContact,
        });

        (useConfirm as jest.Mock).mockReturnValue({
            confirm: mockConfirm,
            confirmationDialog: null,
            isVisible: false,
        });

        const { getByTestId } = render(<ContactManagement />);

        const deleteButton = getByTestId('delete-contact-123');
        fireEvent.press(deleteButton);

        await waitFor(() => {
            expect(mockConfirm).toHaveBeenCalled();
            expect(mockDeleteContact).not.toHaveBeenCalled();
        });
    });

    it('confirms deletion and removes contact from list', async () => {
        const mockDeleteContact = jest.fn();
        const mockConfirm = jest.fn().mockImplementation(({ onConfirm }) => {
            onConfirm();
            return Promise.resolve(true);
        });

        (useContactStore as jest.Mock).mockReturnValue({
            contacts: [mockContact],
            recentRecipients: [],
            getContactByAddress: jest.fn(),
            deleteContact: mockDeleteContact,
        });

        (useConfirm as jest.Mock).mockReturnValue({
            confirm: mockConfirm,
            confirmationDialog: null,
            isVisible: false,
        });

        const { getByTestId } = render(<ContactManagement />);

        const deleteButton = getByTestId('delete-contact-123');
        fireEvent.press(deleteButton);

        await waitFor(() => {
            expect(mockDeleteContact).toHaveBeenCalledWith(mockContact.id);
        });
    });

    it('truncates long addresses in confirmation when name is not available', async () => {
        const contactWithoutName = {
            ...mockContact,
            name: '',
        };

        (useContactStore as jest.Mock).mockReturnValue({
            contacts: [contactWithoutName],
            recentRecipients: [],
            getContactByAddress: jest.fn(),
            deleteContact: jest.fn(),
        });

        const mockConfirm = jest.fn();
        (useConfirm as jest.Mock).mockReturnValue({
            confirm: mockConfirm,
            confirmationDialog: null,
            isVisible: false,
        });

        const { getByTestId } = render(<ContactManagement />);

        const deleteButton = getByTestId('delete-contact-123');
        fireEvent.press(deleteButton);

        await waitFor(() => {
            expect(mockConfirm).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: expect.stringContaining('...'),
                })
            );
        });
    });
});