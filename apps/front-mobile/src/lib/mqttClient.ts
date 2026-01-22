import mqtt from "mqtt";
import type { MqttClient } from "mqtt";

let client: MqttClient | null = null;

export function getMqttClient() {
  if (client) return client;

  const url = process.env.EXPO_PUBLIC_MQTT_WS_URL as string;
  if (!url) throw new Error("EXPO_PUBLIC_MQTT_WS_URL no está definido");

  client = mqtt.connect(url, {
    reconnectPeriod: 1000,
    keepalive: 30,
    clean: true,
  });

  client.on("connect", () => console.log("[mqtt] connected"));
  client.on("reconnect", () => console.log("[mqtt] reconnecting"));
  client.on("error", (e) => console.error("[mqtt] error", e));

  return client;
}
