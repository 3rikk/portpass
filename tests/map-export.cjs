const {chromium} = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
(async () => {
  const browser = await chromium.launch({headless:true});
  try {
    const page = await browser.newPage({viewport:{width:1440,height:1100},colorScheme:'light'});
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(process.env.PORTPASS_URL || 'http://127.0.0.1:8000/');
    await page.waitForSelector('.country');
    // Exercise the fallback even on a browser with native file sharing.
    await page.evaluate(() => Object.defineProperty(navigator,'canShare',{configurable:true,value:()=>false}));
    await page.evaluate(() => {
      window.exportDrawing = {texts:[],boxes:[]};
      const fillText = CanvasRenderingContext2D.prototype.fillText;
      const roundRect = CanvasRenderingContext2D.prototype.roundRect;
      CanvasRenderingContext2D.prototype.fillText = function(value,x,y,...rest) {
        window.exportDrawing.texts.push({value:String(value),x,y,font:this.font});
        return fillText.call(this,value,x,y,...rest);
      };
      CanvasRenderingContext2D.prototype.roundRect = function(x,y,width,height,...rest) {
        window.exportDrawing.boxes.push({x,y,width,height});
        return roundRect.call(this,x,y,width,height,...rest);
      };
    });
    await page.click('#share-map');
    await page.waitForSelector('#download-map');
    assert.equal(await page.locator('#share-image').isVisible(),false);
    const image = await page.locator('#share-preview').evaluate(async img => {
      await img.decode(); return {width:img.naturalWidth,height:img.naturalHeight};
    });
    assert.ok(image.width >= 1800 && image.height >= 1100);
    const drawing = await page.evaluate(()=>window.exportDrawing);
    const mapBox = drawing.boxes.reduce((largest,box)=>box.width>largest.width?box:largest);
    for (const label of ['MAP KEY','portpass','.world','portpass.world']) {
      const text = drawing.texts.find(item=>item.value===label);
      assert.ok(text && text.x>mapBox.x && text.x<mapBox.x+mapBox.width && text.y>mapBox.y && text.y<mapBox.y+mapBox.height,label);
    }
    assert.ok(!drawing.texts.some(item=>/unlocked|FEWER BORDERS|guarantee of admission|Check current entry rules|Country boundaries/.test(item.value)));
    for (const label of ['Your travel wallet','Your possibilities']) {
      const text = drawing.texts.find(item=>item.value===label);
      assert.ok(Number(text.font.match(/([\d.]+)px/)[1])>=30);
    }

    const [download] = await Promise.all([page.waitForEvent('download'),page.click('#download-map')]);
    assert.equal(download.suggestedFilename(),'portpass-world-visit-map.jpg');
    const bytes = await fs.readFile(await download.path());
    assert.deepEqual([...bytes.subarray(0,3)],[255,216,255]);
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('#share-preview').getAttribute('src'),null);
    // Native sharing receives the generated JPEG, and cancellation preserves it.
    await page.evaluate(() => {
      Object.defineProperty(navigator,'canShare',{configurable:true,value:({files})=>files[0].type==='image/jpeg'});
      Object.defineProperty(navigator,'share',{configurable:true,value:async data=>{
        window.sharedFile={name:data.files[0].name,size:data.files[0].size,type:data.files[0].type};
      }});
    });
    await page.emulateMedia({colorScheme:'dark'});
    await page.click('[data-mode=live]');
    await page.click('#share-map'); await page.waitForSelector('#share-image');
    await page.click('#share-image');
    const shared = await page.evaluate(()=>window.sharedFile);
    assert.equal(shared.name,'portpass-world-live-map.jpg');assert.equal(shared.type,'image/jpeg');assert.ok(shared.size>10000);
    await page.evaluate(()=>Object.defineProperty(navigator,'share',{configurable:true,value:async()=>{throw new DOMException('Cancelled','AbortError');}}));
    await page.click('#share-image');
    assert.match(await page.locator('#share-status').innerText(),/cancelled/);
    assert.equal(await page.locator('#download-map').isVisible(),true);
    await page.evaluate(()=>Object.defineProperty(navigator,'share',{configurable:true,value:async()=>{throw new DOMException('Unavailable','NotAllowedError');}}));
    await page.click('#share-image');
    assert.match(await page.locator('#share-status').innerText(),/Download JPEG/);
    await page.setViewportSize({width:390,height:844});
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    assert.deepEqual(errors,[]);
    console.log('Map export passed: JPEG decoding/download, both modes/themes, native share payload, cancellation, share failure, cleanup, mobile layout.');
  } finally { await browser.close(); }
})().catch(error=>{console.error(error);process.exit(1);});
