import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ConversationList } from './ConversationList';

describe('ConversationList Component', () => {
  const mockOnSelect = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should render loading state initially', () => {
    (global.fetch as jest.Mock).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    render(<ConversationList onSelect={mockOnSelect} />);

    expect(screen.getByText('Loading conversations...')).toBeInTheDocument();
  });

  it('should render conversations after loading', async () => {
    const mockConversations = [
      {
        id: 'conv_1',
        clientId: 'client_1',
        channel: 'whatsapp',
        status: 'open',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'conv_2',
        clientId: 'client_2',
        channel: 'email',
        status: 'closed',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockConversations
    });

    render(<ConversationList onSelect={mockOnSelect} />);

    await waitFor(() => {
      expect(screen.queryByText('Loading conversations...')).not.toBeInTheDocument();
    });

    // Conversations should be rendered
    expect(screen.getByText(/whatsapp/i)).toBeInTheDocument();
    expect(screen.getByText(/email/i)).toBeInTheDocument();
  });

  it('should call onSelect when conversation is clicked', async () => {
    const mockConversations = [
      {
        id: 'conv_1',
        clientId: 'client_1',
        channel: 'whatsapp',
        status: 'open',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockConversations
    });

    render(<ConversationList onSelect={mockOnSelect} />);

    await waitFor(() => {
      expect(screen.getByText(/whatsapp/i)).toBeInTheDocument();
    });

    const conversationButton = screen.getByText(/whatsapp/i).closest('button');
    fireEvent.click(conversationButton!);

    expect(mockOnSelect).toHaveBeenCalledWith('conv_1');
  });

  it('should show error state on fetch failure', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    render(<ConversationList onSelect={mockOnSelect} />);

    await waitFor(() => {
      expect(screen.getByText(/Error:/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/Network error/i)).toBeInTheDocument();
  });

  it('should show empty state when no conversations', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => []
    });

    render(<ConversationList onSelect={mockOnSelect} />);

    await waitFor(() => {
      expect(screen.getByText('No conversations yet')).toBeInTheDocument();
    });
  });

  it('should highlight selected conversation', async () => {
    const mockConversations = [
      {
        id: 'conv_1',
        clientId: 'client_1',
        channel: 'whatsapp',
        status: 'open',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockConversations
    });

    const { rerender } = render(<ConversationList onSelect={mockOnSelect} />);

    await waitFor(() => {
      expect(screen.getByText(/whatsapp/i)).toBeInTheDocument();
    });

    // Rerender with selected prop
    rerender(<ConversationList onSelect={mockOnSelect} selected="conv_1" />);

    const selectedButton = screen.getByText(/whatsapp/i).closest('button');
    expect(selectedButton).toHaveClass('bg-blue-50');
  });
});
