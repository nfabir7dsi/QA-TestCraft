import { useState, useEffect } from 'react';
import useGoogleSheetsStore from '../store/googleSheetsStore';
import toast from 'react-hot-toast';

const GoogleSheetsModal = ({ isOpen, onClose, project, onProjectReload }) => {
  const {
    googleConnected,
    syncing,
    checkConnection,
    initiateGoogleAuth,
    createSheet,
    connectSheet,
  } = useGoogleSheetsStore();

  const [mode, setMode] = useState('create');
  const [sheetUrl, setSheetUrl] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      checkConnection().finally(() => setLoading(false));
      setSheetUrl('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleGoogleAuth = async () => {
    try {
      await initiateGoogleAuth(`/projects/${project._id}?openSheetsModal=true`);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleCreateSheet = async () => {
    try {
      const result = await createSheet(project._id);
      toast.success(`Sheet created! ${result.rowsSynced} test cases synced.`);
      onProjectReload();
      onClose();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleConnectSheet = async (e) => {
    e.preventDefault();
    if (!sheetUrl.trim()) {
      toast.error('Please enter a Google Sheet URL');
      return;
    }
    try {
      const result = await connectSheet(project._id, { sheetUrl: sheetUrl.trim() });
      toast.success(result.message);
      onProjectReload();
      onClose();
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg max-w-lg w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h3 className="text-lg font-bold text-white">Google Sheets Integration</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : !googleConnected ? (
            /* Not authenticated with Google */
            <div className="text-center py-4">
              <div className="bg-gray-700 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              </div>
              <h4 className="text-white font-medium mb-2">Connect Your Google Account</h4>
              <p className="text-gray-400 text-sm mb-6">
                To use Google Sheets integration, you need to authorize QA TestCraft to access your Google Sheets.
              </p>
              <button
                onClick={handleGoogleAuth}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-6 rounded-lg transition-colors cursor-pointer inline-flex items-center gap-2"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Connect Google Account
              </button>
            </div>
          ) : (
            /* Authenticated — show create/connect options */
            <>
              {/* Mode tabs */}
              <div className="flex bg-gray-700 rounded-lg p-1 mb-6">
                <button
                  onClick={() => setMode('create')}
                  className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors cursor-pointer ${
                    mode === 'create'
                      ? 'bg-gray-600 text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Create New Sheet
                </button>
                <button
                  onClick={() => setMode('connect')}
                  className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors cursor-pointer ${
                    mode === 'connect'
                      ? 'bg-gray-600 text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Connect Existing
                </button>
              </div>

              {mode === 'create' ? (
                <div>
                  <p className="text-gray-400 text-sm mb-4">
                    Create a new Google Sheet with columns matching your template fields.
                    {project.testCaseCount > 0 && (
                      <> Your <strong className="text-white">{project.testCaseCount}</strong> existing test cases will be automatically synced.</>
                    )}
                  </p>
                  <div className="bg-gray-700/50 rounded-lg p-4 mb-6">
                    <p className="text-gray-300 text-sm font-medium mb-2">Sheet will be named:</p>
                    <p className="text-white font-medium">QA-TestCraft: {project.name}</p>
                  </div>
                  <button
                    onClick={handleCreateSheet}
                    disabled={syncing}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                  >
                    {syncing ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Creating...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Create Google Sheet
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <form onSubmit={handleConnectSheet}>
                  <p className="text-gray-400 text-sm mb-4">
                    Paste the URL of an existing Google Sheet to connect it to this project.
                    Make sure you have edit access to the sheet.
                  </p>
                  <input
                    type="url"
                    value={sheetUrl}
                    onChange={(e) => setSheetUrl(e.target.value)}
                    placeholder="https://docs.google.com/spreadsheets/d/..."
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 mb-4"
                  />
                  <button
                    type="submit"
                    disabled={syncing || !sheetUrl.trim()}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                  >
                    {syncing ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Connecting...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                        </svg>
                        Connect Sheet
                      </>
                    )}
                  </button>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default GoogleSheetsModal;
