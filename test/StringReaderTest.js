import { StringReader, CommandSyntaxException } from "../main.js";

function canRead() {
  var reader = new StringReader("abc");
  console.log("Test canRead():");
  console.assert(reader.canRead() == true);
  reader.skip(); // 'a'
  console.assert(reader.canRead() == true);
  reader.skip(); // 'b'
  console.assert(reader.canRead() == true);
  reader.skip(); // 'c'
  console.assert(reader.canRead() == false);
}
canRead();

function getRemainingLength() {
  var reader = new StringReader("abc");
  console.log("Test getRemainingLength():");
  console.assert(reader.getRemainingLength() == 3);
  reader.setCursor(1);
  console.assert(reader.getRemainingLength() == 2);
  reader.setCursor(2);
  console.assert(reader.getRemainingLength() == 1);
  reader.setCursor(3);
  console.assert(reader.getRemainingLength() == 0);
}
getRemainingLength();

function canRead_length() {
  var reader = new StringReader("abc");
  console.log("Test canRead(length):");
  console.assert(reader.canRead(1) == true);
  console.assert(reader.canRead(2) == true);
  console.assert(reader.canRead(3) == true);
  console.assert(reader.canRead(4) == false);
  console.assert(reader.canRead(5) == false);
}
canRead_length();

function peek() {
  var reader = new StringReader("abc");
  console.log("Test peek():");
  console.assert(reader.peek() == 'a');
  console.assert(reader.getCursor() == 0);
  reader.setCursor(2);
  console.assert(reader.peek() == 'c');
  console.assert(reader.getCursor() == 2);
}
peek();

function peek_length() {
  var reader = new StringReader("abc");
  console.log("Test peek(offset):");
  console.assert(reader.peek(0) == 'a');
  console.assert(reader.peek(2) == 'c');
  console.assert(reader.getCursor() == 0);
  reader.setCursor(1);
  console.assert(reader.peek(1) == 'c');
  console.assert(reader.getCursor() == 1);
}
peek_length();

function read() {
  var reader = new StringReader("abc");
  console.log("Test read():");
  console.assert(reader.read() == 'a');
  console.assert(reader.read() == 'b');
  console.assert(reader.read() == 'c');
  console.assert(reader.getCursor() == 3);
}
read();

function skip() {
  var reader = new StringReader("abc");
  console.log("Test skip():");
  reader.skip();
  console.assert(reader.getCursor() == 1);
}
skip();

function getRemaining() {
  var reader = new StringReader("Hello!");
  console.log("Test getRemaining():");
  console.assert(reader.getRemaining() == "Hello!");
  reader.setCursor(3);
  console.assert(reader.getRemaining() == "lo!");
  reader.setCursor(6);
  console.assert(reader.getRemaining() === "");
}
getRemaining();

function getRead() {
  var reader = new StringReader("Hello!");
  console.log("Test getRead():");
  console.assert(reader.getRead() === "");
  reader.setCursor(3);
  console.assert(reader.getRead() == "Hel");
  reader.setCursor(6);
  console.assert(reader.getRead() == "Hello!");
}
getRead();

function skipWhitespace_none() {
  var reader = new StringReader("Hello!");
  console.log("Test skipWhitespace():");
  reader.skipWhitespace();
  console.assert(reader.getCursor() == 0);
}
skipWhitespace_none();

function skipWhitespace_mixed() {
  var reader = new StringReader(" \t \t\nHello!");
  console.log("Test skipWhitespace() with mixed characters:");
  reader.skipWhitespace();
  console.assert(reader.getCursor() == 5);
}
skipWhitespace_mixed();

function skipWhitespace_empty() {
  var reader = new StringReader("");
  console.log("Test skipWhitespace() with empty string:");
  reader.skipWhitespace();
  console.assert(reader.getCursor() == 0);
}
skipWhitespace_empty();

function readUnquotedString() {
  var reader = new StringReader("hello world");
  console.log("Test readUnquotedString():");
  console.assert(reader.readUnquotedString() == "hello");
  console.assert(reader.getRead() == "hello");
  console.assert(reader.getRemaining() == " world");
}
readUnquotedString();

function readUnquotedString_empty() {
  var reader = new StringReader("");
  console.log("Test readUnquotedString() with empty string:");
  console.assert(reader.readUnquotedString() === "");
  console.assert(reader.getRead() === "");
  console.assert(reader.getRemaining() === "");
}
readUnquotedString_empty();

