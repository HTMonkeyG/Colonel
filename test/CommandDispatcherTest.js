import {
  CommandDispatcher,
  StringReader,
  literal,
  argument,
  integer,
  CommandSyntaxException,
  getInteger
} from "../main.js";

var subject, source = {}, command = () => (commandExecuted++, 114514), commandExecuted = 0;

function setUp() {
  source = {};
  commandExecuted = 0;
  subject = new CommandDispatcher();
}

function inputWithOffset(input, offset) {
  var result = new StringReader(input);
  result.setCursor(offset);
  return result;
}

/* Tests */
function testCreateAndExecuteCommand() {
  console.log("Test create and execute command:");
  subject.register(literal("foo").executes(command));

  console.assert(subject.execute("foo", source) == 114514);
  console.assert(commandExecuted);
}
setUp();
testCreateAndExecuteCommand();

function testCreateAndExecuteOffsetCommand() {
  console.log("Test create and execute offset command:");
  subject.register(literal("foo").executes(command));

  console.assert(subject.execute(inputWithOffset("/foo", 1), source) == 114514);
  console.assert(commandExecuted);
}
setUp();
testCreateAndExecuteOffsetCommand();

function testCreateAndMergeCommands() {
  console.log("Test create and merge commands:");
  subject.register(literal("base").then(literal("foo").executes(command)));
  subject.register(literal("base").then(literal("bar").executes(command)));

  console.assert(subject.execute("base foo", source) == 114514);
  console.assert(subject.execute("base bar", source) == 114514);
  console.assert(commandExecuted == 2);
}
setUp();
testCreateAndMergeCommands();

function testExecuteUnknownCommand() {
  console.log("Test execute unknown command:");
  subject.register(literal("bar"));
  subject.register(literal("baz"));

  try {
    subject.execute("foo", source);
  } catch (ex) {
    console.assert(ex.getType() == CommandSyntaxException.BUILT_IN_EXCEPTIONS.dispatcherUnknownCommand());
    console.assert(ex.getCursor() === 0);
  }
}
setUp();
testExecuteUnknownCommand();

function testExecuteImpermissibleCommand() {
  console.log("Test execute impermissible command:");
  subject.register(literal("foo").requires(s => false));

  try {
    subject.execute("foo", source);
  } catch (ex) {
    console.assert(ex.getType() == CommandSyntaxException.BUILT_IN_EXCEPTIONS.dispatcherUnknownCommand());
    console.assert(ex.getCursor() === 0);
  }
}
setUp();
testExecuteImpermissibleCommand()

function testExecuteEmptyCommand() {
  console.log("Test execute empty command:");
  subject.register(literal(""));

  try {
    subject.execute("", source);
  } catch (ex) {
    console.assert(ex.getType() == CommandSyntaxException.BUILT_IN_EXCEPTIONS.dispatcherUnknownCommand());
    console.assert(ex.getCursor() === 0);
  }
}
setUp();
testExecuteEmptyCommand();

function testExecuteUnknownSubcommand() {
  console.log("Test execute unknown subcommand:");
  subject.register(literal("foo").executes(command));

  try {
    subject.execute("foo bar", source);
  } catch (ex) {
    console.assert(ex.getType() == CommandSyntaxException.BUILT_IN_EXCEPTIONS.dispatcherUnknownArgument());
    console.assert(ex.getCursor() == 4);
  }
}
setUp();
testExecuteUnknownSubcommand();

function testExecuteIncorrectLiteral() {
  console.log("Test execute incorrect literal:");
  subject.register(literal("foo").executes(command).then(literal("bar")));

  try {
    subject.execute("foo baz", source);
  } catch (ex) {
    console.assert(ex.getType() == CommandSyntaxException.BUILT_IN_EXCEPTIONS.dispatcherUnknownArgument());
    console.assert(ex.getCursor() == 4);
  }
}
setUp();
testExecuteIncorrectLiteral();

function testExecuteAmbiguousIncorrectArgument() {
  console.log("Test execute ambiguous incorrect argument:");
  subject.register(
    literal("foo").executes(command)
      .then(literal("bar"))
      .then(literal("baz"))
  );

  try {
    subject.execute("foo unknown", source);
  } catch (ex) {
    console.assert(ex.getType() == CommandSyntaxException.BUILT_IN_EXCEPTIONS.dispatcherUnknownArgument());
    console.assert(ex.getCursor() == 4);
  }
}
setUp();
testExecuteAmbiguousIncorrectArgument();

