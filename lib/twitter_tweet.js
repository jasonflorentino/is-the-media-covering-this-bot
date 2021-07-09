const needle = require('needle');

module.exports = {
  handleNewMention,
}

const NEWS_URL = process.env.NEWS_API_URL;
const NEWS_KEY = process.env.NEWS_API_KEY;

async function handleNewMention(tweet) {
  console.log("handle new mention", tweet)
  const searchQuery = tweet.data.text.slice(16);
  const q = `?q=${searchQuery}`
  let response;
  try {
    response = await needle('get', NEWS_URL + q, { headers: { api_key: NEWS_KEY } });
    postResponseTweet(tweet, response.body);
  } catch (e) {
    console.log(e);
  }
}

async function postResponseTweet(tweet, news) {
  console.log("got news", news)
  return;
}