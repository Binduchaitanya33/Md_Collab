import express from 'express';
import File from '../models/File.js';
import Edit from '../models/Edit.js';
import Notification from '../models/Notification.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

/* =========================================================
   GET ALL APPROVED FILES (All authenticated users)
========================================================= */
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

/* =========================================================
   GET FILES CREATED BY CURRENT USER
   IMPORTANT: must be before "/:id"
========================================================= */
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

/* =========================================================
   GET SINGLE FILE
========================================================= */
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

/* =========================================================
   CREATE NEW FILE (Editor & Admin)
========================================================= */
router.post('/', authenticate, authorize('editor', 'admin'), async (req, res) => {
    try {
        const { name, content } = req.body;

        const file = new File({
            name,
            content,
            author: req.user._id,
            status: 'approved',
            versions: [
                {
                    content,
                    updatedBy: req.user._id
                }
            ]
        });

        await file.save();
        await file.populate('author', 'name email');

        res.status(201).json(file);
    } catch (error) {
        console.error('Error creating file:', error);
        res.status(500).json({ message: 'Failed to create file' });
    }
});

/* =========================================================
   UPDATE FILE DIRECTLY (Admin Only)
========================================================= */
router.put('/:id', authenticate, authorize('admin'), async (req, res) => {
    try {
        const { content } = req.body;

        const file = await File.findById(req.params.id);
        if (!file) {
            return res.status(404).json({ message: 'File not found' });
        }

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

/* =========================================================
   SAVE / UPDATE OWN FILE (Editor & Admin)
========================================================= */
router.put('/:id/save', authenticate, authorize('editor', 'admin'), async (req, res) => {
    try {
        const { content, name } = req.body;

        const file = await File.findById(req.params.id);
        if (!file) {
            return res.status(404).json({ message: 'File not found' });
        }

        if (file.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'You can only save your own files' });
        }

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

/* =========================================================
   DELETE FILE
   Admin: delete any
   Editor: delete any
========================================================= */
router.delete('/:id', authenticate, authorize('editor', 'admin'), async (req, res) => {
    try {
        const file = await File.findById(req.params.id);
        if (!file) {
            return res.status(404).json({ message: 'File not found' });
        }

        await Promise.all([
            Edit.deleteMany({ file: req.params.id }),
            Notification.deleteMany({ fileId: req.params.id })
        ]);

        await File.findByIdAndDelete(req.params.id);

        res.json({ message: 'File deleted successfully' });
    } catch (error) {
        console.error('Error deleting file:', error);
        res.status(500).json({ message: 'Failed to delete file' });
    }
});

export default router;
