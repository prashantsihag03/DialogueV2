# Dialogue V2 Data Model

## Base Table

![Base Table](/dev/images/BaseTableExample.png?raw=true 'Dialogue V2 Base Table')

### Access Pattern

1. Get user details by Username

   > GetItem on Base Table with Partition Key PK = USER#\<username\> and Sort Key SK = PROFILE#\<username\>

2. Get list of conversations the user is part of.

   > Query on Base Table with Partition Key PK = USER#\<username\> and Sort Key SK = starts_with(CONVERSATION#)

3. Get list of conversation sorted by their latest.

   >
