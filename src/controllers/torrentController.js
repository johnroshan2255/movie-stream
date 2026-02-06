import torrent1337x from '../torrent/1337x.js';
import torrentYTS from '../torrent/yts.js';

export const searchTorrents = async (req, res, next) => {
  try {
    const query = req.query.q || req.query.query || '';
    const page = req.query.page || '1';

    if (!query.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Search query (q or query) is required'
      });
    }

    const torrentService = req.query.service || 'yts';
    let torrents = null;

    if (torrentService === '1337x') {
      torrents = await torrent1337x(query.trim(), String(page), true);
    } else if (torrentService === 'yts') {
      torrents = await torrentYTS(query.trim(), String(page), true);
    }

    if (torrents === null) {
      return res.status(502).json({
        success: false,
        message: 'Torrent search temporarily unavailable'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        query: query.trim(),
        page: parseInt(page),
        count: torrents.length,
        torrents
      }
    });
  } catch (error) {
    next(error);
  }
};
