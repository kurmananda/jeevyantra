// Seeds demo data into Supabase: members, projects, inventory, and bookings.
// Run with: node --env-file=.env.local scripts/seed.mjs
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

const MEMBERS = [
  {
    email: "aarav.mehta@jeevyantra.club",
    password: "Jeevyantra#2026",
    name: "Aarav Mehta",
    phone: "+91 98200 11234",
    sccode: "SC-2023-014",
    bio: "Team lead — control systems and firmware. Building the club's autonomous nav stack.",
    is_admin: true,
  },
  {
    email: "diya.rao@jeevyantra.club",
    password: "Jeevyantra#2026",
    name: "Diya Rao",
    phone: "+91 90040 55678",
    sccode: "SC-2023-027",
    bio: "Mechanical design lead. CAD, 3D printing, and drivetrain tuning.",
    is_admin: false,
  },
  {
    email: "kabir.singh@jeevyantra.club",
    password: "Jeevyantra#2026",
    name: "Kabir Singh",
    phone: "+91 98765 43210",
    sccode: "SC-2024-002",
    bio: "Computer vision and sensor fusion. Second-year, joined for the line-follower build.",
    is_admin: false,
  },
  {
    email: "meera.iyer@jeevyantra.club",
    password: "Jeevyantra#2026",
    name: "Meera Iyer",
    phone: "+91 91234 09876",
    sccode: "SC-2024-031",
    bio: "PCB design and power electronics. Currently reworking the swarm-bot charging dock.",
    is_admin: false,
  },
];

const PROJECTS_BY_EMAIL = {
  "aarav.mehta@jeevyantra.club": [
    {
      title: "Autonomous Warehouse Bot",
      description: "SLAM-based navigation on a differential-drive chassis, built for the inter-college robotics meet.",
      status: "current",
      tags: ["ROS2", "SLAM", "Lidar"],
      link: "https://github.com/jeevyantra/warehouse-bot",
    },
    {
      title: "Swarm Coordination Framework",
      description: "Lightweight message-passing layer so 6+ bots can share a shared occupancy grid over ESP-NOW.",
      status: "current",
      tags: ["Swarm", "ESP32"],
    },
    {
      title: "Line-Follower v3",
      description: "PID-tuned line follower that won 2nd place at Robowars 2025.",
      status: "previous",
      tags: ["PID", "IR Array"],
    },
  ],
  "diya.rao@jeevyantra.club": [
    {
      title: "Quadruped Leg Mechanism",
      description: "5-bar linkage leg design for a tabletop quadruped, optimized for print-in-place assembly.",
      status: "current",
      tags: ["CAD", "3D Printing"],
    },
    {
      title: "Modular Chassis Kit",
      description: "A reusable aluminium-extrusion chassis system for next year's beginner workshop kits.",
      status: "current",
      tags: ["Chassis", "Fusion 360"],
    },
    {
      title: "RC Combat Bot 'Anvil'",
      description: "Wedge-style combat bot, runner-up at the 2025 college robowars.",
      status: "previous",
      tags: ["Combat Robotics"],
    },
  ],
  "kabir.singh@jeevyantra.club": [
    {
      title: "Object-Tracking Turret",
      description: "OpenCV + pan-tilt servo turret that tracks a coloured marker in real time.",
      status: "current",
      tags: ["OpenCV", "Python", "Servo"],
      link: "https://github.com/jeevyantra/tracking-turret",
    },
    {
      title: "Depth-Camera Obstacle Map",
      description: "Using an Intel RealSense feed to build a live 2D obstacle map for the warehouse bot.",
      status: "current",
      tags: ["RealSense", "Vision"],
    },
  ],
  "meera.iyer@jeevyantra.club": [
    {
      title: "Wireless Charging Dock",
      description: "Qi-based charging pad so swarm bots can self-dock between test runs.",
      status: "current",
      tags: ["PCB", "Power Electronics"],
    },
    {
      title: "Battery Health Monitor",
      description: "Custom fuel-gauge board with a small OLED read-out and Bluetooth logging.",
      status: "previous",
      tags: ["KiCad", "BLE"],
    },
  ],
};

