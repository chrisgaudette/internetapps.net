export const defaults = {dailyTarget:10,matchThreshold:90,autoApply:true,linkedin:false,indeed:false,greenhouseBoards:[]};
export const easternDay = (now=new Date()) => new Intl.DateTimeFormat('en-CA',{timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit'}).format(now);
export const plain = s => String(s||'').replace(/<[^>]*>/g,' ').replace(/&nbsp;|&#160;/g,' ').replace(/&amp;/g,'&').replace(/\s+/g,' ').trim();
export function canonical(s){const u=new URL(s); if(u.protocol!=='https:')throw Error('HTTPS source required'); if(/^(localhost|127\.|10\.|192\.168\.|169\.254\.)/i.test(u.hostname))throw Error('Public source required'); for(const k of [...u.searchParams.keys()])if(/^utm_|^(source|ref|trk)$/i.test(k))u.searchParams.delete(k);u.hash=''; return u.toString().replace(/\/$/,'');}
export function newState(){return {version:1,settings:{...defaults},jobs:[],runs:[],profile:{facts:{},evidence:[]},resume:null,updatedAt:null};}
export function assessment(job,state,now=Date.now()){
 const v=job.verification||{}, reasons=[];
 if(!v.originalVerified || !v.originalUrl)reasons.push('Verify the current original posting');
 if(!v.checkedAt || !Number.isFinite(Date.parse(v.checkedAt)) || now-Date.parse(v.checkedAt)>86400000 || Date.parse(v.checkedAt)>now+60000)reasons.push('Refresh posting verification within 24 hours');
 if(v.active!==true)reasons.push('Confirm the job is still open');
 if(v.c2c!==true)reasons.push('Confirm C2C through InternetApps.net');
 if(v.remoteCT!==true || v.noTravel!==true)reasons.push('Confirm Connecticut remote eligibility and no travel');
 if(v.hoursCompatible!==true)reasons.push('Confirm availability fits 40 hours/week');
 if(v.currency!=='USD'||v.unit!=='hour'|| !(Number(v.confirmedRate||v.minimumRate)>100))reasons.push('Confirm a USD hourly rate strictly above $100');
 if(!v.termsEvidence)reasons.push('Document engagement, location and rate evidence');
 const host=new URL(job.url).hostname;
 if(!state.settings.linkedin && /(^|\.)linkedin\.com$/.test(host))reasons.push('LinkedIn is excluded by source preference');
 if(!state.settings.indeed && /(^|\.)indeed\.com$/.test(host))reasons.push('Indeed is excluded by source preference');
 if(v.questionsReviewed!==true)reasons.push('Review all application questions');
 const criteria=job.criteria||[], evidence=new Set(state.profile.evidence.map(e=>e.id));
 const supported=c=>c.matched===true && evidence.has(c.evidenceId) && !!c.quote;
 if(!v.criteriaComplete||!criteria.length)reasons.push('Review every mandatory qualification against the résumé');
 const total=criteria.reduce((n,c)=>n+(Number(c.weight)||1),0);
 const earned=criteria.filter(supported).reduce((n,c)=>n+(Number(c.weight)||1),0);
 const score=total? Math.round(earned/total*100):null;
 for(const c of criteria)if(c.mandatory!==false&&!supported(c))reasons.push('Qualification gap: '+c.requirement);
 if(score===null || score<state.settings.matchThreshold)reasons.push('Documented résumé match below '+state.settings.matchThreshold+'%');
 for(const q of job.questions||[])if(q.required!==false && !answer(q,state.profile).supported)reasons.push('Answer needed: '+q.label);
 if(!state.resume)reasons.push('Verified résumé upload needed');
 if(!job.route || !['email','ats','easy_apply'].includes(job.route.type))reasons.push('Verify an application route');
 if(job.route?.type==='email' && (!job.route.verified || !job.route.sourceUrl || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(job.route.address||'')))reasons.push('Verify the recruiting email on an original company source');
 return {score,ready:reasons.length===0,reasons,matched:criteria.filter(supported).length,total:criteria.length,interviewProbability:null};
}
export function answer(q,profile){const fact=q.factKey&&profile.facts[q.factKey];if(fact && fact.verified===true && fact.value!==undefined)return {supported:true,value:fact.value,evidence:fact.source};return {supported:false,value:null,evidence:null};}
export function ingest(state,items,source='agent'){let added=0;for(const item of items){if(!item.title||!item.company||!item.url)continue;const url=canonical(item.url);const duplicate=state.jobs.find(j=>canonical(j.url)===url || (item.requisitionId&&j.requisitionId===item.requisitionId&&j.company.toLowerCase()===item.company.toLowerCase()));if(duplicate)continue;state.jobs.push({...item,id:crypto.randomUUID(),url,source:item.source||source,description:plain(item.description).slice(0,16000),createdAt:new Date().toISOString(),discoveredDay:easternDay(),status:item.historical?'prior_application':(candidate(item)?'review':'excluded'),events:item.historical?(item.events||[]).filter(e=>e.type==='prior_application'&&e.evidence?.reference):[]});added++;}return added;}
export const candidate = j => !/full[_ -]?time|permanent/i.test(j.engagement||'') && (!j.location || /usa|united states|america|anywhere|worldwide|global|remote/i.test(j.location)) && !/w-?2 only|no c2c|no corp.to.corp/i.test(j.description||'');
export function preliminary(job){const text=plain(job.description)+' '+job.salary; if(/\b(no c2c|w-?2 only|cannot.*c2c|no corp.to.corp)\b/i.test(text))return ['Posting excludes C2C'];if(/\b(full.time|permanent)\b/i.test(job.engagement||''))return ['Salaried posting; C2C terms unconfirmed'];return ['Original posting, C2C, rate and mandatory qualifications need verification'];}
export function reserve(state,id){if(!state.settings.autoApply)throw Error('Automatic applications are paused');const job=state.jobs.find(j=>j.id===id);if(!job)throw Error('Job not found');if(['email_sent','ats_received','interview','accepted','claimed','prior_application','excluded','blocked'].includes(job.status))throw Error('Already submitted or reserved');const a=assessment(job,state);if(!a.ready)throw Error(a.reasons.join('; '));const token=crypto.randomUUID();job.status='claimed';job.claim={token,at:new Date().toISOString()};job.events.push({at:job.claim.at,type:'claimed'});return {token,job};}
export function record(state,id,body){const job=state.jobs.find(j=>j.id===id);if(!job)throw Error('Job not found');const allowed=['email_sent','ats_received','inquiry','blocked','rejected','interview','accepted'];if(!allowed.includes(body.status))throw Error('Invalid application status');if(['email_sent','ats_received'].includes(body.status)){
 if(!job.claim || body.claimToken!==job.claim.token)throw Error('Submission requires the application reservation token');
 if(!body.evidence || !body.evidence.reference || !body.evidence.verifiedAt || !body.evidence.kind)throw Error('Verified submission evidence required');
 if(body.status==='email_sent'&&body.evidence.kind!=='gmail_sent')throw Error('Email requires verified Gmail SENT evidence');
 if(body.status==='ats_received'&&body.evidence.kind!=='ats_receipt')throw Error('ATS receipt required');
 if(body.evidence.conditional===true)throw Error('Conditional inquiries are not qualified applications');
 }job.status=body.status;job.events.push({at:new Date().toISOString(),type:body.status,evidence:body.evidence||null,note:body.note||''});job.nextStep=body.nextStep||'';return job;}

