Feature: Booting

  Scenario: The application is served under its mount path
    Given path '/'
    Then the page is loaded
