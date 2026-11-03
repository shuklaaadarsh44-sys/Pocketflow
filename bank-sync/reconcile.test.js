'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {normalizeTransaction,deduplicate,probableInternalTransfer,reconcile}=require('./reconcile');
const tx=(override={})=>normalizeTransaction({date:'2026-11-03',type:'DEBIT',amount:'500.00',narration:'UPI grocery',currency:'INR',...override},'bank:masked-A');
test('stable identifier prevents duplicate ingestion',()=>{
 const a=tx({transactionId:'T123'}),b=tx({transactionId:'T123'});assert.equal(a.id,b.id);assert.equal(deduplicate([a,b]).length,1);
});
test('separate accounts are kept distinct',()=>{
 const a=tx({transactionId:'T123'}),b=normalizeTransaction({date:'2026-11-03',type:'DEBIT',amount:500,narration:'UPI grocery',transactionId:'T123'},'bank:masked-B');
 assert.notEqual(a.id,b.id);
});
test('rejects missing or malformed financial data',()=>{
 assert.throws(()=>tx({amount:-4}));assert.throws(()=>tx({currency:'USD'}));assert.throws(()=>tx({type:'transfer'}));
});
test('internal transfer is flagged for review, not automatically removed',()=>{
 const a=tx({transactionId:'A1'}),b=normalizeTransaction({date:'2026-11-03',type:'CREDIT',amount:500,narration:'Own account transfer',transactionId:'B1'},'bank:masked-B');
 assert.equal(probableInternalTransfer(a,b),true);
 const result=reconcile([a,b]);assert.equal(result.transactions.length,2);assert.equal(result.possibleTransfers.length,1);assert.equal(result.possibleTransfers[0].status,'review_required');
});
test('different amount or date is not marked as transfer',()=>{
 const a=tx(),b=normalizeTransaction({date:'2026-10-20',type:'CREDIT',amount:500},'bank:masked-B');
 assert.equal(probableInternalTransfer(a,b),false);
});

test('missing provider IDs never cause silent deletion of valid repeated payments',()=>{const a=tx({transactionId:''});assert.equal(a.id,null);assert.equal(deduplicate([a,a]).length,2)});
