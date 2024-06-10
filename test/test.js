import { StringReader, CommandDispatcher, literal, argument } from "../main.js";
import { BoolArgumentType } from "../include/ArgumentType.js";
import { EventEmitter } from "node:events";

var t = new StringReader("qwq true true true qaq");

var k = new CommandDispatcher();

var ev = new EventEmitter();
k.setConsumer(ev);
ev.on("oncommandcomplete", (...args) => console.log(args, 9))

var re;

re = k.register(
  literal("qwq")
);

console.log(re)

k.register(literal("qwq").then(
  argument("emmm", new BoolArgumentType())
    .executes((e) => {console.log(e, 9999999);return 1})
      .redirect(re)
)
.then(
  literal("awa")
    .executes((e) => {console.log(e, 88888);return 1})
      //.redirect(re)
)
.then(
  literal("qaq")
    .executes((e) => {console.log(e, 7777);return 1})
      //.redirect(re)
))

console.log(re)
//k.register(new LiteralArgumentBuilder("testfor").then(new LiteralArgumentBuilder("emmm").executes((e)=>console.log(e, 9999999))));
//console.log(k.getRoot().getChild("qwq").getChild("emmm").getRedirect(), 0)
var p = k.parse(t, null)
console.log(p, 1212)
console.log(k.execute(p), 1)