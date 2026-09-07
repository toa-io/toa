#!/bin/bash

# what the script sees of the runtime's variables; grep exits 1 on no match, and no match is
# the point
env | grep '^TOA_' || true
