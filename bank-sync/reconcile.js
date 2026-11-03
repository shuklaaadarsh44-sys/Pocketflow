'use strict';
// Provider-neutral, read-only bank data validation. Requires a verified provider data session.
// This module does NOT connect to a bank, obtain consent, or handle credentials.
const crypto = require('node:crypto');
const TYPES = new Set(['DEBIT','CREDIT']);
const hash = s => crypto.createHash('sha256').update(s).digest('hex');
const exactDate = v => {
  const date = String(v ?? '').slice(0,10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw Error('Invalid ISO date');
  const d = new Date(date+'T00:00:00Z');
  if (!Number.isFinite(d.valueOf()) || d.toISOString().slice(0,10)!==date) throw Error('Invalid calendar date');
  return date;
};
function rupeesToPaise(v,allowZero=false){
  if (typeof v!=='number' && typeof v!=='string') throw Error('Invalid amount');
  const text = String(v).trim();
  if (!/^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/.test(text)) throw Error('Invalid INR amount');
  const [rupees,paisa='']=text.split('.');
  const n=BigInt(rupees)*100n+BigInt((paisa+'00').slice(0,2));
  if (n>BigInt(Number.MAX_SAFE_INTEGER) || (!allowZero&&n===0n)) throw Error('Amount out of range');
  return Number(n);
}
function normalizeTransaction(raw,accountKey) {
  if (!raw || typeof raw!=='object'||typeof accountKey!=='string'||!accountKey.trim()) throw Error('Invalid transaction/account');
  const date=exactDate(raw.date ?? raw.transactionDate);
  const amountPaise=rupeesToPaise(raw.amount);
  const direction=String(raw.type??raw.direction??'').trim().toUpperCase();
  if(!TYPES.has(direction))throw Error('Invalid direction');
  const currency=String(raw.currency??'INR').trim().toUpperCase();
  if(currency!=='INR')throw Error('Unsupported currency');
  const reference=String(raw.transactionId??raw.reference??'').trim().slice(0,180);
  const narration=String(raw.narration??raw.description??'').trim().slice(0,300);
  const source=String(raw.source??'approved-bank-data').trim().slice(0,60);
  const timestamp=raw.timestamp == null ? '' : String(raw.timestamp).trim().slice(0,48);
  // When a provider lacks a unique ID, two legitimate identical payments may exist.
  // Never silently collapse them. Weak fingerprints are for review only.
  const strongId=Boolean(reference);
  const fingerprint=hash(JSON.stringify([accountKey,date,direction,amountPaise,narration.toLowerCase(),timestamp]));
  const id=strongId?hash(JSON.stringify(['bank-v2',accountKey,reference])):null;
  return {id,fingerprint,idStrength:strongId?'provider':'ambiguous',accountKey,date,
    amountPaise,amount:amountPaise/100,direction,currency,reference,narration,source};
}
function normalizeBalance(raw,accountKey){
  if(!raw||typeof raw!=='object'||typeof accountKey!=='string'||!accountKey.trim())throw Error('Invalid account balance');
  const currency=String(raw.currency??'INR').trim().toUpperCase();
  if(currency!=='INR')throw Error('Unsupported currency');
  if(typeof raw.asOf!=='string'||!raw.asOf.trim()||Number.isNaN(Date.parse(raw.asOf)))throw Error('Missing source timestamp');
  const rawAmount=raw.amount;
  const negative=String(rawAmount).startsWith('-');
  const positive=negative?String(rawAmount).slice(1):rawAmount;
  const magnitude=rupeesToPaise(positive,true);
  return {accountKey,currency,amountPaise:negative?-magnitude:magnitude,
    asOf:raw.asOf,source:'verified-provider',isLive:false};
}
function deduplicate(records){
  const seen=new Set(),out=[];
  for(const row of records){
    if(row.idStrength==='provider'&&row.id){
      if(seen.has(row.id))continue;
      seen.add(row.id);
    }
    out.push(row);
  }
  return out;
}
function probableInternalTransfer(a,b){
  if(!a||!b||a.accountKey===b.accountKey||a.amountPaise!==b.amountPaise)return false;
  if(!((a.direction==='DEBIT'&&b.direction==='CREDIT')||(a.direction==='CREDIT'&&b.direction==='DEBIT')))return false;
  const d=Math.abs(Date.parse(a.date+'T00:00:00Z')-Date.parse(b.date+'T00:00:00Z'));
  return Number.isFinite(d)&&d<=2*86400000;
}
function reconcile(records){
  const all=deduplicate(records),suspected=[];
  for(let i=0;i<all.length;i++)for(let j=i+1;j<all.length;j++){
    if(probableInternalTransfer(all[i],all[j]))suspected.push({
      debitId:all[i].id??all[i].fingerprint,creditId:all[j].id??all[j].fingerprint,
      status:'review_required',reason:'matching amount opposite direction distinct accounts within two days'
    });
  }
  return {transactions:all,possibleTransfers:suspected,unverifiedDuplicates:all.filter(x=>x.idStrength==='ambiguous').length};
}
module.exports={normalizeTransaction,normalizeBalance,rupeesToPaise,deduplicate,probableInternalTransfer,reconcile};
