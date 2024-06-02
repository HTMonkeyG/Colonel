var StringReader = require("../main.js").StringReader;

var t = new StringReader("testfor +a");

console.log(t.readString());
t.skipWhitespace();
console.log(t.readString());