const Twitter = require('twitter-lite');
const needle = require('needle');
const config = require('./config');

const client = new Twitter({
  consumer_key: process.env.CONSUMER_KEY,
  consumer_secret: process.env.CONSUMER_SECRET,
  access_token_key: process.env.ACCESS_TOKEN,
  access_token_secret: process.env.ACCESS_TOKEN_SECRET
});

module.exports = {
  handleThreadMention,
  handleNormalMention
}

// Global vars
const NEWS_URL = process.env.NEWS_API_URL;
const NEWS_KEY = process.env.NEWS_API_KEY;

async function handleThreadMention(tweet) {
  const timeId = Date.now();
  console.log(`${timeId} Received new thread mention!`, tweet);

  const tweetId = config.REPLY_IN_CONVERSATION ? tweet.data.conversation_id : tweet.data.id;
  const searchQuery = removeMentionsFromtText(tweet.data.text, tweet.includes.users, timeId);
  const newsData = await fetchNewsData(searchQuery, timeId);
  const status = composeStatusUpdate(searchQuery, newsData, timeId);
  await postResponseTweet(status, tweetId, timeId);
}

async function handleNormalMention(tweet) {
  const timeId = Date.now();
  console.log(`${timeId} Received new normal mention!`, tweet);

  const tweetId = tweet.data.id;
  const status = "Thanks for the shout out! If you'd like me to look up some news, @ mention me in a thread!"
  await postResponseTweet(status, tweetId, timeId);
}

// Helper Functions

async function postResponseTweet(status, tweetId, timeId) {
  let tweet;
  try {
    tweet = await client.post("statuses/update", {
      status: status,
      in_reply_to_status_id: tweetId,
      auto_populate_reply_metadata: true
    });
  } catch (e) {
    console.log(`${timeId} --ERROR WITH TWEET POST--`, e);
  }

  if (tweet.id) console.log(`${timeId} New tweet created with ID ${tweet.id}: ${tweet.text}`);
  else console.log(`${timeId} Can't log tweet! An error may have occurred when trying to post.`);
}

function removeMentionsFromtText(text, users, timeId) {
  console.log(`${timeId} Number of users to check: ${users.length}`)
  for (const user of users) {
    if (text.includes(user.username)) {
      text = text.replace(`@${user.username} `, "")
    }
  }
  return text;
}

async function fetchNewsData(query, timeId) {
  console.log(`${timeId} Fetching news data for '${query}'`);
  const q = `?q=${query}`
  let response;
  try {
    response = await needle('get', NEWS_URL + q, { headers: { api_key: NEWS_KEY } });
  } catch (e) {
    console.log("${timeId} --ERROR WITH REQUEST--", e);
    return null;
  }

  if (response.statusCode === 200) return response.body;
  console.log("${timeId} --BAD STATUS RESPONSE--", response);
  return null;
}

function composeStatusUpdate(query, news, timeId) {
  console.log(`${timeId} Composing status update`)
  let output = "";

  const shortq = makeShortQuery(query);
  const googleNewsUrl = `http://news.google.com/?q=${query.replace(/\s/g, "+")}`

  if (!news || !news.total_articles) {
    output += `Either my program broke, or you've got a scoop! Plz contact a human journalist about '${shortq}' You could also see if this turns up anything: ${googleNewsUrl}`
    return output;
  }

  output += `I found ${news.total_articles} articles from the past six months about '${shortq}' I'm sure there's even more at ${googleNewsUrl}`
  return output;
}

function makeShortQuery(str) {
  if (str.length <= config.PRINTED_QUERY_LENGTH) return str;
  return `${str.slice(0, config.PRINTED_QUERY_LENGTH - 3)}...`;
}