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


// Handlers

/**
 * @name handleThreadMention
 * @description Handles the main function of the bot:
 * Pulls text from the tweet body and makes request
 * to API for news data. Then composes a response
 * with the number of articles found, plus a link
 * to Google news using the original query.
 * @param {tweet} Tweet A tweet object from the stream
 */
async function handleThreadMention(tweet) {
  // Use time of tweet to identify all related operations in log
  const timeId = Date.now();
  console.log(`${timeId} Received new thread mention!`, tweet);

  const tweetId = config.REPLY_IN_CONVERSATION ? tweet.data.conversation_id : tweet.data.id;
  const searchQuery = removeMentionsFromText(tweet.data.text, tweet.includes.users, timeId);
  const newsData = await fetchNewsData(searchQuery, timeId);
  const status = composeStatusUpdate(searchQuery, newsData, timeId);
  await postResponseTweet(status, tweetId, timeId);
}

/**
 * @name handleNormalMention
 * @description Handles the case when a user tags the bot
 * outside of a conversation. Simply response with a 
 * thank you message and a note about usage.
 * @param {tweet} Tweet A tweet object from the stream
 */
async function handleNormalMention(tweet) {
  const timeId = Date.now();
  console.log(`${timeId} Received new normal mention!`, tweet);

  const tweetId = tweet.data.id;
  const status = "Thanks for the shout out! If you'd like me to look up some news, @ mention me in a thread!"
  await postResponseTweet(status, tweetId, timeId);
}


// Helpers


/**
 * @name postResponseTweet
 * @description Handles the case when a user tags the bot
 * outside of a conversation. Simply response with a 
 * thank you message and a note about usage.
 * @param {tweet} status A tweet object
 * @param {string} tweetId The ID of the tweet to respond to
 * @param {number} timeId The ID used to collate related logs
 */
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

/**
 * @name removeMentionsFromText
 * @description Removes @ mentions from the input text so that it can be
 * later used as a search query. Users[] comes with the incoming status
 * and contains all users related to it. Any users mentioned in the text
 * will be in this array. Use it to match text to be removed from input.
 * @param {string} text The tweet text to be sanitized
 * @param {Users[]} users An array of Users, anyone mentioned in the text will be inside
 * @param {number} timeId The ID used to collate related logs
 * @returns {string} The input text with @ mentions removed
 */
function removeMentionsFromText(text, users, timeId) {
  console.log(`${timeId} Number of users to check: ${users.length}`)
  for (const user of users) {
    if (text.includes(user.username)) {
      text = text.replace(`@${user.username} `, "")
    }
  }
  return text;
}

/**
 * @name fetchNewsData
 * @description Requests news results from the API based on the given query.
 * @param {string} query The query to search for
 * @param {number} timeId The ID used to collate related logs
 * @returns {object | null} If successful returns news data from API
 */
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

/**
 * @name composeStatusUpdate
 * @description Makes the string for the new tweet. If there are news
 * results it will include the number as a link to google news.
 * Else it will return an error string along with the google news link.
 * @param {string} query The query that was used for the search
 * @param {object} news The results from the API request
 * @param {number} timeId The ID used to collate related logs
 * @returns The string to be used in the outgoing tweet.
 */
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

/**
 * @name makeShortQuery
 * @description Clamps the given string to the number
 * of characters set in the config file. Appends an ellipsis
 * if the string was shortened.
 * @param {string} str String to be shortened
 * @returns The shortened string
 */
function makeShortQuery(str) {
  if (str.length <= config.PRINTED_QUERY_LENGTH) return str;
  return `${str.slice(0, config.PRINTED_QUERY_LENGTH - 1)}…`;
}