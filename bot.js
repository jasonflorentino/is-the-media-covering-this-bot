require("dotenv").config();
const twitter_stream = require("./lib/twitter.stream");
const config = require("./lib/config");

/**
 * @name main
 * @description The main driver for the bot.
 * Will first conditionally reset any filtered stream 
 * rules, before establishing a new infinite stream
 * connection. Any actions taken are in response to 
 * matched tweets captured while listening.
 */
async function main() {
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

main();
