Feature: MongoDB indexes

  Background:
    Given the `mongo.indexed` database contains:
      | _id                              | name | email            | birthday      | weight | _version |
      | 72cf9b0ab0ac4ab2b8036e4e940ddcae | John | john@example.com | 1709446907166 | 50     | 1        |
      | 72cf9b0ab0ac4ab2b8036e4e940ddcaf | Mary | mary@example.com | 1709446907166 | 60     | 1        |

  Scenario: Creating a unique index
    Given I compose `mongo.indexed` component
    When I call `mongo.indexed.transit` with:
      """yaml
      input:
        name: Mary
        email: john@example.com
      """
    Then the following exception is thrown:
      """yaml
      code: 306
      message: DuplicateException
      """
    # see collection indexes in the database

  Scenario: Update with index violation
    Given I compose `mongo.indexed` component
    When I call `mongo.indexed.transit` with:
      """yaml
      query:
        id: 72cf9b0ab0ac4ab2b8036e4e940ddcaf
      input:
        email: john@example.com
      """
    Then the following exception is thrown:
      """yaml
      code: 306
      message: DuplicateException
      """
