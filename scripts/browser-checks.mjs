import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {createServer} from 'vite';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import lineup from '../src/data/theater-lineups.json' with {type:'json'};

// A separate server and browser context keep real saved plans/notes untouched.
const server=await createServer({logLevel:'error',server:{host:'127.0.0.1',port:0}});
let browser;
try{
  await server.listen();
  const base=`http://127.0.0.1:${server.httpServer.address().port}`;
  browser=await chromium.launch({channel:process.env.BROWSER_CHANNEL??'chrome',headless:true});
  const context=await browser.newContext({viewport:{width:1440,height:1000}});
  await context.addInitScript(time=>{Date.now=()=>time;},Date.parse(lineup.current.startsAt)+1000);
  const page=await context.newPage();
  page.setDefaultTimeout(10000);
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  const nav=label=>page.locator('nav button').filter({hasText:label});
  const act=number=>page.locator('.assignment-only .act').filter({has:page.locator('.act-heading-content strong').filter({hasText:new RegExp(`^Act ${number}$`)})});
  const savedPlan=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('itp-plan-v1')));
  async function check(label,run){await run();console.log(`PASS ${label}`);}

  await page.goto(base,{waitUntil:'domcontentloaded'});
  await check('planner stays locked until the account is eligible',async()=>{
    await nav('Your Characters').waitFor();
    assert.equal(await nav('Theater Planner').isDisabled(),true);
  });
  await page.evaluate(async season=>{
    const {CHARACTERS}=await import('/src/characters.ts');
    localStorage.setItem('itp-ownership-v1',JSON.stringify(Object.fromEntries(CHARACTERS.map(c=>[c.name,{owned:true,level:90}]))));
    localStorage.setItem('itp-setup-v1',JSON.stringify({difficulty:'Lunar',elements:season.elements,opening:season.openingCharacters,guests:season.specialGuests,seasonId:season.season}));
    localStorage.setItem('itp-plan-v1',JSON.stringify({roster:['Mona','Linnea','Barbara','Sigewinne','Itto','Kokomi'],acts:{1:['Aino','Flins','','']},borrowed:'Kokomi'}));
  },lineup.current);
  await page.reload({waitUntil:'domcontentloaded'});
  await check('all five sections navigate without app errors',async()=>{
    for(const label of ['Challenge Setup','Theater Planner','Act Details','Video Guide','Your Characters']){
      await nav(label).click();
      await page.getByRole('heading',{name:label,exact:true}).waitFor();
    }
  });
  await check('difficulty stays synchronized between setup and Act Details',async()=>{
    await nav('Challenge Setup').click();
    await page.locator('.difficulty-select select').selectOption('Hard');
    await nav('Act Details').click();
    assert.equal(await page.locator('.difficulty-select select').inputValue(),'Hard');
    await page.locator('.difficulty-select select').selectOption('Lunar');
    await nav('Challenge Setup').click();
    assert.equal(await page.locator('.difficulty-select select').inputValue(),'Lunar');
  });
  await nav('Theater Planner').click();
  await check('slot keyboard navigation supports selection and Escape',async()=>{
    const slot=act(1).locator('.slots .act-picker-trigger').nth(2);
    await slot.focus();await page.keyboard.press('ArrowDown');
    await act(1).locator('.act-picker-menu').waitFor();
    await page.keyboard.press('ArrowDown');await page.keyboard.press('Enter');
    assert.ok((await savedPlan()).acts[1][2]);
    await slot.click();await page.keyboard.press('Escape');
    assert.equal(await act(1).locator('.act-picker-menu').count(),0);
    assert.equal(await slot.evaluate(element=>document.activeElement===element),true);
    await act(1).getByRole('button',{name:'Clear Act 1, slot 3',exact:true}).click();
  });
  await check('enemy choice supports keyboard selection without changing its height',async()=>{
    const summary=act(1).locator('.planner-choice-dropdown summary');
    const before=(await summary.boundingBox()).height;
    await summary.focus();await page.keyboard.press('Enter');
    const choice=act(1).locator('.planner-encounter-option').nth(1);
    await choice.focus();await page.keyboard.press('Enter');
    assert.equal((await summary.boundingBox()).height,before);
    assert.ok(Object.values((await savedPlan()).encounterChoices).some(Boolean));
  });
  await check('dragging a character into a slot assigns it',async()=>{
    await page.locator('.unallocated-character').filter({hasText:'Mona'}).dragTo(act(1).locator('.slots .act-picker-trigger').first());
    assert.equal((await savedPlan()).acts[1][0],'Mona');
  });
  await check('dragging a slot into another act moves the character',async()=>{
    await act(1).locator('.slots .act-picker-trigger').first().dragTo(act(2).locator('.slots .act-picker-trigger').first());
    const plan=await savedPlan();assert.equal(plan.acts[2][0],'Mona');assert.equal(plan.acts[1][0],'');
  });
  await check('copy/paste allows a second use and blocks a third',async()=>{
    await act(2).getByRole('button',{name:'Copy team from Act 2',exact:true}).click();
    await act(3).getByRole('button',{name:'Paste copied team into Act 3',exact:true}).click();
    assert.equal((await savedPlan()).acts[3][0],'Mona');
    await act(2).getByRole('button',{name:'Copy team from Act 2',exact:true}).click();
    await act(4).getByRole('button',{name:'Paste copied team into Act 4',exact:true}).click();
    await page.locator('.assignment-notice').waitFor();
    assert.notEqual((await savedPlan()).acts[4]?.[0],'Mona');
  });
  await check('whole-team drag preserves assignments',async()=>{
    const before=await savedPlan();
    const handle=act(2).getByRole('button',{name:'Drag team from Act 2',exact:true});
    await handle.scrollIntoViewIfNeeded();
    const source=await handle.boundingBox();
    await page.mouse.move(source.x+source.width/2,source.y+source.height/2);await page.mouse.down();
    await page.mouse.move(source.x+source.width/2-15,source.y+source.height/2+15,{steps:5});
    await act(5).scrollIntoViewIfNeeded();const target=await act(5).boundingBox();
    await page.mouse.move(target.x+target.width/2,target.y+20,{steps:20});await page.mouse.up();
    const after=await savedPlan();assert.deepEqual(after.acts[5],before.acts[2]);assert.deepEqual(after.acts[2],[]);
  });
  await check('assignments survive a browser reload',async()=>{
    const before=await savedPlan();await page.reload({waitUntil:'domcontentloaded'});
    await nav('Theater Planner').click();assert.deepEqual(await savedPlan(),before);
  });
  await check('act links open the corresponding Act Details card',async()=>{
    await act(3).getByRole('link',{name:'Act 3',exact:true}).click();
    await page.locator('#act-details-act-3').waitFor();
    assert.equal(await nav('Act Details').getAttribute('class'),'active');
    const top=await page.locator('#act-details-act-3').evaluate(element=>element.getBoundingClientRect().top);
    assert.ok(top>=0);
  });
  await check('video chapter links update and restart the embedded player',async()=>{
    await nav('Video Guide').click();
    assert.match(await page.locator('iframe').getAttribute('src'),/YqUCsZDrdZQ/);
    const chapter=page.locator('.video-guide-chapters a').filter({hasText:'Act 6'});
    await chapter.click();assert.match(await page.locator('iframe').getAttribute('src'),/start=740/);
    await page.locator('iframe').evaluate(element=>element.dataset.previousFrame='yes');
    await chapter.click();assert.equal(await page.locator('iframe').getAttribute('data-previous-frame'),null);
  });
  try{
    const videoFrame=page.locator('iframe').contentFrame();
    await videoFrame.locator('video').waitFor({state:'attached',timeout:6000});
    const playing=await videoFrame.locator('video').evaluate(video=>!video.paused&&video.currentTime>0);
    console.log(playing?'PASS YouTube playback started':'MANUAL CHECK YouTube player loaded; audible playback still needs checking.');
  }catch{console.log('MANUAL CHECK YouTube media could not be verified in this browser session.');}
  for(const label of ['Your Characters','Challenge Setup','Theater Planner','Act Details','Video Guide']){
    await check(`mobile layout: ${label}`,async()=>{
      await page.setViewportSize({width:390,height:844});await nav(label).click();
      const overflow=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,offenders:[...document.querySelectorAll('main *')].filter(el=>el.getBoundingClientRect().right>innerWidth+1).slice(0,15).map(el=>({tag:el.tagName,class:el.className,right:el.getBoundingClientRect().right,text:el.textContent.slice(0,60)}))}));
      if(overflow.scroll>overflow.width+1)console.log('overflow',label,JSON.stringify(overflow));
      assert.ok(overflow.scroll<=overflow.width+1,'horizontal page overflow');
    });
  }
  await page.screenshot({path:join(tmpdir(),'itp-browser-check-mobile.png'),fullPage:true});
  assert.deepEqual(errors,[],'uncaught browser errors');
  console.log('PASS no uncaught app errors');
  console.log('YouTube playback itself still requires a manual check in the target browser.');
}finally{
  await browser?.close();
  await server.close();
}
