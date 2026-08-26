import { render, screen, fireEvent } from '@testing-library/react-native';
import { ContactPicker } from '@/components/ContactPicker';
import { useContactStore } from '@/features/contacts/contactStore';

// Mock the store
jest.mock('@/features/contacts/contactStore', () => ({
  useContactStore: jest.fn(),
}));

describe('ContactPicker', () => {
  const mockOnSelect = jest.fn();
  const mockOnCancel = jest.fn();
  const mockOnAddNew = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders empty state when no contacts', () => {
    (useContactStore as jest.Mock).mockReturnValue({
      contacts: [],
      recentRecipients: [],
      getContactByAddress: jest.fn(),
    });

    render(
      <ContactPicker
        visible={true}
        onSelect={mockOnSelect}
        onCancel={mockOnCancel}
        onAddNew={mockOnAddNew}
      />
    );

    expect(screen.getByText('No contacts yet')).toBeTruthy();
  });

  it('renders saved contacts', () => {
    const mockContacts = [
      { id: '1', name: 'Alice', address: 'GABC123', createdAt: Date.now() },
      { id: '2', name: 'Bob', address: 'GDEF456', createdAt: Date.now() },
    ];

    (useContactStore as jest.Mock).mockReturnValue({
      contacts: mockContacts,
      recentRecipients: [],
      getContactByAddress: jest.fn(),
    });

    render(
      <ContactPicker
        visible={true}
        onSelect={mockOnSelect}
        onCancel={mockOnCancel}
        onAddNew={mockOnAddNew}
      />
    );

    expect(screen.getByText('Alice')).toBeTruthy();
    expect(screen.getByText('Bob')).toBeTruthy();
  });

  it('renders recent recipients', () => {
    const mockGetContactByAddress = jest.fn((addr) => {
      if (addr === 'GABC123') return { name: 'Alice' };
      return null;
    });

    (useContactStore as jest.Mock).mockReturnValue({
      contacts: [],
      recentRecipients: ['GABC123', 'GXYZ789'],
      getContactByAddress: mockGetContactByAddress,
    });

    render(
      <ContactPicker
        visible={true}
        onSelect={mockOnSelect}
        onCancel={mockOnCancel}
        onAddNew={mockOnAddNew}
      />
    );

    expect(screen.getByText('Alice')).toBeTruthy();
    expect(screen.getByText('Unknown')).toBeTruthy();
  });

  it('calls onSelect when contact is pressed', () => {
    const mockContacts = [
      { id: '1', name: 'Alice', address: 'GABC123', createdAt: Date.now() },
    ];

    (useContactStore as jest.Mock).mockReturnValue({
      contacts: mockContacts,
      recentRecipients: [],
      getContactByAddress: jest.fn(),
    });

    render(
      <ContactPicker
        visible={true}
        onSelect={mockOnSelect}
        onCancel={mockOnCancel}
        onAddNew={mockOnAddNew}
      />
    );

    fireEvent.press(screen.getByText('Alice'));
    expect(mockOnSelect).toHaveBeenCalledWith('GABC123');
  });

  it('calls onAddNew when add button is pressed', () => {
    (useContactStore as jest.Mock).mockReturnValue({
      contacts: [],
      recentRecipients: [],
      getContactByAddress: jest.fn(),
    });

    render(
      <ContactPicker
        visible={true}
        onSelect={mockOnSelect}
        onCancel={mockOnCancel}
        onAddNew={mockOnAddNew}
      />
    );

    fireEvent.press(screen.getByText('Add New Contact'));
    expect(mockOnAddNew).toHaveBeenCalled();
  });

  it('filters contacts by search query', () => {
    const mockContacts = [
      { id: '1', name: 'Alice', address: 'GABC123', createdAt: Date.now() },
      { id: '2', name: 'Bob', address: 'GDEF456', createdAt: Date.now() },
    ];

    (useContactStore as jest.Mock).mockReturnValue({
      contacts: mockContacts,
      recentRecipients: [],
      getContactByAddress: jest.fn(),
    });

    render(
      <ContactPicker
        visible={true}
        onSelect={mockOnSelect}
        onCancel={mockOnCancel}
        onAddNew={mockOnAddNew}
      />
    );

    const searchInput = screen.getByPlaceholderText('Search contacts...');
    fireEvent.changeText(searchInput, 'alice');

    expect(screen.getByText('Alice')).toBeTruthy();
    expect(screen.queryByText('Bob')).toBeNull();
  });
});
