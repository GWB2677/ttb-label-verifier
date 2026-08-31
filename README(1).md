# TTB LabelCheck — AI-Assisted Alcohol Label Verification Prototype

A standalone proof of concept for the Treasury/TTB take-home project. The prototype focuses on the high-volume, repetitive matching portion of alcohol-label review while leaving compliance judgment with trained agents.

## What it does

- Single-label verification against application values
- Brand-name normalization and fuzzy review handling
- ABV, class/type, net contents, producer/bottler checks
- Country-of-origin check for imports
- Government Health Warning wording check
- Clear Pass / Review / Fail explanations
- Batch CSV processing and downloadable results
- Optional label-image preview
- No file persistence and no external API dependency

## Run locally

Requirements: Python 3 or any static web server.

```bash
cd ttb-label-verifier
python3 -m http.server 3000
```

Open `http://localhost:3000`.

No npm install or API keys are required.

## Test

```bash
node tests.js
```

## Fast demo

1. Open **Single label**.
2. Click **Load sample**.
3. Click **Verify label**.
4. Change the expected ABV from `45%` to `50%` and verify again to see a failure.
5. Open **Batch review**, click **Use demo batch**, then **Run batch review**.

## Approach

The stakeholder notes show that the core bottleneck is routine field matching, that useful response time should be roughly five seconds or less, that usability must work for agents with a wide range of technical comfort, and that batch processing would provide meaningful value. The verification engine is therefore local, fast, explainable, and simple.

The app separates **text extraction** from **compliance verification**. In this prototype, users paste recognized/transcribed label text and may upload the image for side-by-side reference. The deterministic verification engine then performs checks in milliseconds. This avoids dependence on public cloud AI endpoints that may be blocked on a federal network.

For a production path, an approved OCR/vision service (for example, a FedRAMP-authorized Azure-hosted service) could be inserted before the verification engine without changing the review UI or matching rules.

## Tools used

- HTML5
- CSS3
- Vanilla JavaScript
- Browser File and Blob APIs
- Node.js only for lightweight verification tests
- Vercel for deployment

## Assumptions

- This is a standalone proof of concept and does not integrate with COLA.
- Test data does not contain sensitive PII.
- Human agents retain final decision authority.
- Brand formatting differences such as capitalization, apostrophes, and spacing should not automatically fail a label.
- The government warning wording must match the standard text; formatting such as visual boldness still requires human review in this prototype.
- OCR/vision is an integration boundary rather than a production-ready component in this time-boxed prototype.

## Trade-offs / limitations

- No production OCR or image-quality correction is included.
- The prototype checks textual presence and values; it does not measure label font size, physical placement, contrast, or visual boldness.
- Brand fuzzy matching is intentionally conservative and routes uncertain cases to **Review** rather than making a compliance decision.
- No data is stored, no authentication is implemented, and this is not intended for production use.

## Project structure

```text
index.html      Main application UI
styles.css      Responsive styling
app.js          Verification engine, UI logic, CSV batch handling
tests.js        Lightweight verification tests
README.md       Setup, approach, tools, assumptions, limitations
vercel.json     Static deployment configuration
```
