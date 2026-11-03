'use strict';
// Bank-provider-neutral transaction reconciliation. No network access, credentials or browser storage.
// Only run on authenticated, authorised financial-data records after consent validation.
const crypto=require('node:crypto');
const TYPES=new Set(['DEBIT','CREDIT']);
function normalizeTransaction(raw,accountKey){
  if(!raw||typeof raw!=='object'||typeof accountKey!=='string'||!accountKey.trim())throw Error('Invalid transaction/account');
  const date=String(raw.date||raw.transactionDate||'').slice(0,10);
  if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||Number.isNaN(Date.parse(date+'T00:00:00Z')))throw Error('Invalid date');
  const rawAmount=raw.amount;
  if(typeof rawAmount!=='string'&&typeof rawAmount!=='number')throw Error('Invalid amount');
  const amount=Number(rawAmount);
  if(!Number.isFinite(amount)||amount<=0||Math.round(amount*100)!==amount*100)throw Error('Invalid amount');
  const direction=String(raw.type||raw.direction||'').trim().toUpperCase();
  if(!TYPES.has(direction))throw Error('Invalid direction');
  const currency=String(raw.currency||'INR').trim().toUpperCase();
  if(currency!=='INR')throw Error('Unsupported currency');
  const reference=String(raw.transactionId||raw.reference||'').trim().slice(0,180);
  const narration=String(raw.narration||raw.description||'').trim().slice(0,300);
  const source=String(raw.source||'approved-bank-data').trim().slice(0,60);
  const identity=reference?['v1',accountKey,reference].join('|'):['v1',accountKey,date,direction,amount.toFixed(2),narration.toLowerCase()].join('|');
  const id=crypto.createHash('sha256').update(identity).digest('hex');
  return {id,accountKey,date,amount,direction,currency,reference,narration,source};
}
function deduplicate(records){
  const seen=new Set(),out=[];
  for(const row of records){if(seen.has(row.id))continue;seen.add(row.id);out.push(row)}
  return out;
}
function probableInternalTransfer(a,b){
  if(!a||!b||a.accountKey===b.accountKey||a.amount!==b.amount)return false;
  if(!((a.direction==='DEBIT'&&b.direction==='CREDIT')||(a.direction==='CREDIT'&&b.direction==='DEBIT')))return false;
  const d=Math.abs(Date.parse(a.date+'T00:00:00Z')-Date.parse(b.date+'T00:00:00Z'));
  return Number.isFinite(d)&&d<=2*86400000; // flag for review, NEVER auto-delete or assert linkage
}
function reconcile(records){
  const all=deduplicate(records),suspected=[];
  for(let i=0;i<all.length;i++)for(let j=i+1;j<all.length;j++){
    if(probableInternalTransfer(all[i],all[j]))suspected.push({debitId:all[i].direction==='DEBIT'?all[i].id:all[j].id,creditId:all[i].direction==='CREDIT'?all[i].id:all[j].id,status:'review_required'});
  }
  return {transactions:all,possibleTransfers:suspected};
}
module.exports={normalizeTransaction,deduplicate,probableInternalTransfer,reconcile};
