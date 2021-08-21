module.exports = {
  // Array of rules for which to capture tweets
  RULES: [
    // 1. @ mentions of the bot in threads that
    // aren't retweets or made by the bot itself.
    // The main way to call the bot. 
    {
      value: `@${process.env.BOT_USERNAME} is:reply -is:retweet -from:${process.env.BOT_USERNAME}`,
      tag: "thread-mention",
    },
    // 2. @ mentions of the bot that aren't in threads
    // (Somebody just tagging the bot)
    {
      value: `@${process.env.BOT_USERNAME} -is:reply -is:retweet -from:${process.env.BOT_USERNAME}`,
      tag: "normal-mention",
    }
  ],
  // Number of chars to clamp the query when
  // printed back in the bot's response tweet.
  PRINTED_QUERY_LENGTH : 30,
  // If true, bot replies in original conversation
  // else it starts a new conversation from the
  // tweet that tagged it.
  REPLY_IN_CONVERSATION: true,
  // If true, resets rules on startup
  // Else establishes connection assuming
  // rules are already in place.
  RESET_RULES_ON_STARTUP: false,
  responses: {
    /** Response if bot is @ mentioned */
    mention: "Thanks for the shout out! If you'd like me to look up some news, @ mention me in a thread!",
    /** Makes response for a failed search for news
     * @param {string} query - The query that was searched for
     * @param {string} url   - The URL where you can try to find results
     */
    newsFailure: function (query, url) {
      return `Either my program broke, or you've got a scoop! Plz contact a human journalist about '${query}' You could also see if this turns up anything: ${url}`;
    },
    /** Makes response for a successful search for news
     * @param {number} num   - The number of results found
     * @param {string} query - The query that was searched for
     * @param {string} url   - The URL where you can try to find more results
     */
    newsSuccess: function (num, query, url) {
      return `I found ${num} articles from the past six months about '${query}' I'm sure there's even more at ${url}`;
    }
  }
}