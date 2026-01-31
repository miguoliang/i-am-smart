---
name: performance
description: Frontend/backend/network optimization. Use when optimizing performance, bundle size, or queries.
---

# Performance Optimization

Follow these principles for optimal application performance.

## Performance Awareness

- Measure before optimizing.
- Understand time and space complexity.
- Optimize bottlenecks, not everything.
- Consider scalability from the start.
- Use appropriate data structures and algorithms.

## Optimization Strategy

- Profile before optimizing.
- Identify actual bottlenecks through measurement.
- Optimize bottlenecks, not everything.
- Consider the trade-offs of optimizations.
- Document performance-critical code.

## Frontend Performance

- Minimize bundle size.
- Use code splitting and lazy loading.
- Optimize images and assets.
- Minimize re-renders in React.
- Use React.memo and useMemo appropriately.
- Implement proper caching strategies.

## Backend Performance

- Optimize database queries.
- Use appropriate indexing strategies.
- Implement caching where appropriate.
- Minimize network requests.
- Use connection pooling for databases.
- Consider database query efficiency.

## Network Optimization

- Minimize network requests.
- Use HTTP caching headers appropriately.
- Implement request batching when possible.
- Use compression for large payloads.
- Consider CDN for static assets.
