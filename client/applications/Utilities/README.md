# Utilities (Kong Manager / Kafka Manager)

Two small client apps that keep a list of links to a web management UI and open a
chosen link inside a window (`WiseWebView`).

- `AppKongManager` — link type `kong_manager`
- `AppKafkaManager` — link type `kafka_manager`

Both use the same windows: `forms/WinUtilityLinks.js` (list: Add / Edit / Delete /
Open / Refresh, context menu), `forms/WinUtilityLinkEdit.js` (add/edit dialog) and
`forms/WinWebViewer.js` (the embedded page, a combobox to switch between the saved
links of the type, and a Reload button).

Open uses the selected row; with nothing selected it opens the default link (or the
first link if none is marked default).

## Backend

REST API in `server/applications/Utilities` (port 4003). The client calls it through
the Kong gateway: default base URL `http://localhost:8000/utilities/api`, override
with the `UTILITIES_API_URL` environment variable (e.g. `http://localhost:4003/api`
to bypass Kong). Repository: `services/UtilitiesApiRepository.js`.

## IMPORTANT: embedding limits

Many management UIs refuse to be shown inside an iframe. Kafka UI sends
`X-Frame-Options: DENY` and Kong Manager sends `sameorigin`; for a page like that the frame is
blank / "refused to connect" (the browser gives the app no way to detect it). The
"open in new tab" link in the bar above the frame is the fallback for any such link.

The two default links work because they go through the Kong gateway, which strips that header for
them: `http://kong-manager.localhost:8000` and `http://kafka-ui.localhost:8000` (see
`server/utilities/kong-gateway/README.md`; the proxy port is bound to 127.0.0.1). Use the same
approach for any other tool you want to embed: add a host-based route + `response-transformer` in
`kong.yml`, then save the new URL as a link here. Note Kong Manager now only works at the
`kong-manager.localhost:8000` address (its Admin API CORS origin moved there).
