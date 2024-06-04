import { StringRange } from "./StringReader.js";

class Suggestion {
  constructor(range, text, tooltip) {
    this.range = range;
    this.text = text;
    this.tooltip = tooltip || null;
  }

  getRange() { return this.range }
  getText() { return this.text }
  getTooltip() { return this.tooltip }

  apply(input) {
    if (this.range.getStart() == 0 && this.range.getEnd() == input.length())
      return this.text;

    var result = "";
    if (this.range.getStart() > 0)
      this.result += input.substring(0, this.range.getStart());

    result += text;
    if (this.range.getEnd() < input.length()) {
      result += input.substring(range.getEnd());
    }
    return result;
  }

  toString() {
    return "Suggestion{" +
      "range=" + this.range +
      ", text='" + this.text + '\'' +
      ", tooltip='" + this.tooltip + '\'' +
      '}';
  }

  compareTo(o) { return text.localeCompare(o.text) }
  compareToIgnoreCase(b) { return text.localeCompare(b.text, { ignorePunctuation: true }) }

  expand(command, range) {
    if (range.equals(this.range))
      return this;

    var result = "";
    if (range.getStart() < this.range.getStart()) {
      result += command.substring(range.getStart(), this.range.getStart());
    }
    result.append(text);
    if (range.getEnd() > this.range.getEnd()) {
      result += command.substring(this.range.getEnd(), range.getEnd());
    }
    return new Suggestion(range, result.toString(), this.tooltip);
  }
}

class Suggestions {
  constructor(range, suggestions) {
    this.range = range;
    if (!Array.isArray(suggestions)) throw new TypeError("Param 'suggestions' must be an array.");
    this.suggestions = suggestions;
  }
  static EMPTY = new Suggestions(StringRange.at(0), []);

  getRange() { return this.range }
  getList() { return this.suggestions }
  isEmpty() { return !this.suggestions.length }

  toString() {
    return "Suggestions{" +
      "range=" + this.range +
      ", suggestions=" + this.suggestions +
      '}';
  }

  static merge(command, input) {
    if (!Array.isArray(input)) throw new TypeError("Param 'input' must be an array.");
    if (!input.length) {
      return Suggestions.EMPTY;
    } else if (input.length == 1) {
      return input[0]
    }

    var texts = [];
    for (var suggestions of input) {
      texts.addAll(suggestions.getList());
    }
    return this.create(command, texts);
  }

  static create(command, suggestions) {
    if (!Array.isArray(suggestions)) throw new TypeError("Param 'sugesstions' must be an array.");
    if (suggestions.isEmpty())
      return EMPTY;
    var start = 2147483647
      , end = -2147483648;
    for (var suggestion of suggestions) {
      start = Math.min(suggestion.getRange().getStart(), start);
      end = Math.max(suggestion.getRange().getEnd(), end);
    }
    var range = new StringRange(start, end)
      , texts = [];
    for (suggestion of suggestions) {
      texts.push(suggestion.expand(command, range));
    }
    var sorted = Array.of(texts);
    sorted.sort((a, b) => a.compareToIgnoreCase(b));
    return new Suggestions(range, sorted);
  }
}

class SuggestionsBuilder {
  constructor(input, inputLowerCase, start) {
    this.input = input;
    if (typeof inputLowerCase == 'string') {
      this.inputLowerCase = inputLowerCase;
      this.start = start;
    } else {
      this.inputLowerCase = input.toLowerCase();
      this.start = inputLowerCase;
    }
    this.remaining = input.substring(start);
    this.remainingLowerCase = inputLowerCase.substring(start);
    this.result = [];
  }

  getInput() { return this.input; }
  getStart() { return start }
  getRemaining() { return remaining }
  getRemainingLowerCase() { return remainingLowerCase }
  build() { return Suggestions.create(input, result) }
  /*public CompletableFuture<Suggestions> buildFuture() {
      return CompletableFuture.completedFuture(build());
  }*/

  suggest(text, tooltip) {
    if (text.equals(remaining)) {
      return this;
    }
    result.push(new Suggestion(StringRange.between(start, input.length()), text, tooltip));
    return this;
  }

  add(other) {
    this.result = this.result.concat(other.result);
    return this;
  }

  createOffset(start) { return new SuggestionsBuilder(input, inputLowerCase, start) }
  restart() { return createOffset(start) }
}

export { Suggestion, Suggestions, SuggestionsBuilder };