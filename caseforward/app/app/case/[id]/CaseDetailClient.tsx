'use client';

import { useState } from 'react';
import Link from 'next/link';
import SwipeContainer from '@/components/SwipeContainer';
import type { Case } from '@/lib/db/models/Case';
import type { Action } from '@/lib/db/models/Action';

interface CaseDetailClientProps {
  case_: Case;
  actions: Action[];
  session: any;
}

export default function CaseDetailClient({ case_, actions, session }: CaseDetailClientProps) {
  const [actionCard, setActionCard] = useState<Action['actionCard'] | null>(null);
  const [consensus, setConsensus] = useState<Action['consensus'] | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [chatLog, setChatLog] = useState<Array<{ role: string; message: string; timestamp: Date }>>([]);

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setChatLog(prev => [...prev, {
      role: 'system',
      message: 'Starting agent analysis...',
      timestamp: new Date(),
    }]);

    try {
      const response = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caseId: case_._id }),
      });

      if (!response.ok) {
        throw new Error('Analysis failed');
      }

      const result = await response.json();
      // Ensure type safety for actionCard
      if (result.actionCard && ['approve', 'reject', 'review'].includes(result.actionCard.recommendation)) {
        setActionCard(result.actionCard as Action['actionCard']);
      }
      setConsensus(result.consensus);

      setChatLog(prev => [
        ...prev,
        {
          role: 'client-guru',
          message: result.consensus.clientGuruOpinion,
          timestamp: new Date(),
        },
        {
          role: 'evidence-analyzer',
          message: result.consensus.evidenceAnalyzerOpinion,
          timestamp: new Date(),
        },
        {
          role: 'orchestrator',
          message: result.consensus.finalDecision,
          timestamp: new Date(),
        },
      ]);
    } catch (error) {
      console.error('Analysis error:', error);
      setChatLog(prev => [...prev, {
        role: 'system',
        message: 'Analysis failed. Please try again.',
        timestamp: new Date(),
      }]);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleApprove = () => {
    setChatLog(prev => [...prev, {
      role: 'user',
      message: 'Case approved',
      timestamp: new Date(),
    }]);
    // Refresh page or update UI
    window.location.reload();
  };

  const handleReject = (comment: string) => {
    setChatLog(prev => [...prev, {
      role: 'user',
      message: `Case rejected: ${comment}`,
      timestamp: new Date(),
    }]);
    // Refresh page or update UI
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <Link href="/app" className="text-2xl font-bold text-gray-900">
              CaseForward AI
            </Link>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">{session.user?.name || session.user?.email}</span>
              <a
                href="/auth/logout"
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                Logout
              </a>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link href="/app" className="text-blue-600 hover:underline mb-4 inline-block">
            ← Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">{case_.title}</h1>
          <p className="mt-2 text-gray-600">Case #{case_.caseNumber}</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Case Details */}
          <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
            <h2 className="text-xl font-semibold mb-4">Case Details</h2>
            <div className="space-y-3">
              <div>
                <span className="text-sm font-medium text-gray-700">Status:</span>
                <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${
                  case_.status === 'approved' ? 'bg-green-100 text-green-800' :
                  case_.status === 'rejected' ? 'bg-red-100 text-red-800' :
                  case_.status === 'reviewed' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {case_.status}
                </span>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-700">Description:</span>
                <p className="mt-1 text-gray-600">{case_.description}</p>
              </div>
              <div className="text-sm text-gray-500">
                Created: {new Date(case_.createdAt).toLocaleString()}
              </div>
            </div>

            <div className="mt-6">
              <button
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isAnalyzing ? 'Analyzing...' : 'Start Agent Analysis'}
              </button>
            </div>
          </div>

          {/* Agent Chat Log */}
          <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
            <h2 className="text-xl font-semibold mb-4">Agent Chat Log</h2>
            <div className="h-96 overflow-y-auto space-y-3">
              {chatLog.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No chat activity yet. Start an analysis to see agent discussions.</p>
              ) : (
                chatLog.map((log, index) => (
                  <div key={index} className="border-l-4 pl-3 py-2 border-gray-300">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-semibold ${
                        log.role === 'client-guru' ? 'text-blue-600' :
                        log.role === 'evidence-analyzer' ? 'text-purple-600' :
                        log.role === 'orchestrator' ? 'text-green-600' :
                        log.role === 'user' ? 'text-orange-600' :
                        'text-gray-600'
                      }`}>
                        {log.role.toUpperCase()}
                      </span>
                      <span className="text-xs text-gray-400">
                        {log.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700">{log.message}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Swipe Container */}
        {actionCard && (
          <div className="mt-6">
            <SwipeContainer
              caseId={case_._id!}
              actionCard={actionCard}
              onApprove={handleApprove}
              onReject={handleReject}
            />
          </div>
        )}

        {/* Previous Actions */}
        {actions.length > 0 && (
          <div className="mt-6 bg-white rounded-lg shadow p-6 border border-gray-200">
            <h2 className="text-xl font-semibold mb-4">Previous Actions</h2>
            <div className="space-y-4">
              {actions.map((action) => (
                <div key={action._id} className="border-l-4 border-blue-500 pl-4 py-2">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-medium text-gray-700">Type:</span>
                    <span className="px-2 py-1 text-xs font-medium rounded bg-blue-100 text-blue-800">
                      {action.type}
                    </span>
                    <span className="text-xs text-gray-400 ml-auto">
                      {new Date(action.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{action.actionCard.reasoning}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

