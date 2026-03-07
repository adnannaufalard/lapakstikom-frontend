'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button, Alert } from '@/components/ui';

export default function EscrowActionsPage() {
  const searchParams = useSearchParams();
  const transactionId = searchParams?.get('transaction');
  
  const [selectedAction, setSelectedAction] = useState<'release' | 'refund' | null>(null);
  const [reason, setReason] = useState('');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess('');
    setError('');

    if (!selectedAction) {
      setError('Please select an action');
      return;
    }

    // Simulate API call
    setTimeout(() => {
      setSuccess(`Funds ${selectedAction === 'release' ? 'released to seller' : 'refunded to buyer'} successfully`);
      setReason('');
      setSelectedAction(null);
    }, 1000);
  };

  return (
    <div className="space-y-6">


      {success && <Alert variant="success">{success}</Alert>}
      {error && <Alert variant="error">{error}</Alert>}

      {/* Action Form */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Transaction Info */}
          {transactionId && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                Processing transaction: <span className="font-semibold">{transactionId}</span>
              </p>
            </div>
          )}

          {/* Action Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Select Action
            </label>
            <div className="grid gap-4 md:grid-cols-2">
              <button
                type="button"
                onClick={() => setSelectedAction('release')}
                className={`p-6 rounded-lg border-2 transition-all ${
                  selectedAction === 'release'
                    ? 'border-green-600 bg-green-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Release Funds</h3>
                </div>
                <p className="text-sm text-gray-600">Transfer funds to seller's account</p>
              </button>

              <button
                type="button"
                onClick={() => setSelectedAction('refund')}
                className={`p-6 rounded-lg border-2 transition-all ${
                  selectedAction === 'refund'
                    ? 'border-red-600 bg-red-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Refund to Buyer</h3>
                </div>
                <p className="text-sm text-gray-600">Return funds to buyer's account</p>
              </button>
            </div>
          </div>

          {/* Reason */}
          <div>
            <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-2">
              Reason / Notes {selectedAction === 'refund' && <span className="text-red-600">*</span>}
            </label>
            <textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter reason for this action..."
              required={selectedAction === 'refund'}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button type="submit" disabled={!selectedAction}>
              {selectedAction === 'release' ? 'Release Funds' : selectedAction === 'refund' ? 'Process Refund' : 'Select Action'}
            </Button>
            <Button type="button" variant="secondary" onClick={() => window.history.back()}>
              Cancel
            </Button>
          </div>
        </form>
      </div>

      {/* Warning */}
      <Alert variant="warning">
        <div className="flex items-start gap-2">
          <svg className="w-5 h-5 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="text-sm">
            This action cannot be undone. Make sure you have reviewed all transaction details and evidence before proceeding.
          </p>
        </div>
      </Alert>
    </div>
  );
}
