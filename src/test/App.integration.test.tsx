import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import App from "../App";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("ASYMPTOTE application integration", () => {
  it("renders the interactive canvas and updates measurements from presets", async () => {
    const user = userEvent.setup();
    render(<App />);
    expect(screen.getByRole("application", { name: /hyperbolic triangle canvas/i })).toBeInTheDocument();
    const initialAngle = screen.getByTestId("angle-sum").textContent;
    await user.click(screen.getByRole("button", { name: /near-ideal/i }));
    expect(screen.getByTestId("angle-sum").textContent).not.toBe(initialAngle);
    expect(screen.getByText(/near-ideal loaded/i)).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/NaN|Infinity/);
  });

  it("supports keyboard point movement with immediate measurement updates", async () => {
    const user = userEvent.setup();
    render(<App />);
    const pointA = screen.getByRole("slider", { name: "Point A" });
    const before = pointA.getAttribute("aria-valuetext");
    pointA.focus();
    expect(pointA).toHaveFocus();
    await user.keyboard("{ArrowRight}");
    expect(pointA.getAttribute("aria-valuetext")).not.toBe(before);
    expect(screen.getByTestId("angle-sum")).toHaveTextContent(/°/);
  });

  it("updates geometry during pointer dragging", () => {
    render(<App />);
    const canvas = screen.getByRole("application", { name: /hyperbolic triangle canvas/i });
    vi.spyOn(canvas, "getBoundingClientRect").mockReturnValue({
      x: 0,
      y: 0,
      left: 0,
      top: 0,
      right: 400,
      bottom: 400,
      width: 400,
      height: 400,
      toJSON: () => ({}),
    });
    const pointA = screen.getByRole("slider", { name: "Point A" });
    const before = pointA.getAttribute("aria-valuetext");
    fireEvent.pointerDown(pointA, { pointerId: 1, clientX: 214, clientY: 89, buttons: 1 });
    fireEvent.pointerMove(canvas, { pointerId: 1, clientX: 305, clientY: 205, buttons: 1 });
    fireEvent.pointerUp(canvas, { pointerId: 1, buttons: 0 });
    expect(pointA.getAttribute("aria-valuetext")).not.toBe(before);
    expect(document.body.textContent).not.toMatch(/NaN|Infinity/);
  });

  it("switches to the circular geodesic lab and reports its runtime classification", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: /circular geodesic/i }));
    expect(screen.getByRole("application", { name: /hyperbolic geodesic canvas/i })).toBeInTheDocument();
    expect(screen.getByText("Orthogonal arc")).toBeInTheDocument();
    expect(screen.getByTestId("geodesic-distance")).toBeInTheDocument();
  });

  it("saves, compares, restores, and removes snapshots", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: /save current triangle/i }));
    const row = screen.getByRole("row", { name: /run 1/i });
    expect(within(row).getByText("Run 1")).toBeInTheDocument();
    await user.click(within(row).getByRole("button", { name: /restore run 1/i }));
    expect(screen.getByText(/integrity-checked/i)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /delete run 1/i }));
    expect(screen.getByText(/no snapshots yet/i)).toBeInTheDocument();
  });

  it("labels the defect-area graph as a Gauss–Bonnet visualization, not a proof", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("tab", { name: "D ↔ A" }));
    expect(screen.getByText(/Gauss–Bonnet visualization, not an independent proof/i)).toBeInTheDocument();
    expect(screen.getByText(/numerical area integration/i)).toBeInTheDocument();
  });
});
