module.exports = {
  toPercentEncodedString
}

function toPercentEncodedString(str) {
  return encodeURIComponent(str)
    .replace(/[!'()*]/g, escape);
}

function escape(c) {
  return '%' + c.charCodeAt(0).toString(16);
}