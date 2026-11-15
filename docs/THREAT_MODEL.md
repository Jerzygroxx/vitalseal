# VitalSeal threat model

VitalSeal is a research prototype, not a medical device. This page states what its integrity layer protects against, and what it does not.

## What is protected

| Asset | Mechanism | Where |
|---|---|---|
| Stored readings cannot be silently edited, reordered or removed in the middle | SHA-256 hash chain: each entry hashes the previous hash, its reading and its timestamp | `src/crypto/chain.ts` |
| A daily report cannot be forged or rewritten without detection | ECDSA P-256 signature over version, date, head hash and entry count | `src/crypto/sign.ts`, `verify.ts` |
| The signing key cannot be stolen by reading it | Private key is created non-extractable with the Web Crypto API; the page can sign with it but cannot export it | `src/crypto/sign.ts` |
| Data at rest is confidential and tamper-evident | AES-GCM vault; key derived from a passphrase with PBKDF2-SHA256 (600,000 iterations, random salt) | `src/crypto/vault.ts` |
| History cannot be rewritten after a seal reaches ground | Short seal code (head hash + entry count + signature fingerprint) that ground compares | `src/crypto/seal-code.ts` |

No secret is stored in the repository, and no key or passphrase is stored in `localStorage` in clear.

Note: the AES-GCM vault is implemented and unit-tested as a module, but it is not yet connected to the interface. The demo app keeps data in memory only and creates a new signing key in each session.

## What the tests prove

`src/crypto/crypto.test.ts` and `src/store/integrity-store.test.ts` check that verification fails when a reading is altered, entries are reordered, an entry is deleted, a signature comes from another key, the report tail is truncated, or the head hash is rewritten after truncation. They also check that a wrong passphrase or modified ciphertext cannot open the vault.

## What is NOT protected (limits)

1. **A lying sensor.** The seal proves a record was not changed *after* it was created. It does not prove the value was true at the source. Planned mitigations: physiological plausibility checks between indicators, and signing at the sensor in a future wearable.
2. **Tail truncation without a prior seal.** A shorter chain is still internally consistent. Only a signed report or a seal code sent earlier reveals missing last entries.
3. **A compromised device while it is unlocked.** Malicious code running in the page can still *use* the non-extractable key to sign, even though it cannot read it.
4. **Weak passphrases.** PBKDF2 slows guessing but cannot save a guessable passphrase.
5. **Public key trust.** The report carries its own public key, so a verifier must obtain that key (or its fingerprint) through a separate trusted channel to rule out a full replacement of the report.
6. **Availability.** Deleting the whole vault destroys the data; the system detects tampering, it does not prevent destruction.
7. **Clinical validity.** Thresholds are reference ranges for a prototype and are not clinically validated.

## Demo data

All demo readings are synthetic and generated from a fixed random seed. No personal data is processed.
