/**
 * Parses rich text by sequentially applying transformation rules.
 * Each rule modifies the text, and the result is passed to the next rule.
 * @param text - The input text to parse (typically Markdown).
 * @param rules - An array of transformation rules to apply in order.
 * @returns The transformed text (typically HTML).
 */
export function parseRichText(text: string, rules: Array<TRichTextRule> = []) {
    let result = text;
    for (const rule of rules) {
        result = rule.apply(result);
    }
    return result;
}

/**
 * A replacer for pattern matching. Can be either:
 * - A string with substitution patterns (e.g., '$1', '$2' for capture groups)
 * - A function that receives the full match and capture groups, returning the replacement string
 */
type TRichTextPatternReplacer = ((content: string, ...groupMatch: any[]) => string) | string

/**
 * Replacer function for unordered lists.
 * Converts Markdown unordered list items (lines starting with '- ' or '+ ') into HTML <ul><li> elements.
 * @param fullMatch - The full matched string containing all list items.
 * @returns HTML string with <ul> and <li> tags.
 */
const UNORDERED_LIST_REPLACER: TRichTextPatternReplacer = (fullMatch: string) => {
    const items = fullMatch.trim().split("\n").reduce((acc, next) => acc + '<li>' + next.substring(2) + '</li>', "");
    return `\n<ul>${items}</ul>`;
}

/**
 * Replacer function for ordered lists.
 * Converts Markdown ordered list items (lines starting with '1. ', '2. ', etc.) into HTML <ol><li> elements.
 * @param fullMatch - The full matched string containing all numbered list items.
 * @returns HTML string with <ol> and <li> tags.
 */
const ORDERED_LIST_REPLACER: TRichTextPatternReplacer = (fullMatch: string) => {
    const items = fullMatch.trim().split("\n").reduce((acc, next) => acc + '<li>' + next.substring(next.indexOf('.') + 2) + '</li>', "");
    return `\n<ol>${items}</ol>`;
}

/**
 * Replacer function for Markdown tables.
 * Converts Markdown table syntax into HTML <table> elements with proper thead/tbody structure.
 * @param _ - The full match (unused).
 * @param header - The header row content (pipe-separated columns).
 * @param __ - The separator row (unused, contains alignment info like |---|).
 * @param rows - The data rows content (newline-separated, pipe-separated cells).
 * @returns HTML string with complete table structure including thead/tbody.
 */
const TABLE_REPLACER: TRichTextPatternReplacer = (_: string, header: string, __: string, rows: string) => {
    const filterEmpty = (str: string) => Boolean(str.trim());
    const xmlHeaders: Array<string> = header.split("|").filter(filterEmpty).map(header => `<th>${header.trim()}</th>`);
    const xmlRows: Array<string> = rows.split("\n").filter(Boolean).map(row => {
        const cells = row.split('|').filter(filterEmpty).map(cell => `<td>${cell.trim()}</td>`).join('');
        return `<tr>${cells}</tr>`;
    })
    return `<table><thead><tr>${xmlHeaders.join('')}</tr></thead><tbody>${xmlRows.join('')}</tbody></table>`.trim().concat("\n");
}

/**
 * Represents a single pattern-based text transformation.
 * Encapsulates a regular expression and its corresponding replacer.
 */
class TRichTextPattern {
    /**
     * Creates a new pattern transformation.
     * @param regexp - The regular expression to match against.
     * @param replacer - The replacement string or function.
     */
    constructor(private regexp: RegExp, private replacer: TRichTextPatternReplacer) { }

    /**
     * Applies this pattern transformation to the given text.
     * @param text - The input text to transform.
     * @returns The text with all matches replaced.
     */
    apply(text: string) {
        const replacer = this.replacer;
        if (typeof replacer === 'string') {
            return text.replace(this.regexp, replacer);
        }
        return text.replace(this.regexp, replacer);
    }
}

/**
 * Represents a named rule containing one or more pattern transformations.
 * Rules group related patterns together and apply them sequentially.
 */
class TRichTextRule {
    /**
     * Creates a new transformation rule.
     * @param name - A descriptive name for this rule (e.g., 'bold', 'link').
     * @param patterns - An array of patterns to apply in order.
     */
    constructor(public name: string, private patterns: TRichTextPattern[]) { }

    /**
     * Applies all patterns in this rule sequentially to the given text.
     * @param text - The input text to transform.
     * @returns The text after all patterns have been applied.
     */
    apply(text: string) {
        return this.patterns.reduce((acc, next) => next.apply(acc), text);
    }
}


