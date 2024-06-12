/* eslint-disable @typescript-eslint/space-before-function-paren */

import appLogger from '../appLogger.js'

interface UserSocketSession {
  refreshTokenId: string
  lastActivity: string
}

interface UserSocketSessionData {
  connections: Record<string, UserSocketSession>
  lastActivity: string
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
  getAllUserSocketSessions(userId: string): Record<string, UserSocketSession> {
    if (this.connectedUsers[userId] == null) return {}
    return this.connectedUsers[userId].connections
  }

  removeUserSocketSession(userId: string, connectionId: string): void {
    if (this.connectedUsers[userId].connections[connectionId] == null) return
    // TODO: Revert this disable rule. Dangerous. Move datatype to Map or Set
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    delete this.connectedUsers[userId].connections[connectionId]
    appLogger.info(`Presence removed for ${userId} with id ${connectionId}}`)
  }

  getUsers(): ConnectedUsers {
    return this.connectedUsers
  }

  updateSocketsessionLastActivity(userId: string, connectionId: string): void {
    if (this.connectedUsers[userId]?.connections[connectionId] == null) return
    appLogger.info(`Presence based last activity updated for ${userId}`)
    this.connectedUsers[userId].lastActivity = new Date().toISOString()
    this.connectedUsers[userId].connections[connectionId].lastActivity = new Date().toISOString()
  }

  getUserLastActivity(userId: string): string | null {
    if (this.connectedUsers[userId] == null) {
      return null
    }
    return this.connectedUsers[userId].lastActivity
  }
}

export default PresenceSystem