function testExecuteSubcommand() {
  console.log("Test execute subcommand:");
  var subCommand = c => 100;

  subject.register(literal("foo").then(
    literal("a")
  ).then(
    literal("=").executes(subCommand)
  ).then(
    literal("c")
  ).executes(command));

  console.assert(subject.execute("foo =", source) == 100);
}
setUp();
testExecuteSubcommand();

function testParseIncompleteLiteral() {
  console.log("Test parse incomplete literal:");
  subject.register(literal("foo").then(literal("bar").executes(command)));

  var parse = subject.parse("foo ", source);
  console.assert(parse.getReader().getRemaining() == " ");
  console.assert(parse.getContext().getNodes().length == 1);
}
setUp();
testParseIncompleteLiteral();

function testParseIncompleteArgument() {
  console.log("Test parse incomplete argument:");
  subject.register(literal("foo").then(argument("bar", integer()).executes(command)));

  var parse = subject.parse("foo ", source);
  console.assert(parse.getReader().getRemaining() == " ");
  console.assert(parse.getContext().getNodes().length == 1);
}
setUp();
testParseIncompleteArgument();

function testExecuteAmbiguiousParentSubcommand() {
  console.log("Test execute ambiguious parent subcommand:");
  var subCommand = c => 100;

  subject.register(
    literal("test")
      .then(
        argument("incorrect", integer())
          .executes(command)
      )
      .then(
        argument("right", integer())
          .then(
            argument("sub", integer())
              .executes(subCommand)
          )
      )
  );

  console.assert(subject.execute("test 1 2", source) == 100);
  console.assert(!commandExecuted);
}
setUp();
testExecuteAmbiguiousParentSubcommand();

function testExecuteAmbiguiousParentSubcommandViaRedirect() {
  console.log("Test execute ambiguious parent subcommand via redirect:");
  var subCommand = c => 100;

  var real = subject.register(
    literal("test")
      .then(
        argument("incorrect", integer())
          .executes(command)
      )
      .then(
        argument("right", integer())
          .then(
            argument("sub", integer())
              .executes(subCommand)
          )
      )
  );

  subject.register(literal("redirect").redirect(real));

  console.assert(subject.execute("redirect 1 2", source) == 100);
  console.assert(!commandExecuted);
}
setUp();
testExecuteAmbiguiousParentSubcommandViaRedirect();

function testExecuteRedirectedMultipleTimes() {
  console.log("Test execute redirected multiple times:");
  var concreteNode = subject.register(literal("actual").executes(command));
  var redirectNode = subject.register(literal("redirected").redirect(subject.getRoot()));

  var input = "redirected redirected actual";

  var parse = subject.parse(input, source);
  console.assert(parse.getContext().getRange().get(input) == "redirected");
  console.assert(parse.getContext().getNodes().length == 1);
  console.assert(parse.getContext().getRootNode() == subject.getRoot());
  console.assert(parse.getContext().getNodes()[0].getRange().equals(parse.getContext().getRange()));
  console.assert(parse.getContext().getNodes()[0].getNode() == redirectNode);

  var child1 = parse.getContext().getChild();
  console.assert(child1 != null);
  console.assert(child1.getRange().get(input) == "redirected");
  console.assert(child1.getNodes().length == 1);
  console.assert(child1.getRootNode() == subject.getRoot());
  console.assert(child1.getNodes()[0].getRange().equals(child1.getRange()));
  console.assert(child1.getNodes()[0].getNode() == redirectNode);

  var child2 = child1.getChild();
  console.assert(child2 != null);
  console.assert(child2.getRange().get(input) == "actual");
  console.assert(child2.getNodes().length == 1);
  console.assert(child2.getRootNode() == subject.getRoot());
  console.assert(child2.getNodes()[0].getRange().equals(child2.getRange()));
  console.assert(child2.getNodes()[0].getNode() == concreteNode);

  console.assert(subject.execute(parse) == 114514);
  console.assert(commandExecuted);
}
setUp();
testExecuteRedirectedMultipleTimes();

