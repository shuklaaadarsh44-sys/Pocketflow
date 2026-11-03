'use strict';
/**
 * Fail-closed integration boundary.
 * DO NOT import in browser client. Do not deploy as a live bank connector without
 * contractual FIU eligibility, credentials, verified webhook signatures and backend auth.
 */
const REQUIRED = ['FIU_PARTNER_APPROVED', 'AA_PROVIDER_ID', 'AA_SERVER_SECRET', 'AA_ZERO_COST_CONFIRMED', 'AA_CONTRACT_PERMITS_PFM'];
function providerReady(env = process.env) {
  return env.AA_ZERO_COST_CONFIRMED === 'true' && env.AA_CONTRACT_PERMITS_PFM === 'true' && env.FIU_PARTNER_APPROVED === 'true'
    && typeof env.AA_PROVIDER_ID === 'string' && env.AA_PROVIDER_ID.length > 0
    && typeof env.AA_SERVER_SECRET === 'string' && env.AA_SERVER_SECRET.length >= 32;
}
function unavailable() {
  const err = new Error('Bank data unavailable: a legally authorised, zero-cost PFM data provider is not confirmed');
  err.code = 'PROVIDER_NOT_CONFIGURED';
  err.httpStatus = 503;
  return err;
}
class ProviderAdapter {
  constructor(env = process.env) { this.env = env; }
  status() {
    // Never represent credentials alone as proof of production authorisation.
    return { connected: false, mode: 'unconfigured', lastSync: null,
      reason: 'No verified FIU partner, consent workflow, and production adapter installed' };
  }
  async createConsent() { throw unavailable(); }
  async fetchAccounts() { throw unavailable(); }
  async fetchTransactions() { throw unavailable(); }
  async refresh() { throw unavailable(); }
  async revoke() { throw unavailable(); }
}
module.exports = { ProviderAdapter, providerReady, unavailable, REQUIRED };
