import Note from '../models/Note.js';

// @desc    Create a new announcement
// @route   POST /api/notes
// @access  Private/Admin
export const createNote = async (req, res) => {
    try {
        const { title, content } = req.body;
        let bannerUrl = "";

        if (req.file) {
            bannerUrl = `/uploads/${req.file.filename}`;
        }

        const note = new Note({
            title,
            content,
            bannerUrl,
            createdBy: req.user._id
        });

        const createdNote = await note.save();
        res.status(201).json(createdNote);
    } catch (error) {
        res.status(400).json({ message: 'Failed to create note', error: error.message });
    }
};

// @desc    Get all announcements
// @route   GET /api/notes
// @access  Private (All logged in users)
export const getNotes = async (req, res) => {
    try {
        // Sort by newest first
        const notes = await Note.find({}).sort({ createdAt: -1 }).populate('createdBy', 'email');
        res.json(notes);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Delete an announcement
// @route   DELETE /api/notes/:id
// @access  Private/Admin
export const deleteNote = async (req, res) => {
    try {
        const note = await Note.findById(req.params.id);
        if (note) {
            await note.deleteOne();
            res.json({ message: 'Note removed' });
        } else {
            res.status(404).json({ message: 'Note not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};