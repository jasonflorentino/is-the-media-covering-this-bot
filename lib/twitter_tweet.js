const Twitter = require('twitter-lite');
const needle = require('needle');

const client = new Twitter({
  consumer_key: process.env.CONSUMER_KEY,
  consumer_secret: process.env.CONSUMER_SECRET,
  access_token_key: process.env.ACCESS_TOKEN,
  access_token_secret: process.env.ACCESS_TOKEN_SECRET
});

module.exports = {
  handleNewMention,
}

const NEWS_URL = process.env.NEWS_API_URL;
const NEWS_KEY = process.env.NEWS_API_KEY;
const SLICE_LENGTH = process.env.BOT_USERNAME.length + 2;
const TWEET_URL = "https://api.twitter.com/1.1/statuses/update.json"
const PRINTED_QUERY_LENGTH = 25;

async function handleNewMention(tweet) {
  console.log("handle new mention", tweet)

  const tweetId = tweet.data.id;
  // const userId = tweet.data.author_id;
  // const userName = getUsernameFromTweet(tweet);

  const searchQuery = tweet.data.text.slice(SLICE_LENGTH);
  const newsData = await fetchNewsData(searchQuery);

  const status = composeStatusUpdate(searchQuery, newsData);

  postResponseTweet(status, tweetId);
}

async function postResponseTweet(status, tweetId) {
  
  let tweet;
  try {
    tweet = await client.post("statuses/update", {
      status: status,
      in_reply_to_status_id: tweetId,
      auto_populate_reply_metadata: true
    });
  } catch (e) {
    console.log(e);
  }

  console.log("new tweet", tweet);
}

// function getUsernameFromTweet(tweet) {
//   const authorId = tweet.data.author_id;
//   const users = tweet.includes.users;
//   for (const user of   users) {
//     if (user.id === authorId) {
//       return user.userName;
//     }
//   }
//   return null;
// }

async function fetchNewsData(query) {
  const q = `?q=${query}`
  let response;
  try {
    response = await needle('get', NEWS_URL + q, { headers: { api_key: NEWS_KEY } });
  } catch (e) {
    console.log(e);
  }
  if (response) return response.body;
  return null;
}

function composeStatusUpdate(query, news) {
  let output = "";

  const shortq = makeShortQuery(query);
  const googleNewsUrl = `http://news.google.com/?q=${query.replace(/\s/g, "+")}`

  if (!news || !news.total_articles) {
    output += `Either my program broke, or you've got a scoop! Plz contact a human journalist about '${shortq}' You could also see if this turns up anything: ${googleNewsUrl}`
    return output;
  }

  output += `I found ${news.total_articles} articles from the past six months about '${shortq}' I'm sure there's more at ${googleNewsUrl}`
  return output;
}

function makeShortQuery(str) {
  if (str.length <= PRINTED_QUERY_LENGTH) return str;
  return `${str.slice(0, PRINTED_QUERY_LENGTH - 3)}...`;
}

function createParameterString() {
  
}

function createSignatureBase() {

}