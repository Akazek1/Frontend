import { describe, expect, it, vi, beforeEach } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import en from "@/messages/en.json";
import { LinkifiedText } from "@/components/chat/linkified-text";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

const renderText = (text: string, onBubbleClick = vi.fn()) =>
  render(
    <NextIntlClientProvider locale="en" messages={en}>
      <div onClick={onBubbleClick} onTouchStart={onBubbleClick} onMouseDown={onBubbleClick}>
        <LinkifiedText text={text} isMe={false} />
      </div>
    </NextIntlClientProvider>,
  );

describe("LinkifiedText", () => {
  beforeEach(() => {
    push.mockClear();
    vi.restoreAllMocks();
  });

  it("renders an outside link as a new-tab anchor and leaves the rest as text", () => {
    renderText("follow instagram.com/huza.app please");
    const link = screen.getByRole("link", { name: "instagram.com/huza.app" });
    expect(link).toHaveAttribute("href", "https://instagram.com/huza.app");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
    expect(screen.getByText(/follow/)).toHaveTextContent("follow instagram.com/huza.app please");
  });

  it("does not let a tap on the link reach the bubble's gesture handlers", () => {
    const onBubble = vi.fn();
    renderText("see https://example.com", onBubble);
    const link = screen.getByRole("link");
    fireEvent.touchStart(link);
    fireEvent.mouseDown(link);
    fireEvent.click(link);
    expect(onBubble).not.toHaveBeenCalled();
  });

  it("navigates in place for a link to this app", () => {
    renderText(`open ${window.location.origin}/services?x=1#top`);
    fireEvent.click(screen.getByRole("link"));
    expect(push).toHaveBeenCalledWith("/services?x=1#top");
  });

  it("asks before opening a link that hides its destination", () => {
    const open = vi.spyOn(window, "open").mockImplementation(() => null);
    renderText("pay at https://bank.com@evil.io/login");
    fireEvent.click(screen.getByRole("link"));

    expect(open).not.toHaveBeenCalled();
    expect(screen.getByText(/This link goes to evil\.io\./)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Open anyway" }));
    expect(open).toHaveBeenCalledWith("https://bank.com@evil.io/login", "_blank", "noopener,noreferrer");
  });

  it("closes the warning without opening anything when the user stays", () => {
    const open = vi.spyOn(window, "open").mockImplementation(() => null);
    renderText("pay at http://10.0.0.1/pay");
    fireEvent.click(screen.getByRole("link"));
    fireEvent.click(screen.getByRole("button", { name: "Stay in Huza" }));
    expect(open).not.toHaveBeenCalled();
    expect(screen.queryByText(/This link goes to/)).not.toBeInTheDocument();
  });
});
