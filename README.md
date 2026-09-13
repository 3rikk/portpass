# Portpass

https://portpass.erik-kunz.com

<img width="1505" height="856" alt="image" src="https://github.com/user-attachments/assets/023d88b6-12f8-40a4-843a-04a8a8615386" />


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
- TTTA: Australian citizens → New Zealand resident visa on arrival; New Zealand citizens → Australian subclass 444 visa on arrival, with residence/work/study conditions. Australian permanent residents get a conditional New Zealand route requiring return travel conditions and normally an NZeTA.
- US green cards support Canadian and Mexican short-visit exemptions. Mark a US residence permit as permanent residence in the wallet; an unspecified permit is conditional and a temporary permit does not qualify.
- Qualifying third-country visas and residence permits support visits to Albania, Serbia and Montenegro. Albania’s visa route checks multiple entry and previous use. These are destination-specific exemptions, not blanket access.
- Greenland is an additional destination, separate from Denmark/Schengen, with passport waivers, eligible Schengen residence permits, explicitly Greenland-valid visas and Nordic residence rights. Choose Denmark for a Danish passport, including one issued in Greenland.
- UK/Canadian ordinary passports → mainland China: sourced 30-day waiver for entry 17 February–31 December 2026. After the published end date, show an eligibility check pending re-verification.
- Schengen short stays with an eligible residence permit or uniform type C visa. These documents alone do not grant residence in other countries.

BOTC coverage includes Gibraltar, the Falkland Islands, Bermuda and the Cayman Islands. In the passport/citizenship selector, choose the territory marked **BOTC** only for that nationality class; choose **United Kingdom · British citizen** for British-citizen nationality even if the passport was issued overseas. The wallet asks separately about documented local right of abode or unrestricted residence status. A BOTC passport never inherits the UK passport matrix, CTA residence rights or the UK–China waiver.

Outbound BOTC rules cover UK visits (including the ETA exemption), Schengen short visits, Canada’s air eTA route and Greenland’s Danish-nationality visa exemption. Inbound coverage includes the Falklands’ own visa list, Gibraltar’s July 2026 arrangements and British-citizen visitor access to Bermuda/Cayman. Living requires confirmed local status or a held residence permit; otherwise sourced application requirements are shown as **Check eligibility**. Other combinations remain unassessed. Small territories without Natural Earth polygons remain searchable.

Turkish association rights: edit an EU residence-permit entry and choose a qualifying worker (1/3/4-year), family (3/5-year) or vocationally trained child stage, then confirm its conditions. Confirmed stages appear as treaty residence rights only in that host country. Missing confirmation stays conditional; nationality alone adds no automatic residence rights. Family beneficiaries may hold another nationality. Dutch self-employed applications and UK legacy ECAA worker/business/dependant extensions remain subject to approval. No association tourist-visa waiver is inferred.

Source links, decision boundaries, and maintenance notes: [agreement coverage](docs/agreement-coverage.md). Country details link to the applicable authority and review date.

The passport option means an ordinary citizen passport (GB means British citizen). Diplomatic passports, other British nationality classes and special travel documents are not assessed. Legacy wallet entries with missing passport-condition fields remain unconfirmed. All confirmation fields are stored locally with the wallet.

Other visas/permits record declared possession for their issuing destination, subject to their conditions. A UK or Irish residence permit does not grant CTA citizenship rights; an EU or Swiss permit does not confer citizenship-based free movement. General work eligibility is not assessed beyond the stated treaty conditions. No-admission records are not overridden by a visa or permit linked to that passport, or by a short-stay visa waiver. An alternative passport may have its own route. Unassessed residence routes are not denials; visa-free tourism never implies residence rights.

