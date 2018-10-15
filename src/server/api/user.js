import { mapFieldsToModel } from './lib/utils'
import { r, User, cacheableData } from '../models'

export function buildUserOrganizationQuery(queryParam, organizationId, role, campaignId) {
  const roleFilter = role ? { role } : {}

  queryParam
    .from('user_organization')
    .innerJoin('user', 'user_organization.user_id', 'user.id')
    .where(roleFilter)
    .where({ 'user_organization.organization_id': organizationId })
    .distinct()

  if (campaignId) {
    queryParam.innerJoin('assignment', 'assignment.user_id', 'user.id')
    .where({ 'assignment.campaign_id': campaignId })
  }
  return queryParam
}

export const resolvers = {
  User: {
    ...mapFieldsToModel([
      'id',
      'firstName',
      'lastName',
      'email',
      'cell',
      'assignedCell',
      'terms'
    ], User),
    displayName: (user) => `${user.first_name} ${user.last_name}`,
    assignment: async (user, { campaignId }) => r.table('assignment')
      .getAll(user.id, { index: 'user_id' })
      .filter({ campaign_id: campaignId })
      .limit(1)(0)
      .default(null),
    organizations: async (user, { role }) => {
      if (!user || !user.id) {
        return []
      }
      // Note: this only returns {id, name}, but that is all apis need here
      return await cacheableData.user.userOrgs(user.id, role)
    },
    roles: async(user, { organizationId }) => (
      cacheableData.user.orgRoles(user.id, organizationId)
    ),
    todos: async (user, { organizationId }) =>
      cacheableData.assignment.getUserTodos(organizationId, user.id),
    inflightCount: (user) => (user.inflightCount || null), // see organization.people(inflightCounts)
    lastMessageTime: (user) => ( // see organization.people(inflightCounts)
      user.lastMessageTime ? new Date(user.lastMessageTime) : null
    ),
    cacheable: () => Boolean(r.redis)
  }
}
