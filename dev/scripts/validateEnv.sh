#!/bin/bash

container_name="dynamodb-local"

# Validate docker is available 
if ! command -v docker &> /dev/null; then
  echo "Docker is not installed."
  exit 1
fi

if ! docker info &> /dev/null; then
  echo "Docker is not running."
  exit 1
fi

echo "Docker is already installed and running."

# Ensure dynamodb-local container is available and running
if ! docker inspect -f '{{.State.Running}}' "$container_name" &> /dev/null; then
  echo "Container $container_name is not running. Please start/create the container."
  exit 1
fi

echo "$container_name container is already running."

# Check if aws is installed
if ! command -v aws &> /dev/null; then
    echo "AWS CLI is not installed."
    exit 1
fi

echo "AWS CLI is already installed."

