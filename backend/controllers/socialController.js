const Idea = require('../models/Idea');
const User = require('../models/User');

/**
 * @desc    Publish a new trade idea
 * @route   POST /api/social
 */
const createIdea = async (req, res) => {
  try {
    const { symbol, title, description, direction } = req.body;
    const userId = req.user._id;

    if (!symbol || !title || !description) {
      return res.status(400).json({
        success: false,
        message: 'Please provide symbol, title, and description'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const idea = await Idea.create({
      userId,
      username: user.name,
      symbol: symbol.toUpperCase(),
      title,
      description,
      direction: direction || 'NEUTRAL'
    });

    res.status(201).json({
      success: true,
      idea
    });
  } catch (error) {
    console.error('CreateIdea error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error creating trade idea'
    });
  }
};

/**
 * @desc    Get all trade ideas (newest first)
 * @route   GET /api/social
 */
const getIdeas = async (req, res) => {
  try {
    const { symbol } = req.query;
    const filter = {};
    if (symbol) {
      filter.symbol = symbol.toUpperCase();
    }

    let ideas = await Idea.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    if (ideas.length === 0 && !symbol) {
      const users = await User.find({});
      const demoUser = users.find(u => u.email === 'demo@example.com') || { _id: req.user._id, name: 'Demo Investor' };
      const traderUser = users.find(u => u.email === 'trader@example.com') || { _id: req.user._id, name: 'Alpha Trader' };

      const mockIdeas = [
        {
          userId: traderUser._id,
          username: traderUser.name,
          symbol: 'RELIANCE',
          title: 'Reliance consolidation breakout imminent',
          description: 'RELIANCE is trading near key support at ₹2450. Volume is increasing. Looking bullish for target of ₹2600.',
          direction: 'BULLISH',
          likes: [demoUser._id],
          comments: [
            {
              userId: demoUser._id,
              username: demoUser.name,
              text: 'Agreed, indicators showing oversold levels.',
              createdAt: new Date(Date.now() - 3600000)
            }
          ],
          createdAt: new Date(Date.now() - 7200000)
        },
        {
          userId: demoUser._id,
          username: demoUser.name,
          symbol: 'BTCINR',
          title: 'BTC support holding strong',
          description: 'BTCINR has tested support near 59L multiple times. Ready for another rally.',
          direction: 'BULLISH',
          likes: [],
          comments: [],
          createdAt: new Date(Date.now() - 14400000)
        },
        {
          userId: traderUser._id,
          username: traderUser.name,
          symbol: 'USDINR',
          title: 'USDINR consolidation continue',
          description: 'Forex pair USDINR continues to trade in a tight range. Watching RBI policies.',
          direction: 'NEUTRAL',
          likes: [demoUser._id],
          comments: [],
          createdAt: new Date(Date.now() - 86400000)
        }
      ];

      await Idea.insertMany(mockIdeas);
      ideas = await Idea.find(filter).sort({ createdAt: -1 }).lean();
    }

    res.json({
      success: true,
      ideas
    });
  } catch (error) {
    console.error('GetIdeas error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error fetching trade ideas'
    });
  }
};

/**
 * @desc    Like or unlike a trade idea
 * @route   POST /api/social/:id/like
 */
const likeIdea = async (req, res) => {
  try {
    const idea = await Idea.findById(req.params.id);
    if (!idea) {
      return res.status(404).json({
        success: false,
        message: 'Trade idea not found'
      });
    }

    const userId = req.user._id;
    const alreadyLiked = idea.likes.includes(userId);

    if (alreadyLiked) {
      // Unlike
      idea.likes = idea.likes.filter(id => id.toString() !== userId.toString());
    } else {
      // Like
      idea.likes.push(userId);
    }

    await idea.save();

    res.json({
      success: true,
      likesCount: idea.likes.length,
      liked: !alreadyLiked
    });
  } catch (error) {
    console.error('LikeIdea error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error liking trade idea'
    });
  }
};

/**
 * @desc    Add a comment to a trade idea
 * @route   POST /api/social/:id/comment
 */
const commentIdea = async (req, res) => {
  try {
    const { text } = req.body;
    const userId = req.user._id;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Comment text cannot be empty'
      });
    }

    const idea = await Idea.findById(req.params.id);
    if (!idea) {
      return res.status(404).json({
        success: false,
        message: 'Trade idea not found'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    idea.comments.push({
      userId,
      username: user.name,
      text: text.trim(),
      createdAt: new Date()
    });

    await idea.save();

    res.status(201).json({
      success: true,
      comments: idea.comments
    });
  } catch (error) {
    console.error('CommentIdea error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error commenting on trade idea'
    });
  }
};

module.exports = { createIdea, getIdeas, likeIdea, commentIdea };
