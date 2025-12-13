import express from 'express';
import File from '../models/File.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Get all approved files (accessible to all authenticated users)
router.get('/', authenticate, async (req, res) => {
    try {
        const files = await File.find({ status: 'approved' })
            .populate('author', 'name email')
            .sort({ updatedAt: -1 });
        res.json(files);
    } catch (error) {
        console.error('Error fetching files:', error);
        res.status(500).json({ message: 'Failed to fetch files' });
    }
});

// Get single file
router.get('/:id', authenticate, async (req, res) => {
    try {
        const file = await File.findById(req.params.id)
            .populate('author', 'name email');

        if (!file) {
            return res.status(404).json({ message: 'File not found' });
        }

        res.json(file);
    } catch (error) {
        console.error('Error fetching file:', error);
        res.status(500).json({ message: 'Failed to fetch file' });
    }
});

// Create new file (editor and admin only)
router.post('/', authenticate, authorize('editor', 'admin'), async (req, res) => {
    try {
        const { name, content } = req.body;

        const file = new File({
            name,
            content,
            author: req.user._id,
            status: req.user.role === 'admin' ? 'approved' : 'approved', // Direct creation is approved
            versions: [{
                content,
                updatedBy: req.user._id
            }]
        });

        await file.save();
        await file.populate('author', 'name email');

        res.status(201).json(file);
    } catch (error) {
        console.error('Error creating file:', error);
        res.status(500).json({ message: 'Failed to create file' });
    }
});

// Update file directly (admin only)
router.put('/:id', authenticate, authorize('admin'), async (req, res) => {
    try {
        const { content } = req.body;

        const file = await File.findById(req.params.id);
        if (!file) {
            return res.status(404).json({ message: 'File not found' });
        }

        // Add current version to history
        file.versions.push({
            content: file.content,
            updatedBy: req.user._id
        });

        file.content = content;
        await file.save();
        await file.populate('author', 'name email');

        res.json(file);
    } catch (error) {
        console.error('Error updating file:', error);
        res.status(500).json({ message: 'Failed to update file' });
    }
});

// Save/update own file (editor can save their own files)
router.put('/:id/save', authenticate, authorize('editor', 'admin'), async (req, res) => {
    try {
        const { content, name } = req.body;

        const file = await File.findById(req.params.id);
        if (!file) {
            return res.status(404).json({ message: 'File not found' });
        }

        // Check if user is the author or admin
        if (file.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'You can only save your own files' });
        }

        // Add current version to history
        file.versions.push({
            content: file.content,
            updatedBy: req.user._id
        });

        file.content = content;
        if (name) file.name = name;
        await file.save();
        await file.populate('author', 'name email');

        res.json(file);
    } catch (error) {
        console.error('Error saving file:', error);
        res.status(500).json({ message: 'Failed to save file' });
    }
});

// Get files created by current user
router.get('/my/files', authenticate, async (req, res) => {
    try {
        const files = await File.find({ author: req.user._id })
            .populate('author', 'name email')
            .sort({ updatedAt: -1 });
        res.json(files);
    } catch (error) {
        console.error('Error fetching my files:', error);
        res.status(500).json({ message: 'Failed to fetch files' });
    }
});

// Delete file (admin only)
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
    try {
        const file = await File.findByIdAndDelete(req.params.id);
        if (!file) {
            return res.status(404).json({ message: 'File not found' });
        }
        res.json({ message: 'File deleted successfully' });
    } catch (error) {
        console.error('Error deleting file:', error);
        res.status(500).json({ message: 'Failed to delete file' });
    }
});

export default router;