/**
 * Rule for converting Markdown images to HTML.
 * Matches: `![alt text](data:image/png;base64,...)` syntax.
 * Outputs: `<img src="..." alt="alt text">` HTML element.
 * @example
 * // Input:  ![Logo](data:image/png;base64,iVBORw0KG...)
 * // Output: <img src="data:image/png;base64,iVBORw0KG..." alt="Logo"></img>
 */
const IMAGE_RULE = new TRichTextRule('image', [
    new TRichTextPattern(
        /!\[([^\[]+)\]\((data:image\/png;base64),([^\)]+)\)/g,
        `<img src="$2,$3" alt="$1"></img>`,
    ),
]);

/**
 * Rule for converting Markdown links to HTML anchors.
 * Matches: `[link text](url)` syntax (excludes image links starting with !).
 * Outputs: `<a href="url">link text</a>` HTML element.
 * @example
 * // Input:  [Google](https://google.com)
 * // Output: <a href="https://google.com">Google</a>
 */
const LINK_RULE = new TRichTextRule('link', [
    new TRichTextPattern(
        /(^|[^!])\[([^\[]+)\]\(([^\)]+)\)/g,
        '$1<a href="$3">$2</a>',
    ),
]);

/**
 * Rule for converting Markdown headers to HTML heading elements.
 * Matches: Lines starting with # (h1), ## (h2), or ### to ###### (converted to <p>).
 * Note: Only h1 and h2 are preserved as headings; h3-h6 become paragraphs.
 * @example
 * // Input:  # Main Title
 * // Output: <h1>Main Title</h1>
 * // Input:  ## Section
 * // Output: <h2>Section</h2>
 */
