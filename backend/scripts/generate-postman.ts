/**
 * Postman Collection Generator for TikTokWeb API
 *
 * Generates a Postman Collection v2.1 JSON file from the route registry.
 * When you add a new controller/endpoint, add it to the ROUTE_REGISTRY below.
 *
 * Usage: npm run postman:generate
 * Output: postman/tiktokweb-api.postman_collection.json
 */

import * as fs from 'fs';
import * as path from 'path';

// ─── Types ───────────────────────────────────────────────────────────
interface RouteEntry {
  name: string;
  method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  path: string;
  description?: string;
  auth?: boolean;
  body?: Record<string, any>;
  query?: { key: string; value: string; description?: string }[];
}

interface FolderEntry {
  name: string;
  description?: string;
  routes: RouteEntry[];
}

// ─── Route Registry ──────────────────────────────────────────────────
// Add your routes here when you create new controllers.
const ROUTE_REGISTRY: FolderEntry[] = [
  {
    name: 'Auth',
    description: 'Authentication endpoints: register, login, refresh, logout, Google OAuth',
    routes: [
      {
        name: 'Register',
        method: 'POST',
        path: '/api/auth/register',
        description: 'Create a new user account',
        body: {
          email: 'user@example.com',
          password: 'Password123',
          username: 'johndoe',
          displayName: 'John Doe',
        },
      },
      {
        name: 'Login',
        method: 'POST',
        path: '/api/auth/login',
        description: 'Login with email and password',
        body: {
          email: 'user@example.com',
          password: 'Password123',
        },
      },
      {
        name: 'Refresh Token',
        method: 'POST',
        path: '/api/auth/refresh',
        description: 'Get a new access token using a refresh token',
        body: {
          refreshToken: '<paste_refresh_token_here>',
        },
      },
      {
        name: 'Logout',
        method: 'POST',
        path: '/api/auth/logout',
        description: 'Invalidate the refresh token',
        auth: true,
        body: {
          refreshToken: '<paste_refresh_token_here>',
        },
      },
      {
        name: 'Google Login',
        method: 'POST',
        path: '/api/auth/google',
        description: 'Login or register with a Google ID token',
        body: {
          idToken: '<google_id_token>',
        },
      },
    ],
  },
  {
    name: 'Users',
    description: 'User profile, follow/unfollow, search endpoints',
    routes: [
      {
        name: 'Get My Profile',
        method: 'GET',
        path: '/api/users/me',
        description: 'Get current authenticated user profile',
        auth: true,
      },
      {
        name: 'Update My Profile',
        method: 'PATCH',
        path: '/api/users/me',
        description: 'Update current user profile',
        auth: true,
        body: {
          displayName: 'New Display Name',
          bio: 'My bio here',
          avatarUrl: 'https://example.com/avatar.jpg',
          dob: '2000-01-15',
          gender: 0,
        },
      },
      {
        name: 'Search Users',
        method: 'GET',
        path: '/api/users/search',
        description: 'Search users by username or display name',
        query: [
          { key: 'q', value: 'john', description: 'Search keyword' },
          { key: 'limit', value: '10', description: 'Number of results (1-100)' },
          { key: 'cursor', value: '', description: 'Cursor for pagination' },
        ],
      },
      {
        name: 'Get Public Profile',
        method: 'GET',
        path: '/api/users/:id',
        description: 'Get a user public profile by ID',
      },
      {
        name: 'Follow User',
        method: 'POST',
        path: '/api/users/:id/follow',
        description: 'Follow a user',
        auth: true,
      },
      {
        name: 'Unfollow User',
        method: 'DELETE',
        path: '/api/users/:id/follow',
        description: 'Unfollow a user',
        auth: true,
      },
      {
        name: 'Get Followers',
        method: 'GET',
        path: '/api/users/:id/followers',
        description: 'Get list of followers for a user',
        query: [
          { key: 'limit', value: '10', description: 'Number of results' },
          { key: 'cursor', value: '', description: 'Cursor for pagination' },
        ],
      },
      {
        name: 'Get Following',
        method: 'GET',
        path: '/api/users/:id/following',
        description: 'Get list of users a user is following',
        query: [
          { key: 'limit', value: '10', description: 'Number of results' },
          { key: 'cursor', value: '', description: 'Cursor for pagination' },
        ],
      },
    ],
  },
];

// ─── Postman Collection Builder ──────────────────────────────────────

function buildPostmanUrl(routePath: string, queryParams?: RouteEntry['query']) {
  const raw = `{{baseUrl}}${routePath}`;
  const pathSegments = routePath.split('/').filter(Boolean);

  const host = ['{{baseUrl}}'];
  const variable: any[] = [];

  // Extract path variables like :id
  const processedPath = pathSegments.map((seg) => {
    if (seg.startsWith(':')) {
      const varName = seg.slice(1);
      variable.push({
        key: varName,
        value: `<${varName}>`,
        description: `${varName} parameter`,
      });
      return `:${varName}`;
    }
    return seg;
  });

  return {
    raw: raw,
    host,
    path: processedPath,
    ...(queryParams && queryParams.length > 0
      ? {
          query: queryParams.map((q) => ({
            key: q.key,
            value: q.value,
            description: q.description || '',
            disabled: !q.value,
          })),
        }
      : {}),
    ...(variable.length > 0 ? { variable } : {}),
  };
}

function buildRequestItem(route: RouteEntry) {
  const item: any = {
    name: route.name,
    request: {
      method: route.method,
      header: [
        {
          key: 'Content-Type',
          value: 'application/json',
        },
      ],
      url: buildPostmanUrl(route.path, route.query),
      description: route.description || '',
    },
  };

  // Add auth header for protected routes
  if (route.auth) {
    item.request.auth = {
      type: 'bearer',
      bearer: [
        {
          key: 'token',
          value: '{{accessToken}}',
          type: 'string',
        },
      ],
    };
  }

  // Add request body for POST/PATCH/PUT
  if (route.body) {
    item.request.body = {
      mode: 'raw',
      raw: JSON.stringify(route.body, null, 2),
      options: {
        raw: {
          language: 'json',
        },
      },
    };
  }

  return item;
}

function buildCollection() {
  return {
    info: {
      name: 'TikTokWeb API',
      description:
        'API collection for TikTokWeb backend.\n\n**Setup:**\n1. Create an environment with `baseUrl` = `http://localhost:3000`\n2. Register/Login to get tokens\n3. Set `accessToken` variable from the login response\n\n**i18n:**\nError responses include a `messageCode` field for frontend i18n lookup.',
      schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
    },
    variable: [
      {
        key: 'baseUrl',
        value: 'http://localhost:3000',
        type: 'string',
      },
      {
        key: 'accessToken',
        value: '',
        type: 'string',
      },
    ],
    item: ROUTE_REGISTRY.map((folder) => ({
      name: folder.name,
      description: folder.description || '',
      item: folder.routes.map(buildRequestItem),
    })),
    event: [
      {
        listen: 'prerequest',
        script: {
          type: 'text/javascript',
          exec: [''],
        },
      },
    ],
  };
}

// ─── Main ────────────────────────────────────────────────────────────
function main() {
  const collection = buildCollection();
  const outputDir = path.resolve(__dirname, '..', 'postman');
  const outputFile = path.join(outputDir, 'tiktokweb-api.postman_collection.json');

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(outputFile, JSON.stringify(collection, null, 2), 'utf-8');

  console.log(`\n✅ Postman collection generated successfully!`);
  console.log(`   📁 ${outputFile}`);
  console.log(`\n   Import into Postman: File → Import → Upload Files → select the JSON\n`);
}

main();
