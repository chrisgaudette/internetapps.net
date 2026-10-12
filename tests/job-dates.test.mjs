import test from 'node:test';
import assert from 'node:assert/strict';
import {newState,ingest} from '../worker/logic.mjs';
const job={company:'Example',title:'Cloud Architect',url:'https://example.com/jobs/architect',engagement:'contract',location:'US Remote'};
test('repeat crawl updates observation without changing discovery or submission history',()=>{
 const state=newState(),first='2026-10-10T12:00:00.000Z',second='2026-10-12T12:00:00.000Z';
 assert.equal(ingest(state,[job],'feed',{crawledAt:first}),1);
 const existing=state.jobs[0],found=existing.foundAt,day=existing.discoveredDay;
 existing.status='email_sent';existing.events.push({type:'email_sent',evidence:{reference:'receipt'}});
 assert.equal(ingest(state,[{...job,url:job.url+'?utm_source=repeat'}],'feed',{crawledAt:second}),0);
 assert.equal(state.jobs.length,1);assert.equal(existing.foundAt,found);assert.equal(existing.discoveredDay,day);
 assert.equal(existing.lastCrawledAt,second);assert.equal(existing.status,'email_sent');assert.equal(existing.events[0].evidence.reference,'receipt');
 assert.equal(ingest(state,[job]),0);assert.equal(existing.lastCrawledAt,second);
});
test('manual and historical imports do not invent crawl or historical discovery dates',()=>{
 const state=newState();ingest(state,[{...job,lastCrawledAt:'2000-01-01T00:00:00Z'}]);
 assert.equal(state.jobs[0].lastCrawledAt,null);assert.equal(state.jobs[0].foundAt,state.jobs[0].createdAt);
 ingest(state,[{...job,url:'https://example.com/jobs/history',historical:true}]);
 assert.equal(state.jobs[1].foundAt,null);assert.equal(state.jobs[1].lastCrawledAt,null);
});
test('legacy discovery survives a later successful crawl',()=>{
 const state=newState();state.jobs.push({...job,id:'legacy',createdAt:'2026-10-10T12:00:00.000Z',discoveredDay:'2026-10-10',status:'review',events:[]});
 ingest(state,[job],'feed',{crawledAt:'2026-10-12T12:00:00.000Z'});
 assert.equal(state.jobs[0].foundAt,'2026-10-10T12:00:00.000Z');assert.equal(state.jobs[0].lastCrawledAt,'2026-10-12T12:00:00.000Z');
});