const HEADER_RULE = new TRichTextRule('header', [
    new TRichTextPattern(/^#{6}\s?([^\n]+)/gm, '<p>$1</p>'),
    new TRichTextPattern(/^#{5}\s?([^\n]+)/gm, '<p>$1</p>'),
    new TRichTextPattern(/^#{4}\s?([^\n]+)/gm, '<p>$1</p>'),
    new TRichTextPattern(/^#{3}\s?([^\n]+)/gm, '<p>$1</p>'),
    new TRichTextPattern(/^#{2}\s?([^\n]+)/gm, `<h2>$1</h2>`),
    new TRichTextPattern(/^#{1}\s?([^\n]+)/gm, `<h1>$1</h1>`),
]);

/**
 * Rule for converting Markdown tables to HTML table elements.
 * Matches: Pipe-delimited table syntax with header separator row.
 * Outputs: Complete HTML table with <thead> and <tbody>.
 * @example
 * // Input:
 * // | Name | Age |
 * // |------|-----|
 * // | John | 30  |
 * // Output: <table><thead><tr><th>Name</th><th>Age</th></tr></thead><tbody><tr><td>John</td><td>30</td></tr></tbody></table>
 */
const TABLE_RULE = new TRichTextRule('table', [
    new TRichTextPattern(
        /^(\|.+\|\r?\n)(\|[-:| ]+\|\r?\n)((?:\|.*\|\r?\n?)*)/gm,
        TABLE_REPLACER,
    ),
]);

/**
 * Rule for converting Markdown lists to HTML list elements.
 * Handles both ordered (1. 2. 3.) and unordered (- or +) lists.
 * Skips lines that already contain HTML tags to avoid double-processing.
 * @example
 * // Input:  - Item 1\n- Item 2
 * // Output: <ul><li>Item 1</li><li>Item 2</li></ul>
 * // Input:  1. First\n2. Second
 * // Output: <ol><li>First</li><li>Second</li></ol>
 */
const LIST_RULE = new TRichTextRule('simple lists', [
    new TRichTextPattern(
        /(?:^|\n)(?![^\n]*<[^>]*>)(\s*[0-9]+\.\s.*)+/g,
        ORDERED_LIST_REPLACER,
    ),
    new TRichTextPattern(
        /(?:^|\n)(?![^\n]*<[^>]*>)(\s*[\-\+]\s.*(?:\n\s*[\-\+]\s.*)*)/g,
        UNORDERED_LIST_REPLACER,
    ),
]);

/**
 * Rule for converting combined/mixed text formatting to HTML.
 * Handles combinations of bold (***), italic (*), and strikethrough (~~) in various orders.
 * Must be processed before individual bold/italic/strikethrough rules.
 * Excludes content inside <li> and <td> elements to avoid conflicts.
 * @example
 * // Input:  ***~~text~~*** → <b><i><s>text</s></i></b>
 * // Input:  ~~***text***~~ → <s><b><i>text</i></b></s>
 * // Input:  ***text***     → <b><i>text</i></b>
 */
const MIXED_TEXT_RULE = new TRichTextRule('mixed-text', [
    new TRichTextPattern(
        /\*\*\*\~\~\s?((?:(?!<li>|<\/li>|<td>|<\/td>).)+?)\~\~\*\*\*/g,
        '<b><i><s>$1</s></i></b>',
    ),
    new TRichTextPattern(
        /\~\~\*\*\*\s?((?:(?!<li>|<\/li>|<td>|<\/td>).)+?)\*\*\*\~\~/g,
        '<s><b><i>$1</i></b></s>',
    ),
    new TRichTextPattern(
        /\~\~\*\*\s?((?:(?!<li>|<\/li>|<td>|<\/td>).)+?)\*\*\~\~/g,
        '<s><b>$1</b></s>',
    ),
    new TRichTextPattern(
        /\*\*\~\~\s?([^\n]+?)\~\~\*\*/g,
        '<b><s>$1</s></b>',
    ),
    new TRichTextPattern(/\~\~\*\s?([^\n]+?)\*\~\~/g, '<s><i>$1</i></s>'),
    new TRichTextPattern(
        /\*\~\~\s?((?:(?!<li>|<\/li>|<td>|<\/td>).)+?)\~\~\*/g,
        '<i><s>$1</s></i>',
    ),
    new TRichTextPattern(/\*\*\*\s?([^\n]+?)\*\*\*/g, '<b><i>$1</i></b>'),
]);

/**
 * Rule for wrapping plain text lines in paragraph tags.
 * Matches: Lines that don't start with # and don't already contain block-level HTML.
 * Skips: Headers, lists, images, tables, and existing paragraph tags.
 * @example
 * // Input:  This is plain text.
 * // Output: <p>This is plain text.</p>
 */
const PARAGRAPH_RULE = new TRichTextRule('paragraph', [
    new TRichTextPattern(
        /^(?!#)(?!.*<\/?(ul|ol|img|h1|h2|p|table|tr|th|td)>)(.*\S.*)$/gm,
        '<p>$&</p>',
    ),
]);

/**
 * Rule for converting Markdown bold text to HTML.
 * Matches: Text wrapped in double asterisks **text**.
 * Outputs: `<b>text</b>` HTML element.
 * @example
 * // Input:  **bold text**
 * // Output: <b>bold text</b>
 */
const BOLD_RULE = new TRichTextRule('bold', [
    new TRichTextPattern(/\*\*(.+?)\*\*/g, '<b>$1</b>'),
]);

/**
 * Rule for converting Markdown italic text to HTML.
 * Matches: Text wrapped in single asterisks *text*.
 * Outputs: `<i>text</i>` HTML element.
 * @example
 * // Input:  *italic text*
 * // Output: <i>italic text</i>
 */
const ITALIC_RULE = new TRichTextRule('italic', [
    new TRichTextPattern(/\*(.+?)\*/g, '<i>$1</i>'),
]);

/**
 * Rule for converting Markdown strikethrough text to HTML.
 * Matches: Text wrapped in double tildes ~~text~~.
 * Outputs: `<s>text</s>` HTML element.
 * @example
 * // Input:  ~~deleted text~~
 * // Output: <s>deleted text</s>
 */
const STRIKETHROUGH_RULE = new TRichTextRule('strikethrough', [
    new TRichTextPattern(/\~\~\s?([^\n]+?)\~\~/g, '<s>$1</s>'),
]);

/**
 * Complete set of Markdown-to-HTML transformation rules.
 * **ORDER MATTERS!** Rules are executed from top to bottom.
 * Each rule receives the modified HTML string from previous rules.
 * 
 * Rule order rationale:
 * 1. IMAGE_RULE - Process images first (before links consume the syntax)
 * 2. LINK_RULE - Convert links before text formatting
 * 3. HEADER_RULE - Convert headers before paragraph wrapping
 * 4. TABLE_RULE - Convert tables before list processing
 * 5. LIST_RULE - Convert lists before paragraph wrapping
 * 6. MIXED_TEXT_RULE - Handle combined formatting first
 * 7. PARAGRAPH_RULE - Wrap remaining plain text
 * 8. MIXED_TEXT_RULE - Second pass for nested formatting
 * 9. BOLD_RULE, ITALIC_RULE, STRIKETHROUGH_RULE - Individual formatting
 */
export const RICH_TEXT_RULES: Array<TRichTextRule> = [
    IMAGE_RULE,
    LINK_RULE,
    HEADER_RULE,
    TABLE_RULE,
    LIST_RULE,
    MIXED_TEXT_RULE,
    PARAGRAPH_RULE,
    MIXED_TEXT_RULE,
    BOLD_RULE,
    ITALIC_RULE,
    STRIKETHROUGH_RULE,
];

