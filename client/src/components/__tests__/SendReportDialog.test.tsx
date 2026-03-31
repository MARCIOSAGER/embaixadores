import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SendReportDialog from "../SendReportDialog";
import { I18nProvider } from "@/lib/i18n";

function renderWithI18n(ui: React.ReactElement) {
  return render(<I18nProvider>{ui}</I18nProvider>);
}

describe("SendReportDialog", () => {
  let onClose: ReturnType<typeof vi.fn>;
  let onSend: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onClose = vi.fn();
    onSend = vi.fn().mockResolvedValue(undefined);
  });

  it("renders email input when open", () => {
    renderWithI18n(
      <SendReportDialog open={true} onClose={onClose} onSend={onSend} />,
    );
    const input = screen.getByPlaceholderText("email@exemplo.com");
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute("type", "email");
  });

  it("does not render content when closed", () => {
    renderWithI18n(
      <SendReportDialog open={false} onClose={onClose} onSend={onSend} />,
    );
    expect(screen.queryByPlaceholderText("email@exemplo.com")).not.toBeInTheDocument();
  });

  it("shows custom title when provided", () => {
    renderWithI18n(
      <SendReportDialog open={true} onClose={onClose} onSend={onSend} title="Custom Title" />,
    );
    expect(screen.getByText("Custom Title")).toBeInTheDocument();
  });

  it("does not call onSend when email is empty", async () => {
    const user = userEvent.setup();
    renderWithI18n(
      <SendReportDialog open={true} onClose={onClose} onSend={onSend} />,
    );
    // The send button should be disabled when input is empty
    const buttons = screen.getAllByRole("button");
    const sendButton = buttons.find(
      (btn) => btn.hasAttribute("disabled") || btn.textContent?.includes("Enviar"),
    );
    if (sendButton) {
      await user.click(sendButton);
    }
    expect(onSend).not.toHaveBeenCalled();
  });

  it("calls onSend with trimmed email value", async () => {
    const user = userEvent.setup();
    renderWithI18n(
      <SendReportDialog open={true} onClose={onClose} onSend={onSend} />,
    );
    const input = screen.getByPlaceholderText("email@exemplo.com");
    await user.type(input, "  test@example.com  ");

    // Find and click the send/enviar button (not the cancel button)
    const buttons = screen.getAllByRole("button");
    const sendButton = buttons.find(
      (btn) => !btn.textContent?.includes("Cancelar") && !btn.hasAttribute("disabled"),
    );
    if (sendButton) {
      await user.click(sendButton);
    }

    await waitFor(() => {
      expect(onSend).toHaveBeenCalledWith("test@example.com");
    });
  });

  it("disables send button when email is empty", () => {
    renderWithI18n(
      <SendReportDialog open={true} onClose={onClose} onSend={onSend} />,
    );
    const buttons = screen.getAllByRole("button");
    // The send button should be disabled (it has disabled={sending || !email.trim()})
    const disabledButtons = buttons.filter((btn) => btn.hasAttribute("disabled"));
    expect(disabledButtons.length).toBeGreaterThan(0);
  });

  it("calls onClose when cancel button is clicked", async () => {
    const user = userEvent.setup();
    renderWithI18n(
      <SendReportDialog open={true} onClose={onClose} onSend={onSend} />,
    );
    const cancelButton = screen.getByText("Cancelar");
    await user.click(cancelButton);
    expect(onClose).toHaveBeenCalled();
  });
});
