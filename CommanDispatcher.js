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
import { CommandNode, RootCommandNode } from "./include/CommandNode.js";
import { CommandContextBuilder, ParseResults, ContextChain } from "./include/Context.js";
import { ArgumentBuilder, LiteralArgumentBuilder } from "./include/ArgumentBuilder.js";
import { EventEmitter } from 'node:events';

const SYNTAX_SINGLE_QUOTE = '\''
  , ARGUMENT_SEPARATOR = ' '
  , USAGE_OPTIONAL_OPEN = "["
  , USAGE_OPTIONAL_CLOSE = "]"
  , USAGE_REQUIRED_OPEN = "("
  , USAGE_REQUIRED_CLOSE = ")"
  , USAGE_OR = "|";

class CommandDispatcher {
  /**
   * Create a new {@link CommandDispatcher} with the specified root node.
   *
   * This is often useful to copy existing or pre-defined command trees.
   *
   * @param {RootCommandNode} [root] - the existing {@link RootCommandNode} to use as the basis for this tree
   */
  constructor(root) {
    if (root) this.root = root;
    else this.root = new RootCommandNode();
    this.consumer = new EventEmitter();
  }

  /**
   * Sets a callback to be informed of the result of every command.
   *
   * @param {EventEmitter} consumer - the new result consumer to be called
   */
  setConsumer(consumer) { this.consumer = consumer }

  /**
   * Gets the root of this command tree.
   *
   * This is often useful as a target of a {@link ArgumentBuilder.redirect()},
   * {@link CommandDispatcher.getAllUsage()} or {@link CommandDispatcher.getSmartUsage()}.
   * You may also use it to clone the command tree via {@link CommandDispatcher()}.</p>
   *
   * @return {RootCommandNode} root of the command tree
   */
  getRoot() { return this.root }


  /**
   * Utility method for registering new commands.
   *
   * This is a shortcut for calling {@link RootCommandNode.addChild()} after building the provided command.
   *
   * As {@link RootCommandNode} can only hold literals, this method will only allow literal arguments.
   *
   * @param {LiteralArgumentBuilder} command - a literal argument builder to add to this command tree
   * @return {LiteralCommandNode} the node added to this tree
   */
  register(command) {
    var build = command.build();
    this.root.addChild(build);
    return build;
  }

  /**
   * Executes a given pre-parsed command.
   *
   * If this command returns a value, then it successfully executed something. If the execution was a failure,
   * then an exception will be thrown.
   * Most exceptions will be of type {@link CommandSyntaxException}, but it is possible that a {@link Error}
   * may bubble up from the result of a command. The meaning behind the returned result is arbitrary, and will depend
   * entirely on what command was performed.
   *
   * If the command passes through a node that is {@link CommandNode.isFork()} then it will be 'forked'.
   * A forked command will not bubble up any {@link CommandSyntaxException}s, and the 'result' returned will turn into
   * 'amount of successful commands executes'.
   *
   * After each and any command is ran, a registered callback given to {@link CommandDispacher.setConsumer()}
   * will be notified of the result and success of the command. You can use that method to gather more meaningful
   * results than this method will return, especially when a command forks.
   *
   * @param {ParseResults} parse - the result of a successful {@link CommandDispacher.parse()}
   * @return {Number} a numeric result from a "command" that was performed.
   * @throws CommandSyntaxException if the command failed to parse or execute
   * @throws RuntimeException if the command failed to execute and was not handled gracefully
   */
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
      this.consumer.emit('oncommandcomplete', original, false, 0);
      throw CommandSyntaxException.BUILT_IN_EXCEPTIONS.dispatcherUnknownCommand().createWithContext(parse.getReader());
    }

    return flatContext.executeAll(original.getSource(), this.consumer);
  }

  /**
   * Parses a given command.
   *
   * The result of this method can be cached, and it is advised to do so where appropriate. Parsing is often the
   * most expensive step, and this allows you to essentially "precompile" a command if it will be ran often.
   *
   * If the command passes through a node that is {@link CommandNode.isFork()} then the resulting context will be marked as 'forked'.
   * Forked contexts may contain child contexts, which may be modified by the {@link RedirectModifier} attached to the fork.
   *
   * Parsing a command can never fail, you will always be provided with a new {@link ParseResults}.
   * However, that does not mean that it will always parse into a valid command. You should inspect the returned results
   * to check for validity. If its {@link ParseResults.getReader()} {@link StringReader.canRead()} then it did not finish
   * parsing successfully. You can use that position as an indicator to the user where the command stopped being valid.
   * You may inspect {@link ParseResults.getExceptions()} if you know the parse failed, as it will explain why it could
   * not find any valid commands. It may contain multiple exceptions, one for each "potential node" that it could have visited,
   * explaining why it did not go down that node.
   *
   * When you eventually call {@link CommandDispacher.execute(ParseResults)} with the result of this method, the above error checking
   * will occur. You only need to inspect it yourself if you wish to handle that yourself.
   *
   * @param {StringReader|String} command - a command string to parse
   * @param {*} source - a custom "source" object, usually representing the originator of this command
   * @return {ParseResults} the result of parsing this command
   */
  parse(command, source) {
    if (typeof command == 'string') command = new StringReader(command);
    var context = new CommandContextBuilder(this, source, this.root, command.getCursor());

    function parseNodes(node, originalReader, contextSoFar) {
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
              , parse = parseNodes(child.getRedirect(), reader, childContext);
            context.withChild(parse.getContext());
            return new ParseResults(context, parse.getReader(), parse.getExceptions());
          } else {
            var parse = parseNodes(child, reader, context);
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

    return parseNodes(this.root, command, context);
  }
}

export { CommandDispatcher };