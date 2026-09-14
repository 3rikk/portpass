'use strict';

const fs = require('node:fs');
const path = require('node:path');

const HOST = 'portpass.world';
const KEY = '9f0952bc59ab0f3fd2a57547e1c046f9';
const KEY_LOCATION = `https://${HOST}/${KEY}.txt`;
const ENDPOINT = 'https://api.indexnow.org/indexnow';
const root = path.resolve(__dirname, '..');

function sitemapUrls(xml) {
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)]
    .map(([, url]) => url.replaceAll('&amp;', '&'));
}

async function submit({dryRun = false, log = console.log} = {}) {
  const xml = fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8');
  const urlList = sitemapUrls(xml);
  if (!urlList.length || urlList.length > 10000) throw Error(`Unexpected sitemap URL count: ${urlList.length}`);
  if (urlList.some(url => !url.startsWith(`https://${HOST}/`))) throw Error('Sitemap contains a URL outside portpass.world.');

  const payload = {host: HOST, key: KEY, keyLocation: KEY_LOCATION, urlList};
  if (dryRun) {
    log(`IndexNow dry run: ${urlList.length} public URLs ready.`);
    return payload;
  }

  const response = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {'content-type': 'application/json; charset=utf-8'},
    body: JSON.stringify(payload)
  });
  if (!response.ok) throw Error(`IndexNow submission failed: HTTP ${response.status}`);
  log(`IndexNow accepted ${urlList.length} public URLs (HTTP ${response.status}).`);
  return payload;
}

if (require.main === module) submit({dryRun: process.argv.includes('--dry-run')}).catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});

module.exports = {sitemapUrls, submit};
