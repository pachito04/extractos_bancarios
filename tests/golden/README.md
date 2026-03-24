# Golden Output Files

Each `.json` file defines the expected output for a specific bank statement PDF.
The integration test loads the corresponding PDF from `tests/fixtures/` and
compares the pipeline result against these values.

## Schema

```json
{
  "fixture": "BANCO NACION 02-2025.pdf",
  "bank_code": "BANCO_NACION",
  "expected_movements_count": 47,
  "expected_saldo_final": 123456.78,
  "expected_total_debitos": 50000.00,
  "expected_total_creditos": 60000.00,
  "max_invalid_movements": 2,
  "tolerance": 0.02
}
```

## Adding a new golden file

1. Run the pipeline manually on the PDF:
   ```
   curl -F "file=@extracto.pdf" http://localhost:3333/process | jq .resumen
   ```
2. Verify the result is correct.
3. Create a `.json` file here with the expected values.
4. Copy the PDF to `tests/fixtures/`.
