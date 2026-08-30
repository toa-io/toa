Feature: Staging a service

  Scenario: Staging a service
    Given environment variables:
      """
      TOA_STORAGES=eyJ0bXAiOnsicHJvdmlkZXIiOiJ0bXAiLCJkaXJlY3RvcnkiOiJ0ZXN0In19
      TOA_CONFIGURATION_IDENTITY_TOKENS=eyJrZXlzIjpbeyJpZCI6ImtleTAiLCJrZXkiOiIkSURFTlRJVFlfVE9LRU5TX0tFWTAifV19
      TOA_CONFIGURATION__IDENTITY_TOKENS_KEY0=sTxL6qVOadKkUJwh3FveU53XgTEo3Sdfg7k2FfiIKfs
      TOA_EXPOSITION_PROPERTIES=eyJhdXRob3JpdGllcyI6eyJkZWZhdWx0IjoibG9jYWxob3N0In19
      """
    And the `exposition` service is staged
    Then the stage is stopped
