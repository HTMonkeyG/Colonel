/*
MIT License

Copyright (c) Microsoft Corporation. All rights reserved.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/
/* Adapted from Brigadier by HTMonkeyG */

class ArgumentType {
  constructor() { }
  parse(reader) { }
  listSuggestions(context, builder) { return Suggestions.empty() }
  getExamples() { return [] }
}

class BoolArgumentType extends ArgumentType {
  static EXAMPLES = ["true", "false"];

  constructor() { super() }
  static getBool(context, name) { return context.getArgument(name, Boolean.class); }
  parse(reader) { return reader.readBoolean() }

  /*
  listSuggestions(context, builder) {
    if ("true".startsWith(builder.getRemainingLowerCase())) {
      builder.suggest("true");
    }
    if ("false".startsWith(builder.getRemainingLowerCase())) {
      builder.suggest("false");
    }
    return builder.buildFuture();
  }

  getExamples() { return BoolArgumentType.EXAMPLES }*/
}

class IntegerArgumentType extends ArgumentType {
  static EXAMPLES = ["0", "123", "-123"];

  constructor(minimum, maximum) {
    super();
    this.minimum = Math.round(minimum);
    this.maximum = Math.round(maximum);
  }

  static getInteger(context, name) { return context.getArgument(name); }

  getMinimum() { return this.minimum }
  getMaximum() { return this.maximum }

  parse(reader) {
    var start = reader.getCursor()
      , result = reader.readInt();
    if (result < this.minimum) {
      reader.setCursor(start);
      throw CommandSyntaxException.BUILT_IN_EXCEPTIONS.integerTooLow().createWithContext(reader, result, this.minimum);
    }
    if (result > this.maximum) {
      reader.setCursor(start);
      throw CommandSyntaxException.BUILT_IN_EXCEPTIONS.integerTooHigh().createWithContext(reader, result, this.maximum);
    }
    return result;
  }

  getExamples() { return IntegerArgumentType.EXAMPLES }
}

function bool() { return new BoolArgumentType() }
function integer(min, max) { return new IntegerArgumentType(typeof min == 'number' ? -2147483648 : min, typeof max == 'number' ? 2147483647 : max) }

export {
  ArgumentType,
  BoolArgumentType,
  IntegerArgumentType,
  integer,
  bool
};