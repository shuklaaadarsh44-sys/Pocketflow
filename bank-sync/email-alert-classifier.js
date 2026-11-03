'use strict';
// Candidate extraction only. NEVER claim email-derived balances are bank verified.
// Caller must authenticate Gmail access and provide verified sender/account settings.
function classifyAlert(mail, settings) {
  if (!mail || !settings || !Array.isArray(settings.approvedSenders)) return {status:'ignored'};
  const sender=String(mail.from||'').toLowerCase().trim();
  if(!settings.approvedSenders.includes(sender)) return {status:'ignored',reason:'unapproved_sender'};
  const subject=String(mail.subject||'');
  if(/otp|login|verification code/i.test(subject)) return {status:'ignored',reason:'security_message'};
  const text=(subject+' '+String(mail.body||'')).slice(0,10000);
  const debit=/debited|spent|withdrawn/i.test(text),credit=/credited|deposited/i.test(text);
  if(debit===credit) return {status:'review',reason:'ambiguous_direction'};
  const re=debit?/(?:INR|Rs\.?|₹)\s*([0-9,]+(?:\.[0-9]{1,2})?)\s*(?:was\s+|has been\s+)?debited/i:/(?:INR|Rs\.?|₹)\s*([0-9,]+(?:\.[0-9]{1,2})?)\s*(?:was\s+|has been\s+)?credited/i;
  const match=text.match(re);
  if(!match)return {status:'review',reason:'no_unambiguous_transaction_amount'};
  const amount=Math.round(Number(match[1].replace(/,/g,''))*100);
  if(!Number.isSafeInteger(amount)||amount<=0)return {status:'review',reason:'invalid_amount'};
  return {status:'review',direction:debit?'DEBIT':'CREDIT',amountPaise:amount,
    reason:'email_alert_only_requires_account_reconciliation',verifiedBankBalance:false};
}
module.exports={classifyAlert};
