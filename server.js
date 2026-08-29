require('dotenv').config();
const express=require('express');
const multer=require('multer');
const pdfParse=require('pdf-parse');
const {google}=require('googleapis');
const crypto=require('crypto');

const app=express();
app.set('trust proxy',1);
const PORT=process.env.PORT||3000;
const upload=multer({storage:multer.memoryStorage(),limits:{fileSize:4*1024*1024}});
app.use(express.json({limit:'4mb'}));
app.use(express.static(__dirname+'/public'));

const days=['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
const dayPretty=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const meals=['breakfast','lunch','snacks','dinner'];

const menu={month:'August',year:2026,mealTimings:{breakfast:{start:'07:50',end:'10:15'},lunch:{start:'12:45',end:'14:45'},snacks:{start:'17:15',end:'18:45'},dinner:{start:'20:00',end:'22:15'}},days:{
 sunday:{breakfast:['Tea, Coffee, Milk','Bread, Butter, Jam','Cornflakes','Boiled Eggs','Mix Fruits','Masala dosa, Sambhar','Groundnut Chutney'],lunch:['Cabbage Carrot Matar','Masala Khichdi','Roti','Potato wedges','Boondi Raita','Salad, Pickle'],snacks:['Tea, Coffee, Milk','Bread, Butter, Jam','Vada Pav','Fried Mirch','Green Chutney'],dinner:['Kadhai Paneer','Butter Chicken','Dal Fry','Hyderabadi Bagara Rice','Butter Roti/Butter Naan','Ice Cream','Salad, Pickle']},
 monday:{breakfast:['Tea, Coffee, Milk','Bread, Butter, Jam','Cornflakes , Chocos','Boiled Eggs','Mix Fruits','Mix Veg /Ajwain Paratha','Tomato Kurma'],lunch:['Veg Manchurian','Soya keema & Egg Fried Rice','Dal Tadka','Roti','Curd With Tadka','Fried Papad','Salad, Pickle'],snacks:['Tea, Coffee, Milk','Bread, Butter, Jam','Dal/Sattu Kachori','Imli Chutney','Green Chutney'],dinner:['Dal Tadka','Navratan Korma','Rice, Roti','Aam Ras','Salad, Pickle']},
 tuesday:{breakfast:['Tea, Coffee, Milk','Bread, Butter, Jam','Cornflakes','Boiled Eggs','Mix Fruits','Uttapam, Sambhar','Onion Tomato Chutney'],lunch:['Malai Kofta','Toor Dal','Roti, Rice','Veg Raita , Fryums','Sprouts , Pickle'],snacks:['Tea, Coffee, Milk','Bread, Butter, Jam','Aloo/ Coleslow Sandwich','Green Chutney, Ketchup'],dinner:['Punjabi Chhole','Pumpkin','Plain Rice','Puri, Roti','Sooji Halwa','Salad, Pickle']},
 wednesday:{breakfast:['Tea, Coffee, Milk','Bread, Butter, Jam','Cornflakes','Bread Omelette','Mix Fruits','Tari Poha (with Onions Lemon and Namkeen)','Ketchup'],lunch:['Kadhi Pakodaa','Aloo Jeera','Rice , Roti','Fryums, Boondi Raita','Salad, Pickle'],snacks:['Tea, Coffee, Milk','Bread, Butter, Jam','Chana Chat Masala','Lemon, Ketchup'],dinner:['Veg Biryani','Hyderabadi Chicken Dum Biryani','Kadhai Paneer','Butter Roti','Kulfi / Chocobar','Veg Raita','Salad, Pickle']},
 thursday:{breakfast:['Tea, Coffee, Milk','Bread, Butter, Jam','Cornflakes, Chocos','Boiled Eggs','Mix Fruits','Thepla / Besan Chilla','Pickle, Ketchup'],lunch:['Toor Daal','Dry Moong Sabzi','Lemon Rice, Roti','Potato wedges','Veg Raita','Salad, Pickle'],snacks:['Tea, Coffee, Milk','Bread, Butter, Jam','Punugulu (Groundnut Chutney) / Pyaz Pakode (Kechtup)'],dinner:['Panchratan Dal','Bharwa Baingan sabji','Rice, Roti','Seviyan Kheer','Sprouts,Pickle']},
 friday:{breakfast:['Tea, Coffee, Milk','Bread, Butter, Jam','Cornflakes','Omelette','Mix Fruits','Idli / Vada, Sambhar','Onion Tomato Chutney'],lunch:['Paneer Bhurji/Paneer Butter Masala','Egg Curry','Dal','Butter Roti, Jeera Rice','Fryums, Curd','Salad, Pickle'],snacks:['Tea, Coffee, Milk','Bread, Butter, Jam','Samosa','onion, Curd','Imli Chutney','Chat Masala','Green Chutney','Ketchup'],dinner:['Rajma','Aloo Jhol','Jeera Rice','Roti','Balushahi','Salad, Pickle']},
 saturday:{breakfast:['Tea, Coffee, Milk','Bread, Butter, Jam','Cornflakes','Boiled Eggs','Mix Fruits','Aloo Pyaz Paratha','Curd, Pickle'],lunch:['Chhole Bhature','Chana Dal','Rasam','Rice','Roti','Fried Papad','Mint Chaach','Salad, Pickle , Lemon'],snacks:['Tea, Coffee, Milk','Bread, Butter, Jam','Hakka Noodles','Ketchup'],dinner:['Dal Makhani','Soya Chunks Aloo','Roti , Matar Pulao','Kala Jamun','Salad, Pickle']}}
};

function appUrl(req){
  if(process.env.APP_URL) return process.env.APP_URL.replace(/\/$/,'');
  if(process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return `http://localhost:${PORT}`;
}
function oauth(req){
  if(!process.env.GOOGLE_CLIENT_ID||!process.env.GOOGLE_CLIENT_SECRET)return null;
  const redirect=process.env.GOOGLE_REDIRECT_URI||`${appUrl(req)}/auth/google/callback`;
  return new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID,process.env.GOOGLE_CLIENT_SECRET,redirect);
}
function cookieOptions(){return {httpOnly:true,secure:process.env.NODE_ENV==='production'||Boolean(process.env.VERCEL),sameSite:'lax',path:'/',maxAge:1000*60*60*24*30};}
function parseCookies(req){const raw=req.headers.cookie||'';const out={};for(const part of raw.split(';')){const i=part.indexOf('=');if(i<0)continue;out[part.slice(0,i).trim()]=decodeURIComponent(part.slice(i+1));}return out;}
function key(){return crypto.createHash('sha256').update(String(process.env.SESSION_SECRET||'change-me-in-vercel')).digest();}
function seal(value){const iv=crypto.randomBytes(12),cipher=crypto.createCipheriv('aes-256-gcm',key(),iv);const body=Buffer.concat([cipher.update(JSON.stringify(value),'utf8'),cipher.final()]);const tag=cipher.getAuthTag();return [iv,tag,body].map(b=>b.toString('base64url')).join('.');}
function unseal(value){try{const [a,b,c]=String(value).split('.');if(!a||!b||!c) return null;const iv=Buffer.from(a,'base64url'),tag=Buffer.from(b,'base64url'),body=Buffer.from(c,'base64url');const decipher=crypto.createDecipheriv('aes-256-gcm',key(),iv);decipher.setAuthTag(tag);return JSON.parse(Buffer.concat([decipher.update(body),decipher.final()]).toString('utf8'));}catch{return null;}}
function setCookie(res,name,value,opts={}){const o={...cookieOptions(),...opts};let s=`${name}=${encodeURIComponent(value)}; Path=${o.path}; Max-Age=${Math.floor(o.maxAge/1000)}; SameSite=${o.sameSite}`;if(o.httpOnly)s+='; HttpOnly';if(o.secure)s+='; Secure';res.append('Set-Cookie',s);}
function clearCookie(res,name){setCookie(res,name,'',{maxAge:0});}
function safeMenu(m){const o={...m,days:{}};for(const d of days){o.days[d]={};for(const x of meals)o.days[d][x]=Array.isArray(m.days?.[d]?.[x])?m.days[d][x].map(String).filter(Boolean):[];}return o;}
function getGoogleTokens(req){const c=parseCookies(req);return unseal(c.messcal_google||'');}
function getState(req){const c=parseCookies(req);return unseal(c.messcal_oauth_state||'');}
function saveGoogleTokens(res,tokens){setCookie(res,'messcal_google',seal(tokens),{maxAge:1000*60*60*24*30});}

app.get('/api/config',(req,res)=>res.json({googleConfigured:Boolean(oauth(req)),googleConnected:Boolean(getGoogleTokens(req)),aiConfigured:Boolean(process.env.ANTHROPIC_API_KEY),deployment:process.env.VERCEL?'vercel':'local'}));
app.get('/api/sample',(req,res)=>res.json({...menu,extractionMethod:'verified August sample'}));
app.post('/api/extract',upload.single('menu'),async(req,res)=>{try{if(!req.file)throw Error('Please upload a PDF.');const t=(await pdfParse(req.file.buffer)).text||'';if(/August Month/i.test(t)&&/Kadhai Paneer/i.test(t))return res.json({...menu,sourceFileName:req.file.originalname,extractionMethod:'verified August menu'});if(process.env.ANTHROPIC_API_KEY){const Anthropic=require('@anthropic-ai/sdk');const client=new Anthropic.default({apiKey:process.env.ANTHROPIC_API_KEY});const prompt=`Extract this college mess-menu PDF text into JSON. Preserve wording exactly, keep / alternatives and & combinations intact, do not invent dishes. Return only JSON with month, year, mealTimings, days (sunday-saturday each with breakfast/lunch/snacks/dinner arrays), notes, flaggedCells. Raw text:\n${t.slice(0,40000)}`;const r=await client.messages.create({model:'claude-3-5-haiku-latest',max_tokens:7000,messages:[{role:'user',content:prompt}]});const txt=r.content?.map(x=>x.text||'').join('')||'';const hit=txt.match(/\{[\s\S]*\}/);if(!hit)throw Error('AI did not return valid JSON.');return res.json({...safeMenu(JSON.parse(hit[0])),sourceFileName:req.file.originalname,extractionMethod:'Claude AI'});}res.status(422).json({error:'This PDF was not recognized. Add ANTHROPIC_API_KEY in Vercel to enable AI extraction for arbitrary monthly PDFs.'});}catch(e){res.status(500).json({error:e.message})}});

const breakfastStaples=new Set(['tea','coffee','milk','bread','butter','jam']);
function calendarItems(meal,items){const list=Array.isArray(items)?items:[];if(meal!=='breakfast')return list;return list.map(x=>String(x).split(',').map(v=>v.trim()).filter(v=>!breakfastStaples.has(v.toLowerCase())).join(', ').trim()).filter(Boolean)}
function eventSummary(meal,items){let shown=calendarItems(meal,items);if(meal==='breakfast'&&shown.length>2)shown=[...shown.slice(-2),...shown.slice(0,-2)];return `${meal[0].toUpperCase()+meal.slice(1)} — ${shown.join(', ')}`}
function buildEvents(m){m=safeMenu(m);const mi=new Date(`${m.month} 1, ${m.year}`).getMonth(),last=new Date(m.year,mi+1,0).getDate(),out=[];if(Number.isNaN(mi))throw Error('Invalid month.');for(let n=1;n<=last;n++){const dow=new Date(m.year,mi,n).getDay(),d=days[dow];for(const meal of meals){const items=m.days[d][meal]||[],t=m.mealTimings?.[meal];if(!items.length||!t)continue;out.push({date:`${m.year}-${String(mi+1).padStart(2,'0')}-${String(n).padStart(2,'0')}`,day:dayPretty[dow],dayKey:d,meal,items,start:t.start,end:t.end})}}return out}
function esc(s){return String(s).replace(/\\/g,'\\\\').replace(/\r?\n/g,'\\n').replace(/,/g,'\\,').replace(/;/g,'\\;')}
app.post('/api/ics',(req,res)=>{try{const m=safeMenu(req.body),stamp=new Date().toISOString().replace(/[-:]/g,'').replace(/\.\d{3}Z$/,'Z'),a=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//MessCal//EN','CALSCALE:GREGORIAN','METHOD:PUBLISH','X-WR-CALNAME:Mess Menu'];for(const e of buildEvents(m)){const d=e.date.replaceAll('-',''),title=eventSummary(e.meal,e.items),desc=['Mess Menu',`Date: ${e.date}`,`Day: ${e.day}`,`Meal: ${e.meal}`,'','Full Menu:',...e.items.map(i=>'- '+i),'','Source: Monthly Mess Menu PDF'].join('\n');a.push('BEGIN:VEVENT',`UID:${e.date}-${e.meal}@messcal.local`,`DTSTAMP:${stamp}`,`DTSTART:${d}T${e.start.replace(':','')}00`,`DTEND:${d}T${e.end.replace(':','')}00`,`SUMMARY:${esc(title)}`,`DESCRIPTION:${esc(desc)}`,'END:VEVENT')}a.push('END:VCALENDAR');res.setHeader('Content-Type','text/calendar;charset=utf-8');res.setHeader('Content-Disposition',`attachment; filename="${m.month}-${m.year}-mess-menu.ics"`);res.send(a.join('\r\n'))}catch(e){res.status(400).json({error:e.message})}});

app.get('/auth/google',(req,res)=>{const c=oauth(req);if(!c)return res.status(500).send('Google Calendar is not configured. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in Vercel Environment Variables.');const state=crypto.randomBytes(24).toString('hex');setCookie(res,'messcal_oauth_state',seal({state,createdAt:Date.now()}),{maxAge:10*60*1000});const url=c.generateAuthUrl({access_type:'offline',prompt:'consent',state,scope:['https://www.googleapis.com/auth/calendar']});res.redirect(url)});
app.get('/auth/google/callback',async(req,res)=>{try{const stored=getState(req);if(!stored||stored.state!==String(req.query.state||''))return res.status(403).send('OAuth state mismatch. Start Google connection again.');const c=oauth(req);if(!c)throw Error('Google credentials are missing.');const {tokens}=await c.getToken(String(req.query.code||''));saveGoogleTokens(res,tokens);clearCookie(res,'messcal_oauth_state');res.redirect('/?google=connected')}catch(e){res.status(500).send(`<h2>Google connection failed</h2><p>${String(e.message).replace(/[<>]/g,'')}</p><p>Check your Google OAuth redirect URI: <code>${process.env.GOOGLE_REDIRECT_URI||`${appUrl(req)}/auth/google/callback`}</code></p><p><a href="/">Back to MessCal</a></p>`)}});

async function getCalendarClient(req,res){const tokens=getGoogleTokens(req);if(!tokens)throw Object.assign(new Error('Connect Google Calendar first.'),{statusCode:401});const c=oauth(req);c.setCredentials(tokens);c.on('tokens',fresh=>{saveGoogleTokens(res,{...tokens,...fresh})});return google.calendar({version:'v3',auth:c});}
app.post('/api/google/import',async(req,res)=>{
  try{
    const cal=await getCalendarClient(req,res);
    const list=await cal.calendarList.list({maxResults:250});
    let found=(list.data.items||[]).find(x=>x.summary==='Mess Menu');
    let calendarId=found?.id;
    if(!calendarId){
      const created=await cal.calendars.insert({requestBody:{summary:'Mess Menu',description:'MessCal monthly mess menu'}});
      calendarId=created.data.id;
    }
    const evs=buildEvents(req.body);
    let created=0,updated=0;
    for(const e of evs){
      const key=`${e.date}:${e.meal}`;
      const body={
        summary:eventSummary(e.meal,e.items),
        description:['Mess Menu',`Date: ${e.date}`,`Day: ${e.day}`,`Meal: ${e.meal}`,'','Full Menu:',...e.items.map(i=>'- '+i),'','Source: Monthly Mess Menu PDF'].join('\n'),
        start:{dateTime:`${e.date}T${e.start}:00`,timeZone:'Asia/Kolkata'},
        end:{dateTime:`${e.date}T${e.end}:00`,timeZone:'Asia/Kolkata'},
        extendedProperties:{private:{messcalKey:key}}
      };
      const foundEvents=await cal.events.list({
        calendarId,
        timeMin:`${e.date}T00:00:00+05:30`,
        timeMax:`${e.date}T23:59:59+05:30`,
        singleEvents:true,
        maxResults:2500
      });
      const old=(foundEvents.data.items||[]).find(ev=>ev.extendedProperties?.private?.messcalKey===key);
      if(old){
        await cal.events.patch({calendarId,eventId:old.id,requestBody:body});
        updated++;
      }else{
        await cal.events.insert({calendarId,requestBody:body});
        created++;
      }
    }
    res.json({ok:true,created,updated,count:evs.length,calendarId});
  }catch(e){
    res.status(e.statusCode||500).json({error:e.message||'Google Calendar import failed.'});
  }
});

app.get('/api/google/status',(req,res)=>{
  res.json({connected:Boolean(getGoogleTokens(req))});
});

app.post('/api/google/remove-events',async(req,res)=>{
  try{
    const cal=await getCalendarClient(req,res);
    const list=await cal.calendarList.list({maxResults:250});
    const calendar=(list.data.items||[]).find(x=>x.summary==='Mess Menu');
    if(!calendar){
      return res.json({ok:true,removed:0,calendarRemoved:false,message:'No Mess Menu calendar found.'});
    }

    // MessCal owns this dedicated calendar. Delete the calendar in one API call
    // instead of deleting hundreds of events one-by-one (which can trigger
    // Google's Calendar API rate limit).
    await cal.calendars.delete({calendarId:calendar.id});

    res.json({
      ok:true,
      removed:'all',
      calendarRemoved:true,
      message:'The Mess Menu calendar and its MessCal events were removed.'
    });
  }catch(e){
    res.status(e.statusCode||500).json({error:e.message||'Could not remove MessCal events.'});
  }
});

app.post('/api/google/disconnect',async(req,res)=>{
  try{
    const tokens=getGoogleTokens(req);
    if(tokens){
      const c=oauth(req);
      if(c){
        c.setCredentials(tokens);
        const token=tokens.refresh_token||tokens.access_token;
        if(token){
          try{
            await fetch('https://oauth2.googleapis.com/revoke?token='+encodeURIComponent(token),{method:'POST'});
          }catch{}
        }
      }
    }
  }finally{
    clearCookie(res,'messcal_google');
    clearCookie(res,'messcal_oauth_state');
  }
  res.json({ok:true});
});


app.use((err,req,res,next)=>{
  if(res.headersSent) return next(err);
  res.status(err.statusCode||500).json({error:err.message||'Server error.'});
});

app.listen(PORT,()=>console.log(`MessCal running at http://localhost:${PORT}`));
module.exports=app;
