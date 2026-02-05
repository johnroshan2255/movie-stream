import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { load } from 'cheerio';

puppeteer.use(StealthPlugin());

async function torrent1337x(query = '', page = '1') {
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
        
        const links = $('td.name').map((_, element) => {
            return 'https://1337xx.to' + $(element).find('a').next().attr('href');
        }).get();
        
        console.log(`Found ${links.length} torrents`);
        
        for (const link of links) {
            try {
                await browserPage.goto(link, { 
                    waitUntil: 'domcontentloaded',
                    timeout: 60000 
                });
                
                await new Promise(resolve => setTimeout(resolve, 1500));
                
                const detailHtml = await browserPage.content();
                const $detail = load(detailHtml);
                
                const data = {
                    Name: $detail('.box-info-heading h1').text().trim(),
                    Magnet: $detail('.clearfix ul li a').attr('href') || "",
                    Url: link
                };
                
                allTorrent.push(data);
                console.log(`✓ ${data.Name}`);
                
            } catch (error) {
                console.error(`✗ Failed: ${link}`);
            }
            
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await browser.close();
    }
    
    return allTorrent;
}

export default torrent1337x;