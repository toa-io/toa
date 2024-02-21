#!/bin/bash

while [[ "$#" -gt 0 ]]; do
    case $1 in
        --greeting) greeting="$2"; shift ;;
        --name) name="$2"; shift
    esac
    shift
done

echo "$greeting, $name!"
