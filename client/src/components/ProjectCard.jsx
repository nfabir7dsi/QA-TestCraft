import { Link } from 'react-router-dom';

const ProjectCard = ({ project, onEdit, onDelete }) => {
  const statusColors = {
    active: 'bg-green-500',
    archived: 'bg-gray-500',
    completed: 'bg-blue-500',
  };

  const statusLabels = {
    active: 'Active',
    archived: 'Archived',
    completed: 'Completed',
  };

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 hover:border-blue-500 transition-all p-6">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <Link to={`/projects/${project._id}`}>
            <h3 className="text-xl font-bold text-white hover:text-blue-400 transition-colors">
              {project.name}
            </h3>
          </Link>
          <p className="text-gray-400 text-sm mt-1 line-clamp-2">
            {project.description || 'No description'}
          </p>
        </div>
        <span
          className={`${
            statusColors[project.status]
          } text-white text-xs px-2 py-1 rounded-full`}
        >
          {statusLabels[project.status]}
        </span>
      </div>

      <div className="mb-4">
        <a
          href={project.websiteUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-400 hover:text-blue-300 text-sm flex items-center space-x-1"
        >
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
          <span className="truncate">{project.websiteUrl}</span>
        </a>
      </div>

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-4 text-sm text-gray-400">
          <div className="flex items-center space-x-1">
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
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <span>{project.testCaseCount} tests</span>
          </div>
          {project.tags && project.tags.length > 0 && (
            <div className="flex items-center space-x-1">
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
                  d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                />
              </svg>
              <span>{project.tags.length} tags</span>
            </div>
          )}
        </div>
      </div>

      {project.tags && project.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {project.tags.slice(0, 3).map((tag, index) => (
            <span
              key={index}
              className="bg-gray-700 text-gray-300 text-xs px-2 py-1 rounded"
            >
              {tag}
            </span>
          ))}
          {project.tags.length > 3 && (
            <span className="text-gray-400 text-xs px-2 py-1">
              +{project.tags.length - 3} more
            </span>
          )}
        </div>
      )}

      <div className="text-xs text-gray-500 mb-4">
        Created {new Date(project.createdAt).toLocaleDateString()}
      </div>

      <div className="flex space-x-2">
        <Link
          to={`/projects/${project._id}`}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-center py-2 px-4 rounded-md text-sm font-medium transition-colors"
        >
          View Details
        </Link>
        <button
          onClick={() => onEdit(project)}
          className="bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-md text-sm font-medium transition-colors cursor-pointer"
        >
          Edit
        </button>
        <button
          onClick={() => onDelete(project)}
          className="bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-md text-sm font-medium transition-colors cursor-pointer"
        >
          Delete
        </button>
      </div>
    </div>
  );
};

export default ProjectCard;
