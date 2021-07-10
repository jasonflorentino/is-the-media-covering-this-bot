module.exports = {
  RULES: [
    {
      value: `@${process.env.BOT_USERNAME} is:reply -is:retweet -from:${process.env.BOT_USERNAME}`,
      tag: "thread-mention",
    },
    {
      value: `@${process.env.BOT_USERNAME} -is:reply -is:retweet -from:${process.env.BOT_USERNAME}`,
      tag: "normal-mention",
    }
  ],
  PRINTED_QUERY_LENGTH : 30,
  REPLY_IN_CONVERSATION: false,
  RESET_RULES_ON_STARTUP: true
}