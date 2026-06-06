import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiMessageSquare, FiHeart, FiPlusCircle, FiTrendingUp,
  FiTrendingDown, FiMessageCircle, FiUsers, FiSend, FiMinus
} from 'react-icons/fi';
import api from '../services/api';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/common/LoadingSpinner';

export default function Community() {
  const { user } = useSelector((state) => state.auth);
  const [ideas, setIdeas] = useState([]);
  const [loading, setLoading] = useState(true);

  // New Idea Form State
  const [symbol, setSymbol] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [direction, setDirection] = useState('NEUTRAL');
  const [publishing, setPublishing] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // Comments State
  const [expandedComments, setExpandedComments] = useState({});
  const [commentInputs, setCommentInputs] = useState({});

  const fetchIdeas = async () => {
    try {
      const { data } = await api.get('/social');
      setIdeas(data.ideas || []);
    } catch (err) {
      console.error('Failed to fetch ideas:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIdeas();
  }, []);

  const handlePublish = async (e) => {
    e.preventDefault();
    if (!symbol.trim() || !title.trim() || !description.trim()) {
      return toast.error('Please fill all fields');
    }
    setPublishing(true);
    try {
      await api.post('/social', {
        symbol: symbol.toUpperCase(),
        title,
        description,
        direction
      });
      toast.success('Trade idea published!');
      setSymbol(''); setTitle(''); setDescription(''); setDirection('NEUTRAL');
      setShowForm(false);
      fetchIdeas();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to publish idea');
    } finally {
      setPublishing(false);
    }
  };

  const handleLike = async (ideaId) => {
    try {
      const { data } = await api.post(`/social/${ideaId}/like`);
      setIdeas(ideas.map(idea => {
        if (idea._id === ideaId) {
          const newCount = data.liked ? (idea.likes.length + 1) : Math.max(0, idea.likes.length - 1);
          return { ...idea, likes: Array(newCount).fill('') };
        }
        return idea;
      }));
    } catch (err) {
      console.error('Failed to like:', err);
    }
  };

  const handleComment = async (e, ideaId) => {
    e.preventDefault();
    const text = commentInputs[ideaId] || '';
    if (!text.trim()) return;
    try {
      const { data } = await api.post(`/social/${ideaId}/comment`, { text });
      setIdeas(ideas.map(idea => {
        if (idea._id === ideaId) return { ...idea, comments: data.comments };
        return idea;
      }));
      setCommentInputs({ ...commentInputs, [ideaId]: '' });
      toast.success('Comment posted!');
    } catch (err) {
      toast.error('Failed to post comment');
    }
  };

  const toggleComments = (ideaId) => {
    setExpandedComments({ ...expandedComments, [ideaId]: !expandedComments[ideaId] });
  };

  if (loading) return <LoadingSpinner size="lg" text="Loading community..." />;

  const directionConfig = {
    BULLISH: { label: 'Bullish', icon: FiTrendingUp, color: 'text-green-700', bg: 'bg-green-50 border-green-200' },
    BEARISH: { label: 'Bearish', icon: FiTrendingDown, color: 'text-red-600', bg: 'bg-red-50 border-red-200' },
    NEUTRAL: { label: 'Neutral', icon: FiMinus, color: 'text-slate-600', bg: 'bg-slate-50 border-slate-200' },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <FiUsers className="text-slate-700" size={22} />
            <h1 className="text-2xl font-bold text-slate-800">Community</h1>
          </div>
          <p className="text-sm text-slate-500">Share trade ideas and market analysis with fellow traders</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-primary flex items-center gap-2 text-xs py-2.5 px-5"
        >
          <FiPlusCircle size={14} />
          Share Idea
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="glass-card p-4 text-center">
          <p className="text-2xl font-extrabold text-slate-800">{ideas.length}</p>
          <p className="text-xs text-slate-400 mt-1 font-semibold">Ideas Shared</p>
        </div>
        <div className="glass-card p-4 text-center">
          <p className="text-2xl font-extrabold text-green-600">
            {ideas.filter(i => i.direction === 'BULLISH').length}
          </p>
          <p className="text-xs text-slate-400 mt-1 font-semibold">Bullish Ideas</p>
        </div>
        <div className="glass-card p-4 text-center">
          <p className="text-2xl font-extrabold text-red-500">
            {ideas.filter(i => i.direction === 'BEARISH').length}
          </p>
          <p className="text-xs text-slate-400 mt-1 font-semibold">Bearish Ideas</p>
        </div>
      </div>

      {/* Share Idea Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -10 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -10 }}
            className="glass-card overflow-hidden"
          >
            <div className="p-5 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <FiPlusCircle size={16} className="text-slate-500" />
                Share a Trade Idea
              </h2>
            </div>
            <form onSubmit={handlePublish} className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Symbol */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Asset Symbol *
                  </label>
                  <input
                    type="text"
                    value={symbol}
                    onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                    placeholder="e.g. RELIANCE, NIFTY"
                    className="w-full glass-input text-sm uppercase"
                    required
                  />
                </div>

                {/* Direction */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Sentiment *
                  </label>
                  <div className="flex gap-2">
                    {[
                      { value: 'BULLISH', label: '🐂 Bullish' },
                      { value: 'NEUTRAL', label: '⚖️ Neutral' },
                      { value: 'BEARISH', label: '🐻 Bearish' },
                    ].map((d) => (
                      <button
                        key={d.value}
                        type="button"
                        onClick={() => setDirection(d.value)}
                        className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all border ${
                          direction === d.value
                            ? d.value === 'BULLISH'
                              ? 'bg-green-50 border-green-300 text-green-700'
                              : d.value === 'BEARISH'
                                ? 'bg-red-50 border-red-300 text-red-600'
                                : 'bg-[#0a0f1d] border-[#0a0f1d] text-white'
                            : 'bg-slate-50 border-slate-100 text-slate-500 hover:bg-slate-100'
                        }`}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Idea Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Brief summary of your analysis..."
                  className="w-full glass-input text-sm"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Analysis Details *
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Explain your technical/fundamental analysis, targets, stop-loss levels..."
                  className="w-full glass-input text-sm h-28 resize-none"
                  required
                />
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  disabled={publishing}
                  className="btn-primary flex items-center gap-2 text-xs py-2.5 px-6"
                >
                  <FiSend size={13} />
                  {publishing ? 'Publishing...' : 'Publish Idea'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="btn-ghost text-xs py-2.5 px-4"
                >
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Ideas Feed */}
      <div className="space-y-4">
        {ideas.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <FiMessageCircle className="mx-auto mb-3 text-slate-300" size={32} />
            <p className="text-sm text-slate-400 font-semibold">No trade ideas yet</p>
            <p className="text-xs text-slate-400 mt-1">Be the first to share a trading idea!</p>
            <button
              onClick={() => setShowForm(true)}
              className="mt-4 btn-primary text-xs py-2 px-4"
            >
              Share First Idea
            </button>
          </div>
        ) : (
          ideas.map((idea, idx) => {
            const dir = directionConfig[idea.direction] || directionConfig.NEUTRAL;
            const DirIcon = dir.icon;
            const isCommentsOpen = expandedComments[idea._id];

            return (
              <motion.div
                key={idea._id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04 }}
                className="glass-card overflow-hidden"
              >
                <div className="p-5">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center font-extrabold text-sm text-slate-700 uppercase">
                        {(idea.username || 'U').slice(0, 2)}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800">{idea.username || 'Anonymous'}</p>
                        <p className="text-[10px] text-slate-400">
                          {new Date(idea.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric', month: 'short', year: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/trade/${idea.symbol}`}
                        className="text-xs font-extrabold text-[#0a0f1d] bg-slate-100 px-3 py-1 rounded-lg hover:bg-slate-200 transition-all"
                      >
                        {idea.symbol}
                      </Link>
                      <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-lg border flex items-center gap-1 ${dir.bg} ${dir.color}`}>
                        <DirIcon size={10} />
                        {dir.label}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="mb-4">
                    <h3 className="text-sm font-extrabold text-slate-800 mb-1.5">{idea.title}</h3>
                    <p className="text-xs text-slate-600 leading-relaxed">{idea.description}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-5 pt-3 border-t border-slate-100 text-xs text-slate-400">
                    <button
                      onClick={() => handleLike(idea._id)}
                      className="flex items-center gap-1.5 hover:text-red-500 transition-colors font-semibold"
                    >
                      <FiHeart size={15} className={idea.likes.length > 0 ? 'fill-red-400 text-red-400' : ''} />
                      <span>{idea.likes.length} Likes</span>
                    </button>
                    <button
                      onClick={() => toggleComments(idea._id)}
                      className="flex items-center gap-1.5 hover:text-[#0a0f1d] transition-colors font-semibold"
                    >
                      <FiMessageSquare size={15} />
                      <span>{idea.comments?.length || 0} Comments</span>
                    </button>
                  </div>
                </div>

                {/* Comments Section */}
                <AnimatePresence>
                  {isCommentsOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="border-t border-slate-100 bg-slate-50/50"
                    >
                      <div className="p-4 space-y-3">
                        {/* Add comment */}
                        <form
                          onSubmit={(e) => handleComment(e, idea._id)}
                          className="flex gap-2"
                        >
                          <input
                            type="text"
                            value={commentInputs[idea._id] || ''}
                            onChange={(e) => setCommentInputs({ ...commentInputs, [idea._id]: e.target.value })}
                            placeholder="Add a comment..."
                            className="flex-1 glass-input text-xs py-2 px-3"
                          />
                          <button type="submit" className="btn-primary py-2 px-4 text-xs flex items-center gap-1">
                            <FiSend size={11} />
                            Post
                          </button>
                        </form>

                        {/* Comment list */}
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {(idea.comments || []).map((c, ci) => (
                            <div
                              key={c._id || ci}
                              className="bg-white border border-slate-100 p-3 rounded-xl"
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-[11px] font-extrabold text-slate-700">
                                  {c.username || 'Anonymous'}
                                </span>
                                <span className="text-[9px] text-slate-400">
                                  {new Date(c.createdAt).toLocaleDateString('en-IN')}
                                </span>
                              </div>
                              <p className="text-xs text-slate-600">{c.text}</p>
                            </div>
                          ))}
                          {(idea.comments?.length || 0) === 0 && (
                            <p className="text-xs text-slate-400 text-center py-3">
                              No comments yet. Be first!
                            </p>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
