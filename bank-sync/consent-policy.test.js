'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {requireAccess,publicConnectionStatus}=require('./consent-policy');
const now=new Date('2026-11-03T12:00:00Z');
const good={id:'sample-consent',verifiedByBackend:true,status:'active',
  issuedAt:'2026-11-01T12:00:00Z',expiresAt:'2026-11-05T12:00:00Z',
  accountIds:['bank:1'],dataTypes:['balances','transactions']};
test('active consent allows only approved read-only scope',()=>{
  assert.equal(requireAccess(good,'bank:1','transactions',now),true);
  assert.equal(requireAccess(good,'bank:1','balances',now),true);
  assert.throws(()=>requireAccess(good,'bank:2','balances',now));
  assert.throws(()=>requireAccess(good,'bank:1','payments',now));
});
test('a local toggle or forged approval never grants access',()=>{
  assert.throws(()=>requireAccess({...good,verifiedByBackend:false},'bank:1','balances',now));
  assert.deepEqual(publicConnectionStatus({...good,verifiedByBackend:false},now),{connected:false,status:'unavailable',expiresAt:null});
});
test('revoked, pending or expired consent fails closed',()=>{
  assert.throws(()=>requireAccess({...good,status:'revoked'},'bank:1','balances',now));
  assert.throws(()=>requireAccess({...good,status:'pending'},'bank:1','balances',now));
  assert.throws(()=>requireAccess(good,'bank:1','balances',new Date('2026-11-06T00:00:00Z')));
});
