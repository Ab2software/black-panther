const cron = require("node-cron");
const { processSettlement } = require("../services/settlementService");

let isRunning = false;

cron.schedule("*/1 * * * *", async () => {
  if (isRunning) return;

  isRunning = true;

    console.log("🕒 Settlement cron hit");


  try {
    const eventTypes = [1, 2, 3, 4, 5, 6, 8, 9];

    for (const id of eventTypes) {
      try {
        await processSettlement(id);
      } catch (e) {
        console.log("❌ EventType error:", id, e.message);
      }
    }
  } finally {
    isRunning = false;
  }
});