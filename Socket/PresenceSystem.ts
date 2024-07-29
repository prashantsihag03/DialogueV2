/* eslint-disable @typescript-eslint/space-before-function-paren */

import appLogger from '../appLogger.js'

interface UserSocketSession {
  refreshTokenId: string
  lastActivity: string // this stores session based last activity
}

interface UserSocketSessionData {
  connections: Record<string, UserSocketSession>
  lastActivity: string // this stores user level last activity
}

type ConnectedUsers = Record<string, UserSocketSessionData>

/**
 * Records and stores active socket connections by userids.
 * Currently it holds in memory. However, can be uplifted to integrate with Redis (or equivalent) to store/fetch user session information.
 */
class PresenceSystem {
  private connectedUsers: ConnectedUsers = {}

  constructor() {
    appLogger.info('Presence System initialized')
  }

  addUserSocketSession(userId: string, connectionId: string, userSocketSession: UserSocketSession): void {
    if (this.connectedUsers[userId] == null) {
      this.connectedUsers[userId] = {
        connections: {},
        lastActivity: new Date().toISOString()
      }
    }

    if (this.connectedUsers[userId]?.connections[connectionId] != null) {
      // this connectionId already exists
      // TODO Handle this case
    }

    this.connectedUsers[userId] = {
      connections: { ...this.connectedUsers[userId].connections, [connectionId]: userSocketSession },
      lastActivity: new Date().toISOString()
    }

    appLogger.info(`Presence recorded for ${userId} with id ${connectionId}`)
  }

  /**
   * Fetches record of all active socket sessions for given user.
   * @param userId of a user whose active socket sessions will be fetched
   * @returns empty record if no active socket session for given user,
   * and returns record of all active socket session for given user with
   * socket id as keys and session details as values
   */
  getAllSocketSessionsByUser(userId: string): Record<string, UserSocketSession> {
    if (this.connectedUsers[userId] == null) return {}
    return this.connectedUsers[userId].connections
  }

  /**
   * Fetches record of all active socket sessions for all provided users.
   * @param userIds List of userIds whose active socket sessions will be fetched
   * @returns empty list if no active socket ids for all given userIds,
   * and returns list of all active socket ids for all given user with
   */
  getAllSocketSessionIdsByUsers(userIds: string[]): string[] {
    const result: string[] = []
    userIds.forEach((userId) => {
      if (this.connectedUsers[userId] != null) {
        const socketIds = Object.keys(this.connectedUsers[userId].connections)
        result.push(...socketIds)
      }
    })
    return result
  }

  removeUserSocketSession(userId: string, connectionId: string): void {
    if (this.connectedUsers[userId].connections[connectionId] == null) return
    // TODO: Revert this disable rule. Dangerous. Move datatype to Map or Set
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    delete this.connectedUsers[userId].connections[connectionId]
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    if (Object.keys(this.connectedUsers[userId].connections).length === 0) delete this.connectedUsers[userId]
    appLogger.info(`Presence removed for ${userId} with id ${connectionId}}`)
  }

  getUsers(): ConnectedUsers {
    return this.connectedUsers
  }

  updateSocketsessionLastActivity(userId: string, connectionId: string): void {
    if (this.connectedUsers[userId]?.connections[connectionId] == null) return
    this.connectedUsers[userId].lastActivity = new Date().toISOString()
    this.connectedUsers[userId].connections[connectionId].lastActivity = new Date().toISOString()
    appLogger.info(`Presence based last activity updated for ${userId}`)
  }

  getUserLastActivity(userId: string): string | null {
    if (this.connectedUsers[userId] == null) {
      return null
    }
    return this.connectedUsers[userId].lastActivity
  }

  updateSocketSessionLastActivityByRefreshToken(userId: string, refreshToken: string): void {
    if (this.connectedUsers[userId] == null) {
      // this user has no active connections
      return
    }

    Object.keys(this.connectedUsers[userId].connections).forEach((connId) => {
      if (this.connectedUsers[userId].connections[connId].refreshTokenId === refreshToken) {
        this.connectedUsers[userId].lastActivity = new Date().toISOString()
        this.connectedUsers[userId].connections[connId].lastActivity = new Date().toISOString()
        appLogger.info(`Presence based last activity updated for ${userId}`)
      }
    })
  }
}

export default PresenceSystem
