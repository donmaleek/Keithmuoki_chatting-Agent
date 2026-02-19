import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ReplyEditor } from './ReplyEditor';

describe('ReplyEditor Component', () => {
  const mockOnSend = jest.fn();
  const mockConversationId = 'conv_1';

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    localStorage.clear();
  });

  it('should render textarea for message input', () => {
    render(
      <ReplyEditor
        conversationId={mockConversationId}
        onSend={mockOnSend}
      />
    );

    const textarea = screen.getByPlaceholderText(/Type your message/i);
    expect(textarea).toBeInTheDocument();
  });

  it('should update text content on input change', () => {
    render(
      <ReplyEditor
        conversationId={mockConversationId}
        onSend={mockOnSend}
      />
    );

    const textarea = screen.getByPlaceholderText(/Type your message/i) as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: 'Hello client!' } });

    expect(textarea.value).toBe('Hello client!');
  });

  it('should call onSend with message content', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 'msg_1', content: 'Message sent!' })
    });

    render(
      <ReplyEditor
        conversationId={mockConversationId}
        onSend={mockOnSend}
      />
    );

    const textarea = screen.getByPlaceholderText(/Type your message/i);
    const sendButton = screen.getByRole('button', { name: /Send/i });

    fireEvent.change(textarea, { target: { value: 'Test message' } });
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(mockOnSend).toHaveBeenCalledWith(
        expect.objectContaining({ content: 'Test message' })
      );
    });
  });

  it('should request AI suggestion', async () => {
    const mockAiResponse = {
      reply: 'Thank you for reaching out!',
      confidence: 0.92,
      mode: 'draft'
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockAiResponse
    });

    localStorage.setItem('token', 'test_token');

    render(
      <ReplyEditor
        conversationId={mockConversationId}
        onSend={mockOnSend}
      />
    );

    const textarea = screen.getByPlaceholderText(/Type your message/i);
    const aiButton = screen.getByRole('button', { name: /Suggest with AI/i });

    fireEvent.change(textarea, { target: { value: 'What is the price?' } });
    fireEvent.click(aiButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/ai/respond'),
        expect.any(Object)
      );
    });
  });

  it('should display AI suggestion with confidence score', async () => {
    const mockAiResponse = {
      reply: 'The price is $99.99',
      confidence: 0.85,
      mode: 'draft'
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockAiResponse
    });

    localStorage.setItem('token', 'test_token');

    render(
      <ReplyEditor
        conversationId={mockConversationId}
        onSend={mockOnSend}
      />
    );

    const aiButton = screen.getByRole('button', { name: /Suggest with AI/i });
    fireEvent.click(aiButton);

    await waitFor(() => {
      expect(screen.getByText(/85%/)).toBeInTheDocument();
    });
  });

  it('should accept AI suggestion and populate textarea', async () => {
    const mockAiResponse = {
      reply: 'Thank you for your inquiry!',
      confidence: 0.9,
      mode: 'draft'
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockAiResponse
    });

    localStorage.setItem('token', 'test_token');

    render(
      <ReplyEditor
        conversationId={mockConversationId}
        onSend={mockOnSend}
      />
    );

    const aiButton = screen.getByRole('button', { name: /Suggest with AI/i });
    fireEvent.click(aiButton);

    await waitFor(() => {
      const acceptButton = screen.getByRole('button', { name: /Accept/i });
      fireEvent.click(acceptButton);
    });

    const textarea = screen.getByPlaceholderText(/Type your message/i) as HTMLTextAreaElement;
    expect(textarea.value).toBe('Thank you for your inquiry!');
  });

  it('should disable send button if textarea is empty', () => {
    render(
      <ReplyEditor
        conversationId={mockConversationId}
        onSend={mockOnSend}
      />
    );

    const sendButton = screen.getByRole('button', { name: /Send/i });
    expect(sendButton).toBeDisabled();
  });

  it('should enable send button when text is entered', () => {
    render(
      <ReplyEditor
        conversationId={mockConversationId}
        onSend={mockOnSend}
      />
    );

    const textarea = screen.getByPlaceholderText(/Type your message/i);
    const sendButton = screen.getByRole('button', { name: /Send/i });

    fireEvent.change(textarea, { target: { value: 'Hello' } });
    expect(sendButton).not.toBeDisabled();
  });
});
