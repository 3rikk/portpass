# Portpass

A standalone, responsive static web app at `/portpass/`. No build step, API key, account or backend. From the repository root, run `python3 -m http.server 8000 --bind 127.0.0.1 --directory portpass`, then open http://localhost:8000/. When deployed with the portfolio, the app lives at `/portpass/`.

## Features

- Multiple passports, residence permits and visitor visas, linked to a passport, with optional expiry dates.
- Interactive pan/zoom world map, searchable country list and Visit/Live modes.
- Best available route plus all assessed alternatives, conditions and provenance.
- Browser-local wallet. No scans or document numbers; no third-party runtime requests.
- Empty first-run state. Add a passport to begin. Expired documents and documents without an active linked passport are excluded.

## Sources and limitations

`data/passports.json`: [imorte/passport-index-data](https://github.com/imorte/passport-index-data), MIT, upstream last updated **2026-02-17**, retrieved 2026-09-12. 199 passport origins. The original [ilyankou dataset](https://github.com/ilyankou/passport-index-dataset) is archived. Upstream data is derived from Passport Index; it is a community dataset, not an official or live admission check. License notice is retained beside the data. No individual corridor freshness or official-source audit is implied.

`rules.js`: a deliberately limited independent rules layer for EU-to-EU citizenship residence rights and Schengen short stays based on eligible residence permits or uniform type C visas. Sources reviewed 2026-09-12:
- https://europa.eu/youreurope/citizens/travel/entry-exit/non-eu-nationals/index_en.htm
- https://europa.eu/youreurope/citizens/residence/residence-rights/index_en.htm

Other visas/permits record declared possession for their own issuing destination, subject to the document's conditions. Work eligibility is not inferred. No-admission records are not overridden by a visa or permit linked to that passport. An alternative passport may have its own assessed route; individual restrictions still require verification. Unassessed residence routes are not denials. Generic `visa free` matrix values are never used to infer residence rights.

Not yet covered: most third-country document exemptions (e.g. a US visa allowing entry elsewhere), UK/Ireland and other bilateral residence arrangements, EEA/Swiss residence agreements, long-stay visas, travel history, remaining entries, restrictions, dates of travel, territorial visa limitations and passport validity thresholds. A comprehensive free, officially maintained database covering these combinations was not identified. Expand the engine with individually sourced, dated rules rather than broad assumptions. [IATA Timatic](https://www.iata.org/timatic) is a production integration candidate; obtain access and licensing terms from IATA.

`data/world.geojson`: Natural Earth 1:110m administrative boundaries, [public domain](https://www.naturalearthdata.com/about/terms-of-use/), obtained from https://github.com/nvkelso/natural-earth-vector. Small countries may not have polygons; all dataset countries remain in the list. Boundary presentation does not imply a political position.

`vendor/d3.min.js`: D3 7.9.0, ISC; license included. All runtime assets are local.

## Maintenance

Review upstream timestamp and changes before replacing the passport JSON. Preserve its license. Update the displayed snapshot date in `index.html` and `app.js`. Add rule regression cases in `tests/rules.test.js` when extending `rules.js`. Keep missing information as `unknown`. Do not treat third-party scraped data as guaranteed current or complete.

Tests: `node portpass/tests/rules.test.js` from the repository root.

Browser checks: install Playwright in your development environment, start the Portpass-only server above, then run `node portpass/tests/browser.cjs`. Set `PORTPASS_URL` to test another URL. Screenshots are written to `/tmp/portpass-desktop.png` and `/tmp/portpass-mobile.png`.
# portpass
