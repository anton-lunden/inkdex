---
title: API Documentation
version: "2.0"
---

# API Documentation

## Authentication

All API requests require a valid JWT token in the Authorization header.
To obtain a token, send a POST request to `/auth/login` with your credentials.
Tokens expire after 24 hours and must be refreshed using the `/auth/refresh` endpoint.

## Rate Limiting

The API enforces rate limiting to ensure fair usage across all clients.
Default limits are 100 requests per minute for authenticated users
and 10 requests per minute for unauthenticated access.
Exceeding the limit returns a 429 Too Many Requests response.

## Error Handling

All errors follow a consistent JSON format with a `code` field and a `message` field.
Common error codes include 400 for bad requests, 401 for unauthorized access,
403 for forbidden resources, and 500 for internal server errors.
Each error response includes a unique `request_id` for debugging purposes.
