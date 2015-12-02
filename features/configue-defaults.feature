Feature: Configue Plugin default workflow
  As a hapi and nconf user
  I want to be able to easily load my configue
  So that I can concentrate on building awesome applications

  Scenario: Loading Plugin with no config
    Given I load Configue
    When I try to access the "who"
    Then I should see have for associated value: undefined

  Scenario: Loading Plugin with some args
    Given I pass as arguments '--who=Me'
    And I load Configue
    When I try to access the "who"
    Then I should see have for associated value: "Me"

  Scenario: Loading Plugin with some env variable
    Given I pass have as ENV var who with value "Me"
    And I load Configue
    When I try to access the "who"
    Then I should see have for associated value: "Me"

