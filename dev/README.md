# Development Documentation and Resources

This directory holds development documentations and development utility scripts for this project.

# Database Script

Scripts directory holds bash scripts that can be used to create, and delete database tables and indexes.

The scripts are by default targetted towards local dynamodb.

DB_ENDPOINT variable can be updated in scripts to target actual AWS resource assuming AWS credentials are provided with appropriate permissions.

Script to setup table initially or to validate current setup:

> setupTable.sh

Script to purge all data, and tables:

> purgeTable.sh

Both the scripts requires Dynamodb to be running.
