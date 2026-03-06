import TestCaseCard from './TestCaseCard';

const TestCasePreview = ({
  testCases,
  templateFields,
  onUpdate,
  onRemove,
  onSave,
  onBack,
  loading,
}) => {
  return (
    <div className="space-y-6">
      {/* Summary bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gray-800 rounded-lg p-4 border border-gray-700">
        <div>
          <h3 className="text-lg font-bold text-white">Generated Test Cases</h3>
          <p className="text-gray-400 text-sm">
            {testCases.length} test {testCases.length === 1 ? 'case' : 'cases'} ready for review
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={onBack}
            className="px-4 py-2 text-sm bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors cursor-pointer"
          >
            Generate More
          </button>
          <button
            onClick={onSave}
            disabled={loading || testCases.length === 0}
            className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium cursor-pointer"
          >
            {loading ? 'Saving...' : `Save All (${testCases.length})`}
          </button>
        </div>
      </div>

      {/* Test case cards */}
      {testCases.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-400">All test cases have been removed.</p>
          <button
            onClick={onBack}
            className="mt-3 text-blue-400 hover:text-blue-300 text-sm cursor-pointer"
          >
            Generate new test cases
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {testCases.map((tc, index) => (
            <TestCaseCard
              key={index}
              testCase={tc}
              index={index}
              templateFields={templateFields}
              onUpdate={(data) => onUpdate(index, data)}
              onRemove={() => onRemove(index)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default TestCasePreview;
