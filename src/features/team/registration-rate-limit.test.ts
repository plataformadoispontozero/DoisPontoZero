// @vitest-environment node
import { PGlite } from '@electric-sql/pglite'
import { describe, expect, it } from 'vitest'
import { registrationRateLimitHashes } from '../../../supabase/functions/team-registration/rateLimit'
import migration from '../../../supabase/migrations/20261012084523_team_registration_review.sql?raw'

describe('registration rate limit email fallback', () => {
  it('normalizes email and preserves the existing email hash', async () => {
    const hashes = await registrationRateLimitHashes('  Person@Example.test  ', 'test-secret')
    expect(hashes).toEqual(await registrationRateLimitHashes('person@example.test', 'test-secret'))
    expect(hashes.p_email_hash).toBe('4b9154816d5f50e83c480e62a36b947686248e56a85211115dd0600da524fed4')
    expect(hashes.p_ip_hash).toMatch(/^[a-f0-9]{64}$/)
    expect(hashes.p_ip_hash).not.toBe(hashes.p_email_hash)
  })

  it('isolates different emails and secrets without accepting request headers', async () => {
    const first = await registrationRateLimitHashes('first@example.test', 'secret')
    expect(first.p_ip_hash).not.toBe((await registrationRateLimitHashes('second@example.test', 'secret')).p_ip_hash)
    expect(first.p_ip_hash).not.toBe((await registrationRateLimitHashes('first@example.test', 'other-secret')).p_ip_hash)
  })

  it('keeps 3/hour per normalized email and 100/day global, allowing more than 10 distinct emails', async () => {
    const db = new PGlite()
    try {
      // Exercise the unchanged reservation function locally, without deploying a migration.
      const reservation = migration.match(/CREATE OR REPLACE FUNCTION public\.reserve_team_registration\([\s\S]*?END;\$\$;/)?.[0]
      expect(reservation).toBeTruthy()
      await db.exec(`CREATE SCHEMA private;
        CREATE TABLE private.registration_rate_limits(bucket text NOT NULL, window_start timestamptz NOT NULL, hits integer NOT NULL, PRIMARY KEY(bucket,window_start));
        ${reservation}`)
      const reserve = async (email: string) => {
        const hashes = await registrationRateLimitHashes(email, 'test-secret')
        return (await db.query<{ ok: boolean }>('select public.reserve_team_registration($1,$2) ok', [hashes.p_ip_hash, hashes.p_email_hash])).rows[0].ok
      }
      expect(await reserve('person@example.test')).toBe(true)
      expect(await reserve(' PERSON@EXAMPLE.TEST ')).toBe(true)
      expect(await reserve('person@example.test')).toBe(true)
      expect(await reserve('Person@example.test')).toBe(false)
      await db.exec('TRUNCATE private.registration_rate_limits')
      for (let i = 0; i < 100; i++) expect(await reserve(`person${i}@example.test`)).toBe(true)
      expect(await reserve('person100@example.test')).toBe(false)
    } finally {
      await db.close()
    }
  })
})
