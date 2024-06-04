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

import { StringReader, StringRange } from "./StringReader.js";

class SuggestionContext {
  constructor(parent, startPos) {
    this.parent = parent;
    this.startPos = startPos;
  }
}

class ParsedCommandNode {
  constructor(node, range) {
    this.node = node;
    this.range = range;
  }
  getNode() { return this.node }
  getRange() { return this.range }
}

class ParsedArgument {
  constructor(start, end, result) {
    this.range = StringRange.between(start, end);
    this.result = result;
  }
  getRange() { return this.range }
  getResult() { return this.result }
  /*
    equals(final Object o) {
      if (this == o) {
        return true;
      }
      if (!(o instanceof ParsedArgument)) {
        return false;
      }
        final ParsedArgument <?, ?> that = (ParsedArgument <?, ?>) o;
      return Objects.equals(range, that.range) && Objects.equals(result, that.result);
    }*/
}


class CommandContext {
  constructor(source, input, arg, command, rootNode, nodes, range, child, modifier, forks) {
    this.source = source;
    this.input = input;
    this.arguments = arg;
    /** Executable part of command. Will be run only when context is last in chain. */
    this.command = command;
    this.rootNode = rootNode;
    this.nodes = nodes;
    this.range = range;
    this.child = child;
    /** Modifier of source. Will be run only when context has children (i.e. is not last in chain). */
    this.modifier = modifier;
    /**
     * Special modifier for running this context and children.
     * Only relevant if it's not last in chain.
     *
     * Effects:
     * 
     * Exceptions from command or modifier will be ignored
     * 
     * Result of command will be number of elements run by element in chain (instead of sum of command results
     */
    this.forks = forks;
  }

  getRedirectModifier() { return this.modifier }
  getRange() { return this.range }
  getInput() { return this.input }
  getRootNode() { return this.rootNode }
  getNodes() { return this.nodes }
  getChild() { return this.child; }
  getCommand() { return this.command }
  getSource() { return this.source }
  getLastChild() {
    var result = this;
    while (result.getChild() != null)
      result = result.getChild()

    return result;
  }
  hasNodes() { return !this.nodes.length }
  isForked() { return this.forks }

  copyFor(source) {
    if (this.source == source)
      return this;
    return new CommandContext(
      source,
      this.input,
      this.arguments,
      this.command,
      this.rootNode,
      this.nodes,
      this.range,
      this.child,
      this.modifier,
      this.forks
    )
  }

  /*getArgument(name, clazz) {
    var argument = this.arguments[name];
    if (argument == null)
      throw new Error("No such argument '" + name + "' exists on this command");

    var result = argument.getResult();
    if (PRIMITIVE_TO_WRAPPER.getOrDefault(clazz, clazz).isAssignableFrom(result.getClass())) {
      return result;
    } else {
      throw new Error("Argument '" + name + "' is defined as " + result.getClass().getSimpleName() + ", not " + clazz);
    }
  }

  equals(final Object o) {
    if (this == o) return true;
    if (!(o instanceof CommandContext)) return false;

    final CommandContext that = (CommandContext) o;

    if (!arguments.equals(that.arguments)) return false;
    if (!rootNode.equals(that.rootNode)) return false;
    if (nodes.size() != that.nodes.size() || !nodes.equals(that.nodes)) return false;
    if (command != null ? !command.equals(that.command) : that.command != null) return false;
    if (!source.equals(that.source)) return false;
    if (child != null ? !child.equals(that.child) : that.child != null) return false;

    return true;
  }*/
}

class CommandContextBuilder {
  constructor(dispatcher, source, rootNode, start) {
    this.child = null;
    this.rootNode = rootNode;
    this.dispatcher = dispatcher;
    this.source = source;
    this.range = StringRange.at(start);
    this.command = void 0;
    this.arguments = {};
    this.nodes = [];
  }

