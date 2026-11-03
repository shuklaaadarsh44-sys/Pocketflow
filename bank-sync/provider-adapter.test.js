'use strict';
const assert=require('node:assert/strict');
const {test}=require('node:test');
const {ProviderAdapter,providerReady}=require('./provider-adapter');
test('no credentials means not ready',()=>assert.equal(providerReady({}),false));
test('credential flags alone do not mark a connection active',()=>{
 const adapter=new ProviderAdapter({FIU_PARTNER_APPROVED:'true',AA_PROVIDER_ID:'test',AA_SERVER_SECRET:'a'.repeat(48)});
 assert.equal(adapter.status().connected,false);
});
test('never fabricates bank balances without authorised adapter',async()=>{
 await assert.rejects(new ProviderAdapter().fetchAccounts(),{code:'PROVIDER_NOT_CONFIGURED'});
 await assert.rejects(new ProviderAdapter().fetchTransactions(),{code:'PROVIDER_NOT_CONFIGURED'});
});
