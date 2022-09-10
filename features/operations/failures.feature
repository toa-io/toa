Feature: Operations failures

  Scenario: Object `id` is readonly
    Given I have a component errors.caller
    And my working directory is ./components/errors.caller
    When I run `toa invoke setid "{}"`
    Then stderr should contain lines:
    """
    error Cannot assign to read only property 'id'
    """
