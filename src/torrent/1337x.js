import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { load } from 'cheerio';

puppeteer.use(StealthPlugin());

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
 * Check if size is between 1GB and 3GB
 */
function isInSizeRange(sizeStr) {
    const bytes = parseSize(sizeStr);
    return bytes >= MIN_SIZE_GB * 1024 * 1024 * 1024 && bytes <= MAX_SIZE_GB * 1024 * 1024 * 1024;
}

async function torrent1337x(query = '', page = '1', returnAll = false) {
    const allTorrent = [];
    const url = `https://1337xx.to/search/${query}/${page}/`;
    console.log('Fetching torrents from:', url);
    
    const browser = await puppeteer.launch({ 
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const browserPage = await browser.newPage();
    await browserPage.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    try {
        await browserPage.goto(url, { 
            waitUntil: 'domcontentloaded',
            timeout: 60000 
        });
        
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        const html = await browserPage.content();
        const $ = load(html);
        
        // Extract torrents from the listing page with seeders and size
        const torrents = [];
        $('tbody tr').each((_, element) => {
            const row = $(element);
            const nameCell = row.find('td.name');
            const link = nameCell.find('a').next().attr('href');
            const seeders = parseInt(row.find('td.seeds').text().trim()) || 0;
            const leechers = parseInt(row.find('td.leeches').text().trim()) || 0;
            const size = row.find('td.size').text().trim().split(' ').slice(0, 2).join(' ');
            const name = nameCell.find('a').next().text().trim();
            console.log(name, link, seeders, leechers, size);
            
            if (link && name) {
                torrents.push({
                    name,
                    link: 'https://1337xx.to' + link,
                    seeders,
                    leechers,
                    size
                });
            }
        });
        
        console.log(`Found ${torrents.length} torrents`);
        
        // Filter: size between 1GB and 3GB
        const filtered = torrents.filter(t => isInSizeRange(t.size));
        console.log(`Filtered to ${filtered.length} torrents (${MIN_SIZE_GB}GB - ${MAX_SIZE_GB}GB)`);
        
        if (filtered.length === 0) {
            console.log(`No torrents found in the ${MIN_SIZE_GB}GB-${MAX_SIZE_GB}GB range`);
            await browser.close();
            return null;
        }
        
        // Sort by seeders (descending) and get the one with maximum seeders
        filtered.sort((a, b) => b.seeders - a.seeders);
        const bestTorrent = returnAll ? filtered : filtered[0];
        
        console.log(`\nBest torrent (max seeders in range):`);
        console.log(`Name: ${bestTorrent.name}`);
        console.log(`Size: ${bestTorrent.size}`);
        console.log(`Seeders: ${bestTorrent.seeders}`);
        console.log(`Leechers: ${bestTorrent.leechers}`);
        console.log(`Fetching magnet link...\n`);
        
        // Get magnet link from detail page
        try {
            await browserPage.goto(bestTorrent.link, { 
                waitUntil: 'domcontentloaded',
                timeout: 60000 
            });
            
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            const detailHtml = await browserPage.content();
            const $detail = load(detailHtml);
            
            const magnet = $detail('.clearfix ul li a').attr('href') || "";
            
            const result = {
                Name: bestTorrent.name,
                Size: bestTorrent.size,
                Seeders: bestTorrent.seeders,
                Leechers: bestTorrent.leechers,
                Magnet: magnet,
                Url: bestTorrent.link
            };
            
            console.log('✓ Success! Magnet link retrieved');
            await browser.close();
            return result;
            
        } catch (error) {
            console.error(`✗ Failed to get magnet: ${error.message}`);
            await browser.close();
            return null;
        }
        
    } catch (error) {
        console.error('Error:', error.message);
        await browser.close();
        return null;
    }
}

export default torrent1337x;