import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import worker from '../worker/index.mjs';

function database(db){
 const statement=(sql,args=[])=>({
  first:async()=>db.prepare(sql).get(...args)||null,
  all:async()=>({results:db.prepare(sql).all(...args)}),
  run:async()=>({meta:{changes:Number(db.prepare(sql).run(...args).changes)}})
 });
 return {prepare(sql){return {...statement(sql),bind(...args){return statement(sql,args);}};}};
}

test('request audit is token-protected and records IP metadata without query strings or bodies',async()=>{
 const db=new DatabaseSync(':memory:');
 for(const migration of ['0000_job_assistant.sql','0001_request_logs.sql'])db.exec(readFileSync(new URL('../drizzle/'+migration,import.meta.url),'utf8'));
 const env={DB:database(db),ADMIN_TOKEN:'integration-test-token'};
 try{
  const denied=await worker.fetch(new Request('https://example.test/api/admin/requests'),env);
  assert.equal(denied.status,401);
  const request=new Request('https://example.test/api/unknown?private=query-value',{
   method:'POST',
   headers:{'content-type':'application/json','cf-connecting-ip':'203.0.113.7','x-forwarded-for':'198.51.100.8, 203.0.113.7','user-agent':'audit-test'},
   body:JSON.stringify({private:'body-value'})
  });
  assert.equal((await worker.fetch(request,env)).status,404);
  const authorized=await worker.fetch(new Request('https://example.test/api/admin/requests',{
   headers:{authorization:'Bearer '+'integration-test-token'}
  }),env);
  assert.equal(authorized.status,200);
  const data=await authorized.json(),captured=data.requests.find(row=>row.path==='/api/unknown');
  assert(captured);
  assert.equal(captured.client_ip,'203.0.113.7');
  assert.equal(captured.ip_sources['x-forwarded-for'],'198.51.100.8, 203.0.113.7');
  assert.equal(captured.user_agent,'audit-test');
  assert(!JSON.stringify(data).includes('private'));
  assert(!JSON.stringify(data).includes('body-value'));
 }finally{db.close();}
});