function readUnquotedString_empty_withRemaining() {
  var reader = new StringReader(" hello world");
  console.log("Test readUnquotedString() with empty start and remaining text:");
  console.assert(reader.readUnquotedString() === "");
  console.assert(reader.getRead() === "");
  console.assert(reader.getRemaining() == " hello world");
}
readUnquotedString_empty_withRemaining();

function readQuotedString() {
  var reader = new StringReader("\"hello world\"");
  console.log("Test readQuotedString():");
  console.assert(reader.readQuotedString() == "hello world");
  console.assert(reader.getRead() == "\"hello world\"");
  console.assert(reader.getRemaining() === "");
}
readQuotedString();

function readSingleQuotedString() {
  var reader = new StringReader("'hello world'");
  console.log("Test readQuotedString() with single quote:");
  console.assert(reader.readQuotedString() == "hello world");
  console.assert(reader.getRead() == "'hello world'");
  console.assert(reader.getRemaining() === "");
}
readSingleQuotedString();

function readMixedQuotedString_doubleInsideSingle() {
  var reader = new StringReader("'hello \"world\"'");
  console.log("Test readQuotedString() with double quote inside single:");
  console.assert(reader.readQuotedString() == "hello \"world\"");
  console.assert(reader.getRead() == "'hello \"world\"'");
  console.assert(reader.getRemaining() === "");
}
readMixedQuotedString_doubleInsideSingle();

function readMixedQuotedString_singleInsideDouble() {
  var reader = new StringReader("\"hello 'world'\"");
  console.log("Test readQuotedString() with single quote inside double:");
  console.assert(reader.readQuotedString() == "hello 'world'");
  console.assert(reader.getRead() == "\"hello 'world'\"");
  console.assert(reader.getRemaining() === "");
}
readMixedQuotedString_singleInsideDouble();

function readQuotedString_empty() {
  var reader = new StringReader("");
  console.log("Test readQuotedString() with empty string:");
  console.assert(reader.readQuotedString() == "");
  console.assert(reader.getRead() == "");
  console.assert(reader.getRemaining() == "");
}
readQuotedString_empty();

function readQuotedString_emptyQuoted() {
  var reader = new StringReader("\"\"");
  console.log("Test readQuotedString() with empty quote:");
  console.assert(reader.readQuotedString() === "");
  console.assert(reader.getRead() == "\"\"");
  console.assert(reader.getRemaining() === "");
}
readQuotedString_emptyQuoted();

function readQuotedString_emptyQuoted_withRemaining() {
  var reader = new StringReader("\"\" hello world");
  console.log("Test readQuotedString() with empty quote and remaining text:");
  console.assert(reader.readQuotedString() === "");
  console.assert(reader.getRead() == "\"\"");
  console.assert(reader.getRemaining() == " hello world");
}
readQuotedString_emptyQuoted_withRemaining();

function readQuotedString_withEscapedQuote() {
  var reader = new StringReader("\"hello \\\"world\\\"\"");
  console.log("Test readQuotedString() with escaped quote:");
  console.assert(reader.readQuotedString() == "hello \"world\"");
  console.assert(reader.getRead() == "\"hello \\\"world\\\"\"");
  console.assert(reader.getRemaining() === "");
}
readQuotedString_withEscapedQuote();

function readQuotedString_withEscapedEscapes() {
  var reader = new StringReader("\"\\\\o/\"");
  console.log("Test readQuotedString() with escaped escapes:");
  console.assert(reader.readQuotedString() == "\\o/");
  console.assert(reader.getRead() == "\"\\\\o/\"");
  console.assert(reader.getRemaining() === "");
}
readQuotedString_withEscapedEscapes();

function readQuotedString_withRemaining() {
  var reader = new StringReader("\"hello world\" foo bar");
  console.log("Test readQuotedString() with remaining text:");
  console.assert(reader.readQuotedString() == "hello world");
  console.assert(reader.getRead() == "\"hello world\"");
  console.assert(reader.getRemaining() == " foo bar");
}
readQuotedString_withRemaining();

function readQuotedString_withImmediateRemaining() {
  var reader = new StringReader("\"hello world\"foo bar");
  console.log("Test readQuotedString() with not separated remaining text:");
  console.assert(reader.readQuotedString() == "hello world");
  console.assert(reader.getRead() == "\"hello world\"");
  console.assert(reader.getRemaining() == "foo bar");
}
readQuotedString_withImmediateRemaining();

