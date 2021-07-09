require("dotenv").config();
const twitter_stream = require("./twitter_stream");

async function run() {
  let currentRules;

  try {
    currentRules = await twitter_stream.getAllRules();
    await twitter_stream.deleteAllRules(currentRules);
    await twitter_stream.setRules();
  } catch (e) {
    console.error(e);
    process.exit(1);
  }

  const stream = twitter_stream.streamConnect(0);
  console.log(`Stream created ${stream}`);
}

run();
