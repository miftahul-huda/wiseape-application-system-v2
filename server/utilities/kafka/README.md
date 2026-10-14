# Kafka + Kafka UI

Single-broker Apache Kafka (KRaft mode, no ZooKeeper) and the Kafka UI (kafbat) for managing it.

| What | Address |
|---|---|
| Kafka UI | http://localhost:8085 |
| Bootstrap server from your machine | `localhost:9092` |
| Bootstrap server from other containers | `kafka:29092` (join the `kafka-net` network) |

Both ports are bound to `127.0.0.1` only: the broker and the UI have no authentication.

## Start / stop

```bash
cd server/utilities/kafka
docker compose up -d            # start
docker compose ps               # status (kafka should become "healthy")
docker compose logs -f kafka    # logs
docker compose down             # stop and remove containers (topics are kept in the volume)
docker compose down -v          # ...and also delete all Kafka data
```

## Starting automatically after a laptop restart

Two things are needed, and both must be true:

1. **Containers:** both services use `restart: unless-stopped`, so Docker brings them back
   whenever the Docker engine starts. They stay down only if you stopped them yourself with
   `docker compose stop` / `down`.
2. **Docker itself:** on macOS the engine is Docker Desktop, which must launch at login:
   *Docker Desktop -> Settings -> General -> "Start Docker Desktop when you sign in to your
   computer"* must be ticked. Without it nothing starts until you open Docker Desktop manually.

Kafka data lives in the named volume `kafka_data`, so topics and messages survive restarts.

## Quick test

```bash
# create a topic, produce and consume one message
docker exec kafka /opt/kafka/bin/kafka-topics.sh --bootstrap-server localhost:9092 --create --topic demo
echo "hello" | docker exec -i kafka /opt/kafka/bin/kafka-console-producer.sh --bootstrap-server localhost:9092 --topic demo
docker exec kafka /opt/kafka/bin/kafka-console-consumer.sh --bootstrap-server localhost:9092 --topic demo --from-beginning --max-messages 1
```

Or open the UI and look at *Topics*.

## Notes

- Single broker: every topic must use replication factor 1 (the internal topics are already configured so).
- To reach Kafka from another compose project, add `networks: { kafka-net: { external: true } }` to it and
  use `kafka:29092`; from an app running on the host use `localhost:9092`.
- To change the host ports, edit the `ports:` entries; if you move `9092`, also change the
  `EXTERNAL://localhost:9092` entry in `KAFKA_ADVERTISED_LISTENERS`.
- The `kafka-ui` image uses the `latest` tag; pin a version once you settle on one.
