import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {randomUUID} from 'node:crypto';

const source = readFileSync(new URL('../dist/activity.js', import.meta.url), 'utf8');
function browser(url='https://www.internetapps.net/dist/?email=private@example.test', stored={}) {
  const sent=[], listeners={}, storage=new Map(Object.entries(stored));
  const context={URL, Set, Date, JSON, Number, crypto:{randomUUID}, location:new URL(url),
    history:{replaceState(){}}, localStorage:{getItem:key=>storage.get(key)||null,
      setItem:(key,value)=>storage.set(key,value), removeItem:key=>storage.delete(key)},
    fetch:(url,options)=>{sent.push({url,...options,body:JSON.parse(options.body)});return Promise.resolve();},
    document:{addEventListener:(name,handler)=>{listeners[name]=handler;}}};
  vm.runInNewContext(source,context);
  return {sent,listeners,storage};
}
test('page logging excludes query strings and never sends account cookies',()=>{
  const {sent}=browser();
  assert.equal(sent.length,1);
  assert.equal(sent[0].body.page_path,'/dist/');
  assert.equal(sent[0].credentials,'omit');
  assert(!JSON.stringify(sent).includes('private@example.test'));
  assert(!('client_ip' in sent[0].body));
});
test('test browser exclusion persists and can be cleared',()=>{
  const excluded=browser('https://www.internetapps.net/dist/?ia_internal=1');
  assert.equal(excluded.sent.length,0);
  const stored=Object.fromEntries(excluded.storage);
  assert.equal(browser(undefined,stored).sent.length,0);
  assert.equal(browser('https://www.internetapps.net/dist/?ia_internal=0',stored).sent.length,1);
});
test('browser ID persists across pages during the retention period',()=>{
  const first=browser();
  const second=browser('https://www.internetapps.net/dist/consulting.html',Object.fromEntries(first.storage));
  assert.equal(first.sent[0].body.browser_id,second.sent[0].body.browser_id);
});
test('form interaction logs only the approved event',()=>{
  const {sent,listeners}=browser();
  listeners.submit({target:{id:'contactForm',name:'private name',email:'private@example.test'}});
  assert.equal(sent[1].body.event_name,'inquiry_prepared');
  assert.equal(Object.keys(sent[1].body).sort().join(','),'browser_id,event_id,event_name,page_path');
});
test('private jobs pages and other hosts are not instrumented',()=>{
  assert.equal(browser('https://www.internetapps.net/jobs/').sent.length,0);
  assert.equal(browser('https://other.test/dist/').sent.length,0);
});
