# Jordan JoFotara Compliance Module

Integration with the Jordan Income and Sales Tax Department (ISTD) JoFotara e-invoicing system.

## Environment Variables

```
JOFOTARA_CLIENT_ID=<your-client-id>
JOFOTARA_SECRET_KEY=<your-secret-key>
JOFOTARA_ENV=sandbox   # or "production"
```

Obtain credentials from the [JoFotara portal](https://www.jofotara.gov.jo).

## Key Differences from Egypt ETA

| Feature | Egypt ETA | Jordan JoFotara |
|---------|-----------|-----------------|
| Auth | OAuth2 token | `Client-Id` + `Secret-Key` headers |
| Tax rate | VAT 14% | GST 16% |
| Invoice chain | Not required | `previousInvoiceHash` required |
| QR code | Not required | TLV base64 required |
| Currency | EGP | JOD |

## Invoice Chaining

Every submitted invoice must include the SHA-256 hash of the previous invoice (as `previousInvoiceHash`). For the first invoice in the chain, use `"0"`.

The hash is stored as `joFotaraLastHash` on the Business record (MVP: stored on the Invoice row as returned `invoiceHash`).

## Production Notes

- Replace sandbox credentials with production credentials via `JOFOTARA_ENV=production`
- Ensure the business TIN is a valid 9-digit Jordanian tax number
- The QR code is generated automatically from TLV encoding of: seller name, TIN, invoice date, gross amount, tax amount
