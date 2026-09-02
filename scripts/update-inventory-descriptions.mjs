// One-off: adds a 1-line description to each existing inventory item.
// Run with: node --env-file=.env.local scripts/update-inventory-descriptions.mjs
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SECRET_KEY;
const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const DESCRIPTIONS = {
  "UNO": "Classic ATmega328P dev board, the default starter microcontroller.",
  "Servo Shield": "16-channel PWM shield for driving many servos from one board.",
  "Raspberry Pi 4": "Single-board computer for vision, ROS, or on-bot compute.",
  "Nano": "Compact ATmega328P board for space-constrained builds.",
  "ESP8266": "Wi-Fi-enabled microcontroller for simple IoT projects.",
  "Pro Micro": "Tiny ATmega32U4 board with native USB HID support.",
  "ESP32": "Dual-core Wi-Fi + Bluetooth microcontroller module.",
  "XIAO RP2040": "Thumb-sized RP2040 board for compact, low-power builds.",
  "ESP32 Dev Kit": "Breakout dev board for the ESP32 module with USB and headers.",
  "Sound Sensor": "Detects ambient sound amplitude via a small microphone.",
  "MPU6050": "6-axis accelerometer + gyroscope IMU module.",
  "Mic (Jack Connector)": "Electret microphone with a standard jack connector.",
  "Step Up": "Boost converter that raises input voltage to a higher output.",
  "HW-166 (2 Channel Dual Motor Driver)": "Dual-channel DC motor driver module.",
  "HW-246 (3 Axis)": "3-axis sensor breakout module.",
  "ADXL345": "3-axis digital accelerometer module.",
  "Rotary Encoder": "Knob input that reports incremental rotation and clicks.",
  "Ultrasonic Sensor": "HC-SR04-style module for distance measurement.",
  "IR Sensor (Normal)": "Infrared proximity/line sensor, standard size.",
  "IR Sensor (Mini)": "Infrared proximity/line sensor, compact form factor.",
  "Gas Sensor": "Detects gas concentration in the surrounding air.",
  "0.96 OLED": "Small 128x64 OLED display over I2C.",
  "TP4056 (Charging)": "Single-cell Li-ion/LiPo battery charging module.",
  "Comparator Module": "Analog comparator breakout for threshold detection.",
  "NRF24L01": "2.4GHz wireless transceiver module for SPI-based comms.",
  "I2C Serial Interface": "I2C backpack/interface adapter module.",
  "Temperature DHT11": "Basic digital temperature and humidity sensor.",
  "NRF24L01 + Antenna": "NRF24L01 transceiver with extended-range antenna.",
  "High Power Motor Driver": "Driver module rated for higher-current DC motors.",
  "L293 Motor Driver": "Dual H-bridge IC/module for driving small DC motors.",
  "L294 Motor Driver": "Dual H-bridge motor driver module.",
  "8 Digit Display": "8-digit 7-segment LED display module.",
  "4-8 Digit Display": "4-to-8-digit 7-segment LED display module.",
  "LCD Display Connector": "Connector/header for interfacing with LCD displays.",
  "433 MHz RF Transceiver": "Low-cost 433MHz radio transmitter/receiver pair.",
  "LM2596": "Adjustable buck (step-down) voltage regulator module.",
  "GPS": "GPS receiver module for outdoor positioning.",
  "Bluetooth": "Bluetooth serial module (e.g. HC-05/06 style).",
  "LM393 Motor Driver": "LM393-based comparator/driver module.",
  "DRV8833 Dual H Bridge Motor Driver": "Dual H-bridge driver for small DC or stepper motors.",
  "Square Force Sensor": "Square-format force-sensitive resistor pad.",
  "HY-M285": "Motor driver / power module board.",
  "HW-200 (NRF24L01)": "NRF24L01-based wireless transceiver breakout.",
  "Soil Sensor": "Measures soil moisture via resistive probes.",
  "Touch Sensor": "Capacitive touch-detection module.",
  "Temperature Sensor": "General-purpose temperature sensing module.",
  "USBasp USB ISP Programmer": "USB AVR in-system programmer for flashing chips.",
  "BO Motor": "Gear-box DC motor commonly used in small robot chassis.",
  "4 Channel IR Line Tracking Sensor (YL-70)": "4-channel IR array for line-following robots.",
  "ULN2003A Stepper Motor Driver": "Darlington driver board, commonly paired with 28BYJ-48 steppers.",
  "Mechanical Servo": "Standard hobby servo with mechanical gear train.",
  "Servo": "Standard hobby servo motor.",
  "Water Solenoid": "Electrically actuated solenoid valve for water flow control.",
  "Transformer Out 10V": "Step-down transformer with 10V output.",
  "Water Pump": "Small DC submersible/inline water pump.",
  "IC": "Miscellaneous integrated circuit stock.",
  "High Torque Geared Motor with Encoder": "Geared DC motor with built-in rotary encoder.",
  "High Torque Motor": "DC motor rated for higher torque output.",
  "Breadboard": "Solderless prototyping board.",
  "Robo Chassis": "Base chassis kit for building small robots.",
  "Tires": "Wheels/tires for robot chassis drivetrains.",
  "Pi 4 Camera": "Camera module compatible with Raspberry Pi 4.",
  "Speaker": "Small audio output speaker.",
  "Cooling Fan": "Small DC fan for cooling electronics enclosures.",
  "Rain Drop Sensor": "Detects rainfall/moisture on a probe grid.",
  "Small Motor": "Miscellaneous small DC motor.",
};

async function main() {
  const { data: items, error } = await supabase.from("inventory_items").select("id, name");
  if (error) throw error;

  let updated = 0;
  for (const item of items) {
    const description = DESCRIPTIONS[item.name];
    if (!description) {
      console.log(`No description mapped for "${item.name}", skipping.`);
      continue;
    }
    const { error: updErr } = await supabase.from("inventory_items").update({ description }).eq("id", item.id);
    if (updErr) throw updErr;
    updated += 1;
  }
  console.log(`Updated ${updated}/${items.length} item(s) with descriptions.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
