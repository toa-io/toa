Feature: Exposition Deployment

  Scenario: Deploy a context with exposition
    Given I have components:
      | dummies.three |
    And I have a context
    And my working directory is ./
    When I run `toa export images ./images -p ./components/dummies/three`
    Then exported exposition's Dockerfile should contain exactly: 'toa serve .'
