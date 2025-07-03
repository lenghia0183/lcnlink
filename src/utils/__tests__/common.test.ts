import { mergePayload } from '../common';

describe('mergePayload', () => {
  it('should merge two simple objects', () => {
    const param = { id: '123', name: 'John' };
    const body = { email: 'john@example.com', age: 30 };
    
    const result = mergePayload(param, body);
    
    expect(result).toEqual({
      id: '123',
      name: 'John',
      email: 'john@example.com',
      age: 30
    });
  });

  it('should merge nested objects', () => {
    const param = { 
      id: '123', 
      user: { name: 'John', role: 'admin' } 
    };
    const body = { 
      email: 'john@example.com', 
      user: { age: 30, department: 'IT' } 
    };
    
    const result = mergePayload(param, body);
    
    expect(result).toEqual({
      id: '123',
      email: 'john@example.com',
      user: {
        name: 'John',
        role: 'admin',
        age: 30,
        department: 'IT'
      }
    });
  });

  it('should handle body values taking precedence for non-objects', () => {
    const param = { id: '123', status: 'draft' };
    const body = { id: '456', status: 'published', title: 'New Title' };
    
    const result = mergePayload(param, body);
    
    expect(result).toEqual({
      id: '456', // body takes precedence
      status: 'published', // body takes precedence
      title: 'New Title'
    });
  });

  it('should handle null and undefined values', () => {
    const param = { id: '123', name: null, description: undefined };
    const body = { email: 'test@example.com', name: 'John', age: null };
    
    const result = mergePayload(param, body);
    
    expect(result).toEqual({
      id: '123',
      email: 'test@example.com',
      name: 'John', // body takes precedence
      description: undefined,
      age: null
    });
  });

  it('should handle arrays correctly (not merge them)', () => {
    const param = { id: '123', tags: ['tag1', 'tag2'] };
    const body = { tags: ['tag3', 'tag4'], categories: ['cat1'] };
    
    const result = mergePayload(param, body);
    
    expect(result).toEqual({
      id: '123',
      tags: ['tag3', 'tag4'], // body array takes precedence
      categories: ['cat1']
    });
  });

  it('should maintain type safety', () => {
    interface ParamType {
      id: string;
      count: number;
    }
    
    interface BodyType {
      name: string;
      active: boolean;
    }
    
    const param: ParamType = { id: '123', count: 5 };
    const body: BodyType = { name: 'Test', active: true };
    
    const result = mergePayload(param, body);
    
    // TypeScript should infer the correct type
    expect(result.id).toBe('123');
    expect(result.count).toBe(5);
    expect(result.name).toBe('Test');
    expect(result.active).toBe(true);
  });
});
