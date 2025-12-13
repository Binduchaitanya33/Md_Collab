import { useState, useEffect } from 'react';
import { FileText, Search, Eye, Clock, User, AlertCircle } from 'lucide-react';
import axios from 'axios';
import MarkdownRenderer from '../components/MarkdownRenderer';

export default function ViewerDashboard() {
    const [files, setFiles] = useState([]);
    const [selectedFile, setSelectedFile] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [backendConnected, setBackendConnected] = useState(true);

    useEffect(() => {
        fetchFiles();
    }, []);

    const fetchFiles = async () => {
        try {
            const response = await axios.get('/api/files');
            setFiles(response.data);
            setBackendConnected(true);
        } catch (error) {
            setBackendConnected(false);
            // Demo data for testing without backend - comprehensive GitHub MD examples
            setFiles([
                {
                    _id: '1',
                    name: 'README.md',
                    content: `# Welcome to MD Collab :rocket:

This is a **collaborative markdown editing platform** with *full* ***GitHub Flavored Markdown*** support.

## Features :sparkles:

- [x] Role-based access control
- [x] Real-time markdown preview
- [x] GitHub-style diff viewer
- [x] Approval workflow
- [ ] Coming soon: Real-time collaboration

## Code Examples

### JavaScript
\`\`\`javascript
const greeting = "Hello, World!";
console.log(greeting);

// Arrow function
const add = (a, b) => a + b;
\`\`\`

### Python
\`\`\`python
def hello_world():
    print("Hello, World!")
    return True
\`\`\`

You can also use inline code like \`npm install\` in your text.

## Blockquotes

> This platform makes markdown collaboration easy and intuitive.
> 
> > Nested quotes work too!

## Links & Images

[Visit GitHub](https://github.com "GitHub Homepage")

## Math Support

Inline math: $E = mc^2$

Block math:
$$
\\sum_{i=1}^{n} x_i = x_1 + x_2 + ... + x_n
$$

## Horizontal Rule

---

## Strikethrough

~~This text is struck through~~

## Emojis

:heart: :fire: :thumbsup: :rocket: :star:

`,
                    author: { name: 'Admin User' },
                    status: 'approved',
                    updatedAt: new Date().toISOString()
                },
                {
                    _id: '2',
                    name: 'CONTRIBUTING.md',
                    content: `# Contributing Guidelines :handshake:

We welcome contributions! :tada:

## How to Contribute

1. Fork the repository
2. Create a feature branch
   - Use descriptive branch names
   - Keep changes focused
3. Make your changes
4. Submit a pull request

## Code Style

| Rule | Description | Example |
|:-----|:-----------:|--------:|
| Indentation | Use 2 spaces | \`  code\` |
| Naming | camelCase | \`myVariable\` |
| Comments | Be descriptive | \`// Handles X\` |

## Task Checklist

- [x] Read the guidelines
- [x] Fork the repo
- [ ] Make changes
- [ ] Submit PR

## Important Notes

> **Note:** Always run tests before submitting!

> **Warning:** Don't commit sensitive data.

## Contact

Mention @maintainer for help with issues #123
`,
                    author: { name: 'Editor User' },
                    status: 'approved',
                    updatedAt: new Date().toISOString()
                },
                {
                    _id: '3',
                    name: 'API.md',
                    content: `# API Documentation :books:

## Authentication

All endpoints require a valid JWT token.

\`\`\`bash
curl -H "Authorization: Bearer <token>" https://api.example.com/files
\`\`\`

## Endpoints

### GET /api/files

Returns all approved markdown files.

**Response:**
\`\`\`json
{
  "status": "success",
  "data": [
    { "id": "1", "name": "README.md" }
  ]
}
\`\`\`

### POST /api/files

Create a new markdown file.

| Parameter | Type | Required | Description |
|:----------|:----:|:--------:|:------------|
| name | string | :white_check_mark: | File name |
| content | string | :white_check_mark: | Markdown content |
| status | string | :x: | File status |

## Rate Limits

- **Free tier:** 100 requests/hour
- **Pro tier:** 1000 requests/hour

## Error Codes

| Code | Meaning |
|------|----------|
| 400 | Bad Request |
| 401 | Unauthorized |
| 404 | Not Found |
| 500 | Server Error |

---

*Last updated: December 2025*
`,
                    author: { name: 'Admin User' },
                    status: 'approved',
                    updatedAt: new Date().toISOString()
                }
            ]);
        }
        setLoading(false);
    };

    const filteredFiles = files.filter(file =>
        file.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
        );
    }

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
                        onClick={fetchFiles}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm font-medium"
                    >
                        Retry
                    </button>
                </div>
            )}

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Markdown Files</h1>
                    <p className="text-gray-500 mt-1">Browse and read all approved markdown files</p>
                </div>

                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search files..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent w-full sm:w-64"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* File List */}
                <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-4 border-b border-gray-200 bg-gray-50">
                        <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                            <FileText className="w-5 h-5 text-purple-600" />
                            Files ({filteredFiles.length})
                        </h2>
                    </div>
                    <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
                        {filteredFiles.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">
                                <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                <p>No files found</p>
                            </div>
                        ) : (
                            filteredFiles.map((file) => (
                                <button
                                    key={file._id}
                                    onClick={() => setSelectedFile(file)}
                                    className={`w-full p-4 text-left hover:bg-gray-50 transition ${selectedFile?._id === file._id ? 'bg-purple-50 border-l-4 border-purple-600' : ''
                                        }`}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                                                <FileText className="w-5 h-5 text-purple-600" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900">{file.name}</p>
                                                <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                                                    <User className="w-3 h-3" />
                                                    <span>{file.author?.name}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 mt-2 text-xs text-gray-400">
                                        <Clock className="w-3 h-3" />
                                        <span>{new Date(file.updatedAt).toLocaleDateString()}</span>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>

                {/* Markdown Preview */}
                <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                        <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                            <Eye className="w-5 h-5 text-purple-600" />
                            Preview
                        </h2>
                        {selectedFile && (
                            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                                {selectedFile.status}
                            </span>
                        )}
                    </div>
                    <div className="p-6 max-h-[600px] overflow-y-auto">
                        {selectedFile ? (
                            <MarkdownRenderer content={selectedFile.content} />
                        ) : (
                            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                                <Eye className="w-16 h-16 mb-4 text-gray-300" />
                                <p className="text-lg font-medium">Select a file to preview</p>
                                <p className="text-sm">Click on any file from the list</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
