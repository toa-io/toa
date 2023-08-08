Feature: Pointer

  Scenario: Deploy a default URL
    Given I have a component `stash`
    And I have a context with:
      """yaml
      stash: redis://redis.example.com
      """
    When I export deployment
    Then exported values should contain:
      """
      variables:
        default-stash:
          - name: TOA_STASH_DEFAULT_STASH
            value: redis://redis.example.com
      """

  Scenario: Deploy default URL set
    Given I have a component `stash`
    And I have a context with:
      """yaml
      stash:
        - redis://redis0.example.com
        - redis://redis1.example.com
      """
    When I export deployment
    Then exported values should contain:
      """
      variables:
        default-stash:
          - name: TOA_STASH_DEFAULT_STASH
            value: redis://redis0.example.com redis://redis1.example.com
      """

  Scenario Outline: Deploy a URL for a <type>
    Given I have a component `stash`
    And I have a context with:
      """yaml
      stash:
        <key>: redis://redis.example.com
      """
    When I export deployment
    Then exported values should contain:
      """
      variables:
        default-stash:
          - name: TOA_STASH_DEFAULT_STASH
            value: redis://redis.example.com
      """
    Examples:
      | type      | key           |
      | component | default.stash |
      | namespace | default       |

  Scenario: Deploy credentials
    Given I have a component `mongo.one`
    And I have a context with:
      """yaml
      mongodb: mongodb://mongo.exmaple.com
      """
    When I export deployment
    Then exported values should contain:
      """yaml
      variables:
        mongo-one:
          - name: TOA_MONGODB_MONGO_ONE
            value: mongodb://mongo.exmaple.com
          - name: TOA_MONGODB_MONGO_ONE_USERNAME
            secret:
              name: toa-mongodb.default
              key: username
          - name: TOA_MONGODB_MONGO_ONE_PASSWORD
            secret:
              name: toa-mongodb.default
              key: password
      """
