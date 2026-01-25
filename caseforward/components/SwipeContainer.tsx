'use client';

import { useState } from 'react';

interface SwipeContainerProps {
  caseId: string;
  actionCard?: {
    recommendation?: 'approve' | 'reject' | 'review' | string;
    reasoning?: string;
    confidence?: number;
    [key: string]: any;
  };
  onApprove: () => void;
  onReject: (comment: string) => void;
}

export default function SwipeContainer({ caseId, actionCard, onApprove, onReject }: SwipeContainerProps) {
  const [comment, setComment] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleApprove = async () => {
    setIsProcessing(true);
    try {
      await fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caseId,
          action: actionCard,
        }),
      });
      onApprove();
    } catch (error) {
      console.error('Approve error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!comment.trim()) {
      alert('Please provide a comment for rejection');
      return;
    }
    setIsProcessing(true);
    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caseId,
          comment,
          type: 'rejection',
        }),
      });
      onReject(comment);
    } catch (error) {
      console.error('Reject error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 p-6 bg-white rounded-lg shadow-lg border border-gray-200">
      {actionCard && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-gray-700">Recommendation:</span>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              (actionCard?.recommendation ?? '') === 'approve' ? 'bg-green-100 text-green-800' :
              (actionCard?.recommendation ?? '') === 'reject' ? 'bg-red-100 text-red-800' :
              'bg-yellow-100 text-yellow-800'
            }`}>
              {(actionCard?.recommendation ?? '').toString().toUpperCase()}
            </span>
          </div>
          <p className="text-sm text-gray-600 mb-2">{actionCard?.reasoning ?? ''}</p>
          <div className="text-xs text-gray-500">Confidence: {actionCard?.confidence ?? 0}%</div>
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={handleApprove}
          disabled={isProcessing}
          className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isProcessing ? 'Processing...' : '✓ Approve (Swipe Right)'}
        </button>
        <button
          onClick={handleReject}
          disabled={isProcessing}
          className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isProcessing ? 'Processing...' : '✗ Reject (Swipe Left)'}
        </button>
      </div>

      <div className="mt-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Rejection Comment (required for reject):
        </label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Explain why you're rejecting this case..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none"
          rows={3}
        />
      </div>
    </div>
  );
}

