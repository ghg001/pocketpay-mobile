# Mobile Security Review Checklist

This checklist should be reviewed by contributors when making changes that affect security-sensitive parts of the PocketPay mobile app.

## Overview

This checklist provides a comprehensive security review guide for mobile changes involving wallets, transactions, vaults, diagnostics, and storage. Use this checklist during PR reviews to ensure security-sensitive changes are properly vetted.

## Purpose

Mobile applications handle sensitive financial data, private keys, and transaction details. This checklist helps reviewers identify and prevent common security vulnerabilities in mobile code.

---

## 1. Secure Storage

### Checklist Items

- [ ] **Sensitive Data Storage**
  - Private keys are **never** stored in plain text
  - Secrets are stored in secure enclave / hardware-backed keystore
  - Biometric authentication is used for accessing sensitive data
  - Data is encrypted at rest using platform-specific encryption
  - **All stored secrets use `expo-secure-store` (Keychain on iOS, Android Keystore on Android)**
  - **No fallback to `AsyncStorage` for any secret material**
  - **Add error handling for SecureStore read/write failures without auto‑deleting keys**

- [ ] **Key Management**
  - Keys are generated and stored securely
  - Key rotation is supported
  - Keys are not hardcoded in the codebase
  - Keys are not logged or exposed in error messages

- [ ] **Data Persistence**
  - Sensitive data is not stored in shared preferences or UserDefaults
  - Cache does not persist sensitive data
  - Temporary files are securely deleted
  - Background snapshots are disabled

- [ ] **Secure Enclave Usage**
  - Keys are stored in the platform's secure enclave
  - Access requires user authentication
  - Failed authentication attempts are limited

### Common Vulnerabilities

| Vulnerability | Risk | Mitigation |
|---------------|------|------------|
| Plain text storage | High | Use encrypted storage |
| Weak key generation | High | Use secure random generation |
| Insecure keychain access | Medium | Restrict access to app only |
| Data leakage in cache | Medium | Clear cache on app close |

---

## 2. Wallet Operations

### Checklist Items

- [ ] **Wallet Creation**
  - Seed phrase generation uses secure random
  - Seed phrase is never logged or stored in plain text
  - Seed phrase is displayed only once and requires confirmation
  - User is warned about seed phrase importance

- [ ] **Wallet Import**
  - Imported private keys are validated
  - Import process requires authentication
  - Imported keys are securely stored
  - Import history is not stored
  - **Verify that any new code handling keys reads from `expo-secure-store` and does not persist them to `AsyncStorage` or the filesystem**

- [ ] **Wallet Export**
  - Export requires strong authentication
  - Exported data is encrypted
  - User is warned about risks
  - Export is logged for audit

- [ ] **Wallet Deletion**
  - Deletion requires confirmation
  - User is warned about irreversible action
  - Keys are securely wiped
  - Backup recommendation is shown
  - **Verify that any reset flow clearly warns users about key loss and requires manual backup confirmation**

### Common Vulnerabilities

| Vulnerability | Risk | Mitigation |
|---------------|------|------------|
| Seed phrase logging | Critical | Redact secrets from logs |
| Unencrypted export | High | Encrypt exports |
| Weak import validation | High | Validate input format |
| Accidental deletion | Medium | Require confirmation |

---

## 3. Transaction Flows

### Checklist Items

- [ ] **Transaction Signing**
  - Signing requires explicit user confirmation
  - Transaction details are clearly displayed
  - Amount and recipient are shown in full
  - User can verify before signing
  - **Confirm that transaction signing occurs via the `Signer` abstraction and that the secret never leaves SecureStore**
  - **When adding new signing pathways, ensure they respect the existing `Signer` interface and do not introduce direct key usage**
  - **Validate that any external signer integration follows the documented handoff design**

- [ ] **Transaction Validation**
  - Amount is within valid range
  - Recipient address is valid
  - Transaction fee is reasonable
  - Duplicate transaction prevention

- [ ] **Transaction Retry**
  - Retry logic handles failures gracefully
  - Retry does not create duplicate transactions
  - User is informed of retry status
  - Exponential backoff is implemented

- [ ] **Transaction History**
  - History does not expose sensitive data
  - Transaction details are properly sanitized
  - Failed transactions are logged for debugging
  - History is not cached insecurely

### Common Vulnerabilities

| Vulnerability | Risk | Mitigation |
|---------------|------|------------|
| Unconfirmed signing | Critical | Require explicit confirmation |
| Address spoofing | High | Display full address |
| Duplicate transactions | High | Implement idempotency |
| Insufficient validation | High | Validate all inputs |

---

## 4. Vault Operations

### Checklist Items

- [ ] **Vault Access**
  - Vault requires authentication
  - Access is time-limited
  - Failed attempts are logged
  - Access is revoked on app close

- [ ] **Vault Storage**
  - Sensitive data is encrypted
  - Data is not accessible outside the app
  - Vault data is backed up securely
  - Data retention is implemented

