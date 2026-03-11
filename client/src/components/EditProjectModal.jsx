import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import projectService from '../services/projectService';

const EditProjectModal = ({ isOpen, onClose, onSubmit, project, loading }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    websiteUrl: '',
    tags: '',
    status: 'active',
  });
  const [newFiles, setNewFiles] = useState([]);
  const [existingDocs, setExistingDocs] = useState([]);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (project) {
      setFormData({
        name: project.name || '',
        description: project.description || '',
        websiteUrl: project.websiteUrl || '',
        tags: project.tags ? project.tags.join(', ') : '',
        status: project.status || 'active',
      });
      setExistingDocs(project.documents || []);
      setNewFiles([]);
    }
  }, [project]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files || []);
    const validFiles = selected.filter((f) => {
      if (f.type !== 'application/pdf') return false;
      if (f.size > 10 * 1024 * 1024) return false;
      return true;
    });
    const totalCount = existingDocs.length + newFiles.length + validFiles.length;
    const canAdd = Math.max(0, 5 - existingDocs.length - newFiles.length);
    setNewFiles((prev) => [...prev, ...validFiles.slice(0, canAdd)]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeNewFile = (index) => {
    setNewFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDeleteExistingDoc = async (docIndex) => {
    try {
      await projectService.deleteDocument(project._id, docIndex);
      setExistingDocs((prev) => prev.filter((_, i) => i !== docIndex));
      toast.success('Document deleted');
    } catch {
      toast.error('Failed to delete document');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const projectData = {
      ...formData,
      tags: formData.tags
        ? formData.tags.split(',').map((tag) => tag.trim()).filter((tag) => tag)
        : [],
      documents: newFiles.length > 0 ? newFiles : undefined,
    };
    onSubmit(project._id, projectData);
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const totalDocs = existingDocs.length + newFiles.length;

  if (!isOpen || !project) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white">Edit Project</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors cursor-pointer"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                Project Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., E-commerce Website Testing"
              />
            </div>

            <div>
              <label htmlFor="websiteUrl" className="block text-sm font-medium text-gray-300 mb-2">
                Website URL *
              </label>
              <input
                type="url"
                id="websiteUrl"
                name="websiteUrl"
                required
                value={formData.websiteUrl}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://example.com"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-2">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                rows={4}
                value={formData.description}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Describe your testing project..."
              />
            </div>

            <div>
              <label htmlFor="tags" className="block text-sm font-medium text-gray-300 mb-2">
                Tags (comma-separated)
              </label>
              <input
                type="text"
                id="tags"
                name="tags"
                value={formData.tags}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., frontend, payment, auth"
              />
            </div>

            {/* Project Documents */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Project Documents
                <span className="text-gray-500 font-normal ml-1">({totalDocs}/5 files)</span>
              </label>

              {/* Existing documents */}
              {existingDocs.length > 0 && (
                <div className="mb-3 space-y-2">
                  {existingDocs.map((doc, index) => (
                    <div key={doc.filename} className="flex items-center justify-between bg-gray-700 rounded-lg px-3 py-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <svg className="w-5 h-5 text-red-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                        <span className="text-gray-300 text-sm truncate">{doc.originalName}</span>
                        <span className="text-gray-500 text-xs shrink-0">({formatFileSize(doc.size)})</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteExistingDoc(index)}
                        className="text-gray-400 hover:text-red-400 transition-colors cursor-pointer ml-2 shrink-0"
                        title="Delete document"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Upload area */}
              {totalDocs < 5 && (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-600 hover:border-blue-500 rounded-lg p-4 text-center transition-colors cursor-pointer"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf"
                    multiple
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <svg className="w-8 h-8 mx-auto text-gray-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className="text-gray-400 text-sm">Click to add more documents</p>
                  <p className="text-gray-500 text-xs mt-1">PDF files up to 10MB each</p>
                </div>
              )}

              {/* New files to upload */}
              {newFiles.length > 0 && (
                <div className="mt-3 space-y-2">
                  <p className="text-gray-500 text-xs">New files to upload:</p>
                  {newFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between bg-blue-900/20 border border-blue-800 rounded-lg px-3 py-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <svg className="w-5 h-5 text-blue-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                        <span className="text-gray-300 text-sm truncate">{file.name}</span>
                        <span className="text-gray-500 text-xs shrink-0">({formatFileSize(file.size)})</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeNewFile(index)}
                        className="text-gray-400 hover:text-red-400 transition-colors cursor-pointer ml-2 shrink-0"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-300 mb-2">
                Status
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="active">Active</option>
                <option value="archived">Archived</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {loading ? 'Updating...' : 'Update Project'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-medium py-3 px-4 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditProjectModal;
