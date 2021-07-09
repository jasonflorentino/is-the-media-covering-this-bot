module.exports = {
  RULES: [
    {
      value: `@${process.env.BOT_USERNAME} is:reply -from:${process.env.BOT_USERNAME}`,
      tag: "mention",
    },
  ],
  PRINTED_QUERY_LENGTH : 30,
  REPLY_IN_CONVERSATION: false,
  RESET_RULES_ON_STARTUP: false
}