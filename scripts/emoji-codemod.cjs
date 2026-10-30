/**
 * Replaces emoji in the app with lucide icons (via app/components/AppIcon.tsx).
 *  - JSX text:              Hello 👋      ->  Hello <AppIcon e="👋" />
 *  - {"..🔥.."} / {x.icon}: wrapped in <Rich>…</Rich> (converts emoji at render time)
 *  - JSX attribute strings, <option>/<title>/<textarea> text: emoji is stripped (cannot hold icons)
 * Anything else is listed in docs/emoji-remaining.txt for manual follow-up.
 * Safe to re-run.
 */
const ts = require("typescript");
const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const APP = path.join(ROOT, "app");
const ICON_FILE = path.join(APP, "components", "AppIcon");

const PICTO =
  "(?:(?![\\u00A9\\u00AE\\u2122\\u203C\\u2049\\u2139\\u2194-\\u21AA\\u231A\\u231B\\u24C2\\u25AA-\\u25FE\\u2934\\u2935\\u2B05-\\u2B07\\u3030\\u303D\\u3297\\u3299])" +
  "\\p{Extended_Pictographic}(?:\\uFE0F|\\u20E3|[\\u{1F3FB}-\\u{1F3FF}]|\\u200D\\p{Extended_Pictographic}\\uFE0F?)*" +
  "|[\\u{1F1E6}-\\u{1F1FF}]{2})";
const HAS = new RegExp(PICTO, "u");
const GLOBAL = new RegExp(PICTO, "gu");
const STRIP = new RegExp("[ \\t]*(?:" + PICTO + ")[ \\t]*", "gu");

const RENDER_NAMES = /^(icon|icons|emoji|emojis|symbol)$/i;
const TEXT_ONLY_TAGS = new Set(["option", "title", "textarea", "style", "script"]);

function walk(dir, out = []) {
  for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
    if (f.name === "node_modules" || f.name.startsWith(".")) continue;
    const p = path.join(dir, f.name);
    if (f.isDirectory()) walk(p, out);
    else if (/\.(tsx|ts)$/.test(f.name)) out.push(p);
  }
  return out;
}

const rel = (p) => path.relative(ROOT, p).split(path.sep).join("/");
const stripEmoji = (s) => s.replace(STRIP, " ").replace(/\s{2,}/g, " ").trim();

function strHasEmoji(n) {
  if (ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n)) return HAS.test(n.text);
  if (ts.isTemplateExpression(n)) {
    if (HAS.test(n.head.text)) return true;
    return n.templateSpans.some((s) => HAS.test(s.literal.text) || strHasEmoji(s.expression));
  }
  if (ts.isParenthesizedExpression(n)) return strHasEmoji(n.expression);
  if (ts.isConditionalExpression(n)) return strHasEmoji(n.whenTrue) || strHasEmoji(n.whenFalse);
  if (ts.isBinaryExpression(n)) {
    const k = n.operatorToken.kind;
    if ([ts.SyntaxKind.PlusToken, ts.SyntaxKind.BarBarToken, ts.SyntaxKind.QuestionQuestionToken, ts.SyntaxKind.AmpersandAmpersandToken].includes(k))
      return strHasEmoji(n.left) || strHasEmoji(n.right);
  }
  return false;
}

function lastName(expr) {
  if (ts.isIdentifier(expr)) return expr.text;
  if (ts.isPropertyAccessExpression(expr)) return expr.name.text;
  if (ts.isElementAccessExpression(expr) && ts.isStringLiteral(expr.argumentExpression)) return expr.argumentExpression.text;
  return null;
}
function isRefLike(expr) {
  return ts.isIdentifier(expr) || ts.isPropertyAccessExpression(expr) || ts.isElementAccessExpression(expr);
}

let totals = { files: 0, jsxText: 0, wrapped: 0, stripped: 0 };
const remaining = [];

