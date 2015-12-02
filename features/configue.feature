Feature: Configue Plugin
  As a hapi and nconf user
  I want to be able to easily load my configue
  So that I can concentrate on building awesome applications

  Scenario: Loading Plugin with no config
    Given I load Configue
    When I try to access the "who"
    Then I should see have for associated value: "World"

