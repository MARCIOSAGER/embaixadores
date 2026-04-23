import { describe, it, expect, vi } from "vitest";

// Mock jspdf and jspdf-autotable before importing the module
vi.mock("jspdf", () => {
  const mockDoc = {
    setFontSize: vi.fn(),
    setFont: vi.fn(),
    text: vi.fn(),
    addImage: vi.fn(),
    save: vi.fn(),
    lastAutoTable: { finalY: 100 },
  };
  return {
    default: vi.fn(() => mockDoc),
  };
});

vi.mock("jspdf-autotable", () => ({
  default: vi.fn(),
}));

vi.mock("../pdfLogo", () => ({
  getLogoDataUrl: vi.fn(() => Promise.resolve("data:image/png;base64,iVBORw0KGgo=")),
}));

import { buildGenericPdfDoc, exportGenericPdf } from "../exportGenericPdf";
import jsPDF from "jspdf";

describe("buildGenericPdfDoc", () => {
  it("returns a jsPDF instance", async () => {
    const doc = await buildGenericPdfDoc(
      "Test Title",
      "Test Subtitle",
      ["Col1", "Col2"],
      [["A", "B"], ["C", "D"]],
    );
    expect(doc).toBeDefined();
    expect(jsPDF).toHaveBeenCalled();
  });

  it("sets the title text on the document", async () => {
    const doc = await buildGenericPdfDoc(
      "My Report",
      "Summary",
      ["Name"],
      [["Alice"]],
    );
    expect(doc.text).toHaveBeenCalledWith(
      "My Report",
      expect.any(Number),
      expect.any(Number),
    );
  });

  it("includes subtitle with date", async () => {
    const doc = await buildGenericPdfDoc(
      "Title",
      "Sub",
      ["X"],
      [["1"]],
    );
    // subtitle text should contain "Sub - Gerado em"
    const textCalls = (doc.text as ReturnType<typeof vi.fn>).mock.calls;
    const subtitleCall = textCalls.find(
      (call: any[]) => typeof call[0] === "string" && call[0].includes("Sub - Gerado em"),
    );
    expect(subtitleCall).toBeDefined();
  });

  it("sets font size for header", async () => {
    const doc = await buildGenericPdfDoc("T", "S", ["A"], [["1"]]);
    expect(doc.setFontSize).toHaveBeenCalledWith(16);
  });

  it("writes total record count in footer", async () => {
    const rows = [["a", "b"], ["c", "d"], ["e", "f"]];
    const doc = await buildGenericPdfDoc("T", "S", ["X", "Y"], rows);
    const textCalls = (doc.text as ReturnType<typeof vi.fn>).mock.calls;
    const footerCall = textCalls.find(
      (call: any[]) => typeof call[0] === "string" && call[0].includes("Total de registros: 3"),
    );
    expect(footerCall).toBeDefined();
  });
});

describe("exportGenericPdf", () => {
  it("calls save with filename containing date", async () => {
    await exportGenericPdf("T", "S", ["A"], [["1"]], "test-file");
    const mockDoc = (jsPDF as unknown as ReturnType<typeof vi.fn>).mock.results[0].value;
    expect(mockDoc.save).toHaveBeenCalled();
    const savedFilename = mockDoc.save.mock.calls[0][0];
    expect(savedFilename).toMatch(/^test-file-\d{4}-\d{2}-\d{2}\.pdf$/);
  });
});
