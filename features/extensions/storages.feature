Feature: Storages Extension 

  Scenario: Adding a file
    Given an encoded environment variable `TOA_STORAGES` is set to:
      """yaml
      dummy: tmp:///whatever
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
      dummy: s3://us-west-1/testbucket?endpoint=http://s3.localhost.localstack.cloud:4566
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
      dummy: tmp:///whatever
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
        tmp: tmp:///whatever
      """
    When I export deployment
    Then exported values should contain:
      """yaml
      compositions:
        - name: default-storage
          variables:
            - name: TOA_STORAGES
              value: 3gABo3RtcK90bXA6Ly8vd2hhdGV2ZXI=
      """

  Scenario: Running 'test:' provider with secrets
    Given an encoded environment variable `TOA_STORAGES` is set to:
      """yaml
      dummy: test:///whatever
      """
    And an environment variable `TOA_STORAGES_DUMMY_USERNAME` is set to "developer"
    And an environment variable `TOA_STORAGES_DUMMY_PASSWORD` is set to "secret"
    And I compose `storage` component

  Scenario: Deploying a storage with secrets
    Given I have a component `storage`
    And I have a context with:
      """yaml
      storages:
        tmp: test:///whatever
      """
    When I export deployment
    Then exported values should contain:
      """yaml
      compositions:
        - name: default-storage
          variables:
            - name: TOA_STORAGES
              value: 3gABo3RtcLB0ZXN0Oi8vL3doYXRldmVy
            - name: TOA_STORAGES_TMP_USERNAME
              secret:
                name: toa-storages-tmp
                key: USERNAME
            - name: TOA_STORAGES_TMP_PASSWORD
              secret:
                name: toa-storages-tmp
                key: PASSWORD
      """
