import { buildReportPdf } from "@/lib/pdf";

describe("buildReportPdf", () => {
  const mockReportData = {
    report: {
      id: "test-id",
      company_id: "test-company",
      operator_id: "test-operator",
      property_id: null,
      client_name: "Test Cliente",
      address: "Via Test 123",
      property_type: "appartamento" as const,
      intervention_date: "2024-01-15",
      time_in: "09:00",
      time_out: "17:00",
      break_minutes: 30,
      total_hours: 7.5,
      notes: "Tutto ok",
      status: "completato" as const,
      template_id: null,
      pdf_url: null,
      approved_by: null,
      approved_at: null,
      contested_reason: null,
      external_video_link: null,
      external_video_description: null,
      created_at: "2024-01-15T09:00:00Z",
      updated_at: "2024-01-15T17:00:00Z"
    },
    operator_name: "Mario Rossi",
    company: {
      id: "test-company",
      name: "Pulizie SRL",
      logo_url: null,
      admin_email: "admin@test.com",
      telegram_chat_id: null,
      manager_whatsapp_number: null,
      company_whatsapp_number: null,
      default_send_channel: null,
      created_at: "2024-01-01T00:00:00Z",
      updated_at: null
    },
    tasks: [
      { section: "Cucina", label: "Pulizia piano lavoro", done: true },
      { section: "Cucina", label: "Pulizia forno", done: false },
      { section: "Bagni", label: "Pulizia wc", done: true }
    ],
    anomalies: [
      { code: "mancanza_prodotti", detail: "Mancava il detersivo" }
    ],
    photos: [],
    signatures: []
  };

  it("generates a valid PDF", async () => {
    const pdfBytes = await buildReportPdf(mockReportData);
    expect(pdfBytes).toBeInstanceOf(Uint8Array);
    expect(pdfBytes.length).toBeGreaterThan(0);
  });

  it("PDF starts with PDF header", async () => {
    const pdfBytes = await buildReportPdf(mockReportData);
    const header = String.fromCharCode(...pdfBytes.slice(0, 5));
    expect(header).toBe("%PDF-");
  });

  it("handles empty tasks and anomalies", async () => {
    const data = {
      ...mockReportData,
      tasks: [],
      anomalies: []
    };
    const pdfBytes = await buildReportPdf(data);
    expect(pdfBytes.length).toBeGreaterThan(0);
  });

  it("handles report with video link", async () => {
    const data = {
      ...mockReportData,
      report: {
        ...mockReportData.report,
        external_video_link: "https://drive.google.com/test",
        external_video_description: "Video panoramica"
      }
    };
    const pdfBytes = await buildReportPdf(data);
    expect(pdfBytes.length).toBeGreaterThan(0);
  });
});
