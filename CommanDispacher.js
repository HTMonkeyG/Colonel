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

import { StringReader } from "./include/StringReader.js";
import { CommandSyntaxException } from "./include/Exceptions.js";
import { RootCommandNode } from "./include/CommandNode.js";
import { CommandContextBuilder, ParseResults, ContextChain } from "./include/Context.js";

const SYNTAX_SINGLE_QUOTE = '\''
  , ARGUMENT_SEPARATOR = ' '
  , USAGE_OPTIONAL_OPEN = "["
  , USAGE_OPTIONAL_CLOSE = "]"
  , USAGE_REQUIRED_OPEN = "("
  , USAGE_REQUIRED_CLOSE = ")"
  , USAGE_OR = "|";

class CommandDispacher {
  constructor(root) {
    if (root) this.root = root;
    else this.root = new RootCommandNode();
  }

  register(command) {
    var build = command.build();
    this.root.addChild(build);
    return build;
  }
  //execute(input, source) {}
  execute(parse) {
    if (parse.getReader().canRead()) {
      if (parse.getExceptions().size == 1) {
        throw parse.getExceptions().values().next().value;
      } else if (parse.getContext().getRange().isEmpty()) {
        throw CommandSyntaxException.BUILT_IN_EXCEPTIONS.dispatcherUnknownCommand().createWithContext(parse.getReader());
      } else {
        throw CommandSyntaxException.BUILT_IN_EXCEPTIONS.dispatcherUnknownArgument().createWithContext(parse.getReader());
      }
    }

    var command = parse.getReader().getString()
      , original = parse.getContext().build(command);

    var flatContext = ContextChain.tryFlatten(original);
    if (!flatContext) {
      //consumer.onCommandComplete(original, false, 0);
      throw CommandSyntaxException.BUILT_IN_EXCEPTIONS.dispatcherUnknownCommand().createWithContext(parse.getReader());
    }

    return flatContext.executeAll(original.getSource(), this.consumer);
  }
  parse(command, source) {
    var context = new CommandContextBuilder(this, source, this.root, command.getCursor());
    return this.parseNodes(this.root, command, context);
  }
  parseNodes(node, originalReader, contextSoFar) {
    var source = contextSoFar.getSource()
      , errors = null
      , potentials = null
      , cursor = originalReader.getCursor();

    for (var child of node.getRelevantNodes(originalReader)) {
      if (!child.canUse(source))
        continue;
      var context = contextSoFar.copy()
        , reader = StringReader.from(originalReader);
      try {
        try {
          child.parse(reader, context);
        } catch (ex) {
          throw CommandSyntaxException.BUILT_IN_EXCEPTIONS.dispatcherParseException().createWithContext(reader, ex.message);
        }
        if (reader.canRead()) {
          if (reader.peek() != ARGUMENT_SEPARATOR) {
            throw CommandSyntaxException.BUILT_IN_EXCEPTIONS.dispatcherExpectedArgumentSeparator().createWithContext(reader);
          }
        }
      } catch (ex) {
        if (errors == null)
          errors = new Map();
        errors.set(child, ex);
        reader.setCursor(cursor);
        continue;
      }

      context.withCommand(child.getCommand());
      if (reader.canRead(child.getRedirect() == null ? 2 : 1)) {
        reader.skip();
        if (child.getRedirect() != null) {
          var childContext = new CommandContextBuilder(this, source, child.getRedirect(), reader.getCursor())
            , parse = this.parseNodes(child.getRedirect(), reader, childContext);
          context.withChild(parse.getContext());
          return new ParseResults(context, parse.getReader(), parse.getExceptions());
        } else {
          var parse = this.parseNodes(child, reader, context);
          if (potentials == null)
            potentials = [];
          potentials.push(parse);
        }
      } else {
        if (potentials == null)
          potentials = [];
        potentials.push(new ParseResults(context, reader, []));
      }
    }

    if (potentials != null) {
      if (potentials.length > 1) {
        potentials.sort((a, b) => {
          if (!a.getReader().canRead() && b.getReader().canRead())
            return -1;
          if (a.getReader().canRead() && !b.getReader().canRead())
            return 1;
          if (a.getExceptions().isEmpty() && !b.getExceptions().isEmpty())
            return -1;
          if (!a.getExceptions().isEmpty() && b.getExceptions().isEmpty())
            return 1;
          return 0;
        });
      }
      return potentials[0];
    }

    return new ParseResults(contextSoFar, originalReader, errors || []);
  }
}

export { CommandDispacher };