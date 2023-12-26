#!/bin/bash

# Localstack initializing script
# see: https://docs.localstack.cloud/references/init-hooks/

awslocal s3 mb s3://test-bucket
