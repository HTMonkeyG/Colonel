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

import { RootCommandNode, LiteralCommandNode, ArgumentCommandNode } from "./CommandNode.js";

class ArgumentBuilder {
  constructor() {
    this.arguments = new RootCommandNode();
    this.command = void 0;
    this.requirement = s => true;
    this.target = void 0;
    this.modifier = null;
    this.forks = void 0;
  }
  getThis() { }
  getArguments() { return this.arguments.getChildren() }
  getRequirement() { return this.requirement }
  getCommand() { return this.command }
  getRedirect() { return this.target }
  getRedirectModifier() { return this.modifier }
  isFork() { return this.forks }
  executes(command) {
    this.command = command;
    return this.getThis();
  }
  requires(requirement) {
    this.requirement = requirement;
    return this.getThis();
  }
  redirect(target, modifier) { return this.forward(target, modifier ? modifier : null, false) }
  fork(target, modifier) { return this.forward(target, modifier, true) }
  forward(target, modifier, fork) {
    if (!this.arguments.getChildren().isEmpty()) {
      throw new Error("Cannot forward a node with children");
    }
    this.target = target;
    this.modifier = modifier;
    this.forks = fork;
    return this.getThis();
  }
  build() { }
  then(argument) {
    if (this.target) {
      throw new Error("Cannot add children to a redirected node");
    }
    this.arguments.addChild(argument.build());
    return this.getThis();
  }
  executes(command) {
    this.command = command;
    return this.getThis();
  }
}

class LiteralArgumentBuilder extends ArgumentBuilder {
  constructor(literal) {
    super();
    this.literal = literal;
  }
  getThis() { return this }
  getLiteral() { return this.literal }
  getCommand() { return this.command }
  build() {
    var result = new LiteralCommandNode(this.getLiteral(), this.getCommand(), this.getRequirement(), this.getRedirect());
    for (var argument of this.getArguments()) {
      result.addChild(argument);
    }
    return result;
  }
}

class RequiredArgumentBuilder extends ArgumentBuilder {
  constructor(name, type) {
    super();
    this.name = name;
    this.type = type;
    this.suggestionsProvider = null;
  }
  getThis() { return this }
  getType() { return this.type }
  getName() { return this.name }
  getSuggestionsProvider() {
    return this.suggestionsProvider;
  }
  suggests(provider) {
    this.suggestionsProvider = provider;
    return getThis();
  }
  build() {
    var result = new ArgumentCommandNode(this.getName(), this.getType(), this.getCommand(), this.getRequirement(), this.getRedirect());
    for (var argument of this.getArguments()) {
      result.addChild(argument);
    }
    return result;
  }
}

export { ArgumentBuilder, RequiredArgumentBuilder, LiteralArgumentBuilder };