for (const file of walk(APP)) {
  if (file === ICON_FILE + ".tsx" || file.endsWith("appicon-map.ts")) continue;
  const text = fs.readFileSync(file, "utf8");
  if (!HAS.test(text) && !/\.tsx$/.test(file)) continue;
  const isTsx = file.endsWith(".tsx");
  if (!HAS.test(text) && !(isTsx && /\b(icon|emoji)s?\b/i.test(text))) continue;

  const sf = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, isTsx ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const edits = [];                 // {start, end, text}
  const handledRanges = [];         // ranges whose emoji are handled
  let needAppIcon = false, needRich = false;
  let wrapCandidates = [];          // ref-like JSX children (decided after we know the file has emoji strings)
  const emojiStrings = [];          // string nodes with emoji not otherwise handled

  const inHandled = (n) => handledRanges.some(([s, e]) => n.getStart(sf) >= s && n.end <= e);

  function visit(node) {
    // JSX text
    if (isTsx && ts.isJsxText(node) && HAS.test(node.text)) {
      const parent = node.parent;
      const tag = ts.isJsxElement(parent) ? parent.openingElement.tagName.getText(sf) : null;
      const raw = text.slice(node.pos, node.end);
      if (tag && TEXT_ONLY_TAGS.has(tag)) {
        edits.push({ start: node.pos, end: node.end, text: raw.replace(STRIP, " ") });
        totals.stripped++;
      } else {
        const out = raw.replace(GLOBAL, (m) => `<AppIcon e="${m}" />`);
        edits.push({ start: node.pos, end: node.end, text: out });
        needAppIcon = true;
        totals.jsxText += (raw.match(GLOBAL) || []).length;
      }
      handledRanges.push([node.pos, node.end]);
      return;
    }
    // JSX attribute string literal -> strip emoji
    if (isTsx && ts.isJsxAttribute(node) && node.initializer && ts.isStringLiteral(node.initializer) && HAS.test(node.initializer.text)) {
      const owner = node.parent && node.parent.parent;
      const ownerTag = owner && (ts.isJsxOpeningElement(owner) || ts.isJsxSelfClosingElement(owner)) ? owner.tagName.getText(sf) : "";
      if (ownerTag === "AppIcon") return;
      const q = text[node.initializer.getStart(sf)];
      edits.push({ start: node.initializer.getStart(sf), end: node.initializer.end, text: q + stripEmoji(node.initializer.text) + q });
      handledRanges.push([node.initializer.getStart(sf), node.initializer.end]);
      totals.stripped++;
      return;
    }
    // JSX child expressions
    if (isTsx && ts.isJsxExpression(node) && node.expression && (ts.isJsxElement(node.parent) || ts.isJsxFragment(node.parent))) {
      if (ts.isJsxElement(node.parent) && node.parent.openingElement.tagName.getText(sf) === "Rich") return;
      const ex = node.expression;
      const byEmoji = strHasEmoji(ex);
      const byName = isRefLike(ex) && RENDER_NAMES.test(lastName(ex) || "");
      if (byEmoji || byName) {
        edits.push({ start: node.getStart(sf), end: node.end, text: "<Rich>" + node.getText(sf) + "</Rich>" });
        handledRanges.push([node.getStart(sf), node.end]);
        needRich = true; totals.wrapped++;
        return;
      }
      if (isRefLike(ex)) wrapCandidates.push(node);
    }
    // any other string with emoji
    if ((ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node) || ts.isTemplateHead(node) || ts.isTemplateMiddle(node) || ts.isTemplateTail(node)) && HAS.test(node.text)) {
      emojiStrings.push(node);
    }
    ts.forEachChild(node, visit);
  }
  visit(sf);

  // Strings that live in this file's data and are rendered through {x.y} children here:
  const unhandled = emojiStrings.filter((n) => !inHandled(n));
  if (isTsx && unhandled.length && wrapCandidates.length) {
    for (const c of wrapCandidates) {
      edits.push({ start: c.getStart(sf), end: c.end, text: "<Rich>" + c.getText(sf) + "</Rich>" });
      needRich = true; totals.wrapped++;
    }
  }
  const covered = isTsx && wrapCandidates.length > 0;

  for (const n of unhandled) {
    const p = n.parent;
    const okProp = p && ts.isPropertyAssignment(p) && RENDER_NAMES.test(p.name.getText(sf));
    const { line } = sf.getLineAndCharacterOfPosition(n.getStart(sf));
    const status = okProp ? "ok-runtime" : covered ? "likely-ok" : "REVIEW";
    remaining.push({ file: rel(file), line: line + 1, status, snippet: n.getText(sf).slice(0, 90).replace(/\s+/g, " ") });
  }

  if (!edits.length) continue;

  let out = text;
  edits.sort((a, b) => b.start - a.start);
  for (const e of edits) out = out.slice(0, e.start) + e.text + out.slice(e.end);

  if ((needAppIcon || needRich) && !/components\/AppIcon/.test(out)) {
    let relPath = path.relative(path.dirname(file), ICON_FILE).split(path.sep).join("/");
    if (!relPath.startsWith(".")) relPath = "./" + relPath;
    const names = [needAppIcon && "AppIcon", needRich && "Rich"].filter(Boolean).join(", ");
    const line = `import { ${names} } from "${relPath}";`;
    const sf2 = ts.createSourceFile(file, out, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    let lastImportEnd = -1;
    sf2.statements.forEach((s) => { if (ts.isImportDeclaration(s)) lastImportEnd = s.end; });
    if (lastImportEnd === -1) {
      // after a leading "use client" directive if present
      const first = sf2.statements[0];
      if (first && ts.isExpressionStatement(first) && ts.isStringLiteral(first.expression)) out = out.slice(0, first.end) + "\n" + line + out.slice(first.end);
      else out = line + "\n" + out;
    } else {
      out = out.slice(0, lastImportEnd) + "\n" + line + out.slice(lastImportEnd);
    }
  }
  fs.writeFileSync(file, out);
  totals.files++;
}

fs.mkdirSync(path.join(ROOT, "docs"), { recursive: true });
const lines = remaining.map((r) => `${r.status.padEnd(10)} ${r.file}:${r.line}  ${r.snippet}`);
fs.writeFileSync(path.join(ROOT, "docs", "emoji-remaining.txt"), lines.join("\n") + "\n");

console.log(`files changed: ${totals.files} | jsx-text icons: ${totals.jsxText} | wrapped <Rich>: ${totals.wrapped} | stripped (attrs/options): ${totals.stripped}`);
const review = remaining.filter((r) => r.status === "REVIEW");
console.log(`emoji strings still needing review: ${review.length} (of ${remaining.length} found in strings)`);
review.slice(0, 60).forEach((r) => console.log(`  ${r.file}:${r.line}  ${r.snippet}`));
