import { useState, useRef } from 'react';

const CreateProjectModal = ({ isOpen, onClose, onSubmit, loading }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    websiteUrl: '',
    tags: '',
    status: 'active',
  });
  const [files, setFiles] = useState([]);
  const fileInputRef = useRef(null);

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
    const total = files.length + validFiles.length;
    setFiles((prev) => [...prev, ...validFiles].slice(0, 5));
    if (total > 5) {
      // silently cap at 5
    }
    // Reset input so same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const projectData = {
      ...formData,
      tags: formData.tags
        ? formData.tags.split(',').map((tag) => tag.trim()).filter((tag) => tag)
        : [],
      documents: files.length > 0 ? files : undefined,
    };
    onSubmit(projectData);
  };

  const handleClose = () => {
    setFormData({
      name: '',
      description: '',
      websiteUrl: '',
      tags: '',
      status: 'active',
    });
    setFiles([]);
    onClose();
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white">Create New Project</h2>
            <button
              onClick={handleClose}
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
                <span className="text-gray-500 font-normal ml-1">(optional, PDF only, max 5 files)</span>
              </label>
              <div
                onClick={() => files.length < 5 && fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
                  files.length >= 5
                    ? 'border-gray-700 cursor-not-allowed'
                    : 'border-gray-600 hover:border-blue-500 cursor-pointer'
                }`}
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
                <p className="text-gray-400 text-sm">
                  {files.length >= 5
                    ? 'Maximum 5 files reached'
                    : 'Click to upload SRS, BRS, or requirement documents'}
                </p>
                <p className="text-gray-500 text-xs mt-1">PDF files up to 10MB each</p>
              </div>

              {/* Selected files list */}
              {files.length > 0 && (
                <div className="mt-3 space-y-2">
                  {files.map((file, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-700 rounded-lg px-3 py-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <svg className="w-5 h-5 text-red-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                        <span className="text-gray-300 text-sm truncate">{file.name}</span>
                        <span className="text-gray-500 text-xs shrink-0">({formatFileSize(file.size)})</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
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
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating...' : 'Create Project'}
              </button>
              <button
                type="button"
                onClick={handleClose}
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

export default CreateProjectModal;