Not yet covered: most third-country document exemptions, other family-member rights, UK Withdrawal Agreement status, EU long-term resident and Blue Card mobility, unassessed Turkish association exceptions, other bilateral residence schemes, long-stay visas, travel history, remaining entries, individual restrictions and travel-date authorisation requirements. These require additional eligibility inputs or destination-specific assessment. Visa-facilitation agreements simplify applications; they do not create visa-free travel or automatic residence. This is a dated rules snapshot, not an exhaustive or live treaty database. [IATA Timatic](https://www.iata.org/timatic) is a production integration candidate; obtain access and licensing terms from IATA.

`data/world.geojson`: Natural Earth 1:110m administrative boundaries, [public domain](https://www.naturalearthdata.com/about/terms-of-use/), obtained from https://github.com/nvkelso/natural-earth-vector. Small countries may not have polygons; all dataset countries remain in the list. Crimea is included in Ukraine: its polygon was removed from Russia and unioned with Ukraine by dissolving their shared edges, following [Andrew Heiss’s guide](https://www.andrewheiss.com/blog/2025/02/13/natural-earth-crimea/). The adjustment preserves the clockwise outer-ring winding used by D3. Reapply this adjustment when updating the Natural Earth source; verify that `[34, 45]` belongs to Ukraine and not Russia.

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

Visa clocks keep allowance, validity, arrival, admission deadline and previous visits in the existing local browser wallet. Edit any document to update its dates. Select a clock to highlight its destination or Schengen bloc; hover or open a country for the corresponding countdown. Entry and exit days count, and remaining days include today. No timing details are sent to a server.

Blank allowances are explicitly labelled as assumptions: the Schengen maximum (90 days), the usual UK Standard Visitor allowance (six calendar months), or a passport-matrix numeric visa estimate where available. Visa-free/ETA allowances are not substituted for held visas. There is no universal issued-visa default database: unsupported allowances remain unknown. US admission deadlines come from the user's I-94, separately from entry-visa expiry.

Schengen estimates combine logged short visits across all Schengen visas in the wallet, including expired visas and other linked passports. The user must confirm complete history before a remaining stay is shown. A shorter entered total allowance also applies. Old visits fall out of the rolling 180-day window; overlapping records count once. Add separate historical visas as needed. Unrecorded visits, single/multiple-entry restrictions, nationality-specific exceptions and residence-authorised periods require the user's own checks; these clocks do not verify legal entitlement.

Run `npm test` for rule and visa-calendar checks. `tests/visa-browser.js` provides browser integration checks (call `checkVisaClocks()` on a loaded local site with a disposable browser profile; it replaces that profile's wallet).

Citizenship without a passport is a separate wallet type. It adds a residence result for that country in the Live tab only. It never substitutes for a passport, links a visa/permit, or adds passport travel or treaty routes abroad.

**Advanced** below the map downloads a readable, indented JSON file with a `.portpass` extension. The optional name determines the filename (default `profile.portpass`). Version 1 contains `format: "portpass"`, `version: 1`, `name`, and `documents`, including visa timing and history. Import reads the file locally, validates it, and previews the entry count before the user replaces the current wallet. Invalid files leave the wallet untouched. Save the current profile first to keep it. Profiles are plain text, not encrypted; files are never uploaded to Portpass.

The top-right theme selector offers System (default), Light and Dark. The override is stored locally as `portpass-theme`, applies to the main page and Impressum, and controls the palette used for new map images. It is a device preference, separate from exported wallet profiles.

`tests/entry-browser.js` checks the new document fields, saved profiles, Greenland map/list, TTTA and China in a disposable browser profile. Run `checkEntryRules()` on the loaded local site. Third-country exemptions use the destination’s stay conditions, not the issuing visa’s stay clock.

BOTC regression checks: `tests/botc.test.js` is included in `npm test`; run `checkBotc()` from `tests/botc-browser.js` in a disposable browser profile for form, edit and profile checks.

`tests/association.test.js` covers host-country and nationality boundaries, qualifying stages, inactive documents and profile validation. `checkAssociation()` in `tests/association-browser.js` checks the residence form, confirmation resets and saved profiles.


**Settlement blocs**, directly above Advanced, opens a separate public membership map. Its 24 colour-key entries cover the 21 overview blocs/initiatives plus enhanced CARICOM, EU–Switzerland and EFTA. Click a key entry to isolate a group, or Show all blocs to restore the overview. Overlapping memberships use continuous diagonal stripes containing every applicable colour; small states and territories omitted from the base map have markers. Country details explain the actual rights and conditions, including bilateral and proposed arrangements. Returning to the personal map preserves the wallet, mode, search and zoom.

`bloc-map.js` builds this view from the supported rules, independently of wallet evaluations. `checkBlocMap()` in `tests/bloc-map-browser.js` checks all member geometries/markers, overlap colours, key filtering, keyboard interaction, desktop/mobile layout, themes and preservation of personal state in a disposable browser profile.
