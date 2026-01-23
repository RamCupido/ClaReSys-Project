import mqtt from "mqtt";
import type { MqttClient } from "mqtt";

let client: MqttClient | null = null;

function resolveMqttUrl(raw: string): string {
  const v = (raw || "").trim();

  if (v.startsWith("ws://") || v.startsWith("wss://")) return v;

  const proto = window.location.protocol === "https:" ? "wss" : "ws";
  const path = v.startsWith("/") ? v : `/${v}`;
  return `${proto}://${window.location.host}${path}`;
}

export function getMqttClient() {
  if (client) return client;

  const raw = (import.meta.env.VITE_MQTT_WS_URL as string) || "/mqtt";
  const url = resolveMqttUrl(raw);

  client = mqtt.connect(url, {
    reconnectPeriod: 1000,
    keepalive: 30,
    clean: true,
  });

  client.on("connect", () => console.log("[mqtt] connected", url));
  client.on("reconnect", () => console.log("[mqtt] reconnecting"));
  client.on("error", (e) => console.error("[mqtt] error", e));

  return client;
}
