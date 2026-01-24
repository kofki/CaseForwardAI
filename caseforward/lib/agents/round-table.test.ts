
import { RoundTable } from './round-table';
import { generateText, generateObject } from 'ai';
import { CaseContext } from './services/case-context.service';

// Mock the 'ai' module
jest.mock('ai', () => ({
    generateText: jest.fn(),
    generateObject: jest.fn(),
    google: jest.fn(),
}));

// Mock @ai-sdk/google
jest.mock('@ai-sdk/google', () => ({
    google: jest.fn().mockImplementation((model) => `mocked-model-${model}`),
    createGoogleGenerativeAI: jest.fn().mockReturnValue((model: string) => `mocked-custom-model-${model}`),
}));

// Helper to create a mock CaseContext
function createMockCaseContext(overrides: Partial<CaseContext> = {}): CaseContext {
    return {
        caseId: 'test-case-123',
        caseNumber: 'CF-2025-12345',
        caseType: 'auto_accident',
        status: 'treatment',
        client: {
            name: 'Test Client',
            email: 'test@email.com',
            phone: '555-0000',
        },
        team: {
            leadAttorney: 'Test Attorney',
            paralegal: 'Test Paralegal',
        },
        insurance: {
            defendantCarrier: 'Test Insurance',
            claimNumber: 'CLM-123',
            policyLimit: 100000,
            adjusterName: 'Adjuster',
            adjusterEmail: 'adj@ins.com',
            adjusterPhone: '555-1111',
        },
        incident: {
            date: new Date('2025-01-01'),
            location: 'Test Location',
            description: 'Test incident',
        },
        financials: {
            totalMedicalBills: 10000,
            totalLiens: 5000,
            lostWages: 2000,
            propertyDamage: 1000,
        },
        evidenceChecklist: {
            clientIntake: true,
            retainerSigned: true,
            policeReport: false,
            medicalRecords: true,
            medicalBills: true,
            incidentPhotos: false,
            witnessStatements: false,
            payStubs: true,
            employerLetter: false,
            insuranceDocs: true,
        },
        missingDocuments: ['Police Report', 'Incident Photos', 'Witness Statements', 'Employer Letter'],
        documents: [],
        liens: [],
        recentActions: [],
        aiFlags: [],
        daysUntilSOL: 365,
        ...overrides,
    };
}

describe('RoundTable', () => {
    let table: RoundTable;

    beforeEach(() => {
        jest.clearAllMocks();
        table = new RoundTable();
    });

    it('should initialize with correct specialists', () => {
        // Accessing private property for testing purposes using 'any' cast or we can check behavior
        const t = table as any;
        expect(t.specialists.CLIENT_GURU).toBeDefined();
        expect(t.specialists.EVIDENCE_ANALYZER).toBeDefined();
        expect(t.specialists.SETTLEMENT_VALUATOR).toBeDefined();
    });

    it('should run a discussion and reach consensus', async () => {
        // 1. Mock Specialist Opinions
        (generateText as jest.Mock).mockResolvedValueOnce({ text: "I'm the Guru and I say we should be nice." }); // Guru Opine
        (generateText as jest.Mock).mockResolvedValueOnce({ text: "I'm the Analyzer and I say the dates are wrong." }); // Analyzer Opine
        (generateText as jest.Mock).mockResolvedValueOnce({ text: "I'm the Valuator and the medical bills total $5,000." }); // Valuator Opine

        // 2. Mock Consensus Object
        const mockCard = {
            title: "Draft Email to Client",
            description: "Send a polite update asking for the correct dates.",
            type: "DRAFT_EMAIL",
            confidence: 0.9,
            reasoning: "Guru wants to be nice, Analyzer noted date issues.",
            metadata: { draft: "Hello..." }
        };

        (generateObject as jest.Mock).mockResolvedValueOnce({ object: mockCard });

        const mockContext = createMockCaseContext();
        const result = await table.discuss("Clients are complaining about the delay", mockContext);

        // Check History Steps
        // 1. Orchestrator Intro
        // 2. Guru Opine
        // 3. Analyzer Opine
        // 4. Valuator Opine
        // 5. Orchestrator Synthesis
        expect(result.history).toHaveLength(5);

        expect(result.history[0].role).toBe('ORCHESTRATOR');
        expect(result.history[1].role).toBe('CLIENT_GURU');
        expect(result.history[1].content).toBe("I'm the Guru and I say we should be nice.");
        expect(result.history[2].role).toBe('EVIDENCE_ANALYZER');
        expect(result.history[2].content).toBe("I'm the Analyzer and I say the dates are wrong.");
        expect(result.history[3].role).toBe('SETTLEMENT_VALUATOR');
        expect(result.history[3].content).toBe("I'm the Valuator and the medical bills total $5,000.");

        // Check Card
        expect(result.card).toBeDefined();
        expect(result.card.title).toBe(mockCard.title);
        expect(result.card.originator).toBe('ORCHESTRATOR');
    });

    it('should handle API errors gracefully (if implemented within the classes)', async () => {
        // If we wanted to test error handling, we would mock rejection here.
        // For now, let's just ensure the flow holds up.
        (generateText as jest.Mock).mockResolvedValue({ text: "Generic Reponse" });
        (generateObject as jest.Mock).mockResolvedValue({ object: { title: "Generic Action", type: "NO_ACTION", confidence: 1, reasoning: "None", description: "None" } });

        const mockContext = createMockCaseContext();
        const result = await table.discuss("Input", mockContext);
        expect(result.card).toBeDefined();
    });
});

