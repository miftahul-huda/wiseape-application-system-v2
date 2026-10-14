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

# AppEventMessageManager (Event Messaging)

Manages the mapping **Kafka topic -> webhook URL** of the Event Messaging API
(`server/applications/EventMessagingApi`, port 4004). The API consumes the configured
topics and POSTs each event to the webhooks registered for that topic.

Files: `AppEventMessageManager.js`, `forms/WinEventMessageManager.js` (the main window),
`forms/WinTopicWebhookEdit.js` (add/edit dialog), `services/EventMessagingApiRepository.js`.

## API base URL

Default `http://localhost:8000/event-messaging/api` (through Kong); override with the
`EVENT_MESSAGING_API_URL` environment variable (e.g. `http://localhost:4004/api` to bypass Kong,
adjust the path to the server's routes).

## Tabs

- **Webhooks** — Add / Edit / Delete / Test / Refresh, a topic filter (topics present in the
  webhooks, plus All), a table (topic, URL, description, active, has-secret) and a context menu.
  Test sends a test event to the selected webhook and reports the HTTP status and duration, or the error.
  In the add/edit dialog the topic is free text (an optional combobox of existing Kafka topics fills it),
  the URL must be http(s), the secret is optional (leaving it empty when editing keeps the stored one;
  "remove the stored secret" clears it).
- **Delivery log** — the latest 100 deliveries (time, topic, webhook URL, status, HTTP status,
  attempts, duration, error) with a status filter (All / Success / Failed).
- **Send message** — publishes a test message (topic, optional key, payload as JSON or plain text) and
  shows the resulting partition/offset. A status line shows the API health (database, Kafka producer,
  consumer); it is refreshed with the Refresh button.

## What a webhook receives

An HTTP `POST` with a JSON body (the event) and these headers:

- `X-Event-Id` — unique id of the event
- `X-Event-Topic` — the Kafka topic it came from
- `X-Event-Signature` — `sha256=<hex HMAC-SHA256 of the raw body>` using the webhook's secret
  (only sent when the webhook has a secret; verify it over the raw request body)
