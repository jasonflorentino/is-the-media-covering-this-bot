require("dotenv").config();
const twitter_stream = require("./lib/twitter_stream");
const config = require("./lib/config");

async function run() {
  console.log("Starting bot")

  if (config.RESET_RULES_ON_STARTUP) {
    let currentRules;
    try {
      currentRules = await twitter_stream.getAllRules();
      await twitter_stream.deleteAllRules(currentRules);
      await twitter_stream.setRules();
    } catch (e) {
      console.error(e);
      process.exit(1);
    }
  }
  
  twitter_stream.streamConnect(0);
  console.log(`Stream created and listening...`);
}

run();
