import axios from 'axios';

const MIN_SIZE_GB = 1;
const MAX_SIZE_GB = 6;

/**
 * Parse file size to bytes for comparison
 */
function parseSize(sizeStr) {
    const match = sizeStr.match(/([\d.]+)\s*(GB|MB)/i);
    if (!match) return 0;
    
    const value = parseFloat(match[1]);
    const unit = match[2].toUpperCase();
    
    if (unit === 'GB') {
        return value * 1024 * 1024 * 1024;
    } else if (unit === 'MB') {
        return value * 1024 * 1024;
    }
    return 0;
}

/**
 * Check if size is between MIN_SIZE_GB and MAX_SIZE_GB
 */
function isInSizeRange(sizeStr) {
    const bytes = parseSize(sizeStr);
    return bytes >= MIN_SIZE_GB * 1024 * 1024 * 1024 && bytes <= MAX_SIZE_GB * 1024 * 1024 * 1024;
}

async function torrentYTS(query = '', page = '1', returnAll = false) {
    const apiUrl = 'https://yts.bz/api/v2/list_movies.json';
    
    let searchTerm = query;
    const searchParams = { page: parseInt(page) };

    // Extract quality (720p, 1080p, etc.)
    const qualityMatch = searchTerm.match(/(?:quality=)?((?:2160|1440|1080|720|480|240)p|3D)/);
    let searchQuality = null;
    if (qualityMatch) {
        searchQuality = qualityMatch[1];
        searchParams.quality = searchQuality;
        searchTerm = searchTerm.replace(/(?:quality=)?((?:2160|1440|1080|720|480|240)p|3D)/, '').trim();
    }

    // Extract codec (x264, x265)
    const codecMatch = searchTerm.match(/\.?(?:x|h)(264|265)/);
    let searchCodec = null;
    if (codecMatch) {
        searchCodec = 'x' + codecMatch[1];
        if (searchParams.quality) {
            searchParams.quality += `.${searchCodec}`;
        }
        searchTerm = searchTerm.replace(/\.?(?:x|h)(264|265)/, '').trim();
    }

    // Extract rating
    const ratingMatch = searchTerm.match(/(?:min(?:imum)?_)?rating=(\d)/);
    if (ratingMatch) {
        searchParams.minimum_rating = ratingMatch[1];
        searchTerm = searchTerm.replace(/(?:min(?:imum)?_)?rating=(\d)/, '').trim();
    }

    // Extract genre
    const genreMatch = searchTerm.match(/genre=(\w+)/);
    if (genreMatch) {
        searchParams.genre = genreMatch[1];
        searchTerm = searchTerm.replace(/genre=(\w+)/, '').trim();
    }

    if (searchTerm) {
        searchParams.query_term = searchTerm;
    }

    console.log('Fetching torrents from YTS API:', apiUrl);
    console.log('Search params:', searchParams);

    try {
        const response = await axios.get(apiUrl, { params: searchParams });

        if (response.data.status !== 'ok') {
            console.error('API Error:', response.data.status_message);
            return null;
        }

        if (response.data.data.movie_count === 0) {
            console.log('No torrents found');
            return null;
        }

        const movies = response.data.data.movies;
        const torrents = [];

        // Extract all torrents from all movies
        movies.forEach(movie => {
            movie.torrents.forEach(torrent => {
                // Filter by codec if specified
                if (searchCodec && torrent.video_codec !== searchCodec) return;
                // Filter by quality if specified
                if (searchQuality && torrent.quality !== searchQuality) return;

                torrents.push({
                    name: `${movie.title_long} [${torrent.quality}] [${torrent.video_codec}] [${torrent.type}] [${torrent.audio_channels}] [YTS]`,
                    size: torrent.size,
                    seeders: torrent.seeds,
                    leechers: torrent.peers,
                    magnet: `magnet:?xt=urn:btih:${torrent.hash}&dn=${encodeURIComponent(movie.title_long)}&tr=udp://open.demonii.com:1337/announce&tr=udp://tracker.openbittorrent.com:80&tr=udp://tracker.coppersurfer.tk:6969&tr=udp://glotorrents.pw:6969/announce&tr=udp://tracker.opentrackr.org:1337/announce&tr=udp://torrent.gresille.org:80/announce&tr=udp://p4p.arenabg.com:1337&tr=udp://tracker.leechers-paradise.org:6969`,
                    url: movie.url,
                    hash: torrent.hash,
                    quality: torrent.quality,
                    codec: torrent.video_codec,
                    type: torrent.type,
                    imdb: movie.imdb_code,
                    year: movie.year,
                    genres: movie.genres,
                    coverImage: movie.medium_cover_image
                });
            });
        });

        console.log(`Found ${torrents.length} torrents`);

        // Filter: size between MIN_SIZE_GB and MAX_SIZE_GB
        const filtered = torrents.filter(t => isInSizeRange(t.size));
        console.log(`Filtered to ${filtered.length} torrents (${MIN_SIZE_GB}GB - ${MAX_SIZE_GB}GB)`);

        if (filtered.length === 0) {
            console.log(`No torrents found in the ${MIN_SIZE_GB}GB-${MAX_SIZE_GB}GB range`);
            return null;
        }

        // Sort by seeders (descending) and get the one with maximum seeders
        filtered.sort((a, b) => b.seeders - a.seeders);
        const bestTorrent = returnAll ? filtered : filtered[0];

        if (!returnAll) {
            console.log(`\nBest torrent (max seeders in range):`);
            console.log(`Name: ${bestTorrent.name}`);
            console.log(`Size: ${bestTorrent.size}`);
            console.log(`Seeders: ${bestTorrent.seeders}`);
            console.log(`Leechers: ${bestTorrent.leechers}`);
            console.log(`Quality: ${bestTorrent.quality}`);
            console.log(`Codec: ${bestTorrent.codec}`);

            const result = {
                Name: bestTorrent.name,
                Size: bestTorrent.size,
                Seeders: bestTorrent.seeders,
                Leechers: bestTorrent.leechers,
                Magnet: bestTorrent.magnet,
                Url: bestTorrent.url,
                Hash: bestTorrent.hash,
                Quality: bestTorrent.quality,
                Codec: bestTorrent.codec,
                Type: bestTorrent.type,
                IMDB: bestTorrent.imdb,
                Year: bestTorrent.year,
                Genres: bestTorrent.genres,
                CoverImage: bestTorrent.coverImage
            };

            console.log('✓ Success! Torrent retrieved');
            return result;
        } else {
            console.log('✓ Success! Returning all filtered torrents');
            return filtered.map(t => ({
                Name: t.name,
                Size: t.size,
                Seeders: t.seeders,
                Leechers: t.leechers,
                Magnet: t.magnet,
                Url: t.url,
                Hash: t.hash,
                Quality: t.quality,
                Codec: t.codec,
                Type: t.type,
                IMDB: t.imdb,
                Year: t.year,
                Genres: t.genres,
                CoverImage: t.coverImage
            }));
        }

    } catch (error) {
        console.error('Error:', error.message);
        return null;
    }
}

export default torrentYTS;