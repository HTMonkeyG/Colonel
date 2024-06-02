const SYNTAX_ESCAPE = '\\'
  , SYNTAX_DOUBLE_QUOTE = '"'
  , SYNTAX_SINGLE_QUOTE = '\'';

class StringReader {
  constructor(str) {
    this.string = str;
    this.cursor = 0;
  }

  static from(reader) {
    var result = new StringReader(reader.getString());
    result.setCursor(reader.getCursor())
    return result
  }

  getString() { return this.string }
  getCursor() { return this.cursor }
  getRemainingLength() { return string.length - cursor }
  getTotalLength() { return string.length }
  getRead() { return string.substring(0, cursor) }
  getRemaining() { return string.substring(cursor) }


  setCursor(cursor) { this.cursor = cursor }

  canRead(length) { return typeof length == 'number' ? this.cursor + length <= this.string.length : this.cursor + 1 <= this.string.length }

  peek(offset) { return typeof offset == 'number' ? this.string[this.cursor + offset] : this.string[this.cursor] }
  read() { return this.string[this.cursor++] }
  skip() { this.cursor++ }

  isAllowedNumber(c) { return /[0-9.\-]/.test(c) }
  isAllowedInUnquotedString(c) { return /[0-9A-Za-z_\-.+]/.test(c) }
  isWhitespace(c) { return /[\t\n\u000B\f\r\u001C-\u0020\u1680\u180E\u2000-\u2006\u2008-\u200B\u205F\u3000\uFEFF]/.test(c) }
  isQuotedStringStart(c) { return c == SYNTAX_DOUBLE_QUOTE /*|| c == SYNTAX_SINGLE_QUOTE*/ }
  skipWhitespace() { while (this.canRead() && this.isWhitespace(this.peek())) this.skip() }

  readInt() {
    var start = this.cursor;
    while (this.canRead() && this.isAllowedNumber(this.peek()))
      this.skip();
    var number = this.string.substring(start, this.cursor);
    if (!number.length) {
      //throw CommandSyntaxException.BUILT_IN_EXCEPTIONS.readerExpectedInt().createWithContext(this);
    } else {
      var number = Number(number);
      if (Number.isNaN(number) || !Number.isFinite(number) || !Number.isInteger(number)) {
        this.cursor = start;
        //throw CommandSyntaxException.BUILT_IN_EXCEPTIONS.readerInvalidInt().createWithContext(this, number);
      } else return number
    }
  }

  readFloat() {
    var start = this.cursor;
    while (this.canRead() && this.isAllowedNumber(this.peek()))
      this.skip();
    var number = this.string.substring(start, this.cursor);
    if (!number.length) {
      //throw CommandSyntaxException.BUILT_IN_EXCEPTIONS.readerExpectedInt().createWithContext(this);
    } else {
      var number = Number(number);
      if (Number.isNaN(number) || !Number.isFinite(number)) {
        this.cursor = start;
        //throw CommandSyntaxException.BUILT_IN_EXCEPTIONS.readerInvalidInt().createWithContext(this, number);
      } else return number
    }
  }

  readUnquotedString() {
    var start = this.cursor;
    while (this.canRead() && this.isAllowedInUnquotedString(this.peek()))
      this.skip();
    return this.string.substring(start, this.cursor);
  }

  readQuotedString() {
    if (!this.canRead())
      return "";

    var next = this.peek();
    if (!this.isQuotedStringStart(next)) {
      //throw CommandSyntaxException.BUILT_IN_EXCEPTIONS.readerExpectedStartOfQuote().createWithContext(this);
    }
    this.skip();
    return readStringUntil(next);
  }

  readStringUntil(terminator) {
    var result = ""
      , escaped = false;
    while (this.canRead()) {
      var c = this.read();
      if (escaped) {
        if (c == terminator || c == SYNTAX_ESCAPE) {
          result += c;
          escaped = false;
        } else {
          this.setCursor(this.getCursor() - 1);
          //throw CommandSyntaxException.BUILT_IN_EXCEPTIONS.readerInvalidEscape().createWithContext(this, String.valueOf(c));
        }
      } else if (c == SYNTAX_ESCAPE) {
        escaped = true;
      } else if (c == terminator) {
        return result
      } else {
        result += c;
      }
    }
    //throw CommandSyntaxException.BUILT_IN_EXCEPTIONS.readerExpectedEndOfQuote().createWithContext(this);
  }

  readString() {
    if (!this.canRead())
      return "";
    var next = this.peek();
    if (this.isQuotedStringStart(next)) {
      this.skip();
      return this.readStringUntil(next);
    }
    return this.readUnquotedString();
  }

  readBoolean() {
    var start = this.cursor
      , value = readString();
    if (!value.length) {
      //throw CommandSyntaxException.BUILT_IN_EXCEPTIONS.readerExpectedBool().createWithContext(this);
    }

    if (value == "true") {
      return true;
    } else if (value == "false") {
      return false;
    } else {
      this.cursor = start;
      //throw CommandSyntaxException.BUILT_IN_EXCEPTIONS.readerInvalidBool().createWithContext(this, value);
    }
  }

  expect(c) {
    if (!this.canRead() || this.peek() != c) {
      //throw CommandSyntaxException.BUILT_IN_EXCEPTIONS.readerExpectedSymbol().createWithContext(this, String.valueOf(c));
    }
    this.skip();
  }
}

class CommandNode {
  constructor(command) {
    this.command = command;
    this.children = {};
    this.literals = {};
    this.arguments = {};
  }

  getCommand() { return this.command }
  getChildren() { return this.children.values(); }
  getChild(name) { return this.children[name]; }

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
        return this.arguments.values();
      }
    } else {
      return this.arguments.values();
    }
  }
  getName() { }
}

class RootCommandNode extends CommandNode {
  constructor() { super(void 0); }
  getName() { return "" }
  toString() { return "<root>" }
}

class ArgumentCommandNode extends CommandNode {
  constructor(name, type, command) {
    super(command);
    this.name = name;
    this.type = type;
  }
  getType() { return this.type }
  getName() { return this.name }
  toString() { return "<argument " + this.name + ":" + this.type + ">" }
}

class LiteralCommandNode extends CommandNode {
  constructor(literal, command) {
    super(command);
    this.literal = literal;
    this.literalLowerCase = literal.toLocaleLowerCase();
  }
  getLiteral() { return this.literal }
  getName() { return this.literal }
  toString() { return "<literal " + this.literal + ">" }
}

class ArgumentBuilder {
  constructor() {
    this.arguments = new RootCommandNode();
    this.command = void 0;
  }
  getThis() { }
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
    return getThis();
  }
  getArguments() {
    return this.arguments.getChildren();
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
    var result = new LiteralCommandNode(getLiteral(), getCommand());
    for (var argument of this.getArguments()) {
      result.addChild(argument);
    }
    return result;
  }
}

class RequiredArgumentBuilder extends ArgumentBuilder {
  constructor(name, type) {
    this.name = name;
    this.type = type;
  }
  getThis() { return this }
  getType() { return this.type }
  getName() { return this.name }
  build() {
    var result = new ArgumentCommandNode(getName(), getType(), getCommand());
    for (var argument of this.getArguments()) {
      result.addChild(argument);
    }
    return result;
  }
}

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
  execute(input, source) {
  }
}

exports.StringReader = StringReader;