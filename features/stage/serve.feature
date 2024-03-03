Feature: Staging a service

  Scenario: Staging a service
    Given environment variables:
      """
      TOA_STORAGES=eyJ0bXAiOnsicHJvdmlkZXIiOiJ0bXAiLCJkaXJlY3RvcnkiOiJ0ZXN0In19
      TOA_CONFIGURATION_IDENTITY_TOKENS=eyJrZXkwIjoiJElERU5USVRZX1RPS0VOU19LRVkwIn0=
      TOA_CONFIGURATION__IDENTITY_TOKENS_KEY0=k3.local.RyDuSdkJimIuxKsqZJbKGemlnizOjuXdR9QDF-Olr_A
      """
    And the `exposition` service is staged
    Then the stage is stopped
