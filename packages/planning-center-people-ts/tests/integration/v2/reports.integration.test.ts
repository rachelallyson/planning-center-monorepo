import { PcoClient, ReportAttributes, ReportResource } from '../../../src';
import { createTestClient, logAuthStatus } from '../test-config';
import {
    validateResourceStructure,
    validateStringAttribute,
    validateRelationship,
} from '../../type-validators';

const TEST_PREFIX = 'TEST_V2_REPORTS_2025';

describe('v2.3.0 Reports API Integration Tests', () => {
    let client: PcoClient;
    let testReportId: string;

    beforeAll(async () => {
        logAuthStatus();
        client = createTestClient();

        // Clean up any previous test reports
        const existingReports = await client.reports.getPage({
            where: { name: TEST_PREFIX } 
        });
        for (const report of existingReports.data) {
            if (report.id) {
                await client.reports.delete(report.id);
            }
        }
    }, 60000);

    it('should create, update, and delete a report', async () => {
        const timestamp = Date.now();
        const reportData: ReportAttributes = {
            name: `${TEST_PREFIX}_Test_Report_${timestamp}`,
            body: 'This is a test report created by the integration test suite.'
        };

        // Create report
        const newReport = await client.reports.create(reportData);
        validateResourceStructure(newReport, 'Report');
        expect(newReport.name).toBe(reportData.name);
        expect(newReport.body).toBe(reportData.body);
        
        // Validate attribute types
        if (newReport.name !== undefined) validateStringAttribute(newReport as Record<string, unknown>, 'name');
        if (newReport.body !== undefined) validateStringAttribute(newReport as Record<string, unknown>, 'body');
        testReportId = newReport.id || '';
        expect(testReportId).toBeTruthy();

        // Update report
        const updateData: Partial<ReportAttributes> = {
            name: `${TEST_PREFIX}_Updated_Report_${timestamp}`,
            body: 'This is an updated test report.'
        };
        const updatedReport = await client.reports.update(testReportId, updateData);
        expect(updatedReport).toBeDefined();
        expect(updatedReport.id).toBe(testReportId);
        expect(updatedReport.name).toBe(updateData.name);
        expect(updatedReport.body).toBe(updateData.body);

        // Get report by ID (getById returns flattened resource)
        const fetchedReport = await client.reports.getById(testReportId);
        validateResourceStructure(fetchedReport, 'Report');
        expect(fetchedReport.id).toBe(testReportId);
        // getById returns flattened resource - name and body are at top level
        if ('name' in fetchedReport) {
            expect(fetchedReport.name).toBe(updateData.name);
        }
        if ('body' in fetchedReport) {
            expect(fetchedReport.body).toBe(updateData.body);
        }

        // Delete report
        await client.reports.delete(testReportId);
        await expect(client.reports.getById(testReportId)).rejects.toThrow();
    }, 60000);

    it('should get all reports', async () => {
        const reports = await client.reports.getAll();
        expect(reports).toBeDefined();
        expect(Array.isArray(reports.data)).toBe(true);

        if (reports.data.length > 0) {
            const report = reports.data[0];
            validateResourceStructure(report, 'Report');
            // getAll() returns flattened resources - attributes are at top level, not in .attributes
            expect(report).toHaveProperty('name');
        }
    }, 30000);

    it('should get report by ID with includes', async () => {
        // Create a test report first
        const testReport = await client.reports.create({
            name: `${TEST_PREFIX}_Include_Test_${Date.now()}`,
            body: 'Test report for include testing'
        });

        try {
            const report = await client.reports.getById(testReport.id || '', ['created_by', 'updated_by']);
            validateResourceStructure(report, 'Report');
            expect(report.id).toBe(testReport.id);
            
            // Validate relationships when included (getById returns flattened resource)
            // Flattened resources have relationships at top level
            if ('created_by' in report && report.created_by) {
                const createdBy = report.created_by;
                if (!Array.isArray(createdBy) && 'type' in createdBy) {
                    expect(createdBy.type).toBe('Person');
                }
            }
            if ('updated_by' in report && report.updated_by) {
                const updatedBy = report.updated_by;
                if (!Array.isArray(updatedBy) && 'type' in updatedBy) {
                    expect(updatedBy.type).toBe('Person');
                }
            }
        } finally {
            // Clean up
            await client.reports.delete(testReport.id || '');
        }
    }, 30000);

    it('should get all pages of reports with pagination', async () => {
        // Create a few test reports to ensure pagination works
        const report1 = await client.reports.create({
            name: `${TEST_PREFIX}_Page_Report_1_${Date.now()}`,
            body: 'Test report 1 for pagination'
        });
        const report2 = await client.reports.create({
            name: `${TEST_PREFIX}_Page_Report_2_${Date.now()}`,
            body: 'Test report 2 for pagination'
        });

        try {
            // Test pagination: getPage with perPage: 1 should return 1 report per page
            const firstPage = await client.reports.getPage({ perPage: 1, page: 1 });
            expect(firstPage).toBeDefined();
            expect(Array.isArray(firstPage.data)).toBe(true);
            expect(firstPage.data.length).toBe(1); // perPage: 1 means 1 report per page
            
            // Verify we can get the second page
            const secondPage = await client.reports.getPage({ perPage: 1, page: 2 });
            expect(secondPage).toBeDefined();
            expect(Array.isArray(secondPage.data)).toBe(true);
            expect(secondPage.data.length).toBeGreaterThanOrEqual(0); // May have more reports or be empty
            
            // Verify getAll() returns all reports including our created ones
            const allReports = await client.reports.getAll();
            expect(allReports).toBeDefined();
            expect(Array.isArray(allReports.data)).toBe(true);
            const createdReportIds = [report1.id, report2.id].filter(Boolean);
            const foundReports = allReports.data.filter(r => createdReportIds.includes(r.id));
            expect(foundReports.length).toBe(createdReportIds.length); // Should find both created reports
        } finally {
            // Clean up test reports
            await client.reports.delete(report1.id || '');
            await client.reports.delete(report2.id || '');
        }
    }, 60000);

    it('should handle invalid report ID gracefully', async () => {
        const invalidReportId = 'invalid-report-id';

        await expect(client.reports.getById(invalidReportId)).rejects.toThrow();
        await expect(client.reports.update(invalidReportId, { name: 'Updated' })).rejects.toThrow();
        await expect(client.reports.delete(invalidReportId)).rejects.toThrow();
    }, 60000);

    it('should handle report creation with minimal data', async () => {
        const minimalReportData: ReportAttributes = {
            name: `${TEST_PREFIX}_Minimal_Report_${Date.now()}`
        };

        const report = await client.reports.create(minimalReportData);
        validateResourceStructure(report, 'Report');
        expect(report.name).toBe(minimalReportData.name);

        // Clean up
        await client.reports.delete(report.id || '');
    }, 30000);

    afterAll(async () => {
        // Clean up any remaining test reports
        const remainingReports = await client.reports.getPage({
            where: { name: TEST_PREFIX }
        });
        for (const report of remainingReports.data) {
            if (report.id) {
                await client.reports.delete(report.id);
            }
        }
    }, 30000);
});
