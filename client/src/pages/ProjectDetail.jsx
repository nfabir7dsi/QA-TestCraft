import { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import useProjectStore from '../store/projectStore';
import toast from 'react-hot-toast';
import projectService from '../services/projectService';
import TemplateBuilderModal from '../components/TemplateBuilderModal';
import EditProjectModal from '../components/EditProjectModal';
import GenerateTestCasesModal from '../components/GenerateTestCasesModal';
import GoogleSheetsModal from '../components/GoogleSheetsModal';
import GoogleSheetsSyncStatus from '../components/GoogleSheetsSyncStatus';
import PdfViewerModal from '../components/PdfViewerModal';

const ProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { currentProject, loading, fetchProject, deleteProject, updateProject, updateProjectTemplate } = useProjectStore();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showTemplateBuilder, setShowTemplateBuilder] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showSheetsModal, setShowSheetsModal] = useState(false);
  const [pdfViewer, setPdfViewer] = useState({ open: false, url: '', name: '' });

  useEffect(() => {
    loadProject();
  }, [id]);

  // Handle Google OAuth callback params
  useEffect(() => {
    const googleAuth = searchParams.get('googleAuth');
    const openSheetsModal = searchParams.get('openSheetsModal');

    if (googleAuth === 'success') {
      toast.success('Google account connected successfully!');
    } else if (googleAuth === 'error') {
      const message = searchParams.get('message') || 'Google authentication failed';
      toast.error(message);
    }

    if (openSheetsModal === 'true') {
      setShowSheetsModal(true);
    }

    // Clear query params
    if (googleAuth || openSheetsModal) {
      navigate(`/projects/${id}`, { replace: true });
    }
  }, []);

  const loadProject = async () => {
    try {
      await fetchProject(id);
    } catch (error) {
      toast.error(error.message);
      navigate('/projects');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteProject(id);
      toast.success('Project deleted successfully!');
      navigate('/projects');
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleEditProject = async (projectId, projectData) => {
    try {
      await updateProject(projectId, projectData);
      toast.success('Project updated successfully!');
      setShowEditModal(false);
      await loadProject();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleDeleteDocument = async (docIndex) => {
    try {
      await projectService.deleteDocument(id, docIndex);
      toast.success('Document deleted');
      await loadProject();
    } catch {
      toast.error('Failed to delete document');
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleTemplateSave = async (template) => {
    try {
      await updateProjectTemplate(id, template);
      toast.success('Template saved successfully!');
      setShowTemplateBuilder(false);
      await loadProject();
    } catch (error) {
      toast.error(error.message);
    }
  };

  if (loading || !currentProject) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const statusColors = {
    active: 'bg-green-500',
    archived: 'bg-gray-500',
    completed: 'bg-blue-500',
  };

  return (
    <div className="min-h-screen bg-gray-900 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <Link
          to="/projects"
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
          Back to Projects
        </Link>

        {/* Project Header */}
        <div className="bg-gray-800 rounded-lg p-8 mb-6">
          <div className="flex justify-between items-start mb-6">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <h1 className="text-3xl font-bold text-white">{currentProject.name}</h1>
                <span
                  className={`${
                    statusColors[currentProject.status]
                  } text-white text-sm px-3 py-1 rounded-full`}
                >
                  {currentProject.status.charAt(0).toUpperCase() + currentProject.status.slice(1)}
                </span>
              </div>
              <p className="text-gray-400">{currentProject.description || 'No description'}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Website URL</label>
              <a
                href={currentProject.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 flex items-center space-x-2"
              >
                <span>{currentProject.websiteUrl}</span>
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
              </a>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Created</label>
              <p className="text-white">
                {new Date(currentProject.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
          </div>

          {currentProject.tags && currentProject.tags.length > 0 && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-400 mb-2">Tags</label>
              <div className="flex flex-wrap gap-2">
                {currentProject.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="bg-gray-700 text-gray-300 text-sm px-3 py-1 rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="flex space-x-3">
            <button
              onClick={() => setShowEditModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors cursor-pointer"
            >
              Edit Project
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-6 rounded-lg transition-colors cursor-pointer"
            >
              Delete Project
            </button>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Test Cases</p>
                <p className="text-3xl font-bold text-white mt-2">
                  {currentProject.testCaseCount}
                </p>
              </div>
              <div className="bg-blue-500 p-3 rounded-lg">
                <svg
                  className="w-8 h-8 text-white"
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
              </div>
            </div>
          </div>

          <GoogleSheetsSyncStatus
            project={currentProject}
            onConnect={() => setShowSheetsModal(true)}
            onProjectReload={loadProject}
          />

          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Last Updated</p>
                <p className="text-lg font-medium text-white mt-2">
                  {new Date(currentProject.updatedAt).toLocaleDateString()}
                </p>
              </div>
              <div className="bg-purple-500 p-3 rounded-lg">
                <svg
                  className="w-8 h-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link
              to={`/projects/${id}/test-cases`}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-4 rounded-lg transition-colors text-left flex items-center space-x-3"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                />
              </svg>
              <div>
                <div className="font-semibold">View Test Cases</div>
                <div className="text-xs text-indigo-200">
                  {currentProject.testCaseCount} test cases
                </div>
              </div>
            </Link>
            <button
              onClick={() => setShowTemplateBuilder(true)}
              className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-4 rounded-lg transition-colors text-left flex items-center space-x-3 cursor-pointer"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
              <div>
                <div className="font-semibold">
                  {currentProject.testCaseTemplate ? 'Edit Template' : 'Create Template'}
                </div>
                <div className="text-xs text-purple-200">
                  {currentProject.testCaseTemplate
                    ? `${currentProject.testCaseTemplate.fields?.length || 0} fields configured`
                    : 'Define your test case structure'}
                </div>
              </div>
            </button>
            <button
              onClick={() => setShowGenerateModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors text-left flex items-center space-x-3 cursor-pointer"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
              <div>
                <div className="font-semibold">Generate Test Cases</div>
                <div className="text-xs text-blue-200">AI-powered test case generation</div>
              </div>
            </button>
            <button
              onClick={() => setShowSheetsModal(true)}
              className="bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-lg transition-colors text-left flex items-center space-x-3 cursor-pointer"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
              <div>
                <div className="font-semibold">
                  {currentProject.googleSheetId ? 'Manage Google Sheet' : 'Connect Google Sheets'}
                </div>
                <div className="text-xs text-green-200">
                  {currentProject.googleSheetId ? 'Sheet connected' : 'Sync test cases to Google Sheets'}
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Project Documents */}
        {currentProject.documents?.length > 0 && (
          <div className="bg-gray-800 rounded-lg p-6 mt-6">
            <h2 className="text-xl font-bold text-white mb-4">
              Project Documents
              <span className="text-gray-500 text-sm font-normal ml-2">
                ({currentProject.documents.length} file{currentProject.documents.length !== 1 ? 's' : ''})
              </span>
            </h2>
            <p className="text-gray-400 text-sm mb-4">
              These documents are used by the AI when generating test cases for this project.
            </p>
            <div className="space-y-2">
              {currentProject.documents.map((doc, index) => (
                <div
                  key={doc.filename}
                  className="flex items-center justify-between bg-gray-700 rounded-lg px-4 py-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <svg className="w-6 h-6 text-red-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    <div className="min-w-0">
                      <p className="text-gray-200 text-sm font-medium truncate">{doc.originalName}</p>
                      <p className="text-gray-500 text-xs">
                        {formatFileSize(doc.size)}
                        {doc.uploadedAt && ` \u00B7 ${new Date(doc.uploadedAt).toLocaleDateString()}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-4">
                    <button
                      onClick={() => setPdfViewer({
                        open: true,
                        url: `/uploads/documents/${doc.filename}`,
                        name: doc.originalName,
                      })}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-lg transition-colors cursor-pointer"
                    >
                      View
                    </button>
                    <button
                      onClick={() => handleDeleteDocument(index)}
                      className="p-1.5 text-gray-400 hover:text-red-400 transition-colors cursor-pointer"
                      title="Delete document"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* PDF Viewer Modal */}
      <PdfViewerModal
        isOpen={pdfViewer.open}
        onClose={() => setPdfViewer({ open: false, url: '', name: '' })}
        fileUrl={pdfViewer.url}
        fileName={pdfViewer.name}
      />

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-white mb-4">Delete Project</h3>
            <p className="text-gray-300 mb-6">
              Are you sure you want to delete "<strong>{currentProject.name}</strong>"? This
              action cannot be undone and will delete all associated test cases.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={handleDelete}
                disabled={loading}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
              >
                {loading ? 'Deleting...' : 'Delete'}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Project Modal */}
      <EditProjectModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSubmit={handleEditProject}
        project={currentProject}
        loading={loading}
      />

      {/* Template Builder Modal */}
      <TemplateBuilderModal
        isOpen={showTemplateBuilder}
        onClose={() => setShowTemplateBuilder(false)}
        onSave={handleTemplateSave}
        initialTemplate={currentProject.testCaseTemplate}
        loading={loading}
      />

      {/* Generate Test Cases Modal */}
      <GenerateTestCasesModal
        isOpen={showGenerateModal}
        onClose={() => {
          setShowGenerateModal(false);
          loadProject();
        }}
        project={currentProject}
      />

      {/* Google Sheets Modal */}
      <GoogleSheetsModal
        isOpen={showSheetsModal}
        onClose={() => setShowSheetsModal(false)}
        project={currentProject}
        onProjectReload={loadProject}
      />
    </div>
  );
};

export default ProjectDetail;
