'use strict';
const fs=require('node:fs'),path=require('node:path');
const ROOT=path.resolve(__dirname,'..');
const THEME_HEAD='<meta name="color-scheme" content="light dark"><meta name="theme-color" content="#f7f8f5" media="(prefers-color-scheme: light)"><meta name="theme-color" content="#171e2b" media="(prefers-color-scheme: dark)"><script src="/theme.js"></script>';
const THEME_STYLE='<link rel="stylesheet" href="/seo-theme.css">';
function inject(html){
  if(html.includes('/seo-theme.css')&&html.includes('/theme.js'))return html;
  const viewport='<meta name="viewport" content="width=device-width,initial-scale=1">';
  if(!html.includes(viewport)||!html.includes('</head>'))throw Error('Generated SEO page has an unexpected head structure.');
  return html.replace(viewport,viewport+THEME_HEAD).replace('</head>',THEME_STYLE+'</head>');
}
function htmlFiles(dir){
  if(!fs.existsSync(dir))return [];
  const out=[];
  for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
    const file=path.join(dir,entry.name);
    if(entry.isDirectory())out.push(...htmlFiles(file));
    else if(entry.isFile()&&entry.name.endsWith('.html'))out.push(file);
  }
  return out;
}
function apply(root=ROOT){
  const files=['passport','travel'].flatMap(dir=>htmlFiles(path.join(root,dir)));
  for(const file of files)fs.writeFileSync(file,inject(fs.readFileSync(file,'utf8')));
  return files.length;
}
if(require.main===module)console.log('Applied shared Portpass theme to '+apply()+' generated SEO pages.');
module.exports={apply,inject};
