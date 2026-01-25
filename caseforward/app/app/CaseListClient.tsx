'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Radley } from 'next/font/google';
import { ChevronDown } from 'lucide-react';
import { CaseStatus } from '@/lib/db/types/enums';

const radley = Radley({ subsets: ['latin'], weight: '400' });

interface CaseItem {
  id: string;
  caseNum: string;
  status: CaseStatus;
  client: string;
  caseName: string;
  incidentDate: string;
}

interface Props {
  activeCases: CaseItem[];
  archivedCases: CaseItem[];
}

export default function CaseListClient({ activeCases, archivedCases }: Props) {
  const [showActive, setShowActive] = useState(true);
  const [showArchived, setShowArchived] = useState(false);

  return (
    <div className="mb-8 space-y-4">
      <div className="bg-[#4b1d1d] text-white p-4 rounded-lg flex justify-between items-center">
        <h2 className={`text-3xl font-bold ${radley.className}`}>Case List</h2>
        <Link href="/app/cases" className="text-base text-amber-200 hover:text-amber-100">
          View All
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <button
          onClick={() => setShowActive(!showActive)}
          className="w-full px-6 py-4 flex items-center justify-between bg-[#f0ece6] hover:bg-[#e6ded3] transition-colors border-b border-[#e6ded3]"
        >
          <div className="flex items-center gap-3">
            <span className="font-semibold text-[#4b1d1d]">Active Cases</span>
            <span className="bg-[#4b1d1d] text-white text-sm px-2 py-0.5 rounded-full">{activeCases.length}</span>
          </div>
          <ChevronDown size={20} className={`text-[#4b1d1d] transition-transform ${showActive ? 'rotate-180' : ''}`} />
        </button>

        {showActive && (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Case #</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Client</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Case Name</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Incident Date</th>
              </tr>
            </thead>
            <tbody>
              {activeCases.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">No active cases</td>
                </tr>
              ) : (
                activeCases.map((item, idx) => (
                  <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-6 py-4 text-base font-semibold text-gray-900">
                      {item.id ? (
                        <Link href={`/app/case/${item.id}/documents`} className="text-[#4b1d1d] hover:underline">
                          {item.caseNum}
                        </Link>
                      ) : (
                        <span>{item.caseNum}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-base text-gray-700">{item.client}</td>
                    <td className="px-6 py-4 text-base text-gray-700">{item.caseName}</td>
                    <td className="px-6 py-4 text-base text-gray-700">{item.incidentDate}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <button
          onClick={() => setShowArchived(!showArchived)}
          className="w-full px-6 py-4 flex items-center justify-between bg-gray-100 hover:bg-gray-200 transition-colors border-b border-gray-200"
        >
          <div className="flex items-center gap-3">
            <span className="font-semibold text-gray-600">Archived Cases</span>
            <span className="bg-gray-500 text-white text-sm px-2 py-0.5 rounded-full">{archivedCases.length}</span>
          </div>
          <ChevronDown size={20} className={`text-gray-600 transition-transform ${showArchived ? 'rotate-180' : ''}`} />
        </button>

        {showArchived && (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Case #</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Client</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Case Name</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Incident Date</th>
              </tr>
            </thead>
            <tbody>
              {archivedCases.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">No archived cases</td>
                </tr>
              ) : (
                archivedCases.map((item, idx) => (
                  <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-6 py-4 text-base font-semibold text-gray-900">
                      {item.id ? (
                        <Link href={`/app/case/${item.id}/documents`} className="text-gray-600 hover:underline">
                          {item.caseNum}
                        </Link>
                      ) : (
                        <span>{item.caseNum}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-base text-gray-500">{item.client}</td>
                    <td className="px-6 py-4 text-base text-gray-500">{item.caseName}</td>
                    <td className="px-6 py-4 text-base text-gray-500">{item.incidentDate}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
