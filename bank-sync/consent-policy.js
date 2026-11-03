'use strict';
// Consent guard for future *authorised* bank-data integrations.
// This does not create a consent or verify a bank/provider signature.
// Only supply records already verified by an authenticated backend.
const ALLOWED_STATES=new Set(['pending','active','revoked','expired','failed']);
const ALLOWED_TYPES=new Set(['balances','transactions']);
function cleanConsent(record,now=new Date()){
  if(!record||typeof record!=='object')throw Error('Missing verified consent record');
  if(record.verifiedByBackend!==true)throw Error('Unverified consent');
  if(!ALLOWED_STATES.has(record.status))throw Error('Invalid consent status');
  if(typeof record.id!=='string'||!record.id.trim())throw Error('Missing consent id');
  const expiry=Date.parse(record.expiresAt||'');
  const issued=Date.parse(record.issuedAt||'');
  if(!Number.isFinite(expiry)||!Number.isFinite(issued)||expiry<=issued)throw Error('Invalid consent period');
  const accountIds=Array.isArray(record.accountIds)?record.accountIds:[];
  if(accountIds.length===0||accountIds.some(x=>typeof x!=='string'||!x.trim()))throw Error('Invalid scope accounts');
  const types=Array.isArray(record.dataTypes)?record.dataTypes:[];
  if(types.length===0||types.some(x=>!ALLOWED_TYPES.has(x)))throw Error('Invalid data scope');
  const time=now instanceof Date?now.getTime():new Date(now).getTime();
  if(!Number.isFinite(time))throw Error('Invalid current time');
  return {id:record.id,status:record.status,accountIds:[...new Set(accountIds)],
    dataTypes:[...new Set(types)],issuedAt:new Date(issued).toISOString(),
    expiresAt:new Date(expiry).toISOString(),validNow:record.status==='active'&&time<expiry&&time>=issued};
}
function requireAccess(consent,accountId,dataType,now=new Date()){
  const safe=cleanConsent(consent,now);
  if(!safe.validNow)throw Error('Consent inactive, expired or revoked');
  if(!safe.accountIds.includes(accountId))throw Error('Account not within consent scope');
  if(!safe.dataTypes.includes(dataType))throw Error('Data type not within consent scope');
  return true;
}
function publicConnectionStatus(record,now=new Date()){
  try{
    const safe=cleanConsent(record,now);
    return {connected:safe.validNow,status:safe.validNow?'active':(safe.status==='active'?'expired':safe.status),
      expiresAt:safe.expiresAt};
  }catch(e){return {connected:false,status:'unavailable',expiresAt:null}}
}
module.exports={cleanConsent,requireAccess,publicConnectionStatus};
