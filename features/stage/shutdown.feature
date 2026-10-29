Feature: Stopping the stage

  Scenario: A composition stopped while it connects answers nothing once it connects
    Given the configuration of `configuration.base` is deployed
    # nothing serves the values now, so a composition waits for its configuration
    And the stage is stopped
    And the component map states the components of the `configuration` extension
    When I compose `configuration.base` component without waiting
    Then the composition does not settle within 2 seconds
    When the stage is stopped
    And the `configuration` service is staged
    # the configuration it waited for is there now
    And a request naming `echo` is published to `configuration.base`
    Then the request to `configuration.base` is not answered within 5 seconds
