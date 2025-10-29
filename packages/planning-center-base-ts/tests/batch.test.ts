/**
 * Tests for BatchExecutor (base package)
 */

import { BatchExecutor } from '../src/batch';
import { PcoEventEmitter } from '../src/monitoring';
import type { BatchOperation, BatchResult, BatchOptions } from '../src/types/batch';

describe('BatchExecutor', () => {
  let batchExecutor: BatchExecutor;
  let eventEmitter: PcoEventEmitter;
  let mockClient: any;

  beforeEach(() => {
    eventEmitter = new PcoEventEmitter();
    mockClient = {
      request: jest.fn(),
    };
    batchExecutor = new BatchExecutor(mockClient, eventEmitter);
  });

  describe('execute', () => {
    it('should execute simple batch operations', async () => {
      const operations: BatchOperation[] = [
        {
          id: 'op1',
          type: 'create',
          resourceType: 'Resource',
          endpoint: '/resources',
          data: { name: 'Resource 1' },
        },
        {
          id: 'op2',
          type: 'create',
          resourceType: 'Resource',
          endpoint: '/resources',
          data: { name: 'Resource 2' },
        },
      ];

      mockClient.request
        .mockResolvedValueOnce({
          data: { data: { id: '1', type: 'Resource' } },
          status: 201,
        })
        .mockResolvedValueOnce({
          data: { data: { id: '2', type: 'Resource' } },
          status: 201,
        });

      const result = await batchExecutor.execute(operations);

      expect(result.total).toBe(2);
      expect(result.successful).toBe(2);
      expect(result.failed).toBe(0);
      expect(result.successRate).toBe(1.0);
      expect(result.results).toHaveLength(2);
    });

    it('should handle operations with dependencies', async () => {
      const operations: BatchOperation[] = [
        {
          id: 'op1',
          type: 'create',
          resourceType: 'Resource',
          endpoint: '/resources',
          data: { name: 'Parent' },
        },
        {
          id: 'op2',
          type: 'create',
          resourceType: 'Related',
          endpoint: '/related',
          data: { parent_id: '$op1.id', name: 'Child' },
          dependsOn: ['op1'],
        },
      ];

      mockClient.request
        .mockResolvedValueOnce({
          data: { data: { id: 'parent-1', type: 'Resource' } },
          status: 201,
        })
        .mockResolvedValueOnce({
          data: { data: { id: 'child-1', type: 'Related' } },
          status: 201,
        });

      const result = await batchExecutor.execute(operations);

      expect(result.total).toBe(2);
      expect(result.successful).toBe(2);
      expect(result.results[1].operation.data.parent_id).toBe('parent-1');
    });

    it('should handle partial failures with continueOnError', async () => {
      const operations: BatchOperation[] = [
        {
          id: 'op1',
          type: 'create',
          resourceType: 'Resource',
          endpoint: '/resources',
          data: { name: 'Success' },
        },
        {
          id: 'op2',
          type: 'create',
          resourceType: 'Resource',
          endpoint: '/resources',
          data: { name: 'Failure' },
        },
      ];

      mockClient.request
        .mockResolvedValueOnce({
          data: { data: { id: '1', type: 'Resource' } },
          status: 201,
        })
        .mockRejectedValueOnce(new Error('Validation failed'));

      const result = await batchExecutor.execute(operations, {
        continueOnError: true,
      });

      expect(result.total).toBe(2);
      expect(result.successful).toBe(1);
      expect(result.failed).toBe(1);
      expect(result.results[1].success).toBe(false);
      expect(result.results[1].error).toBeDefined();
    });

    it('should respect maxConcurrency', async () => {
      const operations: BatchOperation[] = [
        {
          id: 'op1',
          type: 'create',
          resourceType: 'Resource',
          endpoint: '/resources',
          data: { name: '1' },
        },
        {
          id: 'op2',
          type: 'create',
          resourceType: 'Resource',
          endpoint: '/resources',
          data: { name: '2' },
        },
        {
          id: 'op3',
          type: 'create',
          resourceType: 'Resource',
          endpoint: '/resources',
          data: { name: '3' },
        },
      ];

      let concurrentRequests = 0;
      let maxConcurrent = 0;

      mockClient.request.mockImplementation(async () => {
        concurrentRequests++;
        maxConcurrent = Math.max(maxConcurrent, concurrentRequests);
        await new Promise((resolve) => setTimeout(resolve, 10));
        concurrentRequests--;
        return {
          data: { data: { id: '1', type: 'Resource' } },
          status: 201,
        };
      });

      await batchExecutor.execute(operations, {
        maxConcurrency: 2,
      });

      expect(maxConcurrent).toBeLessThanOrEqual(2);
    });

    it('should call onOperationComplete callback', async () => {
      const onOperationComplete = jest.fn();
      const operations: BatchOperation[] = [
        {
          id: 'op1',
          type: 'create',
          resourceType: 'Resource',
          endpoint: '/resources',
          data: { name: 'Test' },
        },
      ];

      mockClient.request.mockResolvedValueOnce({
        data: { data: { id: '1', type: 'Resource' } },
        status: 201,
      });

      await batchExecutor.execute(operations, {
        onOperationComplete,
      });

      expect(onOperationComplete).toHaveBeenCalled();
    });

    it('should call onBatchComplete callback', async () => {
      const onBatchComplete = jest.fn();
      const operations: BatchOperation[] = [
        {
          id: 'op1',
          type: 'create',
          resourceType: 'Resource',
          endpoint: '/resources',
          data: { name: 'Test' },
        },
      ];

      mockClient.request.mockResolvedValueOnce({
        data: { data: { id: '1', type: 'Resource' } },
        status: 201,
      });

      await batchExecutor.execute(operations, {
        onBatchComplete,
      });

      expect(onBatchComplete).toHaveBeenCalledWith(
        expect.objectContaining({
          total: 1,
          successful: 1,
        })
      );
    });

    it('should handle reference resolution', async () => {
      const operations: BatchOperation[] = [
        {
          id: 'op1',
          type: 'create',
          resourceType: 'Resource',
          endpoint: '/resources',
          data: { name: 'Parent' },
        },
        {
          id: 'op2',
          type: 'create',
          resourceType: 'Related',
          endpoint: '/related',
          data: { resource_id: '$op1.id' },
          dependsOn: ['op1'],
        },
      ];

      mockClient.request
        .mockResolvedValueOnce({
          data: { data: { id: 'parent-123', type: 'Resource' } },
          status: 201,
        })
        .mockResolvedValueOnce({
          data: { data: { id: 'child-456', type: 'Related' } },
          status: 201,
        });

      const result = await batchExecutor.execute(operations);

      expect(result.results[1].operation.data.resource_id).toBe('parent-123');
      expect(mockClient.request).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            resource_id: 'parent-123',
          }),
        })
      );
    });
  });
});

