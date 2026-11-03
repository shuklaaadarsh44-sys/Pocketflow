# PocketFlow Personal Finance (iPhone Home Screen PWA)

Private, offline-first money tracker: banks, expenses, income, transfers, category summaries, date filters, CSV import, full JSON backup/restore.

## Deployment
Deploy the repository as a static site with publish directory `.` and build command `echo Ready`. Open the HTTPS site in **Safari** on the iPhone, then Share > Add to Home Screen > Add.

## Privacy and limitations
This is not an Apple App Store iOS binary. No user login. Transactions are stored only in this phone's browser localStorage, not sent to hosting. Local storage is **not encrypted**, so do not use on a shared/untrusted device. Backups are **not encrypted**. Back up regularly and store privately. Clearing site data can erase records.

**No automatic bank sync:** no live bank account connection, balance, UPI notifications, payments, or OTP collection. Automated categorisation and CSV import are supported. Consent-based authorised banking provider integration is still required.

## Account and statement testing
Add a bank with an opening balance, record an income and expense, test a two-account transfer (does not count as expense), then export a full backup. Import CSVs with Date and Debit/Credit or Amount/Type headers and verify totals. CSV duplicate checking is conservative; identical genuine rows may be dropped. Review statements carefully.
