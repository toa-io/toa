@deployment
Feature: Spreading pods across nodes

  A workload's pods are spread across nodes, counting only the pods of its current revision, so a
  rollout spreads the new ones whatever nodes the old ones are on. Where one node is all that
  fits, they are scheduled there all the same.

  @helm
  Scenario Outline: A <template> workload spreads the pods of its revision
    Given I have a component `exposed.one`
    And I have a context
    When I export deployment
    And I run `helm template deployment --show-only templates/<template>.yaml`
    Then program should exit
    And stdout should contain lines:
      """
      topologyKey: kubernetes.io/hostname
      whenUnsatisfiable: ScheduleAnyway
      matchLabelKeys:
      - pod-template-hash
      """

    Examples:
      | template     |
      | compositions |
      | services     |

  @helm
  Scenario: Mono spreads the pods of its revision
    Given I have a component `dummies.one`
    And I have a context
    When I export a mono deployment
    And I run `helm template deployment --show-only templates/mono.yaml`
    Then program should exit
    And stdout should contain lines:
      """
      topologyKey: kubernetes.io/hostname
      whenUnsatisfiable: ScheduleAnyway
      matchLabelKeys:
      - pod-template-hash
      """
