Feature: Storages Extension

  Scenario: Adding a file
    Given an encoded environment variable `TOA_STORAGES` is set to:
      """yaml
      dummy:
        provider: tmp
        directory: whatever
      """
    And I compose `storage` component
    When I call `default.storage.put` with:
      """yaml
      input:
        storage: dummy
        path: /lenna.ascii
      """
    Then the reply is received:
      """yaml
      id: 10cf16b458f759e0d617f2f3d83599ff
      size: 8169
      type: application/octet-stream
      """

  Scenario: Adding a file to S3
    Given an encoded environment variable `TOA_STORAGES` is set to:
      """yaml
      dummy:
        provider: s3
        bucket: test-bucket
        endpoint: http://s3.localhost.localstack.cloud:4566
        region: us-west-1
      """

    And an environment variable `TOA_STORAGES_DUMMY_ACCESS_KEY` is set to "accessKey"
    And an environment variable `TOA_STORAGES_DUMMY_SECRET_ACCESS_KEY` is set to "secretAccessKey"
    And I compose `storage` component
    When I call `default.storage.put` with:
      """yaml
      input:
        storage: dummy
        path: /lenna.ascii
      """
    Then the reply is received:
      """yaml
      id: 10cf16b458f759e0d617f2f3d83599ff
      size: 8169
      type: application/octet-stream
      """

  Scenario: Accessing undefined storage
    Given an encoded environment variable `TOA_STORAGES` is set to:
      """yaml
      dummy:
        provider: tmp
        directory: whatever
      """
    And I compose `storage` component
    When I call `default.storage.get` with:
      """yaml
      input:
        storage: wrong
        path: /lenna.ascii
      """
    Then the following exception is thrown:
      """yaml
      message: "Storage 'wrong' is not defined"
      """

  Scenario: Deploying a storage
    Given I have a component `storage`
    And I have a context with:
      """yaml
      storages:
        tmp:
          provider: tmp
          directory: whatever
      """
    When I export deployment
    Then exported values should contain:
      """yaml
      compositions:
        - name: default-storage
          variables:
            - name: TOA_STORAGES
              value: eyJ0bXAiOnsicHJvdmlkZXIiOiJ0bXAiLCJkaXJlY3RvcnkiOiJ3aGF0ZXZlciJ9fQ==
      """

  Scenario: Running 'test:' provider with secrets
    Given an encoded environment variable `TOA_STORAGES` is set to:
      """yaml
      dummy:
        provider: test
        directory: whatever
      """
    And an environment variable `TOA_STORAGES_DUMMY_USERNAME` is set to "developer"
    And an environment variable `TOA_STORAGES_DUMMY_PASSWORD` is set to "secret"
    And I compose `storage` component

  Scenario: Deploying a storage with secrets
    Given I have a component `storage`
    And I have a context with:
      """yaml
      storages:
        tmp:
          provider: test
          directory: test
      """
    When I export deployment
    Then exported values should contain:
      """yaml
      compositions:
        - name: default-storage
          variables:
            - name: TOA_STORAGES
              value: eyJ0bXAiOnsicHJvdmlkZXIiOiJ0ZXN0IiwiZGlyZWN0b3J5IjoidGVzdCJ9fQ==
            - name: TOA_STORAGES_TMP_USERNAME
              secret:
                name: toa-storages-tmp
                key: USERNAME
            - name: TOA_STORAGES_TMP_PASSWORD
              secret:
                name: toa-storages-tmp
                key: PASSWORD
      """

  Scenario: Deploying S3 storage with secrets
    Given I have a component `storage`
    And I have a context with:
      """yaml
      storages:
        tmp:
          provider: s3
          bucket: te
      """
    When I export deployment
    Then exported values should contain:
      """yaml
      compositions:
        - name: default-storage
          variables:
          - name: TOA_STORAGES
            value: eyJ0bXAiOnsicHJvdmlkZXIiOiJzMyIsImRpcmVjdG9yeSI6InRlc3QiLCJidWNrZXQiOiJ0ZXN0In19
          - name: TOA_STORAGES_TMP_ACCESS_KEY_ID
            secret:
              name: toa-storages-tmp
              key: ACCESS_KEY_ID
              optional: true
          - name: TOA_STORAGES_TMP_SECRET_ACCESS_KEY
            secret:
              name: toa-storages-tmp
              key: SECRET_ACCESS_KEY
              optional: true
      """
