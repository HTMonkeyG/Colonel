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

import { StringRange } from "./StringReader.js";
import { CommandSyntaxException } from "./Exceptions.js";
import { ParsedArgument } from "./Context.js";

class CommandNode {
  constructor(command, requirement, redirect, modifier, forks) {
    this.command = command;
    this.requirement = requirement;
    this.redirect = redirect;
    this.modifier = modifier;
    this.forks = forks;
    this.children = {};
    this.literals = {};
    this.arguments = {};
  }

  getCommand() { return this.command }
  getChildren() { return Object.values(this.children) }
  getChild(name) { return this.children[name] }
  getRedirect() { return this.redirect }
  getRedirectModifier() { return this.modifier }
  getRequirement() { return this.requirement }

  isFork() { return this.forks }
  canUse(source) { return this.requirement(source) }

  addChild(node) {
    if (node instanceof RootCommandNode) {
      throw new Error("Cannot add a RootCommandNode as a child to any other CommandNode");
    }
    var child = this.children[node.getName()];
    if (child) {
      // We've found something to merge onto
      if (node.getCommand()) {
        child.command = node.getCommand();
      }
      for (var grandchild of node.getChildren()) {
        child.addChild(grandchild);
      }
    } else {
      this.children[node.getName()] = node;
      if (node instanceof LiteralCommandNode) {
        this.literals[node.getName()] = node;
      } else if (node instanceof ArgumentCommandNode) {
        this.arguments[node.getName()] = node;
      }
    }
  }

  getRelevantNodes(input) {
    if (Object.keys(this.literals).length > 0) {
      var cursor = input.getCursor();
      while (input.canRead() && input.peek() != ' ')
        input.skip();

      var text = input.getString().substring(cursor, input.getCursor());
      input.setCursor(cursor);
      var literal = this.literals[text];
      if (literal != null) {
        return [literal];
      } else {
        return Object.values(this.arguments);
      }
    } else {
      return Object.values(this.arguments);
    }
  }

  equals(o) {
    if (this == o) return true;
    if (!(o instanceof CommandNode)) return false;
    if (!this.children.equals(o.children)) return false;
    if (this.command != null ? this.command != o.command : o.command != null) return false;
    return true;
  }
  getName() { }
  parse() { }
}

class RootCommandNode extends CommandNode {
  constructor() { super(void 0, c => true, void 0, s => [s.getSource()], false); }
  getName() { return "" }
  toString() { return "<root>" }
  equals(o) {
    if (this == o) return true;
    if (!(o instanceof RootCommandNode)) return false;
    return super.equals(o);
  }
}

class ArgumentCommandNode extends CommandNode {
  constructor(name, type, command, requirement, redirect, modifier, forks) {
    super(command, requirement, redirect, modifier, forks);
    this.name = name;
    this.type = type;
  }
  getType() { return this.type }
  getName() { return this.name }
  toString() { return "<argument " + this.name + ":" + this.type + ">" }

  parse(reader, contextBuilder) {
    var start = reader.getCursor()
      , result = this.type.parse(reader)
      , parsed = new ParsedArgument(start, reader.getCursor(), result);

    contextBuilder.withArgument(this.name, parsed);
    contextBuilder.withNode(this, parsed.getRange());
  }

  equals(o) {
    if (this == o) return true;
    if (!(o instanceof ArgumentCommandNode)) return false;
    if (!this.name.equals(o.name)) return false;
    if (!this.type.equals(o.type)) return false;
    return super.equals(o);
  }
}

class LiteralCommandNode extends CommandNode {
  constructor(literal, command, requirement, redirect, modifier, forks) {
    super(command, requirement, redirect, modifier, forks);
    this.literal = literal;
    this.literalLowerCase = literal.toLocaleLowerCase();
  }
  getLiteral() { return this.literal }
  getName() { return this.literal }
  toString() { return "<literal " + this.literal + ">" }

  parse(reader, contextBuilder) {
    function parse_(reader) {
      var start = reader.getCursor();
      if (reader.canRead(this.literal.length)) {
        var end = start + this.literal.length;
        if (reader.getString().substring(start, end) == this.literal) {
          reader.setCursor(end);
          if (!reader.canRead() || reader.peek() == ' ') {
            return end;
          } else {
            reader.setCursor(start);
          }
        }
      }
      return -1;
    }
    var start = reader.getCursor()
      , end = parse_.call(this, reader);
    if (end > -1) {
      contextBuilder.withNode(this, StringRange.between(start, end));
      return;
    }

    throw CommandSyntaxException.BUILT_IN_EXCEPTIONS.literalIncorrect().createWithContext(reader, literal);
  }

  equals(o) {
    if (this == o) return true;
    if (!(o instanceof LiteralCommandNode)) return false;
    if (!this.literal.equals(o.literal)) return false;
    return super.equals(o);
  }
}

export {
  CommandNode,
  ArgumentCommandNode,
  LiteralCommandNode,
  RootCommandNode
};