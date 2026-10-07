@cli
Feature: toa create

  Create an application in the working directory

  Scenario: Show `toa create` help
    When I run `toa create --help`
    And stdout should contain lines:
      """
      toa create <name>
      Create an application in the working directory
        toa create store
      """

  Scenario: An application is written into an empty directory
    Given my working directory is ./
    When I run `toa create store`
    Then program should exit with code 0
    And the file ./context.toa.yaml contains exact line 'name: store'
    And the file ./package.json contains exact line '  "name": "store",'
    And the file ./docker-compose.yaml contains exact line 'name: store'
    And the file ./.gitignore contains exact line '.map.json'
    And the file ./components/hello/operations/greet.ts contains line starting with 'export async function computation'
    And the file ./components/notes/manifest.toa.yaml contains exact line 'name: notes'
    And the file ./features/steps/application.ts contains line starting with 'BeforeAll('
    And there is no file ./_gitignore

  Scenario: The packages of Toa are listed at the version that creates the application
    Given my working directory is ./
    When I run `toa create store`
    Then program should exit with code 0
    And the file ./package.json contains line starting with '    "@toa.io/runtime": "1.'
    And the file ./package.json contains line starting with '    "@toa.io/userland": "1.'
    And the file ./package.json contains line starting with '    "@toa.io/agent": "1.'
    And no file under ./ contains '{{name}}'
    And no file under ./ contains '{{version}}'
    And no file under ./ contains '{{agent}}'

  Scenario: The command says what to run next
    Given my working directory is ./
    When I run `toa create store`
    Then stdout should contain lines:
      """
      npm install
      npx toa npm
      npm run dock
      npm run env
      npm run features
      """

  Scenario: A directory that holds something is refused
    Given I have a component `dummies.one`
    And my working directory is ./
    When I run `toa create store`
    Then program should exit with code 1
    And stderr should contain lines:
      """
      is not empty
      """
    And there is no file ./context.toa.yaml

  Scenario: A directory that holds a repository alone is taken
    Given I have a directory ./.git
    And my working directory is ./
    When I run `toa create store`
    Then program should exit with code 0
    And the file ./context.toa.yaml contains exact line 'name: store'

  Scenario: A name a Context cannot have is refused
    Given my working directory is ./
    When I run `toa create 1store`
    Then program should exit with code 1
    And stderr should contain lines:
      """
      '1store' is not a name an application can have
      """
    And there is no file ./context.toa.yaml

  Scenario: What is created is an application Toa reads
    Given my working directory is ./
    When I run `toa create store`
    And I run `toa types --quiet`
    And I run `toa env --dev`
    And I run `toa map`
    Then program should exit with code 0
    And the file ./.map.json contains line starting with '"default.hello":'
    And the file ./.map.json contains line starting with '"default.notes":'
    And the file ./components/hello/types/toa.d.ts contains line starting with 'export type GreetInput = '

  Scenario: What is created composes
    Given my working directory is ./
    When I run `toa create store`
    And the application connects to the infrastructure of this repository
    And I run `toa types --quiet`
    And I run `toa env --dev`
    And I run `toa map`
    And I run `toa compose ./components/* --kill`
    Then program should exit with code 0
    And stdout should contain lines:
      """
      Composition shutdown complete
      """