- [ ] **Vault Sharing**
  - Sharing requires explicit consent
  - Shared data is encrypted
  - Recipient is verified
  - Sharing is logged

- [ ] **Vault Export/Import**
  - Export/Import requires authentication
  - Data is encrypted during transfer
  - Import validates data integrity
  - Export includes necessary metadata

### Common Vulnerabilities

| Vulnerability | Risk | Mitigation |
|---------------|------|------------|
| Unauthorized access | Critical | Require authentication |
| Data exposure | High | Encrypt data |
| Insecure sharing | High | Verify recipients |
| Data corruption | Medium | Validate imports |

---

## 5. Diagnostics & Logging

### Checklist Items

- [ ] **Logging**
  - No secrets are logged
  - No private keys are logged
  - No transaction payloads are logged
  - No personally identifiable information (PII) is logged
  - Log level is appropriate for environment
  - **Audit new log statements to ensure no sensitive data (secret keys, mnemonics, seed phrases) are included**
  - **Use `console.log` for non-sensitive debugging only under `__DEV__` guards**
  - **Remove or mask error objects that may contain request parameters or private data before logging**

- [ ] **Error Messages**
  - Error messages are not exposing sensitive data
  - User-facing errors are generic
  - Developer errors are detailed
  - Error context is sanitized
  - **Confirm that storage errors surface appropriate user‑friendly messages and do not purge the secret key**
  - **Ensure that error boundaries do not expose stack traces or internal details in production**
  - **Route unexpected failures through `reportError` so logs/diagnostics stay redacted**

- [ ] **Analytics**
  - Analytics events do not contain PII
  - No transaction details in analytics
  - No wallet data in analytics
  - Analytics data is aggregated and anonymized
  - **If adding analytics or telemetry, exclude any fields that could contain secret keys or personal identifiers**
  - **Review that any performance logs respect privacy guidelines**

- [ ] **Diagnostics**
  - Diagnostic data is opt-in
  - User is informed about data collection
  - Data is anonymized
  - Data retention is limited

### Common Vulnerabilities

| Vulnerability | Risk | Mitigation |
|---------------|------|------------|
| Secret logging | Critical | Redact secrets |
| PII exposure | High | Sanitize data |
| Excessive logging | Medium | Log only what's needed |
| Unclear user consent | Medium | Get explicit consent |

---

## 6. Clipboard & Sharing

### Checklist Items

- [ ] **Clipboard Operations**
  - Sensitive data (keys, seeds, passwords) is not copied to clipboard
  - Clipboard is cleared after a timeout
  - Users are warned about clipboard risks
  - Clipboard access is monitored
  - **Verify that any UI that copies public keys to the clipboard includes a warning about clipboard privacy**

- [ ] **Sharing**
  - Sharing requires user confirmation
  - Shared data is encrypted
  - Sharing is limited to necessary data
  - Sharing is logged

- [ ] **Screenshots**
  - Screenshots are blocked on sensitive screens
  - App content is hidden in app switcher
  - Users are warned about screenshot risks
  - **Avoid displaying secret keys or QR codes containing private information on-screen in screenshots**
  - **Ensure test screenshots used in documentation do not contain real secret keys**

### Common Vulnerabilities

| Vulnerability | Risk | Mitigation |
|---------------|------|------------|
| Clipboard exposure | High | Clear clipboard |
| Unauthorized sharing | Medium | Require confirmation |
| Screenshot leaks | Medium | Block screenshots |
| App switcher preview | Medium | Hide content |

---

## 7. Network Communication

### Checklist Items

- [ ] **Encryption**
  - All network requests use HTTPS
  - Certificate pinning is implemented
  - TLS 1.2+ is enforced
  - No sensitive data in URLs

- [ ] **Request Validation**
  - Request data is validated
  - Response data is validated
  - Error handling is secure
  - Timeout is implemented

- [ ] **Response Handling**
  - Sensitive data is not logged
  - Error responses are sanitized
  - Response data is validated

### Common Vulnerabilities

| Vulnerability | Risk | Mitigation |
|---------------|------|------------|
| HTTP requests | High | Force HTTPS |
| Certificate issues | High | Implement pinning |
| Data leakage in URLs | Medium | Use POST |
| Insecure fallback | Medium | Fail secure |

---

## 8. User Authentication

### Checklist Items

- [ ] **Authentication**
  - Strong authentication is required
  - Biometric authentication is supported
  - Failed attempts are limited
  - Authentication timeouts are implemented

- [ ] **Session Management**
  - Sessions are time-limited
  - Sessions are invalidated on logout
  - Multi-device sessions are handled
  - Session data is stored securely

- [ ] **Password Security**
  - Passwords are hashed and salted
  - Password strength is enforced
  - Password reset is secure
  - Password change requires current password

### Common Vulnerabilities

| Vulnerability | Risk | Mitigation |
|---------------|------|------------|
| Weak authentication | Critical | Enforce strong auth |
| Session fixation | High | Rotate session IDs |
| Password reuse | High | Enforce uniqueness |
| Insecure reset | High | Verify identity |

