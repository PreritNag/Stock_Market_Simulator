const express = require('express');
const router = express.Router();
const { createIdea, getIdeas, likeIdea, commentIdea } = require('../controllers/socialController');
const auth = require('../middleware/auth');

// Protect all social routes
router.use(auth);

// GET /api/social
router.get('/', getIdeas);

// POST /api/social
router.post('/', createIdea);

// POST /api/social/:id/like
router.post('/:id/like', likeIdea);

// POST /api/social/:id/comment
router.post('/:id/comment', commentIdea);

module.exports = router;