function testCorrectExecuteContextAfterRedirect() {
  console.log("Test correct execute context after redirect:");
  var root = subject.getRoot()
    , add = literal("add")
    , blank = literal("blank")
    , addArg = argument("value", integer())
    , run = literal("run");

  subject.register(add.then(addArg.redirect(root, c => c.getSource() + getInteger(c, "value"))));
  subject.register(blank.redirect(root));
  subject.register(run.executes(c => c.getSource()));

  console.assert(subject.execute("run", 0) == 0);
  console.assert(subject.execute("run", 1) == 1);

  console.assert(subject.execute("add 5 run", 1) == 1 + 5);
  console.assert(subject.execute("add 5 add 6 run", 2) == 2 + 5 + 6);
  console.assert(subject.execute("add 5 blank run", 1) == 1 + 5);
  console.assert(subject.execute("blank add 5 run", 1) == 1 + 5);
  console.assert(subject.execute("add 5 blank add 6 run", 2) == 2 + 5 + 6);
  console.assert(subject.execute("add 5 blank blank add 6 run", 2) == 2 + 5 + 6);
}
setUp();
testCorrectExecuteContextAfterRedirect();

function testSharedRedirectAndExecuteNodes() {
  console.log("Test shared redirect and execute nodes:");
  var root = subject.getRoot()
    , add = literal("add")
    , addArg = argument("value", integer());

  subject.register(add.then(
    addArg
      .redirect(root, c => c.getSource() + getInteger(c, "value"))
      .executes(c => c.getSource())
  ));

  console.assert(subject.execute("add 5", 1) == 1);
  console.assert(subject.execute("add 5 add 6", 1) == 1 + 5);
}
setUp();
testSharedRedirectAndExecuteNodes();

function testExecuteRedirected() {
  console.log("Test execute redirected:");
  var modifier = (c) => { if (c.source && c.source == source) return [source1, source2] }
    , source1 = {}
    , source2 = {};

  var concreteNode = subject.register(literal("actual").executes(command))
    , redirectNode = subject.register(literal("redirected").fork(subject.getRoot(), modifier));

  var input = "redirected actual";
  var parse = subject.parse(input, source);
  console.assert(parse.getContext().getRange().get(input) == "redirected");
  console.assert(parse.getContext().getNodes().length == 1);
  console.assert(parse.getContext().getRootNode().equals(subject.getRoot()));
  console.assert(parse.getContext().getNodes()[0].getRange().equals(parse.getContext().getRange()));
  console.assert(parse.getContext().getNodes()[0].getNode() == redirectNode);
  console.assert(parse.getContext().getSource() == source);

  var parent = parse.getContext().getChild();
  console.assert(parent != null);
  console.assert(parent.getRange().get(input) == "actual");
  console.assert(parent.getNodes().length == 1);
  console.assert(parse.getContext().getRootNode().equals(subject.getRoot()));
  console.assert(parent.getNodes()[0].getRange().equals(parent.getRange()));
  console.assert(parent.getNodes()[0].getNode() == concreteNode);
  console.assert(parent.getSource() == source);

  console.assert(subject.execute(parse) == 2);
}
setUp();
testExecuteRedirected();

function testIncompleteRedirectShouldThrow() {
  console.log("Test incomplete redirect should throw:");
  var foo = subject.register(literal("foo")
    .then(literal("bar")
      .then(argument("value", integer()).executes(context => IntegerArgumentType.getInteger(context, "value"))))
    .then(literal("awa").executes(context => 2)));
  subject.register(literal("baz").redirect(foo));
  try {
    subject.execute("baz bar", source);
    console.assert(false, "Should have thrown an exception");
  } catch (e) {
    console.assert(e.getType() == CommandSyntaxException.BUILT_IN_EXCEPTIONS.dispatcherUnknownCommand());
  }
}
setUp();
testIncompleteRedirectShouldThrow();

function testRedirectModifierEmptyResult() {
  console.log("Test redirect modifier with empty result:");
  var foo = subject.register(literal("foo")
    .then(literal("bar")
      .then(argument("value", integer()).executes(context => IntegerArgumentType.getInteger(context, "value"))))
    .then(literal("awa").executes(context => 2)));
  var emptyModifier = context => [];
  subject.register(literal("baz").fork(foo, emptyModifier));
  var result = subject.execute("baz bar 100", source);
  console.assert(result == 0); // No commands executed, so result is 0
}
setUp();
testRedirectModifierEmptyResult();


