'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {classifyAlert}=require('./email-alert-classifier');
const cfg={approvedSenders:['alerts@example.test']};
test('does not trust unknown sender',()=>{
 const x=classifyAlert({from:'unknown@example.test',subject:'Debit alert',body:'INR 500 debited'},cfg);
 assert.equal(x.status,'ignored');
});
test('email amount is candidate only, not verified bank balance',()=>{
 const x=classifyAlert({from:'alerts@example.test',subject:'Debit alert',body:'INR 500 debited. Available balance INR 9,999'},cfg);
 assert.equal(x.amountPaise,50000);
 assert.equal(x.status,'review');
 assert.equal(x.verifiedBankBalance,false);
});
test('missing amount or OTP is ignored or flagged for review',()=>{
 assert.equal(classifyAlert({from:'alerts@example.test',subject:'OTP',body:'INR 100 debited'},cfg).status,'ignored');
 assert.equal(classifyAlert({from:'alerts@example.test',subject:'Debit alert',body:'Your A/c was debited'},cfg).status,'review');
});
