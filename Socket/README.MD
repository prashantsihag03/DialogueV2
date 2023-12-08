# Presence System

Presence System stores record of users that are currently connected to DialogueV2 socket server.

## Record Structure

It follows a following structure represented using Typescript:

```
Record<string, Record<string, UserSocketSession>>
```

Where, UserSocketSession has following structure:

```
interface UserSocketSession {
  refreshTokenId: string
}
```

Please see the following example to illustrate how this would look together with example data:

```
{
    "userId-1": {
        "connnectionId-1": {
            "refreshTokenId": "example1"
        },
        "connnectionId-2": {
            "refreshTokenId": "example2"
        }
    },
    "userId-2": {
        "connnectionId-1": {
            "refreshTokenId": "example1"
        },
        "connnectionId-2": {
            "refreshTokenId": "example2"
        }
    }
}
```
