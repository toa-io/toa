#!/bin/bash

code=0

while [[ "$#" -gt 0 ]]; do
    case $1 in
        --message) message="$2"; shift ;;
        --code) code="$2"; shift
    esac
    shift
done

if [ "$code" -eq 0 ]; then
    echo "$message"
    exit 0
else
    echo "$message" >&2
    exit 1
fi
