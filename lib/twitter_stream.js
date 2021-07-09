// Open a realtime stream of Tweets, filtered according to rules
// Modified from:
// https://developer.twitter.com/en/docs/twitter-api/tweets/filtered-stream/quick-start
const needle = require("needle");
const twitter_tweet = require("./twitter_tweet");
const config = require("./config");

const TOKEN = process.env.BEARER_TOKEN;
const RULES_URL = "https://api.twitter.com/2/tweets/search/stream/rules";
const STREAM_URL = "https://api.twitter.com/2/tweets/search/stream";

module.exports = {
  getAllRules,
  deleteAllRules,
  setRules,
  streamConnect,
};

async function getAllRules() {
  console.log("Getting existing rules")
  const response = await needle("get", RULES_URL, {
    headers: {
      authorization: `Bearer ${TOKEN}`,
    },
  });

  if (response.statusCode !== 200) {
    console.log("Error:", response.statusMessage, response.statusCode);
    throw new Error(response.body);
  }

  return response.body;
}

async function deleteAllRules(rules) {
  console.log("Deleting rules")
  if (!Array.isArray(rules.data)) {
    return null;
  }

  const ids = rules.data.map((rule) => rule.id);

  const data = {
    delete: {
      ids: ids,
    },
  };

  const response = await needle("post", RULES_URL, data, {
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${TOKEN}`,
    },
  });

  if (response.statusCode !== 200) {
    throw new Error(response.body);
  }

  return response.body;
}

async function setRules() {
  console.log("Setting rules")
  const data = {
    add: config.RULES,
  };

  const response = await needle("post", RULES_URL, data, {
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${TOKEN}`,
    },
  });

  if (response.statusCode !== 201) {
    throw new Error(response.body);
  }
  return response.body;
}

function streamConnect(retryAttempt) {
  console.log("Creating stream")
  const query = "?tweet.fields=conversation_id,in_reply_to_user_id&expansions=author_id"
  const stream = needle.get(STREAM_URL + query, {
    headers: {
      "User-Agent": "v2FilterStreamJS",
      Authorization: `Bearer ${TOKEN}`,
    },
    timeout: 20000,
  });

  stream
    .on("data", (data) => {
      console.log("Stream received data")
      try {
        const json = JSON.parse(data);
        twitter_tweet.handleNewMention(json);
        retryAttempt = 0;
      } catch (e) {
        if (
          data.detail ===
          "This stream is currently at the maximum allowed connection limit."
        ) {
          console.log(data.detail);
          process.exit(1);
        } else {
          // Keep alive signal received. Do nothing.
        }
      }
    })
    .on("err", (error) => {
      console.log("Stream received error")
      if (error.code !== "ECONNRESET") {
        console.log(error.code);
        process.exit(1);
      } else {
        setTimeout(() => {
          console.warn("A connection error occurred. Reconnecting...");
          streamConnect(++retryAttempt);
        }, (2 ** retryAttempt) * 1000);
      }
    });

  return stream;
}
