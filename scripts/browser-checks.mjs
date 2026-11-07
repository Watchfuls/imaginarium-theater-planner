import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {createServer} from 'vite';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {readFile} from 'node:fs/promises';
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
  await check('element and unallocated placeholders persist and prioritize matching characters',async()=>{
    const testPage=await context.newPage();
    try{
      await testPage.goto(base);
      await testPage.evaluate(async season=>{
        const {CHARACTERS}=await import('/src/characters.ts');
        localStorage.setItem('itp-ownership-v1',JSON.stringify(Object.fromEntries(CHARACTERS.map(c=>[c.name,{owned:true,level:90}]))));
        localStorage.setItem('itp-setup-v1',JSON.stringify({difficulty:'Lunar',elements:season.elements,opening:season.openingCharacters,guests:season.specialGuests,seasonId:season.season}));
        localStorage.setItem('itp-plan-v1',JSON.stringify({roster:[],acts:{}}));
      },lineup.current);
      await testPage.reload();
      await testPage.locator('nav button').filter({hasText:'Planner'}).click();
      const slot=testPage.getByRole('button',{name:'Act 1, slot 1',exact:true});
      await slot.click();
      const menu=testPage.locator('.act-picker-menu');
      for(const element of lineup.current.elements)assert.equal(await menu.getByRole('option',{name:'Any '+element,exact:true}).count(),1);
      assert.equal(await menu.getByRole('option').filter({hasText:/^Any /}).count(),3);
      await menu.getByRole('option',{name:'Any '+lineup.current.elements[0],exact:true}).click();
      await testPage.getByRole('button',{name:'Act 1, slot 1: Any '+lineup.current.elements[0],exact:true}).click();
      assert.equal(await menu.locator('.act-picker-group-label').first().textContent(),lineup.current.elements[0]+' characters');
      assert.ok(await menu.locator('.act-picker-option').count()>5);
      await menu.getByRole('option',{name:'Unallocated Character',exact:true}).click();
      await testPage.reload();
      await testPage.locator('nav button').filter({hasText:'Planner'}).click();
      await testPage.getByRole('button',{name:'Act 1, slot 1: Unallocated Character',exact:true}).click();
      assert.equal(await testPage.locator('.act-picker-menu .act-picker-group-label').filter({hasText:/characters$/}).count(),0);
      await testPage.locator('.act-picker-menu').getByRole('option',{name:'Any '+lineup.current.elements[0],exact:true}).click();
      await testPage.getByRole('button',{name:'Act 1, slot 2',exact:true}).click();
      await testPage.locator('.act-picker-menu').getByRole('option',{name:'Any '+lineup.current.elements[0],exact:true}).click();
      await testPage.getByRole('button',{name:'Copy team from Act 1',exact:true}).click();
      await testPage.getByRole('button',{name:'Paste copied team into Act 2',exact:true}).click();
      assert.equal(await testPage.getByRole('button',{name:'Act 2, slot 1: Any '+lineup.current.elements[0],exact:true}).count(),1);
    }finally{await testPage.close();}
  });
  await check('feedback opens on demand and returns focus when closed',async()=>{
    // Keep the UI check independent of Tally availability; never submit feedback.
    await page.route('https://tally.so/**',route=>route.fulfill(route.request().url().endsWith('/embed.js')
      ?{contentType:'application/javascript',body:'window.Tally={loadEmbeds(){}};'}
      :{contentType:'text/html',body:'<p>Feedback form</p>'}));
    const trigger=page.getByRole('button',{name:'Send feedback',exact:true});
    assert.equal(await page.locator('iframe').count(),0);
    await trigger.click();
    const dialog=page.getByRole('dialog',{name:'Send feedback'});
    await dialog.waitFor();
    assert.match(await dialog.locator('iframe').getAttribute('src'),/tally\.so\/embed\/jeZg4J/);
    await page.getByRole('button',{name:'Close feedback'}).click();
    assert.equal(await dialog.isVisible(),false);
    assert.equal(await trigger.evaluate(element=>document.activeElement===element),true);
    await page.setViewportSize({width:390,height:844});
    await trigger.click();
    const bounds=await dialog.boundingBox();
    assert.ok(bounds.x>=0&&bounds.x+bounds.width<=390);
    await page.keyboard.press('Escape');
    assert.equal(await dialog.isVisible(),false);
    await page.setViewportSize({width:1440,height:1000});
  });
  await check('mobile feedback supports touch scrolling and text entry inside the form',async()=>{
    const mobile=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
    try{
      const mobilePage=await mobile.newPage();
      await mobilePage.route('https://tally.so/**',route=>route.fulfill(route.request().url().endsWith('/embed.js')
        ?{contentType:'application/javascript',body:'window.Tally={loadEmbeds(){document.querySelector(".feedback-dialog iframe").style.height="1200px";}};'}
        :{contentType:'text/html',body:'<label><input type="radio" name="type">Bug report</label><label>Message<textarea></textarea></label><div style="height:900px"></div><label>Contact<input></label>'}));
      await mobilePage.goto(base,{waitUntil:'domcontentloaded'});
      await mobilePage.getByRole('button',{name:'Send feedback',exact:true}).click();
      const frame=mobilePage.locator('.feedback-dialog iframe').contentFrame();
      await frame.getByRole('radio',{name:'Bug report'}).tap();
      assert.equal(await frame.getByRole('radio',{name:'Bug report'}).isChecked(),true);
      await frame.getByRole('textbox',{name:'Message'}).tap();
      await mobilePage.keyboard.type('A mobile feedback report');
      const touch=await mobile.newCDPSession(mobilePage);
      await touch.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:195,y:650}]});
      for(let y=630;y>=250;y-=20)await touch.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:195,y}]});
      await touch.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
      assert.ok(await mobilePage.locator('.feedback-body').evaluate(element=>element.scrollTop>0),'swiping inside the iframe scrolls the popup');
      await mobilePage.locator('.feedback-body').evaluate(element=>new Promise(resolve=>{
        let previous=element.scrollTop,stable=0;
        const settled=()=>{const current=element.scrollTop;stable=current===previous?stable+1:0;previous=current;if(stable>=10)resolve();else requestAnimationFrame(settled);};
        requestAnimationFrame(settled);
      }));
      await frame.getByRole('textbox',{name:'Contact'}).tap();
      await mobilePage.keyboard.type('Optional contact');
      assert.equal(await frame.getByRole('textbox',{name:'Contact'}).inputValue(),'Optional contact');
      assert.equal(await frame.getByRole('textbox',{name:'Message'}).inputValue(),'A mobile feedback report');
      await mobilePage.getByRole('button',{name:'Close feedback'}).click();
      assert.equal(await mobilePage.getByRole('dialog').count(),0);
    }finally{await mobile.close();}
  });
  await check('backups round-trip, reject invalid uploads, and retain unavailable seasons as history',async()=>{
    const backupContext=await browser.newContext();
    try{
      const backupPage=await backupContext.newPage();
      await backupPage.goto(base,{waitUntil:'domcontentloaded'});
      const original=await backupPage.evaluate(async season=>{
        const {createPlannerBackup}=await import('/src/plannerBackup.ts');
        return createPlannerBackup({ownership:{Aino:{owned:true,level:95}},setup:{difficulty:'Hard',elements:season.elements,opening:season.openingCharacters,guests:season.specialGuests,seasonId:season.season},plan:{roster:['Aino'],acts:{1:['Aino','','','']}},sort:'game'});
      },lineup.current);
      await backupPage.getByText('Saves & backups',{exact:true}).click();
      const upload=async value=>{
        backupPage.once('dialog',dialog=>dialog.accept());
        await backupPage.getByLabel('Planner backup file').setInputFiles({name:'backup.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(value))});
      };
      await upload(original);
      await backupPage.getByRole('status').filter({hasText:'Backup restored.'}).waitFor();
      await backupPage.waitForFunction(()=>JSON.parse(localStorage.getItem('itp-ownership-v1')).Aino?.level===95);
      const downloadEvent=backupPage.waitForEvent('download');
      await backupPage.getByRole('button',{name:'Download backup',exact:true}).click();
      const download=await downloadEvent;
      const downloaded=JSON.parse(await readFile(await download.path(),'utf8'));
      assert.deepEqual(downloaded,original);
      await backupPage.getByLabel('Planner backup file').setInputFiles({name:'invalid.json',mimeType:'application/json',buffer:Buffer.from('{"format":"GOOD","characters":[]}')});
      await backupPage.getByRole('status').filter({hasText:'Restore failed:'}).waitFor();
      assert.equal(await backupPage.evaluate(()=>JSON.parse(localStorage.getItem('itp-ownership-v1')).Aino.level),95);
      const old={...original,setup:{...original.setup,seasonId:1},plan:{roster:['Mona'],acts:{1:['Mona']}}};
      await upload(old);
      await backupPage.getByRole('status').filter({hasText:'Season 1 is no longer available'}).waitFor();
      await backupPage.waitForFunction(()=>JSON.parse(localStorage.getItem('itp-plan-history-v1')).length===1);
      assert.deepEqual(await backupPage.evaluate(()=>JSON.parse(localStorage.getItem('itp-plan-v1'))),original.plan);
      await backupPage.reload({waitUntil:'domcontentloaded'});
      await backupPage.getByText('Saves & backups',{exact:true}).click();
      await backupPage.getByText('Historical plans (1)',{exact:true}).click();
      await backupPage.getByText('Season 1 · Hard',{exact:true}).click();
      assert.ok(await backupPage.getByText('Act 1: Mona',{exact:true}).isVisible());
    }finally{await backupContext.close();}
  });
  await check('Google Drive connects, saves, loads, and handles expired connections without storing tokens',async()=>{
    const driveContext=await browser.newContext();
    try{
      const drivePage=await driveContext.newPage();
      drivePage.setDefaultTimeout(10000);
      let cloud=null,writeCount=0,expired=false;
      await drivePage.route('https://www.googleapis.com/**',async route=>{
        const request=route.request();
        assert.equal(request.headers().authorization,'Bearer test-drive-token');
        if(expired){await route.fulfill({status:401,body:'{}'});return;}
        if(request.method()==='POST'){
          writeCount++;
          const body=request.postData();
          assert.match(body,/appDataFolder/);
          const pieces=body.split('Content-Type: application/json\r\n\r\n');
          cloud=JSON.parse(pieces[1].split('\r\n--')[0]);
          await route.fulfill({json:{id:'test-save'}});return;
        }
        if(request.url().includes('alt=media')){await route.fulfill({json:cloud});return;}
        await route.fulfill({json:{files:cloud?[{id:'test-save',modifiedTime:'2026-11-03T10:00:00Z'}]:[]}});
      });
      await drivePage.goto(base,{waitUntil:'domcontentloaded'});
      await drivePage.evaluate(async()=>{
        const {default:React}=await import('/node_modules/.vite/deps/react.js');
        const {default:ReactDOM}=await import('/node_modules/.vite/deps/react-dom_client.js');
        const {DriveControls}=await import('/src/DriveControls.tsx');
        window.google={accounts:{oauth2:{initTokenClient:options=>({requestAccessToken:()=>{
          if(options.scope!=='https://www.googleapis.com/auth/drive.appdata')throw new Error('Unexpected OAuth scope');
          options.callback({access_token:'test-drive-token',expires_in:3600,scope:options.scope});
        }})}}};
        const host=document.createElement('div');document.body.appendChild(host);
        ReactDOM.createRoot(host).render(React.createElement(DriveControls,{clientId:'test.apps.googleusercontent.com',save:{ownership:{Aino:{owned:true,level:95}},setup:{difficulty:'Hard',elements:['Hydro'],opening:[],guests:[]},plan:{roster:['Aino'],acts:{1:['Aino']}},sort:'name'},onRestore:save=>{window.driveRestored=save;return 'Drive backup restored.';}}));
      });
      await drivePage.getByRole('button',{name:'Connect Google Drive',exact:true}).click();
      await drivePage.getByRole('button',{name:'Load from Drive',exact:true}).click();
      await drivePage.getByText('No planner backup was found in this Google account. Save from your other device first.',{exact:true}).waitFor();
      await drivePage.getByRole('button',{name:'Save to Drive',exact:true}).click();
      await drivePage.getByText('Saved to Google Drive.',{exact:true}).waitFor();
      assert.equal(writeCount,1);
      assert.equal(cloud.ownership.Aino.level,95);
      await Promise.all([
        drivePage.waitForEvent('dialog').then(dialog=>dialog.dismiss()),
        drivePage.getByRole('button',{name:'Save to Drive',exact:true}).click(),
      ]);
      // The subsequent click waits for the cancelled operation to finish.
      drivePage.once('dialog',dialog=>dialog.accept());
      await drivePage.getByRole('button',{name:'Load from Drive',exact:true}).click();
      await drivePage.getByText('Drive backup restored.',{exact:true}).waitFor();
      assert.equal(writeCount,1,'cancelling replacement does not upload');
      assert.equal(await drivePage.evaluate(()=>window.driveRestored.ownership.Aino.level),95);
      assert.equal(await drivePage.evaluate(()=>JSON.stringify(localStorage).includes('test-drive-token')),false);
      expired=true;
      await drivePage.getByRole('button',{name:'Load from Drive',exact:true}).click();
      await drivePage.getByText('Your Google connection expired. Connect again.',{exact:true}).waitFor();
      await drivePage.getByRole('button',{name:'Connect Google Drive',exact:true}).waitFor();
    }finally{await driveContext.close();}
  });
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
    const navigation=await page.locator('.app-navigation').boundingBox();
    assert.ok(top>=navigation.y+navigation.height,'act heading is below the sticky navigation');
  });
  await check('Act Details keeps only compact navigation visible while scrolling',async()=>{
    for(const viewport of [{width:1440,height:1000},{width:390,height:844}]){
      await page.setViewportSize(viewport);
      await page.evaluate(async()=>{window.scrollTo(0,800);await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));});
      const navigation=await page.locator('.app-navigation').boundingBox();
      const header=await page.locator('.app-header').boundingBox();
      assert.ok(Math.abs(navigation.y)<1,'navigation stays at the top');
      assert.ok(navigation.height<100,'navigation leaves room for act content');
      assert.ok(header.y+header.height<0,'large header scrolls away');
      for(const button of await page.locator('.app-navigation nav button').all()){
        const bounds=await button.boundingBox();
        assert.ok(bounds.x>=0&&bounds.x+bounds.width<=viewport.width,'all five buttons fit');
      }
    }
    await nav('Video Guide').click();
    await page.getByRole('heading',{name:'Video Guide',exact:true}).waitFor();
    await nav('Act Details').click();
    await page.setViewportSize({width:1440,height:1000});
  });
  await check('mechanics show colored gauge badges with local element icons',async()=>{
    const gauges=page.locator('#act-details-act-8 .mechanics-element.is-gauge');
    assert.equal(await gauges.count(),2);
    assert.match(await gauges.nth(0).textContent(),/1U.*Pyro/);
    assert.match(await gauges.nth(1).textContent(),/30U.*Geo/);
    assert.match(await gauges.nth(1).locator('img').getAttribute('src'),/icons\/elements\/Geo_Icon.png/);
  });
  await check('Acts 1 and 2 show delayed thunder once above all choices and retain elite-specific hazards',async()=>{
    await nav('Act Details').click();
    for(const number of [1,2]){
      const shared=page.locator(`#act-details-act-${number} .act-shared-stage-effect`);
      assert.equal(await shared.count(),1);
      assert.equal(await shared.isVisible(),true);
      assert.match(await shared.textContent(),/All Choices.*Treacherous Thunder: Thunder starts roughly 5–15s after the star time limit/);
      assert.match(await shared.textContent(),/escalates about every 15s up to Level V/);
      const choices=page.locator(`#act-details-act-${number} .act-encounter:not(.is-elite-assault)`);
      assert.equal(await choices.count(),2);
      for(const choice of await choices.all()){
        const toggle=choice.getByRole('button',{name:new RegExp(`^Expand Act ${number}, choice`)});
        if(await toggle.count())await toggle.click();
        const effects=choice.locator('.act-detail-field').filter({has:page.getByText('Stage Effects',{exact:true})});
        assert.equal(await effects.count(),0,'normal choices do not repeat the shared effect');
      }
      const elite=page.locator(`#act-details-act-${number} .act-encounter.is-elite-assault .act-detail-field`).filter({has:page.getByText('Stage Effects',{exact:true})});
      assert.match(await elite.textContent(),number===1?/Desolation/:/Horrific Explosion/);
      assert.doesNotMatch(await elite.textContent(),/Treacherous Thunder/);
    }
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
      if(label==='Theater Planner'){
        const selected=page.locator('.act-picker-trigger').filter({has:page.locator('.act-picker-name')}).first();
        assert.equal(await selected.locator(':scope > .element').isVisible(),false,'compact slots hide the element badge');
        assert.equal(await selected.locator('.character-icon').isVisible(),true,'compact slots retain character portraits');
        assert.match(await selected.getAttribute('aria-label'),/: .+/,'portrait-only slots expose the character name to assistive technology');
      }
      const overflow=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,offenders:[...document.querySelectorAll('main *')].filter(el=>el.getBoundingClientRect().right>innerWidth+1).slice(0,15).map(el=>({tag:el.tagName,class:el.className,right:el.getBoundingClientRect().right,text:el.textContent.slice(0,60)}))}));
      await page.evaluate(async()=>{window.scrollTo(0,800);await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));});
      const navigation=await page.locator('.app-navigation').boundingBox();
      assert.ok(Math.abs(navigation.y)<1,'navigation stays pinned on every tab');
      assert.ok(navigation.height<100,'navigation stays compact on every tab');
      if(overflow.scroll>overflow.width+1)console.log('overflow',label,JSON.stringify(overflow));
      assert.ok(overflow.scroll<=overflow.width+1,'horizontal page overflow');
    });
  }
  await check('all tabs and planner controls fit standard mobile, tablet, and desktop resolutions',async()=>{
    await nav('Theater Planner').click();
    for(const [width,height] of [[320,568],[360,800],[375,667],[390,844],[412,915],[430,932],[667,375],[768,1024],[1024,768],[1280,720],[1366,768],[1440,900],[1920,1080],[2560,1440]]){
      await page.setViewportSize({width,height});
      for(const label of ['Your Characters','Challenge Setup','Act Details','Video Guide','Theater Planner']){
        await nav(label).click();
        await page.getByRole('heading',{name:label,exact:true}).waitFor();
        assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${label} overflows at ${width}x${height}`);
      }
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`page overflow at ${width}`);
      const escaping=await page.locator('.act-team-tools').evaluateAll(elements=>elements.some(element=>element.getBoundingClientRect().right>element.closest('.act').getBoundingClientRect().right+1));
      assert.equal(escaping,false,`act controls spill outside cards at ${width}`);
      for(const heading of await page.locator('.act-heading').all()){
        const title=await heading.locator('.act-heading-content>strong').boundingBox();
        const icon=await heading.locator('.act-team-tools .copy-team').boundingBox();
        assert.ok(Math.abs(title.y+title.height/2-icon.y-icon.height/2)<=1,`act title and toolbar have different vertical centers at ${width}`);
      }
      const list=await page.locator('.unallocated-list').evaluate(element=>element.scrollWidth<=element.clientWidth+1);
      assert.ok(list,`unallocated list clips horizontally at ${width}`);
      assert.ok(await page.locator('.unallocated-list').evaluate(element=>{
        const right=element.getBoundingClientRect().left+element.clientWidth;
        return [...element.children].every(child=>child.getBoundingClientRect().right<=right-6);
      }),`unallocated rows need space before the scrollbar at ${width}`);
      for(const index of [0,1]){
        await page.locator('.act-picker-trigger').nth(index).click();
        const menu=await page.locator('.act-picker-menu').boundingBox();
        assert.ok(menu.x>=0&&menu.x+menu.width<=width,`slot menu leaves viewport at ${width}`);
        assert.ok(await page.locator('.act-picker-options').evaluate(element=>{
          const right=element.getBoundingClientRect().left+element.clientWidth;
          return element.scrollWidth<=element.clientWidth+1&&[...element.querySelectorAll('.act-picker-option')].every(child=>child.getBoundingClientRect().right<=right-4&&child.scrollWidth<=child.clientWidth+1);
        }),`character choices are clipped by their menu at ${width}`);
        await page.keyboard.press('Escape');
      }
      const encounter=page.locator('.planner-choice-dropdown summary').first();
      if(await encounter.count()){
        await encounter.click();
        const menu=page.locator('.planner-choice-dropdown[open] .planner-encounter-options');
        assert.ok(await menu.evaluate(element=>{
          const right=element.getBoundingClientRect().left+element.clientWidth;
          return element.scrollWidth<=element.clientWidth+1&&[...element.children].every(child=>child.getBoundingClientRect().right<=right-6&&child.scrollWidth<=child.clientWidth+1);
        }),`enemy choices are clipped by their menu at ${width}`);
        await page.keyboard.press('Escape');
      }
      for(const preview of await page.locator('.act-heading>.planner-encounter-picker').all()){
        const heading=await preview.locator('..').boundingBox();
        const bounds=await preview.boundingBox();
        assert.ok(Math.abs(bounds.x+bounds.width/2-heading.x-heading.width/2)<2,`encounter preview is not centered at ${width}`);
      }
      if([375,768,1366,1920].includes(width)){
        await page.locator('.assignment-only .act').first().scrollIntoViewIfNeeded();
        await page.screenshot({path:join(tmpdir(),`itp-final-${width}x${height}.png`)});
      }
      console.log(`PASS resolution ${width}x${height}: all five tabs and planner dropdowns`);
    }
  });
  await page.screenshot({path:join(tmpdir(),'itp-browser-check-mobile.png'),fullPage:true});
  await check('uploaded generic elite encounters show effects and per-enemy resistance labels',async()=>{
    const isolated=await browser.newContext();
    try{
      const custom={format:'imaginarium-theater-custom-season',version:1,
        season:{id:'2099-01-01',season:99,startsAt:'2099-01-01T00:00:00Z',endsAt:'2099-02-01T00:00:00Z',elements:['Pyro','Hydro','Geo'],openingCharacters:[],specialGuests:[],bossStages:[],sourceUrl:''},
        actDetails:{seasons:{99:{Visionary:{9:{requirements:'',notes:'',encounters:[{name:'Enemy lineup 3',battleType:'Elite Assault',enemyIds:['123'],enemies:'Wave 1: 1 Test Ruin Enemy.',resistances:'Test Ruin Enemy: Physical 70%.',requirements:'Clear: Defeat 3 Bounties.',notes:'',stageEffects:'Thrilling Duel regression effect.'}]}}}}},
        enemies:{123:{name:'Test Ruin Enemy',iconUrl:'https://static.wikia.nocookie.net/gensin-impact/images/5/5b/Cryo_Slime_Icon.png',wikiUrl:'https://genshin-impact.fandom.com/wiki/Ruin_Guard'}}};
      custom.actDetails.seasons[99].Visionary[9].encounters.push({name:'Normal choice',enemies:'',resistances:'',requirements:'',notes:''});
      for(const act of [1,2])custom.actDetails.seasons[99].Visionary[act]={requirements:'',notes:'',encounters:[
        {name:'Normal choice',enemies:'',resistances:'',requirements:'',notes:'',stageEffects:'Treacherous Thunder: After a delay, thunder strikes characters.'},
        {name:'Elite choice',battleType:'Elite Assault',enemies:'',resistances:'',requirements:'',notes:'',stageEffects:'Treacherous Thunder: After a delay, thunder strikes characters.\nDistinct elite effect '+act+'.'}
      ]};
      custom.enemies['124']={...custom.enemies['123'],name:'Second Test Enemy'};
      Object.assign(custom.actDetails.seasons[99].Visionary[9].encounters[0],{enemyIds:['123','124'],bountyEnemyIds:['123']});
      custom.actDetails.seasons[99].Visionary[9].encounters.push({name:'Unmarked choice',enemies:'',resistances:'',requirements:'',notes:'',enemyIds:['123','124']});
      custom.actDetails.seasons[99].Lunar=Object.fromEntries([11,12].map(act=>[act,{requirements:'',notes:'',encounters:[{
        name:`Arcana ${act-10}`,enemies:'',resistances:'',requirements:'',notes:'',enemyIds:act===11?['123']:['123','124'],keyRecommendations:[{label:'Healing'},{label:'Shielding'}]
      }]}]));
      custom.actDetails.seasons[99].Lunar[9]=structuredClone(custom.actDetails.seasons[99].Visionary[9]);
      for(let id=125;id<=129;id++)custom.enemies[id]={...custom.enemies['123'],name:`Overflow Enemy ${id}`};
      custom.actDetails.seasons[99].Lunar[4]={requirements:'',notes:'',encounters:[
        {name:'Overflow bounty choice',enemyIds:['123','124','125','126','127','128','129'],bountyEnemyIds:['123','124'],enemies:'',resistances:'',requirements:'',notes:''},
        {name:'Other choice',enemies:'',resistances:'',requirements:'',notes:''}
      ]};
      await isolated.addInitScript(data=>{
        localStorage.setItem('itp-custom-season-v1',JSON.stringify(data));
        if(!localStorage.getItem('itp-setup-v1'))localStorage.setItem('itp-setup-v1',JSON.stringify({difficulty:'Visionary',seasonId:99,customSeasonSelected:true,elements:['Pyro','Hydro','Geo'],opening:[],guests:[]}));
      },custom);
      const customPage=await isolated.newPage();
      const customErrors=[];customPage.on('pageerror',error=>customErrors.push(error.message));
      await customPage.goto(base,{waitUntil:'domcontentloaded'});
      await customPage.locator('nav button').filter({hasText:'Act Details'}).click();
      const card=customPage.locator('#act-details-act-9');
      await card.waitFor();
      for(const toggle of await card.getByRole('button',{name:/^Expand/}).all())await toggle.click();
      await card.getByText('Thrilling Duel regression effect.',{exact:true}).waitFor();
      assert.equal(await card.locator('.act-elite-badge').count(),1);
      assert.match(await card.locator('.act-enemy-resistances').innerText(),/70%/);
      assert.equal(await card.getByText('Resistance notes',{exact:true}).count(),0);
      for(const act of [1,2]){
        const stage=customPage.locator(`#act-details-act-${act}`);
        assert.equal((await stage.innerText()).match(/Treacherous Thunder/g)?.length,1);
        assert.match(await stage.innerText(),/Thunder starts.*after/i);
        await stage.getByText(`Distinct elite effect ${act}.`,{exact:true}).waitFor();
      }
      await customPage.evaluate(async()=>{
        const {CHARACTERS}=await import('/src/characters.ts');
        localStorage.setItem('itp-ownership-v1',JSON.stringify(Object.fromEntries(CHARACTERS.map(c=>[c.name,{owned:true,level:90}]))));
        const setup=JSON.parse(localStorage.getItem('itp-setup-v1'));setup.difficulty='Lunar';
        localStorage.setItem('itp-setup-v1',JSON.stringify(setup));
      });
      await customPage.reload({waitUntil:'domcontentloaded'});
      await customPage.locator('nav button').filter({hasText:'Theater Planner'}).click();
      const bountyPicker=customPage.locator('.planner-choice-dropdown').filter({has:customPage.locator('summary[aria-label^="Choose enemies for Act 9"]')});
      const bountySummary=bountyPicker.locator(':scope > summary');
      await bountySummary.click();
      const bountyChoice=bountyPicker.locator('.planner-encounter-option').filter({hasText:'Enemy lineup 3'});
      assert.equal(await bountyChoice.locator('.planner-encounter-icons img').count(),2);
      await bountyChoice.click();
      assert.equal(await bountySummary.locator('img:visible').count(),2);
      await bountySummary.evaluate(element=>element.parentElement.parentElement.style.maxWidth='65px');
      await bountySummary.locator('.bounty-only').waitFor();
      assert.equal(await bountySummary.locator('img:visible').count(),1);
      assert.equal(await bountySummary.locator('img:visible').getAttribute('alt'),'Test Ruin Enemy');
      await bountySummary.evaluate(element=>element.parentElement.parentElement.style.maxWidth='150px');
      await customPage.waitForFunction(()=>!document.querySelector('summary[aria-label^="Choose enemies for Act 9"] .bounty-only'));
      assert.equal(await bountySummary.locator('img:visible').count(),2);
      await bountySummary.click();
      assert.equal(await bountyChoice.locator('.planner-encounter-icons img').count(),2);
      await bountyPicker.getByRole('button',{name:'Unmarked choice',exact:false}).click();
      assert.equal(await bountySummary.locator('img').count(),2);
      const overflowPicker=customPage.locator('.planner-choice-dropdown').filter({has:customPage.locator('summary[aria-label^="Choose enemies for Act 4"]')});
      const overflowSummary=overflowPicker.locator(':scope > summary');
      await overflowSummary.click();
      const overflowChoice=overflowPicker.getByRole('button',{name:/Overflow bounty choice/});
      assert.equal(await overflowChoice.locator('img').count(),7);
      await overflowChoice.click();
      await overflowSummary.evaluate(element=>element.parentElement.parentElement.style.maxWidth='110px');
      await overflowSummary.locator('.bounty-only').waitFor();
      assert.equal(await overflowSummary.locator('img:visible').count(),2);
      assert.ok((await overflowSummary.boundingBox()).width<100,'compact bounty summary fits its visible portraits');
      assert.equal(await overflowSummary.locator('.responsive-bounty-icons').evaluate(element=>getComputedStyle(element).overflowX),'hidden');
      await overflowSummary.evaluate(element=>element.parentElement.parentElement.style.maxWidth='260px');
      await customPage.waitForFunction(()=>!document.querySelector('summary[aria-label^="Choose enemies for Act 4"] .bounty-only'));
      assert.equal(await overflowSummary.locator('img:visible').count(),7);
      await overflowSummary.click();
      assert.equal(await overflowChoice.locator('img').count(),7);
      await overflowSummary.click();
      for(const [arcana,count]of [[1,1],[2,2]]){
        const preview=customPage.getByLabel(`Arcana ${arcana} enemies`,{exact:true});
        await preview.waitFor();
        assert.equal(await preview.locator('.planner-encounter-icons img').count(),count);
        await preview.getByText('Healing',{exact:true}).waitFor();
        await preview.getByText('Shielding',{exact:true}).waitFor();
      }
      assert.deepEqual(customErrors,[]);
    }finally{await isolated.close();}
  });
  assert.deepEqual(errors,[],'uncaught browser errors');
  console.log('PASS no uncaught app errors');
  console.log('YouTube playback itself still requires a manual check in the target browser.');
}finally{
  await browser?.close();
  await server.close();
}
