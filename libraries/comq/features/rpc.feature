Feature: Request-reply (RPC)

  Background:
    Given an active connection to amqp://developer:secret@localhost

  Scenario Outline: Send request and get reply (<queue>)
    Given function replying `<queue>` queue:
    """
    ({ a, b }) => { return <expression> }
    """
    When a consumer sends the following request to the `<queue>` queue:
    """yaml
    a: <a>
    b: <b>
    """
    Then the consumer receives the reply:
    """yaml
    <reply>
    """
    Examples:
      | queue            | expression | a | b | reply |
      | add_numbers      | a + b      | 1 | 2 | 3     |
      | multiply_numbers | a * b      | 1 | 2 | 2     |
      | divide_numbers   | a / b      | 4 | 2 | 2     |
