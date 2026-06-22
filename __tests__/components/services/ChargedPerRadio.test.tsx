import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import React from "react";
import { ChargedPerRadio } from "@/components/services/ChargedPerRadio";

describe("ChargedPerRadio", () => {
  it("renders all four options with the right roles", () => {
    render(<ChargedPerRadio value="daily" onChange={() => {}} />);

    const group = screen.getByRole("radiogroup");
    expect(group).toBeInTheDocument();
    expect(group).toHaveAttribute("aria-label", "Charged per");

    const radios = screen.getAllByRole("radio");
    expect(radios).toHaveLength(4);
    const labels = radios.map((r) =>
      (r.textContent ?? "").replace(/\s+/g, "").toLowerCase(),
    );
    expect(labels).toEqual([
      "one-timeasinglepayment",
      "perdaychargedeveryday",
      "perweekchargedeveryweek",
      "permonthchargedeverymonth",
    ]);
  });

  it("marks the currently selected option with aria-checked", () => {
    render(<ChargedPerRadio value="weekly" onChange={() => {}} />);

    const weekly = screen.getByRole("radio", { name: /per week/i });
    const daily = screen.getByRole("radio", { name: /per day/i });

    expect(weekly).toHaveAttribute("aria-checked", "true");
    expect(daily).toHaveAttribute("aria-checked", "false");
  });

  it("fires onChange with the option's value when clicked", () => {
    const onChange = vi.fn();
    render(<ChargedPerRadio value="daily" onChange={onChange} />);

    fireEvent.click(screen.getByRole("radio", { name: /one-time/i }));
    expect(onChange).toHaveBeenCalledWith("one_time");

    fireEvent.click(screen.getByRole("radio", { name: /per month/i }));
    expect(onChange).toHaveBeenCalledWith("monthly");
  });

  it("supports a custom group label for accessibility", () => {
    render(
      <ChargedPerRadio
        value="daily"
        onChange={() => {}}
        groupLabel="Billing frequency"
      />,
    );
    expect(screen.getByRole("radiogroup")).toHaveAttribute(
      "aria-label",
      "Billing frequency",
    );
  });
});