---

## 9. Secure Code Review

### Checklist Items

- [ ] **Code Quality**
  - No hardcoded secrets
  - No debug code in production
  - No commented-out sensitive code
  - No insecure dependencies
  - **If exposing a secret for debugging, guard with `if (__DEV__)` and ensure it is removed before production**

- [ ] **Dependencies**
  - Dependencies are up-to-date
  - Known vulnerabilities are patched
  - Trusted sources only
  - Regular security audits

- [ ] **Testing**
  - Security tests are included
  - Edge cases are tested
  - Negative scenarios are tested
  - Fuzzing is implemented
  - **Tests added/updated to cover security-critical paths**

---

## 10. Compliance & Privacy

### Checklist Items

- [ ] **Privacy**
  - Privacy policy is accessible
  - Data collection is transparent
  - User consent is obtained
  - Data is anonymized where possible

- [ ] **Compliance**
  - GDPR compliance for EU users
  - CCPA compliance for California users
  - Financial regulations are followed
  - Data retention policies are followed

- [ ] **Audit**
  - Security events are logged
  - Audit trail is maintained
  - Logs are tamper-proof
  - Regular security reviews

---

## Review Process

### Before Review

1. **Understand the change** - Read the PR description and linked issue
2. **Check the scope** - Identify which areas are affected
3. **Review the checklist** - Focus on relevant sections
4. **Prepare questions** - Clarify any unclear parts

### During Review

1. **Apply the checklist** - Go through each relevant item
2. **Test the change** - Verify secure behavior
3. **Check edge cases** - Test boundary conditions
4. **Verify error handling** - Check error paths
5. **Validate data flow** - Trace sensitive data

### After Review

1. **Document findings** - Note any issues or concerns
2. **Provide feedback** - Suggest improvements
3. **Verify fixes** - Review fixes for identified issues
4. **Approve or request changes** - Make final decision

---

## Common Security Anti-Patterns

### Critical Anti-Patterns

| Anti-Pattern | Why It's Bad | Fix |
|--------------|--------------|-----|
| Hardcoded secrets | Exposed in source code | Use secure environment variables |
| Logging private keys | Exposed in logs | Redact all secrets |
| Unencrypted storage | Data at risk | Use platform encryption |
| Weak random generation | Predictable keys | Use secure random |
| Disabled certificate pinning | MITM attacks | Enable pinning |

### High-Risk Anti-Patterns

| Anti-Pattern | Why It's Bad | Fix |
|--------------|--------------|-----|
| Unconfirmed transactions | Accidental sends | Require explicit confirmation |
| Insecure data sharing | Data leaks | Encrypt shared data |
| Clipboard logging | Exposed data | Clear clipboard |
| Screenshot capture | Visual leaks | Block screenshots |
| Insufficient validation | Invalid data | Validate all inputs |

---

## Tools & Resources

### Security Testing Tools

- **Mobile Security Framework** (MobSF) - Mobile app security testing
- **OWASP ZAP** - Web application security testing
- **Frida** - Dynamic instrumentation
- **Burp Suite** - API testing

### Security References

- [OWASP Mobile Top 10](https://owasp.org/www-project-mobile-top-10/)
- [iOS Security Guide](https://developer.apple.com/security/)
- [Android Security Guide](https://developer.android.com/security)
- [Stellar Security Best Practices](https://developers.stellar.org/docs/security/)

### Documentation

- Keep checklist updated
- Document security decisions
- Track security incidents
- Regular security reviews

---

## Summary

| Category | Items | Critical | High | Medium |
|----------|-------|----------|------|--------|
| Secure Storage | 8 | 4 | 3 | 1 |
| Wallet Operations | 8 | 3 | 3 | 2 |
| Transaction Flows | 8 | 3 | 3 | 2 |
| Vault Operations | 8 | 2 | 3 | 3 |
| Diagnostics & Logging | 8 | 2 | 3 | 3 |
| Clipboard & Sharing | 6 | 2 | 2 | 2 |
| Network Communication | 6 | 2 | 3 | 1 |
| User Authentication | 6 | 2 | 3 | 1 |
| Secure Code Review | 6 | 2 | 2 | 2 |
| Compliance & Privacy | 6 | 1 | 2 | 3 |

---

## Peer Review Checklist

- [ ] All above items have been checked for the modified code
- [ ] Documentation updated to reflect any new security-relevant behavior
- [ ] Tests added/updated to cover security-critical paths

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2024-07-25 | Initial release |
| 1.1 | 2024-07-26 | Added anti-patterns section |
| 1.2 | 2024-07-27 | Added tools & resources |
| 1.3 | 2024-07-27 | Merged with PocketPay-specific security checklist |

---

## Feedback

If you have suggestions for improving this checklist, please open an issue or submit a PR with your recommendations.

---

*This checklist is intended to maintain the high security standards of PocketPay on the Stellar Testnet.*