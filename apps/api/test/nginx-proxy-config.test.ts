import { readFileSync } from 'fs';
import { resolve } from 'path';
import { describe, expect, it } from 'vitest';

describe('production Nginx API proxy', () => {
  const config = readFileSync(resolve(process.cwd(), '../web/nginx.conf'), 'utf8');

  it('preserves /api and forwards the reverse-proxy headers exactly once', () => {
    expect(config).toMatch(/location \^~ \/api\/\s*\{[\s\S]*proxy_pass http:\/\/api:3001;/);
    expect(config).not.toContain('proxy_pass http://api:3001/;');

    for (const header of [
      'proxy_set_header Host $host;',
      'proxy_set_header X-Real-IP $remote_addr;',
      'proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;',
      'proxy_set_header X-Forwarded-Proto $scheme;',
      'proxy_set_header Upgrade $http_upgrade;',
      'proxy_set_header Connection "upgrade";',
    ]) {
      expect(config.split(header)).toHaveLength(2);
    }
  });
});
