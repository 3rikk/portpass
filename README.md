# Portpass

A standalone, responsive static web app. No build step, API key, account or backend. From this directory, run `python3 -m http.server 8000 --bind 127.0.0.1`, then open http://localhost:8000/.

## Features

- Multiple passports, residence permits and visitor visas, linked to a passport, with optional expiry dates.
- Interactive pan/zoom world map, searchable country list and Visit/Live modes.
- Show all destinations matching the current search and filter, or load more in batches.
- Automatic light and dark appearance matching the system, including the map and dialogs.
- Share map previews a JPEG with your travel wallet, current Visit/Live counters, a grid-free world map, and Portpass branding. Download it or use native file sharing where supported. Images are generated locally in the browser.
- Best available route plus all assessed alternatives, conditions and provenance.
- Browser-local wallet. No scans or document numbers; no third-party runtime requests.
- Empty first-run state. Add a passport to begin. Expired documents and documents without an active linked passport are excluded.

## Sources and limitations

`data/passports.json`: [imorte/passport-index-data](https://github.com/imorte/passport-index-data), MIT, upstream last updated **2026-02-17**, retrieved 2026-09-12. 199 passport origins. The original [ilyankou dataset](https://github.com/ilyankou/passport-index-dataset) is archived. Upstream data is derived from Passport Index; it is a community dataset, not an official or live admission check. License notice is retained beside the data. No individual corridor freshness or official-source audit is implied.

`rules.js`: independent rules reviewed **2026-09-12**, covering:

- UK–Ireland Common Travel Area visits and residence for British and Irish citizens, in both directions.
- EU/EEA free movement, the EU–Switzerland agreement, and EFTA mobility. Residence conditions and registration remain applicable. Liechtenstein requires quota approval and is shown as **Check eligibility**, not established residence rights.
- EU/Schengen ordinary-passport short-stay waivers, including biometric, Taiwanese national-ID-number and Hong Kong/Macao SAR-passport conditions. The wallet asks for yes/no confirmation, never the ID number. Missing confirmation is **Check eligibility**; a negative answer does not qualify for the waiver. These rules apply to Schengen destinations, not Ireland or Cyprus. No reciprocal entry rights outside Schengen are inferred.
- Vanuatu’s removed waiver and Nauru’s not-yet-applicable waiver; the EU–Brazil stay-calculation exception is identified rather than reduced to a generic day count.
- Schengen short stays with an eligible residence permit or uniform type C visa. These documents alone do not grant residence in other countries.

Source links, decision boundaries, and maintenance notes: [agreement coverage](docs/agreement-coverage.md). Country details link to the applicable authority and review date.

The passport option means an ordinary citizen passport (GB means British citizen). Diplomatic passports, other British nationality classes and special travel documents are not assessed. Legacy wallet entries with missing passport-condition fields remain unconfirmed. All confirmation fields are stored locally with the wallet.

Other visas/permits record declared possession for their issuing destination, subject to their conditions. A UK or Irish residence permit does not grant CTA citizenship rights; an EU or Swiss permit does not confer citizenship-based free movement. General work eligibility is not assessed beyond the stated treaty conditions. No-admission records are not overridden by a visa or permit linked to that passport, or by a short-stay visa waiver. An alternative passport may have its own route. Unassessed residence routes are not denials; visa-free tourism never implies residence rights.

Not yet covered: most third-country document exemptions, family-member rights, UK Withdrawal Agreement status, EU long-term resident and Blue Card mobility, Turkish association rights, other bilateral residence schemes, long-stay visas, travel history, remaining entries, individual restrictions and travel-date authorisation requirements. These require additional eligibility inputs or destination-specific assessment. Visa-facilitation agreements simplify applications; they do not create visa-free travel or automatic residence. This is a dated rules snapshot, not an exhaustive or live treaty database. [IATA Timatic](https://www.iata.org/timatic) is a production integration candidate; obtain access and licensing terms from IATA.

`data/world.geojson`: Natural Earth 1:110m administrative boundaries, [public domain](https://www.naturalearthdata.com/about/terms-of-use/), obtained from https://github.com/nvkelso/natural-earth-vector. Small countries may not have polygons; all dataset countries remain in the list. Boundary presentation does not imply a political position.

`vendor/d3.min.js`: D3 7.9.0, ISC; license included. All runtime assets are local.

## Maintenance

Review upstream timestamp and changes before replacing the passport JSON. Preserve its license. Update the displayed snapshot date in `index.html` and `app.js`. Add rule regression cases in `tests/rules.test.js` when extending `rules.js`. Keep missing information as `unknown`. Do not treat third-party scraped data as guaranteed current or complete.

Tests: `node tests/rules.test.js` from this directory.

Browser checks: install Playwright in your development environment, start the server above, then run `node tests/browser.cjs`. Run `node tests/map-export.cjs` for JPEG download and sharing checks. Set `PORTPASS_URL` to test another URL. Screenshots are written to `/tmp/portpass-desktop.png` and `/tmp/portpass-mobile.png`.
# Portpass

## Cloudflare deployment

This is a no-build static site and can be deployed either as a Workers Static
Assets application or as a Cloudflare Pages project.

Install the local Cloudflare CLI and authenticate once:

```sh
npm install
npx wrangler login
```

Run it locally through the Workers runtime:

```sh
npm run dev
```

Deploy as a Worker:

```sh
npm run deploy:worker
```

For Git-connected Workers Builds, leave the build command empty and use
`npm run deploy:worker` as the deploy command. The root `.assetsignore` allows
only the site's files, `data/`, and `vendor/` to be uploaded. Add new public
files there when needed. Wrangler does not support `assets.exclude` in
`wrangler.jsonc`; without `.assetsignore`, using the repository root as the
asset directory also uploads dependencies such as `node_modules/workerd`.

Deploy to Pages (the Pages project must exist, or Wrangler will prompt to
create it):

```sh
npm run deploy:pages
```

For a Git-connected Pages project, use `.` as the build output directory and
leave the build command empty. The `wrangler.pages.jsonc` file records the same
configuration for CLI deployments. The Worker and Pages configs are separate
because Cloudflare uses different configuration keys for those services.
