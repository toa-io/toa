Feature: Probes

  # The probe is on a port of its own: kubelet speaks HTTP/1.1, and the gateway may serve h2c.
  Scenario: The gateway answers its readiness probe
    Given the Gateway is running
    When the ready probe is requested
    Then the ready probe answers 200

  Scenario: The traffic port does not serve the probe
    Given the Gateway is running
    When the following request is received:
      """
      GET /.ready HTTP/1.1
      """
    Then the following reply is sent:
      """
      404 Not Found
      """