function readQuotedString_noOpen() {
  console.log("Test readQuotedString() with no open:");
  try {
    new StringReader("hello world\"").readQuotedString();
  } catch (ex) {
    console.assert(ex.getType() == CommandSyntaxException.BUILT_IN_EXCEPTIONS.readerExpectedStartOfQuote());
    console.assert(ex.getCursor() == 0);
  }
}
readQuotedString_noOpen();

function readQuotedString_noClose() {
  console.log("Test readQuotedString() with no close:");
  try {
    new StringReader("\"hello world").readQuotedString();
  } catch (ex) {
    console.assert(ex.getType() == CommandSyntaxException.BUILT_IN_EXCEPTIONS.readerExpectedEndOfQuote());
    console.assert(ex.getCursor() == 12);
  }
}
readQuotedString_noClose();

function readQuotedString_invalidEscape() {
  console.log("Test readQuotedString() with invalid escape:");
  try {
    new StringReader("\"hello\\nworld\"").readQuotedString();
  } catch (ex) {
    console.assert(ex.getType() == CommandSyntaxException.BUILT_IN_EXCEPTIONS.readerInvalidEscape());
    console.assert(ex.getCursor() == 7);
  }
}
readQuotedString_invalidEscape();

function readQuotedString_invalidQuoteEscape() {
  console.log("Test readQuotedString() with invalid escaped quote:");
  try {
    new StringReader("'hello\\\"\'world").readQuotedString();
  } catch (ex) {
    console.assert(ex.getType() == CommandSyntaxException.BUILT_IN_EXCEPTIONS.readerInvalidEscape());
    console.assert(ex.getCursor() == 7);
  }
}
readQuotedString_invalidQuoteEscape();

function readString_noQuotes() {
  console.log("Test readString() with no quotes:");
  var reader = new StringReader("hello world");
  console.assert(reader.readString() == "hello");
  console.assert(reader.getRead() == "hello");
  console.assert(reader.getRemaining() == " world");
}
readString_noQuotes();

function readString_singleQuotes() {
  console.log("Test readString() with single quotes:");
  var reader = new StringReader("'hello world'");
  console.assert(reader.readString() == "hello world");
  console.assert(reader.getRead() == "'hello world'");
  console.assert(reader.getRemaining() === "");
}
readString_singleQuotes();

function readString_doubleQuotes() {
  console.log("Test readString() with double quotes:");
  var reader = new StringReader("\"hello world\"");
  console.assert(reader.readString() == "hello world");
  console.assert(reader.getRead() == "\"hello world\"");
  console.assert(reader.getRemaining() === "");
}
readString_doubleQuotes();

function readInt() {
  console.log("Test readInt():");
  var reader = new StringReader("1234567890");
  console.assert(reader.readInt() == 1234567890);
  console.assert(reader.getRead() == "1234567890");
  console.assert(reader.getRemaining() === "");
}
readInt();

function readInt_negative() {
  console.log("Test readInt() with negative:");
  var reader = new StringReader("-1234567890");
  console.assert(reader.readInt() == -1234567890);
  console.assert(reader.getRead() == "-1234567890");
  console.assert(reader.getRemaining() === "");
}
readInt_negative();

function readInt_invalid() {
  console.log("Test readInt() with invalid int:");
  try {
    new StringReader("12.34").readInt();
  } catch (ex) {
    console.assert(ex.getType() == CommandSyntaxException.BUILT_IN_EXCEPTIONS.readerInvalidInt());
    console.assert(ex.getCursor() === 0);
  }
}
readInt_invalid();

function readInt_none() {
  console.log("Test readInt() with empty string:");
  try {
    new StringReader("").readInt();
  } catch (ex) {
    console.assert(ex.getType() == CommandSyntaxException.BUILT_IN_EXCEPTIONS.readerExpectedInt());
    console.assert(ex.getCursor() === 0);
  }
}
readInt_none();

function readInt_withRemaining() {
  console.log("Test readInt() with remaining text:");
  var reader = new StringReader("1234567890 foo bar");
  console.assert(reader.readInt() == 1234567890);
  console.assert(reader.getRead() == "1234567890");
  console.assert(reader.getRemaining() == " foo bar");
}
readInt_withRemaining()

