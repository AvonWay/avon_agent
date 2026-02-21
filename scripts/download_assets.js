import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const currentDir = path.dirname(__filename);
const __dirname = path.dirname(currentDir); // parent dir of scripts

const dir = path.join(__dirname, 'previews');
const assetsDir = path.join(dir, 'assets');
const imgDir = path.join(assetsDir, 'images');

if (!fs.existsSync(assetsDir)) fs.mkdirSync(assetsDir);
if (!fs.existsSync(imgDir)) fs.mkdirSync(imgDir);

const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

let imgMap = {};
let imageCounter = 1;

// Pass 1: Find all unique images
files.forEach(file => {
    let content = fs.readFileSync(path.join(dir, file), 'utf8');
    // More robust regex to catch both single and double quotes
    const regex1 = /<img[^>]+src="([^"]+)"/ig;
    let match;
    while ((match = regex1.exec(content)) !== null) {
        let url = match[1];
        if (url.startsWith('https://')) {
            if (!imgMap[url]) {
                const ext = 'jpg'; // Unsplash and Pravatar return jpgs
                const filename = `img_${imageCounter.toString().padStart(3, '0')}.${ext}`;
                imgMap[url] = filename;
                imageCounter++;
            }
        }
    }
});

console.log(`Found ${Object.keys(imgMap).length} unique external images to download.`);

function downloadImage(url, dest) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(dest);
        const req = https.get(url, (response) => {
            if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
                // Handle redirect
                return downloadImage(response.headers.location, dest).then(resolve).catch(reject);
            }
            if (response.statusCode !== 200) {
                return reject(new Error(`Failed to get '${url}' (${response.statusCode})`));
            }
            response.pipe(file);
            file.on('finish', () => {
                file.close(resolve);
            });
        }).on('error', (err) => {
            fs.unlink(dest, () => reject(err));
        });

        req.end();
    });
}

// Pass 2: Download and replace
async function processImages() {
    const urls = Object.keys(imgMap);

    console.log('Downloading images...');
    for (const url of urls) {
        const filename = imgMap[url];
        const destPath = path.join(imgDir, filename);
        if (!fs.existsSync(destPath)) {
            try {
                await downloadImage(url, destPath);
                console.log(`\u2705 Downloaded: ${filename}`);
            } catch (err) {
                console.error(`\u274c Failed: ${url} - ${err.message}`);
                // Remove from map so we don't replace broken files
                delete imgMap[url];
            }
        } else {
            console.log(`\u23e9 Skipped (exists): ${filename}`);
        }
    }

    console.log('\nRewriting HTML files to use local assets...');
    files.forEach(file => {
        const filePath = path.join(dir, file);
        let content = fs.readFileSync(filePath, 'utf8');
        let modifications = 0;

        for (const [url, filename] of Object.entries(imgMap)) {
            const localPath = `assets/images/${filename}`;
            if (content.includes(url)) {
                // Use literal replacement
                content = content.replace(new RegExp(url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), localPath);
                modifications++;
            }
        }

        if (modifications > 0) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`Updated ${file} (${modifications} image paths)`);
        }
    });

    console.log('\nAll done! Blueprints are now 100% offline-ready.');
}

processImages();
