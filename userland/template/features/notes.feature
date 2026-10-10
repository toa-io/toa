Feature: Notes

  Scenario: Keeping a note
    When the request is sent:
      """
      POST /notes/ HTTP/1.1
      content-type: application/yaml
      accept: application/yaml

      text: Buy milk
      """
    Then the response is received:
      """
      201 Created

      id: ${{ id }}
      text: Buy milk
      """
    When the request is sent:
      """
      GET /notes/${{ id }}/ HTTP/1.1
      accept: application/yaml
      """
    Then the response is received:
      """
      200 OK

      text: Buy milk
      """
