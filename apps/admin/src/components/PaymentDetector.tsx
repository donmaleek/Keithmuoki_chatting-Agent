import { useMemo } from 'react';
import { apiClient } from '@/lib/api';

interface PaymentDetectorProps {
  messageContent: string;
  conversationId: string;
  clientId: string;
  onPaymentLinkCreated?: (link: string) => void;
}

const PAYMENT_KEYWORDS = [
  'pay',
  'payment',
  'invoice',
  'bill',
  'charge',
  'price',
  'cost',
  'amount',
  'transfer',
  'money'
];

export function PaymentDetector({
  messageContent,
  conversationId: _conversationId,
  clientId,
  onPaymentLinkCreated
}: PaymentDetectorProps) {
  const hasPaymentIntent = useMemo(() => {
    const lowercased = messageContent.toLowerCase();
    return PAYMENT_KEYWORDS.some((keyword) => lowercased.includes(keyword));
  }, [messageContent]);

  const handleCreatePaymentLink = async () => {
    try {
      const response = await apiClient.post<{ url: string; paymentIntentId: string }>(
        '/payments/link',
        {
          clientId,
          provider: 'stripe',
          amount: 10000, // Default amount in cents ($100)
          currency: 'USD'
        }
      );

      onPaymentLinkCreated?.(response.url);
      alert(`Payment link created:\n${response.url}`);
    } catch (err) {
      console.error('Failed to create payment link:', err);
      alert('Failed to create payment link. Please try again.');
    }
  };

  if (!hasPaymentIntent) {
    return null;
  }

  return (
    <div className="mx-3 mt-3 p-3 bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200/60 rounded-xl flex items-center justify-between animate-slide-up">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-sm">💳</div>
        <div>
          <p className="text-xs font-semibold text-amber-800">Payment intent detected</p>
          <p className="text-[11px] text-amber-600 mt-0.5">This message mentions payment. Generate a link?</p>
        </div>
      </div>
      <button
        onClick={handleCreatePaymentLink}
        className="px-3 py-1.5 text-xs bg-amber-600 text-white rounded-lg hover:bg-amber-700 font-medium shadow-sm shadow-amber-500/20 whitespace-nowrap"
      >
        Create Link
      </button>
    </div>
  );
}
