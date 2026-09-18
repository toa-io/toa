@deployment
Feature: Deploying configuration

  A component is given the revision of its configuration: the hash of the defaults the values
  service is given for it. A values service of another deployment holds another revision, which
  the component refuses.

  Scenario: A component is given the revision of its defaults
    Given I have components:
      | configuration.base |
    And I have a context
    When I export deployment
    Then exported values should contain:
      """yaml
      compositions:
        - name: configuration-base
          variables:
            - name: TOA_CONFIGURATION_REVISION_CONFIGURATION_BASE
              value: 1088a5ddaf3f5cd2101b11ee118adfda4b1c69cabda0c049f19c8556a3e2a5e3
      """

  # a change of values alone replaces the component's processes, as a change of its sources does
  Scenario: The revision follows the Context's values
    Given I have components:
      | configuration.base |
    And I have a context with:
      """yaml
      configuration:
        configuration.base:
          foo: deployed
      """
    When I export deployment
    Then exported values should contain:
      """yaml
      compositions:
        - name: configuration-base
          variables:
            - name: TOA_CONFIGURATION_REVISION_CONFIGURATION_BASE
              value: 44b267babfd1cb9970b656bb5c1ebb3eb05676e6342011b2e3ebf3bc5b2c85f0
      """

  Scenario: A component that declares no configuration is given no revision
    Given I have components:
      | configuration.base |
      | dummies.one        |
    And I have a context
    When I export deployment
    Then exported values should not contain:
      """yaml
      compositions:
        - name: dummies-one
          variables:
            - name: TOA_CONFIGURATION_REVISION_DUMMIES_ONE
      """