function readInt_withRemainingImmediate() {
  var reader = new StringReader("1234567890foo bar");
  console.log("Test readInt() with not separated remaining text:");
  console.assert(reader.readInt() == 1234567890);
  console.assert(reader.getRead() == "1234567890");
  console.assert(reader.getRemaining() == "foo bar");
}
readInt_withRemainingImmediate();

function readFloat() {
  var reader = new StringReader("123");
  console.log("Test readFloat() with integer:");
  console.assert(reader.readFloat() == 123.0);
  console.assert(reader.getRead() == "123");
  console.assert(reader.getRemaining() === "");
}
readFloat();

function readFloat_withDecimal() {
  var reader = new StringReader("12.34");
  console.log("Test readFloat() with decimal:");
  console.assert(reader.readFloat() == 12.34);
  console.assert(reader.getRead() == "12.34");
  console.assert(reader.getRemaining() === "");
}
readFloat_withDecimal();

function readFloat_negative() {
  var reader = new StringReader("-123");
  console.log("Test readFloat() with negative:");
  console.assert(reader.readFloat() == -123.0);
  console.assert(reader.getRead() == "-123");
  console.assert(reader.getRemaining() == "");
}
readFloat_negative();

function readFloat_invalid() {
  console.log("Test readFloat() with invalid:");
  try {
    new StringReader("12.34.56").readFloat();
  } catch (ex) {
    console.assert(ex.getType() == CommandSyntaxException.BUILT_IN_EXCEPTIONS.readerInvalidFloat());
    console.assert(ex.getCursor() === 0);
  }
}
readFloat_invalid();

function readFloat_none() {
  console.log("Test readFloat() with empty string:");
  try {
    new StringReader("").readFloat();
  } catch (ex) {
    console.assert(ex.getType() == CommandSyntaxException.BUILT_IN_EXCEPTIONS.readerExpectedFloat());
    console.assert(ex.getCursor() === 0);
  }
}
readFloat_none();

function readFloat_withRemaining() {
  console.log("Test readFloat() with remaining text:");
  var reader = new StringReader("12.34 foo bar");
  console.assert(reader.readFloat() == 12.34);
  console.assert(reader.getRead() == "12.34");
  console.assert(reader.getRemaining() == " foo bar");
}
readFloat_withRemaining();

function readFloat_withRemainingImmediate() {
  var reader = new StringReader("12.34foo bar");
  console.log("Test readFloat() with not separated remaining text:");
  console.assert(reader.readFloat() == 12.34);
  console.assert(reader.getRead() == "12.34");
  console.assert(reader.getRemaining() == "foo bar");
}
readFloat_withRemainingImmediate();

function expect_correct() {
  var reader = new StringReader("abc");
  console.log("Test expect() with correct text:");
  reader.expect('a');
  console.assert(reader.getCursor() == 1);
}
expect_correct();

function expect_incorrect() {
  var reader = new StringReader("bcd");
  console.log("Test expect() with incorrect text:");
  try {
    reader.expect('a');
  } catch (ex) {
    console.assert(ex.getType() == CommandSyntaxException.BUILT_IN_EXCEPTIONS.readerExpectedSymbol());
    console.assert(ex.getCursor() === 0);
  }
}
expect_incorrect();

function expect_none() {
  var reader = new StringReader("");
  console.log("Test expect() with empty string:");
  try {
    reader.expect('a');
  } catch (ex) {
    console.assert(ex.getType() == CommandSyntaxException.BUILT_IN_EXCEPTIONS.readerExpectedSymbol());
    console.assert(ex.getCursor() === 0);
  }
}
expect_none();

function readBoolean_correct() {
  var reader = new StringReader("true");
  console.log("Test readBoolean() with correct value:");
  console.assert(reader.readBoolean() == true);
  console.assert(reader.getRead() == "true");
}
readBoolean_correct();

function readBoolean_incorrect() {
  var reader = new StringReader("tuesday");
  console.log("Test readBoolean() with incorrect value:");
  try {
    reader.readBoolean();
  } catch (ex) {
    console.assert(ex.getType() == CommandSyntaxException.BUILT_IN_EXCEPTIONS.readerInvalidBool());
    console.assert(ex.getCursor() == 0);
  }
}
readBoolean_incorrect();

function readBoolean_none() {
  var reader = new StringReader("");
  try {
    reader.readBoolean();
  } catch (ex) {
    console.assert(ex.getType() == CommandSyntaxException.BUILT_IN_EXCEPTIONS.readerExpectedBool());
    console.assert(ex.getCursor() === 0);
  }
}
readBoolean_none();