function testExecuteOrphanedSubcommand() {
  console.log("Test execute orphaned subcommand:");
  subject.register(literal("foo").then(
    argument("bar", integer())
  ).executes(command));

  try {
    subject.execute("foo 5", source);
  } catch (ex) {
    console.assert(ex.getType() == CommandSyntaxException.BUILT_IN_EXCEPTIONS.dispatcherUnknownCommand());
    console.assert(ex.getCursor() == 5);
  }
}
setUp();
testExecuteOrphanedSubcommand();

function testExecute_invalidOther() {
  console.log("Test execute invalid other:");
  var wrongCommandExecuted = false, wrongCommand = a => wrongCommandExecutes = true;
  subject.register(literal("w").executes(wrongCommand));
  subject.register(literal("world").executes(command));

  console.assert(subject.execute("world", source) == 114514);
  console.assert(!wrongCommandExecuted);
  console.assert(commandExecuted);
}
setUp();
testExecute_invalidOther();

function parse_noSpaceSeparator() {
  console.log("Test parse no space separator:");
  subject.register(literal("foo").then(argument("bar", integer()).executes(command)));

  try {
    subject.execute("foo$", source);
  } catch (ex) {
    console.assert(ex.getType() == CommandSyntaxException.BUILT_IN_EXCEPTIONS.dispatcherUnknownCommand());
    console.assert(ex.getCursor() == 0);
  }
}
setUp();
parse_noSpaceSeparator();

function testExecuteInvalidSubcommand() {
  console.log("Test execute invalid subcommand");
  subject.register(literal("foo").then(
    argument("bar", integer())
  ).executes(command));

  try {
    subject.execute("foo bar", source);
  } catch (ex) {
    console.assert(ex.getType() == CommandSyntaxException.BUILT_IN_EXCEPTIONS.readerExpectedInt());
    console.assert(ex.getCursor() == 4);
  }
}
setUp();
testExecuteInvalidSubcommand();

function testGetPath() {
  console.log("Test getPath():");
  var bar = literal("bar").build();
  subject.register(literal("foo").then(bar));

  var equ = true;
  subject.getPath(bar).forEach((ele, ind) => {
    ele != ["foo", "bar"][ind] && (equ = false)
  });
}
setUp();
testGetPath();

function testFindNodeExists() {
  console.log("Test findNode() with exist node:");
  var bar = literal("bar").build();
  subject.register(literal("foo").then(bar));

  console.assert(subject.findNode(["foo", "bar"]) == bar);
}
setUp();
testFindNodeExists();

