import { useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import useProjectStore from '../store/projectStore';
import useTestCaseStore from '../store/testCaseStore';
import TestCaseManager from '../components/TestCaseManager';
import GenerateTestCasesModal from '../components/GenerateTestCasesModal';
import { useState } from 'react';
import toast from 'react-hot-toast';

const TestCases = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentProject, loading, fetchProject } = useProjectStore();
  const { testCases, fetchTestCases } = useTestCaseStore();
  const [showGenerateModal, setShowGenerateModal] = useState(false);

  const templateFields = currentProject?.testCaseTemplate?.fields || [];

  useEffect(() => {
    loadProject();
    fetchTestCases(id);
  }, [id]);

  const loadProject = async () => {
    try {
      await fetchProject(id);
    } catch (error) {
      toast.error(error.message);
      navigate('/projects');
    }
  };

  if (loading || !currentProject) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <Link
          to={`/projects/${id}`}
          className="inline-flex items-center text-blue-400 hover:text-blue-300 mb-6"
        >
          <svg
            className="w-5 h-5 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Back to {currentProject.name}
        </Link>

        {/* Page Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white">Test Cases</h1>
            <p className="text-gray-400 mt-1">{currentProject.name}</p>
          </div>
          <button
            onClick={() => setShowGenerateModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors cursor-pointer flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
            Generate Test Cases
          </button>
        </div>

        {/* Test Case Manager */}
        {testCases.length > 0 ? (
          <TestCaseManager
            projectId={id}
            templateFields={templateFields}
            onProjectReload={loadProject}
            onGenerateMore={() => setShowGenerateModal(true)}
          />
        ) : (
          <div className="bg-gray-800 rounded-lg p-12 text-center">
            <svg
              className="w-16 h-16 text-gray-600 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h3 className="text-xl font-medium text-white mb-2">No Test Cases Yet</h3>
            <p className="text-gray-400 mb-6">Generate test cases using AI to get started.</p>
            <button
              onClick={() => setShowGenerateModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors cursor-pointer"
            >
              Generate Test Cases
            </button>
          </div>
        )}
      </div>

      {/* Generate Test Cases Modal */}
      <GenerateTestCasesModal
        isOpen={showGenerateModal}
        onClose={() => {
          setShowGenerateModal(false);
          fetchTestCases(id);
          loadProject();
        }}
        project={currentProject}
      />
    </div>
  );
};

export default TestCases;
