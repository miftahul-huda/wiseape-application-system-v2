# Wiseape Event Messaging API

Express + Sequelize + PostgreSQL + kafkajs service that (1) publishes events to Kafka and (2) consumes every non-internal Kafka topic and delivers each message to the webhooks registered for that topic. Default port **4004**. It uses the same PostgreSQL database as the Utilities API, with its own tables: `event_topic_webhooks` and `event_webhook_deliveries`.

## Run
    cp .env.example .env   # fill in DB credentials
    npm install
    npm run dev            # or: npm start

Kafka (see `server/utilities/kafka`) is optional at startup: if the broker is down the API still starts, logs it, keeps retrying the producer/consumer in the background and answers `503` on the Kafka endpoints meanwhile. Shutdown (SIGINT/SIGTERM) disconnects producer, consumer, admin and Sequelize.

## Environment variables
| Var | Description |
|---|---|
| `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER` | PostgreSQL connection (database default `wise-utilities`) |
| `DB_PASSWORD` | Required, no default (startup fails with a clear error if missing) |
| `PORT` | HTTP port (default 4004) |
| `KAFKA_BROKERS` | Comma-separated brokers (default `localhost:9092`) |
| `KAFKA_CLIENT_ID` | Default `event-messaging-api` |
| `KAFKA_GROUP_ID` | Consumer group, default `event-messaging-webhooks` |
| `WEBHOOK_TIMEOUT_MS` | Per-attempt HTTP timeout, default 10000 |
| `WEBHOOK_MAX_ATTEMPTS` | Attempts per delivery, default 3 |
| `DB_LOGGING` | `true` to log SQL |

## Endpoints
Success: `{success:true,data}`; errors: `{success:false,message}` (400 validation, 404, 409 duplicate topic+url, 500, 503 Kafka down).

- `GET /` server info; `GET /api` endpoint index
- `POST /api/messages` `{topic,key?,payload,headers?}` -> 201 `{topic,partition,offset,eventId}`. Object/array/number/boolean payloads are JSON-stringified, strings are sent as-is. `headers` is a string map. An `x-event-id` header is added (the generated `eventId`). Topic must match `[A-Za-z0-9._-]{1,249}` and must not start with `__`.
- `POST /api/client-application-events` `{application,event,data?,key?}` -> publishes `{eventId,application,event,data,occurredAt}` to topic `CLIENT_APPLICATION_EVENT`.
- `GET /api/webhooks?topic=`, `GET /api/webhooks/:id`, `POST /api/webhooks` `{topic,url,description,secret,isActive}`, `PUT /api/webhooks/:id` (omitted/empty `secret` keeps the stored one; `clearSecret:true` removes it), `DELETE /api/webhooks/:id`. `url` must be http/https. The secret is never returned; responses carry `hasSecret`.
- `POST /api/webhooks/:id/test` delivers a sample event (`{eventId,topic,test:true,payload:{message:'test'}}`) synchronously through the normal delivery path (not written to Kafka, logged as a delivery) -> `{success,httpStatus,error,durationMs}`.
- `GET /api/deliveries?webhookId=&topic=&status=success|failed&limit=` newest first (default 100, max 500). Only the newest 5000 rows are kept.
- `GET /api/topics` non-internal topics from Kafka.
- `GET /api/health` `{database, kafkaProducer, consumer:{running,topics}}`.

## Webhook delivery
For each consumed message the event is built as `{eventId, topic, partition, offset, timestamp, key, headers, payload}` (`payload` is parsed JSON when valid, otherwise the raw string; `eventId` comes from the message JSON `eventId`, else the `x-event-id` header, else is generated). It is POSTed as JSON, concurrently, to every **active** webhook whose topic matches exactly, with headers:

- `Content-Type: application/json`, `X-Event-Id`, `X-Event-Topic`, `X-Event-Timestamp`
- `X-Event-Signature: sha256=<hex>` when the webhook has a secret: HMAC-SHA256 of the **raw request body** keyed with the secret.

Verification (Node):

    const crypto = require('crypto');
    function verify(rawBody, header, secret) {           // rawBody: Buffer/string exactly as received
      const expected = 'sha256=' + crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
      const a = Buffer.from(expected), b = Buffer.from(header || '');
      return a.length === b.length && crypto.timingSafeEqual(a, b);
    }

Retry rules: any 2xx is success. Network errors, timeouts (`WEBHOOK_TIMEOUT_MS`), 5xx and 429 are retried up to `WEBHOOK_MAX_ATTEMPTS` with backoff 1s then 3s; other 4xx are not retried. One `event_webhook_deliveries` row is written per webhook per message (status, httpStatus, attempts, truncated error, durationMs). A failing or slow webhook never stops the consumer or other webhooks. Delivery is at-most-once from the webhook's point of view (offsets are committed regardless of the delivery result); use `X-Event-Id` for idempotency.

## Consumer and the new-topic refresh caveat
One consumer (group `KAFKA_GROUP_ID`, `fromBeginning:false`) reads all non-internal topics (names not matching `/^(?!__).+$/` are skipped). kafkajs only subscribes to topics that exist at subscribe time, so every ~30 s (and shortly after a publish to a topic not seen before) the topic list is re-read; if a new topic appeared, the consumer is stopped and restarted with the new topic list. Topics discovered after startup are subscribed with `fromBeginning:true` (when the group has no stored offset), so the first message produced to a brand-new topic is not lost during the gap. Consequence: messages published to a new topic are delivered up to ~30 s late (usually ~1-5 s when published through this API); topics created externally are picked up within ~30 s. Topics that already existed when the API first started and have no committed offset start at the latest offset.

## Webhook URLs that always fail: blocked ports

Deliveries use Node's `fetch`, which (like browsers) refuses the "bad ports" list of the WHATWG fetch
standard. A webhook on one of those ports fails every attempt with `fetch failed (bad port)` and is
logged as `failed`. Examples: `5060` / `5061` (SIP), `6000`, `6665`-`6669` (IRC), `10080`, plus the
classic service ports (`22`, `25`, `110`, `143`, `587`, ...). Pick an ordinary application port such
as `5099`, `8081` or `9090`. Full list: https://fetch.spec.whatwg.org/#port-blocking
