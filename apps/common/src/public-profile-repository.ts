export type PublicProfileProjection = {
  displayName: string;
  biography: string;
  updatedAt: string;
};

export type PublicProfileSqlClient = {
  query<T>(sql: string, params: unknown[]): { rows: T[] };
};

export const APPROVED_PUBLIC_PROFILE_QUERY = `
with latest_standing as (
  select distinct on (member_id)
    member_id,
    standing
  from membership_status
  order by member_id, effective_at desc
)
select
  member_profile.display_name as "displayName",
  member_profile.biography,
  member_profile.updated_at as "updatedAt"
from member_profile
inner join latest_standing
  on latest_standing.member_id = member_profile.member_id
where latest_standing.standing = 'good'
  and member_profile.visibility = 'public'
  and member_profile.consent = 'granted'
  and member_profile.approved_for_public = true
order by member_profile.updated_at desc
limit $1
`;

export type PublicProfileRepository = {
  findApprovedPublicProfiles(limit?: number): PublicProfileProjection[];
};

export function createPublicProfileRepository(client: PublicProfileSqlClient): PublicProfileRepository {
  return {
    findApprovedPublicProfiles(limit = 25) {
      return client.query<PublicProfileProjection>(APPROVED_PUBLIC_PROFILE_QUERY, [limit]).rows;
    }
  };
}
