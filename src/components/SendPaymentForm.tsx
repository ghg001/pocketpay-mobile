import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import { useDirtyForm } from '../hooks/useDirtyForm';
import { DirtyFormConfirm } from './DirtyFormConfirm';

interface SendPaymentFormData {
  recipient: string;
  amount: string;
  currency: string;
  memo?: string;
}

export const SendPaymentForm: React.FC = () => {
  const router = useRouter();
  const [formData, setFormData] = useState<SendPaymentFormData>({
    recipient: '',
    amount: '',
    currency: 'XLM',
    memo: '',
  });
  const [initialData] = useState<SendPaymentFormData>(formData);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check if form is dirty (has unsaved changes)
  const isDirty = JSON.stringify(formData) !== JSON.stringify(initialData);

  const {
    showConfirm,
    handleConfirmLeave,
    handleCancelLeave,
    resetDirty,
  } = useDirtyForm({
    isDirty,
    message: 'You have unsaved changes in the payment form. Are you sure you want to leave?',
    onConfirmLeave: () => {
      resetDirty();
      router.back();
    },
  });

  const handleInputChange = (field: keyof SendPaymentFormData) => (
    e: any
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: e.target.value,
    }));
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // Submit payment logic here
      console.log('Submitting payment:', formData);
      // On success, reset dirty state and navigate
      resetDirty();
      router.push('/(tabs)');
    } catch (error) {
      console.error('Payment failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (isDirty) {
      // The hook will handle showing the confirmation
      return;
    }
    router.back();
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="send-payment-form">
        <h2>Send Payment</h2>

        <div className="form-group">
          <label htmlFor="recipient">Recipient Address</label>
          <input
            id="recipient"
            type="text"
            value={formData.recipient}
            onChange={handleInputChange('recipient')}
            placeholder="G... or @username"
            className="form-input"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="amount">Amount</label>
          <input
            id="amount"
            type="number"
            value={formData.amount}
            onChange={handleInputChange('amount')}
            placeholder="0.00"
            className="form-input"
            required
            min="0"
            step="0.0000001"
          />
        </div>

        <div className="form-group">
          <label htmlFor="currency">Currency</label>
          <select
            id="currency"
            value={formData.currency}
            onChange={handleInputChange('currency')}
            className="form-input"
          >
            <option value="XLM">XLM</option>
            <option value="USDC">USDC</option>
            <option value="EURT">EURT</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="memo">Memo (Optional)</label>
          <input
            id="memo"
            type="text"
            value={formData.memo}
            onChange={handleInputChange('memo')}
            placeholder="Payment for invoice #123"
            className="form-input"
          />
        </div>

        <div className="form-actions">
          <button
            type="button"
            onClick={handleCancel}
            className="btn btn-secondary"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Sending...' : 'Send Payment'}
          </button>
        </div>
      </form>

      <DirtyFormConfirm
        isOpen={showConfirm}
        message="You have unsaved changes in the payment form. Are you sure you want to leave?"
        onConfirm={handleConfirmLeave}
        onCancel={handleCancelLeave}
      />

      <style>{`
        .send-payment-form {
          max-width: 500px;
          margin: 0 auto;
          padding: 24px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .send-payment-form h2 {
          margin: 0 0 24px 0;
          font-size: 24px;
          font-weight: 600;
          color: #1a1a2e;
        }

        .form-group {
          margin-bottom: 16px;
        }

        .form-group label {
          display: block;
          margin-bottom: 4px;
          font-size: 14px;
          font-weight: 500;
          color: #333;
        }

        .form-input {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid #ddd;
          border-radius: 6px;
          font-size: 14px;
          transition: border-color 0.2s;
        }

        .form-input:focus {
          outline: none;
          border-color: #0066cc;
          box-shadow: 0 0 0 2px rgba(0,102,204,0.1);
        }

        .form-actions {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
          margin-top: 24px;
        }

        .btn {
          padding: 10px 24px;
          border: none;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .btn-primary {
          background: #0066cc;
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          background: #0052a3;
        }

        .btn-secondary {
          background: #f0f0f0;
          color: #333;
        }

        .btn-secondary:hover:not(:disabled) {
          background: #e0e0e0;
        }
      `}</style>
    </>
  );
};