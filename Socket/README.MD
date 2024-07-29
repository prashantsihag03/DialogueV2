# Presence System

Presence System stores record of users that are currently connected to DialogueV2 socket server.

## Record Structure

It follows a following structure represented using Typescript:

```
Record<string, Record<string, UserSocketSessionData>>
```

Where, UserSocketSessionData has following structure:

```
interface UserSocketSessionData {
  connections: Record<string, UserSocketSession>
  lastActivity: string // this stores user level last activity
}

interface UserSocketSession {
  refreshTokenId: string
  lastActivity: string // this stores session based last activity
}
```

Please see the following example to illustrate how this would look together with example data:

```
{
    "userId-1": {
        "lastActivity": "ISO_date_time_string",
        "connections": {
            "connnectionId-1": {
                "refreshTokenId": "example1",
                "lastActivity": "ISO_date_time_string",
            },
            "connnectionId-2": {
                "refreshTokenId": "example2",
                "lastActivity": "ISO_date_time_string",
            },
        }
    },
    "userId-2": {
        "lastActivity": "ISO_date_time_string",
        "connections": {
            "connnectionId-1": {
                "refreshTokenId": "example1",
                "lastActivity": "ISO_date_time_string",
            },
            "connnectionId-2": {
                "refreshTokenId": "example2",
                "lastActivity": "ISO_date_time_string",
            },
        }
    }
}
```
