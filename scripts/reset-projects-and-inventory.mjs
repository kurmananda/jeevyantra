// One-off maintenance script:
// 1. Deletes every project except "Venture X" (cascades project_teams/project_progress),
//    and clears project_requests. Adds no new project data.
// 2. Clears inventory_items and repopulates it with the club's current stock list.
// Run with: node --env-file=.env.local scripts/reset-projects-and-inventory.mjs
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SECRET_KEY;

if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY in the environment.");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function categorize(name) {
  const n = name.toLowerCase();
  if (/(uno|nano|esp32|esp8266|pro micro|xiao|raspberry pi|dev kit)/.test(n)) return "Microcontroller / Board";
  if (/(sensor|mpu6050|adxl345|dht11|encoder|gps)/.test(n)) return "Sensor";
  if (/(motor driver|h bridge)/.test(n)) return "Motor Driver";
  if (/(motor|servo|bo motor|pump|solenoid)/.test(n)) return "Motor / Actuator";
  if (/(display|oled|lcd)/.test(n)) return "Display";
  if (/(nrf24l01|bluetooth|rf transceiver|hw-200)/.test(n)) return "Wireless / RF Module";
  if (/(charging|tp4056|step up|lm2596|transformer|comparator)/.test(n)) return "Power Module";
  if (/(chassis|tires|breadboard|camera|speaker|fan|ic\b)/.test(n)) return "Component / Chassis";
  return "Other";
}

const INVENTORY = [
  ["UNO", 15],
  ["Servo Shield", 3],
  ["Raspberry Pi 4", 2],
  ["Nano", 3],
  ["ESP8266", 3],
  ["Pro Micro", 1],
  ["ESP32", 1],
  ["XIAO RP2040", 1],
  ["ESP32 Dev Kit", 2],
  ["Sound Sensor", 4],
  ["MPU6050", 5],
  ["Mic (Jack Connector)", 56],
  ["Step Up", 1],
  ["HW-166 (2 Channel Dual Motor Driver)", 2],
  ["HW-246 (3 Axis)", 1],
  ["ADXL345", 1],
  ["Rotary Encoder", 8],
  ["Ultrasonic Sensor", 18],
  ["IR Sensor (Normal)", 23],
  ["IR Sensor (Mini)", 5],
  ["Gas Sensor", 1],
  ["0.96 OLED", 4],
  ["TP4056 (Charging)", 1],
  ["Comparator Module", 2],
  ["NRF24L01", 4],
  ["I2C Serial Interface", 1],
  ["Temperature DHT11", 1],
  ["NRF24L01 + Antenna", 3],
  ["High Power Motor Driver", 6],
  ["L293 Motor Driver", 11],
  ["L294 Motor Driver", 37],
  ["8 Digit Display", 15],
  ["4-8 Digit Display", 1],
  ["LCD Display Connector", 1],
  ["433 MHz RF Transceiver", 1],
  ["LM2596", 1],
  ["GPS", 5],
  ["Bluetooth", 2],
  ["LM393 Motor Driver", 1],
  ["DRV8833 Dual H Bridge Motor Driver", 1],
  ["Square Force Sensor", 3],
  ["HY-M285", 1],
  ["HW-200 (NRF24L01)", 1],
  ["Soil Sensor", 2],
  ["Touch Sensor", 1],
  ["Temperature Sensor", 5],
  ["USBasp USB ISP Programmer", 1],
  ["BO Motor", 40],
  ["4 Channel IR Line Tracking Sensor (YL-70)", 1],
  ["ULN2003A Stepper Motor Driver", 1],
  ["Mechanical Servo", 3],
  ["Servo", 16],
  ["Water Solenoid", 8],
  ["Transformer Out 10V", 1],
  ["Water Pump", 2],
  ["IC", 1],
  ["High Torque Geared Motor with Encoder", 5],
  ["High Torque Motor", 10],
  ["Breadboard", 15],
  ["Robo Chassis", 16],
  ["Tires", 25],
  ["Pi 4 Camera", 1],
  ["Speaker", 4],
  ["Cooling Fan", 4],
  ["Rain Drop Sensor", 1],
  ["Small Motor", 2],
].map(([name, quantity]) => ({
  name,
  category: categorize(name),
  description: null,
  quantity,
  available_quantity: quantity,
  image_url: null,
}));

async function main() {
  console.log("── Projects ──────────────────────────────");
  const { data: projects, error: fetchErr } = await supabase
    .from("projects")
    .select("id, title")
    .neq("title", "Venture X");
  if (fetchErr) throw fetchErr;

  if (projects.length) {
    const ids = projects.map((p) => p.id);
    const { error: delErr } = await supabase.from("projects").delete().in("id", ids);
    if (delErr) throw delErr;
    console.log(`Deleted ${ids.length} project(s), kept "Venture X".`);
  } else {
    console.log('No projects to delete besides "Venture X".');
  }

  const { error: reqErr } = await supabase.from("project_requests").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  if (reqErr) throw reqErr;
  console.log("Cleared project_requests.");

  console.log("── Inventory ─────────────────────────────");
  const { error: invDelErr } = await supabase.from("inventory_items").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  if (invDelErr) throw invDelErr;
  console.log("Cleared inventory_items.");

  const { error: invInsErr } = await supabase.from("inventory_items").insert(INVENTORY);
  if (invInsErr) throw invInsErr;
  console.log(`Inserted ${INVENTORY.length} inventory items.`);

  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
