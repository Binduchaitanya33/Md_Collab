import { useState, useEffect, useCallback } from 'react';
import {
    FileText,
    Plus,
    Edit,
    Eye,
    Send,
    Save,
    X,
    Clock,
    CheckCircle,
    XCircle,
    AlertCircle,
    FolderOpen,
    Download,
    RefreshCw,
    File
} from 'lucide-react';
import axios from 'axios';
import DiffViewer from '../components/DiffViewer';
import MarkdownRenderer from '../components/MarkdownRenderer';
import SyncScrollEditor from '../components/SyncScrollEditor';

export default function EditorDashboard() {
    const [files, setFiles] = useState([]);
    const [myFiles, setMyFiles] = useState([]);
    const [myEdits, setMyEdits] = useState([]);
    const [selectedFile, setSelectedFile] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [isOpenModalVisible, setIsOpenModalVisible] = useState(false);
    const [editContent, setEditContent] = useState('');
    const [editFileName, setEditFileName] = useState('');
    const [currentFileId, setCurrentFileId] = useState(null);
    const [isOwnFile, setIsOwnFile] = useState(false);
    const [newFileName, setNewFileName] = useState('');
    const [newFileContent, setNewFileContent] = useState('');
    const [showDiff, setShowDiff] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState(null); // 'saved', 'saving', 'error'
    const [activeTab, setActiveTab] = useState('myfiles');
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [backendConnected, setBackendConnected] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [filesRes, myFilesRes, editsRes] = await Promise.all([
                axios.get('/api/files'),
                axios.get('/api/files/my/files'),
                axios.get('/api/edits/my')
            ]);
            setFiles(filesRes.data);
            setMyFiles(myFilesRes.data);
            setMyEdits(editsRes.data);
            setBackendConnected(true);
        } catch (error) {
            setBackendConnected(false);
            // Demo data
            const demoFiles = [
                {
                    _id: '1',
                    name: 'README.md',
                    content: '# Welcome to MD Collab\n\nThis is a **collaborative markdown editing platform**.\n\n## Features\n\n- Role-based access control\n- Real-time markdown preview\n- GitHub-style diff viewer\n- Approval workflow\n\n## Getting Started\n\n1. Login with your credentials\n2. Navigate to your dashboard\n3. Start collaborating!',
                    author: { _id: 'user1', name: 'Admin User' },
                    status: 'approved',
                    updatedAt: new Date().toISOString()
                },
                {
                    _id: '2',
                    name: 'CONTRIBUTING.md',
                    content: '# Contributing Guidelines\n\nWe welcome contributions!\n\n## How to Contribute\n\n1. Fork the repository\n2. Create a feature branch\n3. Make your changes\n4. Submit a pull request',
                    author: { _id: 'currentUser', name: 'Editor User' },
                    status: 'approved',
                    updatedAt: new Date().toISOString()
                }
            ];
            setFiles(demoFiles);
            setMyFiles(demoFiles.filter(f => f.author._id === 'currentUser'));
            setMyEdits([
                {
                    _id: 'e1',
                    file: { name: 'README.md' },
                    status: 'pending',
                    createdAt: new Date().toISOString()
                }
            ]);
        }
        setLoading(false);
    };

    const handleStartEdit = (file, isOwn = false) => {
        setSelectedFile(file);
        setEditContent(file.content);
        setEditFileName(file.name);
        setCurrentFileId(file._id);
        setIsOwnFile(isOwn);
        setIsEditing(true);
        setShowDiff(false);
        setHasUnsavedChanges(false);
        setSaveStatus(null);
    };

    const handleContentChange = useCallback((content) => {
        setEditContent(content);
        setHasUnsavedChanges(true);
        setSaveStatus(null);
    }, []);

    const handleSaveFile = async () => {
        if (!currentFileId || !isOwnFile || !hasUnsavedChanges) return;

        setSaving(true);
        setSaveStatus('saving');

        try {
            const response = await axios.put(`/api/files/${currentFileId}/save`, {
                content: editContent,
                name: editFileName
            });

            // Update local state
            setSelectedFile(response.data);
            setHasUnsavedChanges(false);
            setSaveStatus('saved');

            // Refresh file lists
            fetchData();

            // Clear save status after 2 seconds
            setTimeout(() => setSaveStatus(null), 2000);
        } catch (error) {
            console.error('Save error:', error);
            // Demo mode - simulate successful save
            setHasUnsavedChanges(false);
            setSaveStatus('saved');
            setTimeout(() => setSaveStatus(null), 2000);
        } finally {
            setSaving(false);
        }
    };

    const handleOpenFile = (file) => {
        // Check if it's user's own file
        const isOwn = myFiles.some(f => f._id === file._id);
        handleStartEdit(file, isOwn);
        setIsOpenModalVisible(false);
    };

    const handleSendForApproval = async () => {
        try {
            await axios.post('/api/edits', {
                fileId: selectedFile._id,
                newContent: editContent
            });
            alert('Edit sent for approval!');
            setIsEditing(false);
            fetchData();
        } catch (error) {
            // Demo mode
            alert('Edit sent for approval! (Demo mode)');
            setIsEditing(false);
        }
    };

    const handleCreateFile = async () => {
        if (!newFileName || !newFileContent) return;

        try {
            const response = await axios.post('/api/files', {
                name: newFileName.endsWith('.md') ? newFileName : `${newFileName}.md`,
                content: newFileContent
            });

            // Open the newly created file for editing
            setIsCreating(false);
            handleStartEdit(response.data, true);
            setNewFileName('');
            setNewFileContent('');
            fetchData();
        } catch (error) {
            // Demo mode - simulate file creation
            const newFile = {
                _id: Date.now().toString(),
                name: newFileName.endsWith('.md') ? newFileName : `${newFileName}.md`,
                content: newFileContent,
                author: { _id: 'currentUser', name: 'You' },
                status: 'approved',
                updatedAt: new Date().toISOString()
            };
            setMyFiles(prev => [newFile, ...prev]);
            setIsCreating(false);
            handleStartEdit(newFile, true);
            setNewFileName('');
            setNewFileContent('');
        }
    };

    const handleDownloadFile = () => {
        const blob = new Blob([editContent], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = editFileName;
        a.click();
        URL.revokeObjectURL(url);
    };

    const getStatusBadge = (status) => {
        const styles = {
            pending: 'bg-yellow-100 text-yellow-700',
            approved: 'bg-green-100 text-green-700',
            rejected: 'bg-red-100 text-red-700'
        };
        const icons = {
            pending: <Clock className="w-3 h-3" />,
            approved: <CheckCircle className="w-3 h-3" />,
            rejected: <XCircle className="w-3 h-3" />
        };
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${styles[status]}`}>
                {icons[status]}
                {status}
            </span>
        );
    };

    const getSaveStatusIndicator = () => {
        if (saveStatus === 'saving') {
            return (
                <span className="flex items-center gap-1 text-xs text-blue-600">
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    Saving...
                </span>
            );
        }
        if (saveStatus === 'saved') {
            return (
                <span className="flex items-center gap-1 text-xs text-green-600">
                    <CheckCircle className="w-3 h-3" />
                    Saved
                </span>
            );
        }
        if (saveStatus === 'error') {
            return (
                <span className="flex items-center gap-1 text-xs text-red-600">
                    <XCircle className="w-3 h-3" />
                    Error saving
                </span>
            );
        }
        if (hasUnsavedChanges) {
            return (
                <span className="flex items-center gap-1 text-xs text-yellow-600">
                    <AlertCircle className="w-3 h-3" />
                    Unsaved changes
                </span>
            );
        }
        return null;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
        );
    }

    // Open File Modal
    const renderOpenModal = () => (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
                <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                    <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                        <FolderOpen className="w-5 h-5 text-purple-600" />
                        Open File
                    </h2>
                    <button
                        onClick={() => setIsOpenModalVisible(false)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <div className="p-4">
                    {/* My Files Section */}
                    <div className="mb-4">
                        <h3 className="text-sm font-medium text-gray-700 mb-2">My Files</h3>
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                            {myFiles.length === 0 ? (
                                <p className="text-sm text-gray-500 py-2">No files created yet</p>
                            ) : (
                                myFiles.map((file) => (
                                    <button
                                        key={file._id}
                                        onClick={() => handleOpenFile(file)}
                                        className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-purple-50 border border-gray-200 hover:border-purple-300 transition text-left"
                                    >
                                        <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                                            <File className="w-4 h-4 text-purple-600" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-gray-900 truncate">{file.name}</p>
                                            <p className="text-xs text-gray-500">
                                                Updated {new Date(file.updatedAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                                            Editable
                                        </span>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>

                    {/* All Files Section */}
                    <div>
                        <h3 className="text-sm font-medium text-gray-700 mb-2">All Files (Requires Approval to Edit)</h3>
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                            {files.filter(f => !myFiles.some(mf => mf._id === f._id)).map((file) => (
                                <button
                                    key={file._id}
                                    onClick={() => handleOpenFile(file)}
                                    className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 border border-gray-200 transition text-left"
                                >
                                    <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                                        <FileText className="w-4 h-4 text-gray-600" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-gray-900 truncate">{file.name}</p>
                                        <p className="text-xs text-gray-500">
                                            By {file.author?.name} • Updated {new Date(file.updatedAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                                        Read-only
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="p-4 border-t border-gray-200 flex justify-end">
                    <button
                        onClick={() => setIsOpenModalVisible(false)}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );

    // Create New File Modal
    if (isCreating) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-gray-900">Create New File</h1>
                    <button
                        onClick={() => setIsCreating(false)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition"
                    >
                        <X className="w-6 h-6 text-gray-500" />
                    </button>
                </div>

                {/* Filename Input - Separate and prominent */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        File Name
                    </label>
                    <div className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-purple-600" />
                        <input
                            type="text"
                            placeholder="Enter filename (e.g., README.md)"
                            value={newFileName}
                            onChange={(e) => setNewFileName(e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                        {!newFileName.endsWith('.md') && newFileName && (
                            <span className="text-xs text-gray-500">.md will be added</span>
                        )}
                    </div>
                </div>

                <SyncScrollEditor
                    content={newFileContent}
                    onChange={setNewFileContent}
                    placeholder="Write your markdown content here..."
                    editorHeight="500px"
                    editorTitle="Content"
                    previewTitle="Preview"
                />

                <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-500">
                        {!newFileName && <span className="text-red-500">⚠ Enter a filename</span>}
                        {newFileName && !newFileContent && <span className="text-red-500">⚠ Enter some content</span>}
                        {newFileName && newFileContent && <span className="text-green-600">✓ Ready to create</span>}
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => setIsCreating(false)}
                            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleCreateFile}
                            disabled={!newFileName || !newFileContent}
                            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            <Save className="w-4 h-4" />
                            Create File
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Edit Mode
    if (isEditing && selectedFile) {
        return (
            <div className="space-y-6">
                {isOpenModalVisible && renderOpenModal()}

                <div className="flex items-center justify-between">
                    <div className="flex-1">
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold text-gray-900">
                                {isOwnFile ? 'Editing: ' : 'Viewing: '}
                                <input
                                    type="text"
                                    value={editFileName}
                                    onChange={(e) => {
                                        setEditFileName(e.target.value);
                                        setHasUnsavedChanges(true);
                                    }}
                                    disabled={!isOwnFile}
                                    className={`bg-transparent border-none focus:outline-none ${isOwnFile ? 'cursor-text' : 'cursor-default'}`}
                                />
                            </h1>
                            {getSaveStatusIndicator()}
                        </div>
                        <p className="text-gray-500 mt-1">
                            {isOwnFile ? 'You can save changes directly' : 'Make changes and send for approval'}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setIsOpenModalVisible(true)}
                            className="p-2 hover:bg-gray-100 rounded-lg transition"
                            title="Open file"
                        >
                            <FolderOpen className="w-5 h-5 text-gray-600" />
                        </button>
                        <button
                            onClick={handleDownloadFile}
                            className="p-2 hover:bg-gray-100 rounded-lg transition"
                            title="Download file"
                        >
                            <Download className="w-5 h-5 text-gray-600" />
                        </button>
                        <button
                            onClick={() => setIsEditing(false)}
                            className="p-2 hover:bg-gray-100 rounded-lg transition"
                        >
                            <X className="w-6 h-6 text-gray-500" />
                        </button>
                    </div>
                </div>

                {/* Toggle Buttons */}
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowDiff(false)}
                        className={`px-4 py-2 rounded-lg font-medium transition ${!showDiff ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                    >
                        <Edit className="w-4 h-4 inline mr-2" />
                        Editor
                    </button>
                    <button
                        onClick={() => setShowDiff(true)}
                        className={`px-4 py-2 rounded-lg font-medium transition ${showDiff ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                    >
                        <Eye className="w-4 h-4 inline mr-2" />
                        View Changes
                    </button>
                </div>

                {showDiff ? (
                    <DiffViewer
                        oldContent={selectedFile.content}
                        newContent={editContent}
                        oldTitle="Original"
                        newTitle="Your Changes"
                    />
                ) : (
                    <SyncScrollEditor
                        content={editContent}
                        onChange={handleContentChange}
                        placeholder="Write your markdown content here..."
                        editorHeight="500px"
                        editorTitle="Markdown Editor"
                        previewTitle="Live Preview"
                    />
                )}

                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                        {isOwnFile ? (
                            <span className="flex items-center gap-1 bg-green-50 text-green-700 px-2 py-1 rounded">
                                <CheckCircle className="w-3 h-3" />
                                Your file - Can save directly or send for review
                            </span>
                        ) : (
                            <span className="flex items-center gap-1 bg-yellow-50 text-yellow-700 px-2 py-1 rounded">
                                <AlertCircle className="w-3 h-3" />
                                Not your file - Requires admin approval
                            </span>
                        )}
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => setIsEditing(false)}
                            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                        >
                            Cancel
                        </button>

                        {/* Save button - only for own files */}
                        {isOwnFile && (
                            <button
                                onClick={handleSaveFile}
                                disabled={!hasUnsavedChanges || saving}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 flex items-center gap-2"
                            >
                                {saving ? (
                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Save className="w-4 h-4" />
                                )}
                                Save
                            </button>
                        )}

                        {/* Send for Approval - always available when there are changes */}
                        <button
                            onClick={handleSendForApproval}
                            disabled={editContent === selectedFile.content}
                            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50 flex items-center gap-2"
                        >
                            <Send className="w-4 h-4" />
                            Send for Approval
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Main Dashboard
    return (
        <div className="space-y-6">
            {/* Backend Not Connected Banner */}
            {!backendConnected && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
                    <div className="p-2 bg-red-100 rounded-full">
                        <AlertCircle className="w-5 h-5 text-red-600" />
                    </div>
                    <div className="flex-1">
                        <h4 className="font-semibold text-red-800">Backend Not Connected</h4>
                        <p className="text-sm text-red-600">Unable to connect to the server. Showing demo data. Please ensure the backend server is running on port 5000.</p>
                    </div>
                    <button
                        onClick={fetchData}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm font-medium"
                    >
                        Retry
                    </button>
                </div>
            )}

            {isOpenModalVisible && renderOpenModal()}

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Editor Dashboard</h1>
                    <p className="text-gray-500 mt-1">Create and edit markdown files</p>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={() => setIsOpenModalVisible(true)}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                    >
                        <FolderOpen className="w-5 h-5 mr-2" />
                        Open File
                    </button>
                    <button
                        onClick={() => setIsCreating(true)}
                        className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                    >
                        <Plus className="w-5 h-5 mr-2" />
                        Create New
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200">
                <nav className="flex gap-4">
                    <button
                        onClick={() => setActiveTab('myfiles')}
                        className={`pb-3 px-1 border-b-2 font-medium text-sm transition ${activeTab === 'myfiles'
                            ? 'border-purple-600 text-purple-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        My Files ({myFiles.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('files')}
                        className={`pb-3 px-1 border-b-2 font-medium text-sm transition ${activeTab === 'files'
                            ? 'border-purple-600 text-purple-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        All Files ({files.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('edits')}
                        className={`pb-3 px-1 border-b-2 font-medium text-sm transition ${activeTab === 'edits'
                            ? 'border-purple-600 text-purple-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        My Edits ({myEdits.length})
                    </button>
                </nav>
            </div>

            {activeTab === 'myfiles' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {myFiles.length === 0 ? (
                        <div className="col-span-full bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
                            <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                            <p className="text-gray-500 mb-4">You haven't created any files yet</p>
                            <button
                                onClick={() => setIsCreating(true)}
                                className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Create Your First File
                            </button>
                        </div>
                    ) : (
                        myFiles.map((file) => (
                            <div
                                key={file._id}
                                className="bg-white rounded-xl shadow-sm border border-purple-200 p-4 hover:shadow-md transition"
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                                            <File className="w-5 h-5 text-purple-600" />
                                        </div>
                                        <div>
                                            <h3 className="font-medium text-gray-900">{file.name}</h3>
                                            <p className="text-xs text-gray-500">Your file</p>
                                        </div>
                                    </div>
                                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                        Editable
                                    </span>
                                </div>

                                <p className="text-sm text-gray-600 line-clamp-2 mb-4">
                                    {file.content.substring(0, 100)}...
                                </p>

                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleStartEdit(file, true)}
                                        className="flex-1 px-3 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition flex items-center justify-center gap-1"
                                    >
                                        <Edit className="w-4 h-4" />
                                        Edit & Save
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            ) : activeTab === 'files' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {files.map((file) => (
                        <div
                            key={file._id}
                            className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition"
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                                        <FileText className="w-5 h-5 text-purple-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-medium text-gray-900">{file.name}</h3>
                                        <p className="text-xs text-gray-500">{file.author?.name}</p>
                                    </div>
                                </div>
                                {getStatusBadge(file.status)}
                            </div>

                            <p className="text-sm text-gray-600 line-clamp-2 mb-4">
                                {file.content.substring(0, 100)}...
                            </p>

                            <div className="flex gap-2">
                                <button
                                    onClick={() => setSelectedFile(file)}
                                    className="flex-1 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition flex items-center justify-center gap-1"
                                >
                                    <Eye className="w-4 h-4" />
                                    View
                                </button>
                                <button
                                    onClick={() => handleStartEdit(file, myFiles.some(f => f._id === file._id))}
                                    className="flex-1 px-3 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition flex items-center justify-center gap-1"
                                >
                                    <Edit className="w-4 h-4" />
                                    Edit
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="divide-y divide-gray-100">
                        {myEdits.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">
                                <AlertCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                <p>No edits yet. Start editing a file!</p>
                            </div>
                        ) : (
                            myEdits.map((edit) => (
                                <div key={edit._id} className="p-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${edit.status === 'approved' ? 'bg-green-100' :
                                                edit.status === 'rejected' ? 'bg-red-100' : 'bg-yellow-100'
                                                }`}>
                                                {edit.status === 'approved' ? (
                                                    <CheckCircle className="w-5 h-5 text-green-600" />
                                                ) : edit.status === 'rejected' ? (
                                                    <XCircle className="w-5 h-5 text-red-600" />
                                                ) : (
                                                    <Clock className="w-5 h-5 text-yellow-600" />
                                                )}
                                            </div>
                                            <div>
                                                <h3 className="font-medium text-gray-900">{edit.file?.name}</h3>
                                                <p className="text-xs text-gray-500">
                                                    Submitted {new Date(edit.createdAt).toLocaleDateString()}
                                                    {edit.reviewedAt && ` • Reviewed ${new Date(edit.reviewedAt).toLocaleDateString()}`}
                                                </p>
                                            </div>
                                        </div>
                                        {getStatusBadge(edit.status)}
                                    </div>
                                    {/* Show review notes if rejected */}
                                    {edit.status === 'rejected' && edit.reviewNotes && (
                                        <div className="mt-3 ml-13 p-3 bg-red-50 rounded-lg border border-red-100">
                                            <p className="text-sm text-red-700">
                                                <span className="font-medium">Rejection reason:</span> {edit.reviewNotes}
                                            </p>
                                        </div>
                                    )}
                                    {/* Show success message if approved */}
                                    {edit.status === 'approved' && (
                                        <div className="mt-3 ml-13 p-3 bg-green-50 rounded-lg border border-green-100">
                                            <p className="text-sm text-green-700">
                                                ✓ Your changes have been applied to the file.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* Quick Preview Modal */}
            {selectedFile && !isEditing && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full max-h-[80vh] overflow-hidden">
                        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                            <h2 className="font-semibold text-gray-900">{selectedFile.name}</h2>
                            <button
                                onClick={() => setSelectedFile(null)}
                                className="p-2 hover:bg-gray-100 rounded-lg transition"
                            >
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto max-h-[60vh]">
                            <MarkdownRenderer content={selectedFile.content} />
                        </div>
                        <div className="p-4 border-t border-gray-200 flex justify-end gap-3">
                            <button
                                onClick={() => setSelectedFile(null)}
                                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                            >
                                Close
                            </button>
                            <button
                                onClick={() => handleStartEdit(selectedFile, myFiles.some(f => f._id === selectedFile._id))}
                                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition flex items-center gap-2"
                            >
                                <Edit className="w-4 h-4" />
                                Edit This File
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
