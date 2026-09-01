Feature: Staging a service

  Scenario: Staging a service
    Given environment variables:
      """
      TOA_STORAGES={"tmp":{"provider":"tmp","directory":"test"}}
      TOA_CONFIGURATION_IDENTITY_TOKENS={"keys":[{"id":"key0","key":"$IDENTITY_TOKENS_KEY0"}]}
      TOA_CONFIGURATION__IDENTITY_TOKENS_KEY0=sTxL6qVOadKkUJwh3FveU53XgTEo3Sdfg7k2FfiIKfs
      TOA_EXPOSITION_PROPERTIES={"authorities":{"default":"localhost"}}
      """
    And the `exposition` service is staged
    Then the stage is stopped
