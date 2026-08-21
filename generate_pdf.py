import os
import sys
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.pdfgen import canvas

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super(NumberedCanvas, self).__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_number(num_pages)
            canvas.Canvas.showPage(self)
        canvas.Canvas.save(self)

    def draw_page_number(self, page_count):
        self.saveState()
        self.setFont("Helvetica", 9)
        self.setFillColor(colors.HexColor("#718096"))
        
        # Header (pages > 1)
        if self._pageNumber > 1:
            self.drawString(54, 750, "Intelligent Product Support Assistant — System Architecture & RAG Pipeline")
            self.setStrokeColor(colors.HexColor("#CBD5E0"))
            self.setLineWidth(0.5)
            self.line(54, 742, 558, 742)
            
        # Footer
        page_text = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(558, 36, page_text)
        self.drawString(54, 36, "Confidential — Architecture & Technical Specifications")
        self.setStrokeColor(colors.HexColor("#CBD5E0"))
        self.setLineWidth(0.5)
        self.line(54, 48, 558, 48)
        self.restoreState()

def build_pdf(filename="System_Architecture_and_Pipeline_Documentation.pdf"):
    doc = SimpleDocTemplate(
        filename,
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=54,
        bottomMargin=54
    )

    styles = getSampleStyleSheet()
    
    # Custom styles
    primary_color = colors.HexColor("#1E3A8A")   # Deep Blue
    secondary_color = colors.HexColor("#0D9488") # Teal
    dark_text = colors.HexColor("#1F2937")       # Charcoal
    light_bg = colors.HexColor("#F8FAFC")        # Off-white / light slate
    accent_bar = colors.HexColor("#3B82F6")

    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=24,
        leading=28,
        textColor=primary_color,
        spaceAfter=6
    )

    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=12,
        leading=16,
        textColor=colors.HexColor("#4B5563"),
        spaceAfter=15
    )

    h1_style = ParagraphStyle(
        'Heading1_Custom',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=15,
        leading=18,
        textColor=primary_color,
        spaceBefore=14,
        spaceAfter=8,
        keepWithNext=True
    )

    h2_style = ParagraphStyle(
        'Heading2_Custom',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=15,
        textColor=secondary_color,
        spaceBefore=10,
        spaceAfter=4,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        'Body_Custom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=13.5,
        textColor=dark_text,
        spaceAfter=6
    )

    bullet_style = ParagraphStyle(
        'Bullet_Custom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=dark_text,
        leftIndent=12,
        spaceAfter=3
    )

    table_header_style = ParagraphStyle(
        'TableHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=12,
        textColor=colors.white
    )

    table_cell_style = ParagraphStyle(
        'TableCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=11.5,
        textColor=dark_text
    )

    table_cell_bold = ParagraphStyle(
        'TableCellBold',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8.5,
        leading=11.5,
        textColor=primary_color
    )

    callout_style = ParagraphStyle(
        'Callout',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=9,
        leading=13,
        textColor=colors.HexColor("#1E293B")
    )

    story = []

    # Title Block
    story.append(Spacer(1, 10))
    story.append(Paragraph("Intelligent Product Support Assistant", title_style))
    story.append(Paragraph("Fullstack Web, RAG Architecture, Dataset & Pipelining Specifications", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=2, color=accent_bar, spaceBefore=0, spaceAfter=15))

    # Executive Overview
    story.append(Paragraph("1. Executive Overview & Technology Stack", h1_style))
    overview_text = (
        "The <b>Intelligent Product Support Assistant</b> is an enterprise-grade, version-aware, multimodal AI "
        "technical support solution built on a decoupled fullstack architecture. It utilizes a high-performance "
        "<b>Node.js Express</b> backend with an in-memory <b>768-D Dense Vector Store</b> for Grounded Retrieval-Augmented "
        "Generation (RAG), paired with an interactive <b>React + Vite</b> glassmorphic frontend."
    )
    story.append(Paragraph(overview_text, body_style))

    tech_data = [
        [Paragraph("Layer", table_header_style), Paragraph("Technologies", table_header_style), Paragraph("Key Responsibilities", table_header_style)],
        [Paragraph("Frontend UI", table_cell_bold), Paragraph("React 18, Vite, Vanilla CSS Glassmorphism", table_cell_style), Paragraph("Chat interface, device switcher, live citations, telemetry dashboard, vision upload.", table_cell_style)],
        [Paragraph("Backend API", table_cell_bold), Paragraph("Node.js, Express, Multer, SQLite3", table_cell_style), Paragraph("REST API endpoints, conversation routing, dynamic reindexing, feedback storage.", table_cell_style)],
        [Paragraph("RAG Engine", table_cell_bold), Paragraph("Dense 768-D Vector Hashing, Cosine Sim", table_cell_style), Paragraph("Sliding-window chunking (220/35 words), in-memory semantic indexing, score filtering.", table_cell_style)],
        [Paragraph("LLM & Vision", table_cell_bold), Paragraph("Google Gemini / OpenAI compatible API", table_cell_style), Paragraph("Domain assessment, grounded question answering, hardware photo defect inspection.", table_cell_style)],
        [Paragraph("Data Storage", table_cell_bold), Paragraph("SQLite (assistant.db), JSONL, Markdown", table_cell_style), Paragraph("Session states, audit trails (interactions.jsonl), indexed product manuals, FAQs.", table_cell_style)],
    ]
    t_tech = Table(tech_data, colWidths=[90, 160, 254])
    t_tech.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), primary_color),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, light_bg]),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    story.append(t_tech)
    story.append(Spacer(1, 12))

    # Hierarchical System Structure
    story.append(Paragraph("2. Hierarchical Directory & Component Structure", h1_style))
    story.append(Paragraph("The system is logically partitioned into discrete modules across the client, server, RAG store, and knowledge bases:", body_style))

    comp_data = [
        [Paragraph("Directory / Component", table_header_style), Paragraph("Role & Execution Logic", table_header_style)],
        [Paragraph("frontend/src/App.jsx", table_cell_bold), Paragraph("Main orchestrator: Manages state for active device, messages, diagnostics modal, upload modal.", table_cell_style)],
        [Paragraph("frontend/src/components/Sidebar.jsx", table_cell_bold), Paragraph("Device selector panel: Allows user to filter technical context by device (Sony, TP-Link, Ecobee, etc.).", table_cell_style)],
        [Paragraph("frontend/src/components/ChatMessage.jsx", table_cell_bold), Paragraph("Renders conversational bubbles, AI output, hallucination check status, and interactive citation cards.", table_cell_style)],
        [Paragraph("backend/src/server.js", table_cell_bold), Paragraph("Express server bootstrapper (Port 5000): Automatically executes loadAndIndexAll() on startup.", table_cell_style)],
        [Paragraph("backend/src/chatService.js", table_cell_bold), Paragraph("Central pipeline brain: Classifies domain, invokes vector search, constructs context, calls LLM, logs telemetry.", table_cell_style)],
        [Paragraph("backend/src/vectorStore.js", table_cell_bold), Paragraph("RAG Vector Engine: Deterministic 768-D dense embeddings, sliding chunker, and Cosine similarity search.", table_cell_style)],
        [Paragraph("backend/src/llm.js", table_cell_bold), Paragraph("Model API client: Executes conversation intent assessment, grounded prompt generation, and vision inspection.", table_cell_style)],
        [Paragraph("backend/src/db.js & interactions.js", table_cell_bold), Paragraph("SQLite database & JSONL audit logger for tracking interaction IDs, latency, user feedback, and citations.", table_cell_style)],
    ]
    t_comp = Table(comp_data, colWidths=[170, 334])
    t_comp.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), primary_color),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, light_bg]),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    story.append(t_comp)
    story.append(Spacer(1, 14))

    # Page Break for Clean Layout
    story.append(PageBreak())

    # Datasets Breakdown
    story.append(Paragraph("3. Knowledge Base & Dataset Inventory", h1_style))
    story.append(Paragraph("The system operates on multiple structured and semi-structured datasets stored in <code>backend/data/</code>:", body_style))

    dataset_data = [
        [Paragraph("Dataset Name", table_header_style), Paragraph("Location & Format", table_header_style), Paragraph("Source & Description", table_header_style)],
        [
            Paragraph("Maktek General FAQs", table_cell_bold),
            Paragraph("backend/data/faq/<br/>general_support_faqs.jsonl<br/>(Lines 1–200)", table_cell_style),
            Paragraph("Hugging Face Hub (Maktek Ecommerce Support). Covers order placement, payments, shipping times, returns, accounts.", table_cell_style)
        ],
        [
            Paragraph("Bitext Customer Support", table_cell_bold),
            Paragraph("backend/data/faq/<br/>general_support_faqs.jsonl<br/>(Lines 201–687)", table_cell_style),
            Paragraph("Hugging Face Hub (Bitext Intent Training Benchmark). 480+ detailed conversational intents: cancel_order, track_refund, change_order.", table_cell_style)
        ],
        [
            Paragraph("Device Manuals & Technical Docs", table_cell_bold),
            Paragraph("backend/data/products/<br/>[product-slug]/*.md", table_cell_style),
            Paragraph("Official OEM manuals: Sony WH-1000XM5, TP-Link Archer AX21, Ecobee Thermostat, MacBook Air M2, Dell OptiPlex 7050.", table_cell_style)
        ],
        [
            Paragraph("General Hardware FAQs", table_cell_bold),
            Paragraph("backend/data/products/<br/>general-support-faqs/faqs.csv", table_cell_style),
            Paragraph("Curated electronics Q&A: USB-PD chargers, lithium-ion battery care, Wi-Fi diagnosis, cushion cleaning.", table_cell_style)
        ],
        [
            Paragraph("Runtime Telemetry & DB", table_cell_bold),
            Paragraph("backend/data/assistant.db<br/>backend/data/interactions.jsonl", table_cell_style),
            Paragraph("SQLite tables: sessions, messages, feedback, verified memory chunks. Continuous telemetry log stream.", table_cell_style)
        ],
    ]
    t_data = Table(dataset_data, colWidths=[115, 145, 244])
    t_data.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), primary_color),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, light_bg]),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    story.append(t_data)
    story.append(Spacer(1, 14))

    # Request-to-Response Pipeline Flow
    story.append(Paragraph("4. End-to-End Request-to-Response Pipeline Flow", h1_style))
    story.append(Paragraph("When an end-user submits a query, it undergoes a deterministic multi-stage pipelined lifecycle:", body_style))

    pipeline_steps = [
        ("Step 1: Client Query Dispatch", "User inputs query on React UI (App.jsx). The client attaches active product context (if any) and sends HTTP POST to /api/chat."),
        ("Step 2: Intent & Domain Assessment", "chatService.js evaluates query intent via assessConversation() in llm.js. The query is routed to 'general_support' (FAQ), 'product_support' (Device Manual), or 'clarification_needed'."),
        ("Step 3: Dense Embedding & RAG Vector Search", "vectorStore.js calculates a 768-D normalized hash embedding of the query and runs Cosine Similarity search over indexed chunks, retrieving Top-K candidates above similarity threshold."),
        ("Step 4: Grounded Context Assembly", "buildProductContext() / buildFaqContext() compiles retrieved doc chunks, section metadata, hardware version tags, and approved historical memory into an immutable evidence block."),
        ("Step 5: Constrained LLM Generation", "generateGroundedAnswer() prompts the model with strict anti-hallucination guardrails: Answer ONLY from supplied context. If evidence is insufficient, emit NOT_FOUND: escalation token."),
        ("Step 6: Citations & Telemetry Audit", "Source citations (source name, section, similarity score) are structured, and the full Q&A exchange is written to SQLite (assistant.db) and interactions.jsonl."),
        ("Step 7: Frontend Response Rendering", "React UI displays formatted markdown answer with verified source badges, similarity indicators, and interactive user feedback thumbs.")
    ]

    for step_title, step_desc in pipeline_steps:
        story.append(Paragraph(f"<b>{step_title}</b>: {step_desc}", bullet_style))

    story.append(Spacer(1, 14))

    # RAG Vector Engine Technical Details
    story.append(Paragraph("5. RAG Engine & Vector Store Mathematical Mechanism", h1_style))
    rag_desc = (
        "The vector store implements a deterministic <b>768-dimensional normalized dense embedding algorithm</b> "
        "using 1-gram and 2-gram SHA-256 bit shifting, guaranteeing reproducible embedding vectors across runtime sessions "
        "without external embedding API latency or cost.<br/><br/>"
        "• <b>Chunking Strategy:</b> Sliding window of 220 words with 35-word overlap, preserving sentence boundaries.<br/>"
        "• <b>Similarity Metric:</b> Normalized Cosine Similarity: <code>Sim(A, B) = A · B / (||A|| * ||B||)</code><br/>"
        "• <b>Version-Aware Retrieval:</b> If a device version (e.g. V1 vs V2) is detected, hardware revision metadata is filtered to prevent cross-version technical discrepancies."
    )
    story.append(Paragraph(rag_desc, body_style))

    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"Successfully generated {filename}")

if __name__ == "__main__":
    build_pdf()
