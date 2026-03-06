import { useState } from 'react';
import toast from 'react-hot-toast';
import useTestCaseStore from '../store/testCaseStore';
import TestCasePreview from './TestCasePreview';

const SCENARIO_OPTIONS = [
  {
    value: 'positive',
    label: 'Positive',
    description: 'Happy path, valid inputs, expected workflows',
  },
  {
    value: 'negative',
    label: 'Negative',
    description: 'Invalid inputs, error handling, unauthorized access',
  },
  {
    value: 'edge',
    label: 'Edge Cases',
    description: 'Empty inputs, max lengths, special characters',
  },
  {
    value: 'boundary',
    label: 'Boundary',
    description: 'Min/max values, off-by-one, limits',
  },
];

const COUNT_OPTIONS = [1, 3, 5, 10, 15, 20];

const GenerateTestCasesModal = ({ isOpen, onClose, project }) => {
  const [description, setDescription] = useState('');
  const [options, setOptions] = useState({
    count: 5,
    scenarios: ['positive'],
  });

  const {
    generatedTestCases,
    generating,
    loading,
    generateTestCases,
    saveTestCases,
    updateGeneratedTestCase,
    removeGeneratedTestCase,
    clearGeneratedTestCases,
  } = useTestCaseStore();

  const hasTemplate = project?.testCaseTemplate?.fields?.length > 0;
  const hasResults = generatedTestCases.length > 0;

  const handleClose = () => {
    clearGeneratedTestCases();
    setDescription('');
    setOptions({ count: 5, scenarios: ['positive'] });
    onClose();
  };

  const toggleScenario = (scenario) => {
    setOptions((prev) => {
      const scenarios = prev.scenarios.includes(scenario)
        ? prev.scenarios.filter((s) => s !== scenario)
        : [...prev.scenarios, scenario];
      return { ...prev, scenarios: scenarios.length > 0 ? scenarios : prev.scenarios };
    });
  };

  const handleGenerate = async () => {
    if (!description.trim() || description.trim().length < 10) {
      toast.error('Please provide a description of at least 10 characters');
      return;
    }
    try {
      await generateTestCases({
        projectId: project._id,
        description: description.trim(),
        options,
      });
      toast.success('Test cases generated successfully!');
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleSave = async () => {
    try {
      const result = await saveTestCases(project._id, generatedTestCases);
      toast.success(`${result.count} test cases saved!`);
      handleClose();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleBack = () => {
    clearGeneratedTestCases();
  };

  if (!isOpen) return null;

  // No template warning
  if (!hasTemplate) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-gray-800 rounded-lg max-w-md w-full p-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-yellow-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Template Required</h3>
            <p className="text-gray-400 text-sm mb-6">
              You need to create a test case template for this project before generating test cases.
              The template defines the structure of your test cases.
            </p>
            <button
              onClick={handleClose}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Got it
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-900 z-50 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700 bg-gray-800">
        <div>
          <h2 className="text-xl font-bold text-white">Generate Test Cases</h2>
          <p className="text-gray-400 text-sm">{project?.name}</p>
        </div>
        <button
          onClick={handleClose}
          className="text-gray-400 hover:text-white transition-colors p-2 cursor-pointer"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto">
          {/* Phase 1: Generation Form */}
          {!hasResults && !generating && (
            <div className="space-y-6">
              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  What do you want to test?
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  placeholder="Describe the feature or functionality to test, e.g., 'Login functionality including social login, forgot password, and account lockout after failed attempts'"
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 resize-none focus:outline-none focus:border-blue-500 transition-colors"
                />
                <p className="text-gray-500 text-xs mt-1">
                  {description.length}/2000 characters (minimum 10)
                </p>
              </div>

              {/* Scenario Types */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  Scenario Types
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {SCENARIO_OPTIONS.map((scenario) => (
                    <button
                      key={scenario.value}
                      onClick={() => toggleScenario(scenario.value)}
                      className={`text-left p-4 rounded-lg border transition-all cursor-pointer ${
                        options.scenarios.includes(scenario.value)
                          ? 'border-blue-500 bg-blue-900/30'
                          : 'border-gray-700 bg-gray-800 hover:border-gray-600'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-white font-medium text-sm">{scenario.label}</span>
                        {options.scenarios.includes(scenario.value) && (
                          <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <p className="text-gray-400 text-xs mt-1">{scenario.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Count Selector */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  Number of Test Cases
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  {COUNT_OPTIONS.map((count) => (
                    <button
                      key={count}
                      onClick={() => setOptions((prev) => ({ ...prev, count }))}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                        options.count === count
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-800 text-gray-300 border border-gray-700 hover:border-gray-600'
                      }`}
                    >
                      {count}
                    </button>
                  ))}
                  <div className="flex items-center gap-2 ml-2">
                    <span className="text-gray-400 text-sm">or</span>
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={options.count}
                      onChange={(e) => {
                        const val = Math.min(20, Math.max(1, parseInt(e.target.value) || 1));
                        setOptions((prev) => ({ ...prev, count: val }));
                      }}
                      className="w-20 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm text-center focus:outline-none focus:border-blue-500"
                    />
                    <span className="text-gray-500 text-xs">max 20</span>
                  </div>
                </div>
              </div>

              {/* Template Info */}
              <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
                <p className="text-gray-400 text-sm">
                  <span className="text-gray-300 font-medium">Template:</span>{' '}
                  {project?.testCaseTemplate?.fields?.length} fields defined
                  {' | '}
                  <span className="text-gray-300 font-medium">Website:</span>{' '}
                  {project?.websiteUrl}
                </p>
              </div>

              {/* Generate Button */}
              <button
                onClick={handleGenerate}
                disabled={!description.trim() || description.trim().length < 10}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center justify-center space-x-2 cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span>Generate {options.count} Test Cases</span>
              </button>
            </div>
          )}

          {/* Generating State */}
          {generating && (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-gray-700 rounded-full"></div>
                <div className="absolute top-0 left-0 w-16 h-16 border-4 border-blue-500 rounded-full animate-spin border-t-transparent"></div>
              </div>
              <h3 className="text-white font-semibold mt-6 text-lg">AI is generating test cases...</h3>
              <p className="text-gray-400 text-sm mt-2">
                Generating {options.count} test cases with{' '}
                {options.scenarios.map((s) => SCENARIO_OPTIONS.find((o) => o.value === s)?.label).join(', ')}{' '}
                scenarios
              </p>
              <p className="text-gray-500 text-xs mt-4">This may take 10-30 seconds</p>
            </div>
          )}

          {/* Phase 2: Results Preview */}
          {hasResults && !generating && (
            <TestCasePreview
              testCases={generatedTestCases}
              templateFields={project?.testCaseTemplate?.fields || []}
              onUpdate={updateGeneratedTestCase}
              onRemove={removeGeneratedTestCase}
              onSave={handleSave}
              onBack={handleBack}
              loading={loading}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default GenerateTestCasesModal;