function testFindNodeDoesntExist() {
  console.log("Test findNode() with non exist node:");
  console.assert(subject.findNode("foo", "bar") == null);
}
setUp();
testFindNodeDoesntExist();
/*
function testResultConsumerInNonErrorRun() {
  subject.setConsumer(consumer);

  subject.register(literal("foo").executes(command));
  when(command.run(any())).thenReturn(5);

  console.assert(subject.execute("foo", source) == 5));
  verify(consumer).onCommandComplete(any(), eq(true), eq(5));
  verifyNoMoreInteractions(consumer);
}

function testResultConsumerInForkedNonErrorRun() {
  subject.setConsumer(consumer);

  subject.register(literal("foo").executes(c -> (Integer)(c.getSource())));
 final Object[] contexts = new Object[] { 9, 10, 11 };

  subject.register(literal("repeat").fork(subject.getRoot(), context -> Arrays.asList(contexts)));

  console.assert(subject.execute("repeat foo", source) == contexts.length));
  verify(consumer).onCommandComplete(argThat(contextSourceMatches(contexts[0])), eq(true), eq(9));
  verify(consumer).onCommandComplete(argThat(contextSourceMatches(contexts[1])), eq(true), eq(10));
  verify(consumer).onCommandComplete(argThat(contextSourceMatches(contexts[2])), eq(true), eq(11));
  verifyNoMoreInteractions(consumer);
}

function testExceptionInNonForkedCommand() {
  subject.setConsumer(consumer);
  subject.register(literal("crash").executes(command));
  exception = CommandSyntaxException.BUILT_IN_EXCEPTIONS.readerExpectedBool().create();
  when(command.run(any())).thenThrow(exception);

  try {
    subject.execute("crash", source);
  } catch (ex) {
    console.assert(ex == exception));
  }

  verify(consumer).onCommandComplete(any(), eq(false), eq(0));
  verifyNoMoreInteractions(consumer);
}

function testExceptionInNonForkedRedirectedCommand() {
  subject.setConsumer(consumer);
  subject.register(literal("crash").executes(command));
  subject.register(literal("redirect").redirect(subject.getRoot()));

  exception = CommandSyntaxException.BUILT_IN_EXCEPTIONS.readerExpectedBool().create();
  when(command.run(any())).thenThrow(exception);

  try {
    subject.execute("redirect crash", source);
  } catch (ex) {
    console.assert(ex == exception));
  }

  verify(consumer).onCommandComplete(any(), eq(false), eq(0));
  verifyNoMoreInteractions(consumer);
}

function testExceptionInForkedRedirectedCommand() {
  subject.setConsumer(consumer);
  subject.register(literal("crash").executes(command));
  subject.register(literal("redirect").fork(subject.getRoot(), Collections:: singleton));

  exception = CommandSyntaxException.BUILT_IN_EXCEPTIONS.readerExpectedBool().create();
  when(command.run(any())).thenThrow(exception);

  console.assert(subject.execute("redirect crash", source) == 0));
  verify(consumer).onCommandComplete(any(), eq(false), eq(0));
  verifyNoMoreInteractions(consumer);
}

function testExceptionInNonForkedRedirect() {
  exception = CommandSyntaxException.BUILT_IN_EXCEPTIONS.readerExpectedBool().create();

  subject.setConsumer(consumer);
  subject.register(literal("noop").executes(command));
  subject.register(literal("redirect").redirect(subject.getRoot(), context -> {
    throw exception;
  }));

  when(command.run(any())).thenReturn(3);

  try {
    subject.execute("redirect noop", source);
  } catch (ex) {
    console.assert(ex == exception));
  }

  verifyZeroInteractions(command);
  verify(consumer).onCommandComplete(any(), eq(false), eq(0));
  verifyNoMoreInteractions(consumer);
}

function testExceptionInForkedRedirect() {
  exception = CommandSyntaxException.BUILT_IN_EXCEPTIONS.readerExpectedBool().create();

  subject.setConsumer(consumer);
  subject.register(literal("noop").executes(command));
  subject.register(literal("redirect").fork(subject.getRoot(), context -> {
    throw exception;
  }));

  when(command.run(any())).thenReturn(3);


  console.assert(subject.execute("redirect noop", source) == 0));

  verifyZeroInteractions(command);
  verify(consumer).onCommandComplete(any(), eq(false), eq(0));
  verifyNoMoreInteractions(consumer);
}

function testPartialExceptionInForkedRedirect() {
  exception = CommandSyntaxException.BUILT_IN_EXCEPTIONS.readerExpectedBool().create();
 final Object otherSource = new Object();
 final Object rejectedSource = new Object();

  subject.setConsumer(consumer);
  subject.register(literal("run").executes(command));
  subject.register(literal("split").fork(subject.getRoot(), context -> Arrays.asList(source, rejectedSource, otherSource)));
  subject.register(literal("filter").fork(subject.getRoot(), context -> {
    final Object currentSource = context.getSource();
    if(currentSource == rejectedSource) {
    throw exception;
  }
     return Collections.singleton(currentSource);
}));

when(command.run(any())).thenReturn(3);

console.assert(subject.execute("split filter run", source) == 2));

verify(command).run(argThat(contextSourceMatches(source)));
verify(command).run(argThat(contextSourceMatches(otherSource)));
verifyNoMoreInteractions(command);

verify(consumer).onCommandComplete(argThat(contextSourceMatches(rejectedSource)), eq(false), eq(0));
verify(consumer).onCommandComplete(argThat(contextSourceMatches(source)), eq(true), eq(3));
verify(consumer).onCommandComplete(argThat(contextSourceMatches(otherSource)), eq(true), eq(3));
verifyNoMoreInteractions(consumer);
}*/