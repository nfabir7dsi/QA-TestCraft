import { useState, useMemo, useEffect } from 'react';
import useTestCaseStore from '../store/testCaseStore';
import TestCaseCard from './TestCaseCard';
import toast from 'react-hot-toast';

const TestCaseManager = ({ projectId, templateFields, onProjectReload, onGenerateMore }) => {
  const {
    testCases,
    fetchTestCases,
    deleteTestCase,
    updateTestCase,
    duplicateTestCase,
    bulkDeleteTestCases,
    bulkUpdateStatus,
  } = useTestCaseStore();

  // Toolbar state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [tagFilter, setTagFilter] = useState([]);
  const [sortField, setSortField] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc');
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [viewMode, setViewMode] = useState('table');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Expanded modal state
  const [expandedTestCase, setExpandedTestCase] = useState(null);
  const [editingExpanded, setEditingExpanded] = useState(false);
  const [editData, setEditData] = useState({});
  const [editTags, setEditTags] = useState([]);

  const sortedFields = useMemo(
    () => [...templateFields].sort((a, b) => a.order - b.order),
    [templateFields]
  );

  const allTags = useMemo(() => {
    const tags = new Set();
    testCases.forEach((tc) => (tc.tags || []).forEach((t) => tags.add(t)));
    return [...tags].sort();
  }, [testCases]);

  // Filter pipeline
  const filteredTestCases = useMemo(() => {
    let result = testCases;

    if (statusFilter !== 'all') {
      result = result.filter((tc) => tc.status === statusFilter);
    }

    if (tagFilter.length > 0) {
      result = result.filter((tc) =>
        tagFilter.some((tag) => tc.tags?.includes(tag))
      );
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((tc) =>
        Object.values(tc.data || {}).some((val) =>
          String(val).toLowerCase().includes(q)
        )
      );
    }

    return result;
  }, [testCases, statusFilter, tagFilter, searchQuery]);

  // Sort pipeline
  const sortedTestCases = useMemo(() => {
    if (!sortField) {
      return [...filteredTestCases].sort((a, b) => a._id.localeCompare(b._id));
    }
    return [...filteredTestCases].sort((a, b) => {
      const aVal = a.data?.[sortField] ?? '';
      const bVal = b.data?.[sortField] ?? '';
      const cmp = String(aVal).localeCompare(String(bVal), undefined, { numeric: true });
      return sortDirection === 'asc' ? cmp : -cmp;
    });
  }, [filteredTestCases, sortField, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(sortedTestCases.length / pageSize);
  const paginatedTestCases = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedTestCases.slice(start, start + pageSize);
  }, [sortedTestCases, currentPage, pageSize]);

  // Reset to page 1 when filters/sort/pageSize change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, tagFilter, sortField, sortDirection, pageSize]);

  const handleSort = (fieldName) => {
    if (sortField === fieldName) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(fieldName);
      setSortDirection('asc');
    }
  };

  const handleBulkDelete = async () => {
    const ids = Array.from(selectedIds);
    try {
      await bulkDeleteTestCases(ids);
      toast.success(`${ids.length} test case(s) deleted`);
      setSelectedIds(new Set());
      onProjectReload();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleBulkStatusChange = async (status) => {
    const ids = Array.from(selectedIds);
    try {
      await bulkUpdateStatus(ids, status);
      toast.success(`${ids.length} test case(s) updated to ${status}`);
      setSelectedIds(new Set());
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDuplicate = async (id) => {
    try {
      await duplicateTestCase(id);
      toast.success('Test case duplicated!');
      onProjectReload();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleExportCSV = () => {
    const headers = ['#', ...sortedFields.map((f) => f.label), 'Status', 'Tags'];

    const rows = sortedTestCases.map((tc, index) => {
      const fieldValues = sortedFields.map((field) => {
        const val = tc.data?.[field.name];
        if (Array.isArray(val)) return val.join('; ');
        if (typeof val === 'boolean') return val ? 'Yes' : 'No';
        return val ?? '';
      });
      const tags = (tc.tags || []).join('; ');
      return [index + 1, ...fieldValues, tc.status, tags];
    });

    const csvContent = [headers, ...rows]
      .map((row) =>
        row
          .map((cell) => {
            const str = String(cell);
            if (str.includes(',') || str.includes('\n') || str.includes('"')) {
              return `"${str.replace(/"/g, '""')}"`;
            }
            return str;
          })
          .join(',')
      )
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `test-cases-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('CSV exported!');
  };

  const renderFieldValue = (field, value) => {
    if (value === undefined || value === null || value === '') {
      return <span className="text-gray-600 italic">-</span>;
    }
    if (field.type === 'boolean') {
      return (
        <span
          className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${
            value ? 'bg-green-900/60 text-green-400' : 'bg-red-900/60 text-red-400'
          }`}
        >
          {value ? 'Yes' : 'No'}
        </span>
      );
    }
    if (field.type === 'multiselect' && Array.isArray(value)) {
      return (
        <div className="flex flex-wrap gap-1">
          {value.slice(0, 2).map((v, i) => (
            <span
              key={i}
              className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-blue-900/60 text-blue-300"
            >
              {v}
            </span>
          ))}
          {value.length > 2 && (
            <span className="text-gray-500 text-xs">+{value.length - 2}</span>
          )}
        </div>
      );
    }
    if (field.type === 'select') {
      return (
        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-purple-900/60 text-purple-300">
          {value}
        </span>
      );
    }
    const str = String(value);
    return (
      <span className="text-gray-300 block truncate" title={str.length > 40 ? str : undefined}>
        {str.length > 40 ? str.slice(0, 40) + '...' : str}
      </span>
    );
  };

  const renderExpandedFieldValue = (field, value) => {
    if (value === undefined || value === null || value === '') {
      return <span className="text-gray-600 italic">Empty</span>;
    }
    if (field.type === 'boolean') {
      return (
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
            value ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'
          }`}
        >
          {value ? 'Yes' : 'No'}
        </span>
      );
    }
    if (field.type === 'multiselect' && Array.isArray(value)) {
      return (
        <div className="flex flex-wrap gap-1">
          {value.map((v, i) => (
            <span
              key={i}
              className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-900 text-blue-300"
            >
              {v}
            </span>
          ))}
        </div>
      );
    }
    if (field.type === 'select') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-900 text-purple-300">
          {value}
        </span>
      );
    }
    if (field.type === 'textarea') {
      return (
        <p className="text-sm whitespace-pre-wrap break-words overflow-hidden bg-gray-900 rounded p-3 border border-gray-700">
          {value}
        </p>
      );
    }
    return <span className="text-sm break-words overflow-hidden block">{String(value)}</span>;
  };

  const renderEditField = (field, value, onChange) => {
    const inputClass =
      'w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:border-blue-500';

    if (field.type === 'textarea') {
      return (
        <textarea
          value={value || ''}
          onChange={(e) => onChange(field.name, e.target.value)}
          rows={3}
          className={`${inputClass} resize-none`}
        />
      );
    }
    if (field.type === 'select') {
      return (
        <select
          value={value || ''}
          onChange={(e) => onChange(field.name, e.target.value)}
          className={inputClass}
        >
          <option value="">Select...</option>
          {field.options?.map((opt, i) => (
            <option key={i} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      );
    }
    if (field.type === 'multiselect') {
      return (
        <div className="bg-gray-700 border border-gray-600 rounded p-2 space-y-1">
          {field.options?.map((opt, i) => (
            <label
              key={i}
              className="flex items-center space-x-2 text-gray-300 text-sm cursor-pointer"
            >
              <input
                type="checkbox"
                checked={Array.isArray(value) && value.includes(opt)}
                onChange={(e) => {
                  const current = Array.isArray(value) ? value : [];
                  const updated = e.target.checked
                    ? [...current, opt]
                    : current.filter((v) => v !== opt);
                  onChange(field.name, updated);
                }}
                className="w-4 h-4 text-blue-600 bg-gray-600 border-gray-500 rounded"
              />
              <span>{opt}</span>
            </label>
          ))}
        </div>
      );
    }
    if (field.type === 'boolean') {
      return (
        <label className="flex items-center space-x-2 cursor-pointer">
          <input
            type="checkbox"
            checked={!!value}
            onChange={(e) => onChange(field.name, e.target.checked)}
            className="w-4 h-4 text-blue-600 bg-gray-600 border-gray-500 rounded"
          />
          <span className="text-gray-300 text-sm">{value ? 'Yes' : 'No'}</span>
        </label>
      );
    }
    if (field.type === 'number') {
      return (
        <input
          type="number"
          value={value ?? ''}
          onChange={(e) =>
            onChange(field.name, e.target.value ? Number(e.target.value) : '')
          }
          className={inputClass}
        />
      );
    }
    if (field.type === 'date') {
      return (
        <input
          type="date"
          value={value || ''}
          onChange={(e) => onChange(field.name, e.target.value)}
          className={inputClass}
        />
      );
    }
    return (
      <input
        type="text"
        value={value || ''}
        onChange={(e) => onChange(field.name, e.target.value)}
        className={inputClass}
      />
    );
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6 mt-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-white">
          Test Cases ({filteredTestCases.length}
          {filteredTestCases.length !== testCases.length && ` of ${testCases.length}`})
        </h2>
        <button
          onClick={onGenerateMore}
          className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors cursor-pointer"
        >
          Generate More
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            placeholder="Search test cases..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Status filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
        >
          <option value="all">All Status</option>
          <option value="draft">Draft</option>
          <option value="active">Active</option>
          <option value="archived">Archived</option>
        </select>

        {/* Tag filter */}
        {allTags.length > 0 && (
          <div className="relative group">
            <button className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm flex items-center gap-1 hover:border-gray-500 cursor-pointer transition-colors">
              Tags
              {tagFilter.length > 0 && (
                <span className="bg-blue-600 text-white text-xs px-1.5 rounded-full">
                  {tagFilter.length}
                </span>
              )}
              <svg className="w-3 h-3 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <div className="absolute top-full left-0 mt-1 bg-gray-700 border border-gray-600 rounded-lg p-2 z-10 hidden group-hover:block min-w-[150px] shadow-lg">
              {allTags.map((tag) => (
                <label
                  key={tag}
                  className="flex items-center space-x-2 px-2 py-1 text-sm text-gray-300 hover:bg-gray-600 rounded cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={tagFilter.includes(tag)}
                    onChange={(e) => {
                      setTagFilter((prev) =>
                        e.target.checked ? [...prev, tag] : prev.filter((t) => t !== tag)
                      );
                    }}
                    className="w-3.5 h-3.5 text-blue-600 bg-gray-600 border-gray-500 rounded"
                  />
                  <span>{tag}</span>
                </label>
              ))}
              {tagFilter.length > 0 && (
                <button
                  onClick={() => setTagFilter([])}
                  className="w-full text-left px-2 py-1 text-xs text-gray-400 hover:text-white mt-1 border-t border-gray-600"
                >
                  Clear tags
                </button>
              )}
            </div>
          </div>
        )}

        {/* View toggle */}
        <div className="flex bg-gray-700 rounded-lg p-0.5">
          <button
            onClick={() => setViewMode('table')}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors cursor-pointer ${
              viewMode === 'table'
                ? 'bg-gray-600 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
          </button>
          <button
            onClick={() => setViewMode('card')}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors cursor-pointer ${
              viewMode === 'card'
                ? 'bg-gray-600 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
          </button>
        </div>

        {/* Export CSV */}
        <button
          onClick={handleExportCSV}
          className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm hover:bg-gray-600 transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          CSV
        </button>
      </div>

      {/* Bulk action bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 mb-3 p-3 bg-blue-900/30 border border-blue-800 rounded-lg">
          <span className="text-blue-300 text-sm font-medium">
            {selectedIds.size} selected
          </span>
          <button
            onClick={handleBulkDelete}
            className="px-3 py-1 text-sm bg-red-600 hover:bg-red-700 text-white rounded transition-colors cursor-pointer"
          >
            Delete Selected
          </button>
          <select
            onChange={(e) => {
              if (e.target.value) handleBulkStatusChange(e.target.value);
              e.target.value = '';
            }}
            className="px-3 py-1 text-sm bg-gray-700 text-white rounded border border-gray-600"
            defaultValue=""
          >
            <option value="" disabled>
              Change Status...
            </option>
            <option value="draft">Mark as Draft</option>
            <option value="active">Mark as Active</option>
            <option value="archived">Mark as Archived</option>
          </select>
          <button
            onClick={() => setSelectedIds(new Set())}
            className="text-gray-400 hover:text-white text-sm ml-auto transition-colors cursor-pointer"
          >
            Clear Selection
          </button>
        </div>
      )}

      {/* Table View */}
      {viewMode === 'table' ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-gray-700">
                {/* Select all checkbox */}
                <th className="px-3 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={
                      selectedIds.size > 0 && selectedIds.size === sortedTestCases.length
                    }
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedIds(new Set(sortedTestCases.map((tc) => tc._id)));
                      } else {
                        setSelectedIds(new Set());
                      }
                    }}
                    className="w-4 h-4 text-blue-600 bg-gray-600 border-gray-500 rounded cursor-pointer"
                  />
                </th>
                <th className="px-3 py-3 text-gray-400 font-medium">#</th>
                {sortedFields.map((field) => (
                  <th
                    key={field.id}
                    className="px-3 py-3 text-gray-400 font-medium whitespace-nowrap cursor-pointer hover:text-white select-none transition-colors"
                    onClick={() => handleSort(field.name)}
                  >
                    <div className="flex items-center space-x-1">
                      <span>{field.label}</span>
                      {sortField === field.name && (
                        <span className="text-blue-400">
                          {sortDirection === 'asc' ? '▲' : '▼'}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
                <th className="px-3 py-3 text-gray-400 font-medium">Status</th>
                <th className="px-3 py-3 text-gray-400 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedTestCases.map((tc, index) => (
                <tr
                  key={tc._id}
                  className={`border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors ${
                    selectedIds.has(tc._id) ? 'bg-blue-900/20' : ''
                  }`}
                >
                  <td className="px-3 py-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(tc._id)}
                      onChange={(e) => {
                        const next = new Set(selectedIds);
                        e.target.checked ? next.add(tc._id) : next.delete(tc._id);
                        setSelectedIds(next);
                      }}
                      className="w-4 h-4 text-blue-600 bg-gray-600 border-gray-500 rounded cursor-pointer"
                    />
                  </td>
                  <td className="px-3 py-3 text-gray-500 whitespace-nowrap">
                    {tc.testCaseId || (currentPage - 1) * pageSize + index + 1}
                  </td>
                  {sortedFields.map((field) => (
                    <td key={field.id} className="px-3 py-3 max-w-[200px] overflow-hidden">
                      {renderFieldValue(field, tc.data?.[field.name])}
                    </td>
                  ))}
                  <td className="px-3 py-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        tc.status === 'active'
                          ? 'bg-green-900/60 text-green-400'
                          : tc.status === 'archived'
                          ? 'bg-gray-700 text-gray-400'
                          : 'bg-yellow-900/60 text-yellow-400'
                      }`}
                    >
                      {tc.status}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center space-x-2">
                      {/* View */}
                      <button
                        onClick={() => setExpandedTestCase(tc)}
                        className="text-blue-400 hover:text-blue-300 transition-colors cursor-pointer"
                        title="View details"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                      </button>
                      {/* Duplicate */}
                      <button
                        onClick={() => handleDuplicate(tc._id)}
                        className="text-green-400 hover:text-green-300 transition-colors cursor-pointer"
                        title="Duplicate"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                          />
                        </svg>
                      </button>
                      {/* Delete */}
                      <button
                        onClick={() => {
                          deleteTestCase(tc._id)
                            .then(() => {
                              toast.success('Test case deleted!');
                              onProjectReload();
                            })
                            .catch((err) => toast.error(err.message));
                        }}
                        className="text-red-400 hover:text-red-300 transition-colors cursor-pointer"
                        title="Delete"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {paginatedTestCases.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No test cases match your filters.
            </div>
          )}
        </div>
      ) : (
        /* Card View */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {paginatedTestCases.map((tc, index) => (
            <TestCaseCard
              key={tc._id}
              testCase={{ ...tc.data, status: tc.status }}
              index={(currentPage - 1) * pageSize + index}
              testCaseId={tc.testCaseId}
              templateFields={templateFields}
              onUpdate={(updatedData) => {
                updateTestCase(tc._id, { data: updatedData })
                  .then(() => toast.success('Updated!'))
                  .catch((err) => toast.error(err.message));
              }}
              onRemove={() => {
                deleteTestCase(tc._id)
                  .then(() => {
                    toast.success('Deleted!');
                    onProjectReload();
                  })
                  .catch((err) => toast.error(err.message));
              }}
              isSaved={true}
            />
          ))}
          {paginatedTestCases.length === 0 && (
            <div className="col-span-2 text-center py-8 text-gray-500">
              No test cases match your filters.
            </div>
          )}
        </div>
      )}

      {/* Pagination */}
      {sortedTestCases.length > 0 && (
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-700">
          <div className="flex items-center gap-2">
            <span className="text-gray-400 text-sm">Rows per page:</span>
            {[5, 10, 20].map((size) => (
              <button
                key={size}
                onClick={() => setPageSize(size)}
                className={`px-2.5 py-1 text-sm rounded transition-colors cursor-pointer ${
                  pageSize === size
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-400 hover:text-white'
                }`}
              >
                {size}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-gray-400 text-sm">
              {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, sortedTestCases.length)} of {sortedTestCases.length}
            </span>
            <div className="flex gap-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded bg-gray-700 text-gray-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded bg-gray-700 text-gray-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Expanded Test Case Modal */}
      {expandedTestCase && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-700">
              <h3 className="text-lg font-bold text-white">
                {expandedTestCase.testCaseId
                  ? `${expandedTestCase.testCaseId} — Details`
                  : 'Test Case Details'}
                <span
                  className={`ml-3 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                    expandedTestCase.status === 'active'
                      ? 'bg-green-900/60 text-green-400'
                      : expandedTestCase.status === 'archived'
                      ? 'bg-gray-700 text-gray-400'
                      : 'bg-yellow-900/60 text-yellow-400'
                  }`}
                >
                  {expandedTestCase.status}
                </span>
              </h3>
              <div className="flex items-center space-x-2">
                {!editingExpanded && (
                  <button
                    onClick={() => {
                      setEditingExpanded(true);
                      setEditData({ ...expandedTestCase.data });
                      setEditTags([...(expandedTestCase.tags || [])]);
                    }}
                    className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors cursor-pointer"
                  >
                    Edit
                  </button>
                )}
                <button
                  onClick={() => {
                    setExpandedTestCase(null);
                    setEditingExpanded(false);
                    setEditData({});
                    setEditTags([]);
                  }}
                  className="text-gray-400 hover:text-white transition-colors p-1 cursor-pointer"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>

            {/* Fields */}
            <div className="p-6 space-y-4">
              {sortedFields.map((field) => {
                const value = editingExpanded
                  ? editData[field.name]
                  : expandedTestCase.data?.[field.name];

                return (
                  <div key={field.id}>
                    <label className="block text-sm font-medium text-gray-400 mb-1">
                      {field.label}
                      {field.required && <span className="text-red-400 ml-0.5">*</span>}
                    </label>
                    {editingExpanded ? (
                      renderEditField(field, value, (name, val) =>
                        setEditData((prev) => ({ ...prev, [name]: val }))
                      )
                    ) : (
                      <div className="text-gray-200 overflow-hidden">
                        {renderExpandedFieldValue(field, value)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Tags section */}
            <div className="px-6 py-3 border-t border-gray-700">
              <label className="block text-sm font-medium text-gray-400 mb-2">Tags</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {(editingExpanded ? editTags : expandedTestCase.tags || []).map((tag, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-blue-900/60 text-blue-300"
                  >
                    {tag}
                    {editingExpanded && (
                      <button
                        onClick={() => setEditTags((prev) => prev.filter((_, idx) => idx !== i))}
                        className="ml-1 text-blue-400 hover:text-red-400 cursor-pointer"
                      >
                        ×
                      </button>
                    )}
                  </span>
                ))}
                {!editingExpanded && (!expandedTestCase.tags || expandedTestCase.tags.length === 0) && (
                  <span className="text-gray-600 text-xs italic">No tags</span>
                )}
              </div>
              {editingExpanded && (
                <input
                  type="text"
                  placeholder="Type a tag and press Enter..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.target.value.trim()) {
                      const newTag = e.target.value.trim();
                      if (!editTags.includes(newTag)) {
                        setEditTags((prev) => [...prev, newTag]);
                      }
                      e.target.value = '';
                      e.preventDefault();
                    }
                  }}
                  className="w-full px-3 py-1.5 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:border-blue-500"
                />
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-end space-x-3 p-6 border-t border-gray-700">
              {editingExpanded ? (
                <>
                  <button
                    onClick={() => {
                      updateTestCase(expandedTestCase._id, { data: editData, tags: editTags })
                        .then((updated) => {
                          toast.success('Test case updated!');
                          setExpandedTestCase(updated);
                          setEditingExpanded(false);
                          setEditData({});
                          setEditTags([]);
                          fetchTestCases(projectId);
                        })
                        .catch((err) => toast.error(err.message));
                    }}
                    className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors cursor-pointer"
                  >
                    Save Changes
                  </button>
                  <button
                    onClick={() => {
                      setEditingExpanded(false);
                      setEditData({});
                      setEditTags([]);
                    }}
                    className="px-4 py-2 text-sm bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => handleDuplicate(expandedTestCase._id)}
                    className="px-4 py-2 text-sm bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors cursor-pointer"
                  >
                    Duplicate
                  </button>
                  <button
                    onClick={() => {
                      deleteTestCase(expandedTestCase._id)
                        .then(() => {
                          toast.success('Test case deleted!');
                          setExpandedTestCase(null);
                          onProjectReload();
                        })
                        .catch((err) => toast.error(err.message));
                    }}
                    className="px-4 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors cursor-pointer"
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => {
                      setExpandedTestCase(null);
                      setEditingExpanded(false);
                    }}
                    className="px-4 py-2 text-sm bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors cursor-pointer"
                  >
                    Close
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestCaseManager;
