import useGoogleSheetsStore from '../store/googleSheetsStore';
import toast from 'react-hot-toast';

const GoogleSheetsSyncStatus = ({ project, onConnect, onProjectReload }) => {
  const { syncing, syncToSheet, disconnectSheet } = useGoogleSheetsStore();

  const isConnected = !!project.googleSheetId;

  const handleSync = async () => {
    try {
      const result = await syncToSheet(project._id);
      toast.success(`Synced ${result.rowsSynced} test cases!`);
      onProjectReload();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDisconnect = async () => {
    if (!window.confirm('Disconnect this Google Sheet? The sheet itself will not be deleted.')) return;
    try {
      await disconnectSheet(project._id);
      toast.success('Google Sheet disconnected');
      onProjectReload();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const formatTimeAgo = (dateStr) => {
    if (!dateStr) return 'Never';
    const diff = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-gray-400 text-sm">Google Sheets</p>

          {isConnected ? (
            <div className="mt-2">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                <span className="text-white font-medium">Connected</span>
              </div>

              {project.googleSheetUrl && (
                <a
                  href={project.googleSheetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 text-sm truncate block mb-2"
                >
                  Open in Google Sheets
                  <svg className="w-3 h-3 inline ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              )}

              <p className="text-gray-500 text-xs">
                Last synced: {formatTimeAgo(project.lastSyncedAt)}
              </p>

              {project.syncStatus === 'error' && project.syncError && (
                <p className="text-red-400 text-xs mt-1">Error: {project.syncError}</p>
              )}

              <div className="flex items-center gap-2 mt-3">
                <button
                  onClick={handleSync}
                  disabled={syncing}
                  className="px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                >
                  {syncing ? (
                    <>
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                      Syncing...
                    </>
                  ) : (
                    <>
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Sync Now
                    </>
                  )}
                </button>
                <button
                  onClick={handleDisconnect}
                  disabled={syncing}
                  className="px-3 py-1.5 text-xs text-gray-400 hover:text-red-400 transition-colors cursor-pointer"
                >
                  Disconnect
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-2">
              <p className="text-lg font-medium text-white">Not Connected</p>
              <button
                onClick={onConnect}
                className="mt-2 px-3 py-1.5 text-xs bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors cursor-pointer"
              >
                Connect Sheet
              </button>
            </div>
          )}
        </div>

        <div className={`${isConnected ? 'bg-green-500' : 'bg-gray-600'} p-3 rounded-lg flex-shrink-0`}>
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
      </div>
    </div>
  );
};

export default GoogleSheetsSyncStatus;