const INVENTORY = [
  { name: "Arduino Uno R3", category: "Boards", description: "ATmega328P dev board for general prototyping.", quantity: 12, available_quantity: 9 },
  { name: "ESP32 DevKit v1", category: "Boards", description: "Wi-Fi + BLE microcontroller, used across most current builds.", quantity: 10, available_quantity: 6 },
  { name: "Raspberry Pi 4 (4GB)", category: "Boards", description: "For vision and SLAM workloads.", quantity: 4, available_quantity: 1 },
  { name: "MG996R Servo Motor", category: "Actuators", description: "High-torque servo for turrets and grippers.", quantity: 20, available_quantity: 14 },
  { name: "NEMA 17 Stepper Motor", category: "Actuators", description: "For CNC and precision drivetrain builds.", quantity: 8, available_quantity: 8 },
  { name: "TT Gear Motor (Yellow)", category: "Actuators", description: "Standard drive motor for beginner chassis kits.", quantity: 30, available_quantity: 22 },
  { name: "HC-SR04 Ultrasonic Sensor", category: "Sensors", description: "Distance sensing, 2cm–400cm range.", quantity: 25, available_quantity: 19 },
  { name: "MPU6050 IMU", category: "Sensors", description: "6-axis accelerometer + gyroscope module.", quantity: 15, available_quantity: 10 },
  { name: "RPLidar A1", category: "Sensors", description: "360° laser scanner, reserved for SLAM projects.", quantity: 2, available_quantity: 0 },
  { name: "LiPo Battery 3S 2200mAh", category: "Power", description: "For combat bots and higher-draw drivetrains.", quantity: 10, available_quantity: 7 },
  { name: "Bench Power Supply", category: "Tools", description: "0–30V adjustable, shared lab bench unit.", quantity: 3, available_quantity: 2 },
  { name: "Soldering Station", category: "Tools", description: "Temperature-controlled iron with stand and sponge.", quantity: 6, available_quantity: 4 },
];

