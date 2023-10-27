Feature: Storages Extension

  Scenario: Adding a file
    Given an encoded environment variable `TOA_STORAGES` is set to:
      """yaml
      dummy: tmp:///features
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

  Scenario: Accessing undefined storage
    Given I compose `storage` component
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
