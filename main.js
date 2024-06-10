import { StringRange, StringReader } from "./include/StringReader.js";
import { CommandDispatcher } from "./CommandDispatcher.js";
import { ArgumentBuilder, LiteralArgumentBuilder, RequiredArgumentBuilder } from "./include/ArgumentBuilder.js";
import { ArgumentType, integer, bool, IntegerArgumentType } from "./include/ArgumentType.js";
import { CommandSyntaxException } from "./include/Exceptions.js";

function literal(name) { return new LiteralArgumentBuilder(name) }
function argument(name, type) { return new RequiredArgumentBuilder(name, type) }
var getInteger = IntegerArgumentType.getInteger;
export {
  StringRange,
  StringReader,
  CommandDispatcher,
  ArgumentBuilder,
  literal,
  argument,
  integer,
  getInteger,
  bool,
  ArgumentType,
  CommandSyntaxException
};