async function upsertMember(m) {
  const { data: list } = await supabase.auth.admin.listUsers({ page: 1, perPage: 200 });
  let user = list?.users?.find((u) => u.email === m.email);

  if (!user) {
    const { data, error } = await supabase.auth.admin.createUser({
      email: m.email,
      password: m.password,
      email_confirm: true,
      user_metadata: { name: m.name, phone: m.phone, sccode: m.sccode },
    });
    if (error) throw error;
    user = data.user;
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .upsert(
      {
        id: user.id,
        name: m.name,
        phone: m.phone,
        sccode: m.sccode,
        bio: m.bio,
        is_admin: m.is_admin,
      },
      { onConflict: "id" }
    );
  if (profileError) throw profileError;

  return user;
}

async function main() {
  console.log("Seeding demo members...");
  const userByEmail = {};
  for (const m of MEMBERS) {
    const user = await upsertMember(m);
    userByEmail[m.email] = user;
    console.log(`  ✓ ${m.name} (${m.email})`);
  }

  console.log("Seeding demo projects...");
  for (const [email, projects] of Object.entries(PROJECTS_BY_EMAIL)) {
    const owner_id = userByEmail[email].id;
    const { data: existing } = await supabase.from("projects").select("title").eq("owner_id", owner_id);
    const existingTitles = new Set((existing ?? []).map((p) => p.title));
    const toInsert = projects.filter((p) => !existingTitles.has(p.title)).map((p) => ({ ...p, owner_id }));
    if (toInsert.length) {
      const { error } = await supabase.from("projects").insert(toInsert);
      if (error) throw error;
    }
    console.log(`  ✓ ${toInsert.length} project(s) for ${email}`);
  }

  console.log("Seeding demo inventory...");
  for (const item of INVENTORY) {
    const { data: existing } = await supabase.from("inventory_items").select("id").eq("name", item.name).maybeSingle();
    if (!existing) {
      const { error } = await supabase.from("inventory_items").insert(item);
      if (error) throw error;
    }
  }
  console.log(`  ✓ ${INVENTORY.length} inventory item(s) ensured`);

  console.log("Seeding demo bookings...");
  const { data: items } = await supabase.from("inventory_items").select("id, name");
  const findItem = (name) => items.find((i) => i.name === name)?.id;
  const admin = userByEmail["aarav.mehta@jeevyantra.club"];
  const daysAgo = (n) => new Date(Date.now() - n * 86400000).toISOString();
  const daysFromNow = (n) => new Date(Date.now() + n * 86400000).toISOString();

  const bookings = [
    {
      item_id: findItem("Raspberry Pi 4 (4GB)"),
      user_id: userByEmail["kabir.singh@jeevyantra.club"].id,
      quantity: 1,
      status: "approved",
      assigned_by: admin.id,
      pickup_time: daysAgo(3),
      approved_at: daysAgo(3),
      return_by: daysFromNow(4),
      notes: "Needed for the object-tracking turret demo.",
    },
    {
      item_id: findItem("MG996R Servo Motor"),
      user_id: userByEmail["diya.rao@jeevyantra.club"].id,
      quantity: 3,
      status: "approved",
      assigned_by: admin.id,
      pickup_time: daysAgo(7),
      approved_at: daysAgo(7),
      return_by: daysFromNow(-1),
      notes: "Quadruped leg mechanism testing.",
    },
    {
      item_id: findItem("Soldering Station"),
      user_id: userByEmail["meera.iyer@jeevyantra.club"].id,
      quantity: 1,
      status: "approved",
      assigned_by: admin.id,
      pickup_time: daysAgo(1),
      approved_at: daysAgo(1),
      return_by: daysFromNow(6),
      notes: "PCB rework for the charging dock.",
    },
    {
      item_id: findItem("LiPo Battery 3S 2200mAh"),
      user_id: userByEmail["diya.rao@jeevyantra.club"].id,
      quantity: 2,
      status: "pending",
      notes: "Testing the combat bot drivetrain this weekend.",
    },
    {
      item_id: findItem("Bench Power Supply"),
      user_id: userByEmail["meera.iyer@jeevyantra.club"].id,
      quantity: 1,
      status: "pending",
      notes: "Bring-up testing for the wireless charging dock PCB.",
    },
    {
      item_id: findItem("ESP32 DevKit v1"),
      user_id: userByEmail["aarav.mehta@jeevyantra.club"].id,
      quantity: 2,
      status: "approved",
      assigned_by: admin.id,
      pickup_time: daysAgo(10),
      approved_at: daysAgo(10),
      return_by: daysAgo(3),
      notes: "Swarm coordination framework — ESP-NOW testing.",
    },
    {
      item_id: findItem("HC-SR04 Ultrasonic Sensor"),
      user_id: userByEmail["kabir.singh@jeevyantra.club"].id,
      quantity: 4,
      status: "approved",
      assigned_by: admin.id,
      pickup_time: daysAgo(5),
      approved_at: daysAgo(5),
      return_by: daysFromNow(2),
      notes: "Depth-camera obstacle map bring-up.",
    },
  ];

  for (const b of bookings) {
    const { data: existing } = await supabase
      .from("bookings")
      .select("id")
      .eq("item_id", b.item_id)
      .eq("user_id", b.user_id)
      .maybeSingle();
    if (!existing) {
      const { error } = await supabase.from("bookings").insert(b);
      if (error) throw error;
    }
  }
  console.log(`  ✓ ${bookings.length} booking(s) ensured`);

  const { error: tableCheckError } = await supabase.from("project_requests").select("id").limit(1);
  if (tableCheckError) {
    console.log("Skipping demo project requests — run the project_requests block in supabase/schema.sql first.");
  } else {
    console.log("Seeding demo project requests...");
    const requests = [
      {
        requested_by: userByEmail["meera.iyer@jeevyantra.club"].id,
        title: "Solar-Powered Weather Buoy",
        description: "A floating sensor pod for the campus pond — temperature, pH, and water level over LoRa.",
      },
      {
        requested_by: userByEmail["kabir.singh@jeevyantra.club"].id,
        title: "Voice-Controlled Lab Assistant",
        description: "A desk robot that fetches tools by voice command using a small robotic arm.",
      },
    ];
    for (const r of requests) {
      const { data: existing } = await supabase
        .from("project_requests")
        .select("id")
        .eq("title", r.title)
        .maybeSingle();
      if (!existing) {
        const { error } = await supabase.from("project_requests").insert(r);
        if (error) throw error;
      }
    }
    console.log(`  ✓ ${requests.length} project request(s) ensured`);
  }

  const { error: flagshipCheckError } = await supabase.from("projects").select("is_flagship").limit(1);
  if (flagshipCheckError) {
    console.log("Skipping Venture X — run the updated projects/teams/progress block in supabase/schema.sql first.");
  } else {
    console.log("Seeding Venture X...");
    const admin = userByEmail["aarav.mehta@jeevyantra.club"];
    const team = [
      userByEmail["aarav.mehta@jeevyantra.club"],
      userByEmail["diya.rao@jeevyantra.club"],
      userByEmail["kabir.singh@jeevyantra.club"],
      userByEmail["meera.iyer@jeevyantra.club"],
    ];

    let { data: venture } = await supabase.from("projects").select("id").eq("title", "Venture X").maybeSingle();
    if (!venture) {
      const { data, error } = await supabase
        .from("projects")
        .insert({
          owner_id: admin.id,
          title: "Venture X",
          description:
            "The club's flagship build: a full-size autonomous rover paired with a robotic arm for pick-and-place tasks. Everything else feeds into this.",
          status: "current",
          tags: ["Rover", "Robotic Arm", "Flagship"],
          is_flagship: true,
          progress_admin_only: true,
        })
        .select()
        .single();
      if (error) throw error;
      venture = data;
    }

    for (const member of team) {
      const { data: existing } = await supabase
        .from("project_teams")
        .select("*")
        .eq("project_id", venture.id)
        .eq("user_id", member.id)
        .maybeSingle();
      if (!existing) {
        const { error } = await supabase
          .from("project_teams")
          .insert({ project_id: venture.id, user_id: member.id, added_by: admin.id });
        if (error) throw error;
      }
    }

    const roadmap = [
      { month: "January 2026", title: "Chassis + drivetrain", description: "Welded frame, motor mounts, and wheel selection finalized." },
      { month: "February 2026", title: "Rover navigation stack", description: "IMU + wheel odometry fused, basic waypoint following works indoors." },
      { month: "March 2026", title: "Robotic arm — first pass", description: "3-DOF arm assembled, servo range calibrated, basic pick-up demo." },
      { month: "March 2026", title: "Rover ↔ arm integration", description: "Arm mounted on the rover chassis, wiring and power budget sorted." },
    ];
    for (const r of roadmap) {
      const { data: existing } = await supabase
        .from("project_progress")
        .select("id")
        .eq("project_id", venture.id)
        .eq("title", r.title)
        .maybeSingle();
      if (!existing) {
        const { error } = await supabase
          .from("project_progress")
          .insert({ ...r, project_id: venture.id, created_by: admin.id });
        if (error) throw error;
      }
    }
    console.log(`  ✓ Venture X, ${team.length} teammate(s), ${roadmap.length} roadmap entries ensured`);

    console.log("Seeding progress on a couple of regular projects...");
    const regularProgress = [
      {
        owner: "aarav.mehta@jeevyantra.club",
        projectTitle: "Autonomous Warehouse Bot",
        entries: [
          { month: "January 2026", title: "SLAM prototype", description: "Basic 2D map built from lidar scans in the lab." },
          { month: "February 2026", title: "Path planning", description: "A* planner working on the built map, avoids static obstacles." },
        ],
      },
      {
        owner: "kabir.singh@jeevyantra.club",
        projectTitle: "Object-Tracking Turret",
        entries: [
          { month: "February 2026", title: "Color tracking", description: "OpenCV pipeline locks onto a marker and centers it in frame." },
        ],
      },
    ];
    for (const group of regularProgress) {
      const owner = userByEmail[group.owner];
      const { data: project } = await supabase
        .from("projects")
        .select("id")
        .eq("owner_id", owner.id)
        .eq("title", group.projectTitle)
        .maybeSingle();
      if (!project) continue;
      for (const entry of group.entries) {
        const { data: existing } = await supabase
          .from("project_progress")
          .select("id")
          .eq("project_id", project.id)
          .eq("title", entry.title)
          .maybeSingle();
        if (!existing) {
          const { error } = await supabase
            .from("project_progress")
            .insert({ ...entry, project_id: project.id, created_by: owner.id });
          if (error) throw error;
        }
      }
    }
    console.log("  ✓ Regular project progress ensured");
  }

  console.log("\nDone. Demo login: aarav.mehta@jeevyantra.club / Jeevyantra#2026 (admin)");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