  getSource() { return this.source }
  getCommand() { return this.command }
  getChild() { return this.child }
  getNodes() { return this.nodes }
  getRootNode() { return this.rootNode }
  getArguments() { return this.arguments }
  getDispatcher() { return this.dispatcher }
  getRange() { return this.range }
  getLastChild() {
    var result = this;
    while (result.getChild() != null)
      result = result.getChild();
    return result;
  }
  withChild(child) {
    this.child = child;
    return this;
  }
  withCommand(command) {
    this.command = command;
    return this;
  }
  withArgument(name, argument) {
    this.arguments[name] = argument;
    return this;
  }
  withSource(source) {
    this.source = source;
    return this;
  }
  withNode(node, range) {
    this.nodes.push(new ParsedCommandNode(node, range));
    this.range = StringRange.encompassing(this.range, range);
    this.modifier = node.getRedirectModifier();
    this.forks = node.isFork();
    return this;
  }
  copy() {
    var copy = new CommandContextBuilder(this.dispatcher, this.source, this.rootNode, this.range.getStart());
    copy.command = this.command;
    for (var key in this.arguments)
      copy.arguments[key] = this.arguments[key];
    for (var ele of this.nodes)
      copy.nodes.push(ele);
    copy.child = this.child;
    copy.range = this.range;
    copy.forks = this.forks;
    return copy;
  }
  build(input) {
    return new CommandContext(
      this.source,
      this.input,
      this.arguments,
      this.command,
      this.rootNode,
      this.nodes,
      this.range,
      this.child == null ? null : this.child.build(input),
      this.modifier,
      this.forks
    );
  }
  findSuggestionContext(cursor) {
    if (this.range.getStart() <= cursor) {
      if (this.range.getEnd() < cursor) {
        if (this.child != null)
          return this.child.findSuggestionContext(cursor);
        else if (this.nodes.length) {
          var last = this.nodes[this.nodes.length - 1];
          return new SuggestionContext(last.getNode(), last.getRange().getEnd() + 1);
        } else
          return new SuggestionContext(this.rootNode, this.range.getStart());
      } else {
        var prev = this.rootNode;
        for (var node of this.nodes) {
          var nodeRange = node.getRange();
          if (nodeRange.getStart() <= cursor && cursor <= nodeRange.getEnd())
            return new SuggestionContext(prev, nodeRange.getStart());
          prev = node.getNode();
        }
        if (prev == null)
          throw new Error("Can't find node before cursor");
        return new SuggestionContext(prev, range.getStart());
      }
    }
    throw new Error("Can't find node before cursor");
  }
}

class ParseResults {
  constructor(context, reader, exceptions) {
    this.context = context;
    this.reader = reader || new StringReader("");
    this.exceptions = exceptions || [];
  }

  getContext() { return this.context }
  getReader() { return this.reader }
  getExceptions() { return this.exceptions }
}

class ContextChain {
  constructor(modifiers, executable) {
    if (executable.getCommand() == null)
      throw new Error("Last command in chain must be executable");
    this.modifiers = modifiers;
    this.executable = executable;
    this.nextStageCache = null;
  }

  static tryFlatten(rootContext) {
    var modifiers = []
      , current = rootContext;

    while (true) {
      var child = current.getChild();
      if (child == null) {
        // Last entry must be executable command
        if (current.getCommand() == null)
          return false
        return new ContextChain(modifiers, current);
      }
      modifiers.push(current);
      current = child;
    }
  }

  static runModifier(modifier, source, resultConsumer, forkedMode) {
    var sourceModifier = modifier.getRedirectModifier();

    // Note: source currently in context is irrelevant at this point, since we might have updated it in one of earlier stages
    if (sourceModifier == null)
      // Simple redirect, just propagate source to next node
      return [source];

    var contextToUse = modifier.copyFor(source);
    try {
      return sourceModifier.call(null, contextToUse);
    } catch (ex) {
      resultConsumer.onCommandComplete(contextToUse, false, 0);
      if (forkedMode)
        return []
      throw ex;
    }
  }

  static runExecutable(executable, source, resultConsumer, forkedMode) {
    var contextToUse = executable.copyFor(source);
    try {
      var result = executable.getCommand()(contextToUse);
      //resultConsumer.onCommandComplete(contextToUse, true, result);
      return forkedMode ? 1 : result;
    } catch (ex) {
      //resultConsumer.onCommandComplete(contextToUse, false, 0);
      if (forkedMode)
        return 0;
      throw ex;
    }
  }

  executeAll(source, resultConsumer) {
    if (!this.modifiers.length)
      // Fast path - just a single stage
      return ContextChain.runExecutable(this.executable, source, resultConsumer, false);

    var forkedMode = false
      , currentSources = [source];

    for (var modifier of this.modifiers) {
      forkedMode |= modifier.isForked();
      var nextSources = [];
      for (var sourceToRun of currentSources)
        nextSources = nextSources.concat(ContextChain.runModifier(modifier, sourceToRun, resultConsumer, forkedMode));
      if (!nextSources.length)
        return 0;
      currentSources = nextSources;
    }

    var result = 0;
    for (var executionSource of currentSources)
      result += ContextChain.runExecutable(this.executable, executionSource, resultConsumer, forkedMode);

    return result;
  }

  getStage() { return !this.modifiers.length ? ContextChain.Stage.EXECUTE : ContextChain.Stage.MODIFY }

  getTopContext() {
    if (!this.modifiers.length)
      return this.executable;
    return this.modifiers[0];
  }

  nextStage() {
    var modifierCount = this.modifiers.length;
    if (modifierCount == 0)
      return null;

    if (nextStageCache == null)
      nextStageCache = new ContextChain(this.modifiers.subarray(1, modifierCount), this.executable);
    return nextStageCache;
  }

  static Stage = {
    MODIFY: 1,
    EXECUTE: 2,
  };
}

export { CommandContext, CommandContextBuilder, ContextChain, ParseResults, ParsedArgument };