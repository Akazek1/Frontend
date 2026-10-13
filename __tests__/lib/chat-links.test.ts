import { describe, expect, it } from "vitest";
import { containsChatLink, tokenizeChatLinks } from "@/lib/chat-links";

const links = (text: string) => tokenizeChatLinks(text).filter((t) => t.type === "link");

describe("tokenizeChatLinks", () => {
  it("returns plain text untouched when there is no link", () => {
    expect(tokenizeChatLinks("hello there")).toEqual([{ type: "text", text: "hello there" }]);
    expect(tokenizeChatLinks("")).toEqual([]);
  });

  it("keeps the surrounding text and drops trailing punctuation from the link", () => {
    expect(tokenizeChatLinks("see https://x.com/a. ok")).toEqual([
      { type: "text", text: "see " },
      { type: "link", text: "https://x.com/a", href: "https://x.com/a", host: "x.com", suspicious: false },
      { type: "text", text: ". ok" },
    ]);
  });

  it("links bare domains and www. links over https", () => {
    expect(links("go to huza.app now")[0]).toMatchObject({ text: "huza.app", href: "https://huza.app/" });
    expect(links("instagram.com/huza.app")[0]).toMatchObject({ href: "https://instagram.com/huza.app" });
    expect(links("www.instagram.com/huza.app/")[0]).toMatchObject({ host: "www.instagram.com" });
  });

  it("keeps balanced brackets inside a URL", () => {
    expect(links("(https://en.wikipedia.org/wiki/A_(b))")[0]).toMatchObject({
      text: "https://en.wikipedia.org/wiki/A_(b)",
    });
  });

  it("does not link words joined by a dot, prices or emails", () => {
    for (const text of ["ok.so i will come", "yes.no", "murakoze.ni byiza", "price is 5.000rwf", "mail a@b.com"]) {
      expect(links(text)).toEqual([]);
    }
  });

  it("only ever produces http(s) links", () => {
    for (const text of ["javascript:alert(1)", "ftp://x.com/file", "//evil.com", "mailto:a@b.com", "data:text/html,x"]) {
      expect(links(text)).toEqual([]);
    }
  });

  it("flags links that hide their destination", () => {
    expect(links("https://bank.com@evil.io/login")[0]).toMatchObject({ host: "evil.io", suspicious: true });
    expect(links("http://192.168.1.1/x")[0]).toMatchObject({ suspicious: true });
    // Cyrillic "а" in place of the Latin "a".
    expect(links("https://аpple.com")[0]).toMatchObject({ host: "xn--pple-43d.com", suspicious: true });
  });
});

describe("containsChatLink", () => {
  it("reports whether the text has a link", () => {
    expect(containsChatLink("call me on wa.me/250788000000")).toBe(true);
    expect(containsChatLink("call me tomorrow")).toBe(false);
  });
});
