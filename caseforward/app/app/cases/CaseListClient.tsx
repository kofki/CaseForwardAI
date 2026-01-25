'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Radley } from 'next/font/google';
import { ChevronDown, Archive, Search, X } from 'lucide-react';
import { CaseStatus } from '@/lib/db/types/enums';

const radley = Radley({ subsets: ['latin'], weight: '400' });

interface CaseItem {
  id: string;
  caseNum: string;
  status: CaseStatus;
  client: string;
  caseName: string;
  incidentDate: string;
  email?: string;
  phone?: string;
}

interface Props {
  activeCases: CaseItem[];
  archivedCases: CaseItem[];
}

function highlightMatch(text: string, query: string): React.ReactNode {
  if (!query.trim()) return text;
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);
  return parts.map((part, i) => 
    regex.test(part) ? <mark key={i} className="bg-amber-200 text-[#4b1d1d] px-0.5 rounded">{part}</mark> : part
  );
}

export default function CaseListClient({ activeCases, archivedCases }: Props) {
  const [showActive, setShowActive] = useState(true);
  const [showArchived, setShowArchived] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filterCases = (cases: CaseItem[]) => {
    if (!searchQuery.trim()) return cases;
    const query = searchQuery.toLowerCase().trim();
    return cases.filter(c => 
      c.caseNum.toLowerCase().includes(query) ||
      c.client.toLowerCase().includes(query) ||
      c.caseName.toLowerCase().includes(query) ||
      (c.email && c.email.toLowerCase().includes(query)) ||
      (c.phone && c.phone.replace(/\D/g, '').includes(query.replace(/\D/g, '')))
    );
  };

  const filteredActive = useMemo(() => filterCases(activeCases), [activeCases, searchQuery]);
  const filteredArchived = useMemo(() => filterCases(archivedCases), [archivedCases, searchQuery]);

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg shadow p-4">
        <div className="relative">
          <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#4b1d1d]" />
          <input
            type="text"
            placeholder="Search by name, case number, email, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-10 py-3 border border-[#e6ded3] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4b1d1d] focus:border-transparent text-base text-[#4b1d1d] placeholder:text-[#4b1d1d]/50"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#4b1d1d]/60 hover:text-[#4b1d1d]">
              <X size={20} />
            </button>
          )}
        </div>
        {searchQuery && (
          <p className="mt-2 text-sm text-[#4b1d1d]/70">
            Found <span className="font-semibold text-[#4b1d1d]">{filteredActive.length}</span> active and <span className="font-semibold text-[#4b1d1d]">{filteredArchived.length}</span> archived cases
          </p>
        )}
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <button onClick={() => setShowActive(!showActive)} className="w-full px-6 py-4 flex items-center justify-between bg-[#4b1d1d] text-white hover:bg-[#5a2424] transition-colors">
          <div className="flex items-center gap-3">
            <span className={`font-semibold text-lg ${radley.className}`}>Active Cases</span>
            <span className="bg-white/20 text-white text-sm px-3 py-1 rounded-full">{filteredActive.length}</span>
          </div>
          <ChevronDown size={20} className={`transition-transform ${showActive ? 'rotate-180' : ''}`} />
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
              {filteredActive.length === 0 ? (
                <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-500">{searchQuery ? 'No matching active cases' : 'No active cases'}</td></tr>
              ) : (
                filteredActive.map((item, idx) => (
                  <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-6 py-4 text-base font-semibold"><Link href={`/app/case/${item.id}/documents`} className="text-[#4b1d1d] hover:underline">{highlightMatch(item.caseNum, searchQuery)}</Link></td>
                    <td className="px-6 py-4 text-base text-gray-700">{highlightMatch(item.client, searchQuery)}</td>
                    <td className="px-6 py-4 text-base text-gray-700">{highlightMatch(item.caseName, searchQuery)}</td>
                    <td className="px-6 py-4 text-base text-gray-700">{item.incidentDate}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <button onClick={() => setShowArchived(!showArchived)} className="w-full px-6 py-4 flex items-center justify-between bg-gray-500 text-white hover:bg-gray-600 transition-colors">
          <div className="flex items-center gap-3">
            <Archive size={20} />
            <span className={`font-semibold text-lg ${radley.className}`}>Archived Cases</span>
            <span className="bg-white/20 text-white text-sm px-3 py-1 rounded-full">{filteredArchived.length}</span>
          </div>
          <ChevronDown size={20} className={`transition-transform ${showArchived ? 'rotate-180' : ''}`} />
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
              {filteredArchived.length === 0 ? (
                <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-500">{searchQuery ? 'No matching archived cases' : 'No archived cases'}</td></tr>
              ) : (
                filteredArchived.map((item, idx) => (
                  <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-6 py-4 text-base font-semibold text-gray-500"><Link href={`/app/case/${item.id}/documents`} className="hover:underline">{highlightMatch(item.caseNum, searchQuery)}</Link></td>
                    <td className="px-6 py-4 text-base text-gray-500">{highlightMatch(item.client, searchQuery)}</td>
                    <td className="px-6 py-4 text-base text-gray-500">{highlightMatch(item.caseName, searchQuery)}</td>
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
