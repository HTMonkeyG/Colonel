import { StringReader } from "../include/StringReader.js";
import { CommandDispacher } from "../CommanDispatcher.js";
import { LiteralArgumentBuilder, RequiredArgumentBuilder } from "../include/ArgumentBuilder.js";
import { BoolArgumentType } from "../include/ArgumentType.js";
import { ContextChain } from "../include/Context.js";
import { EventEmitter } from "node:events";

var t = new StringReader("qwq true");

var k = new CommandDispacher();

var ev = new EventEmitter();
k.setConsumer(ev);
ev.on("oncommandcomplete", (...args) => console.log(args, 9))

k.register(
  (new LiteralArgumentBuilder("qwq")
    .then(
      new RequiredArgumentBuilder("emmm", new BoolArgumentType())
        .executes((e) => console.log(e, 9999999))
    ))
    .then(
      new LiteralArgumentBuilder("awa")
        .executes((e) => console.log(e, 88888))
    )
);
//k.register(new LiteralArgumentBuilder("testfor").then(new LiteralArgumentBuilder("emmm").executes((e)=>console.log(e, 9999999))));
console.log(k, 0)
var p = k.parse(t, null)

console.log(k.execute(p))