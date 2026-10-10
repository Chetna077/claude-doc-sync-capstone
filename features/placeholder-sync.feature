Feature: Fill placeholders only from verified repo facts
  As a tech lead
  I want template placeholders filled only from facts proven in the repo
  So that generated documents never contain guesses

  Background:
    Given a Markdown template containing {{Placeholder}} tokens
    And a target repository path

  Scenario: A value present in package.json is rendered exactly
    Given the repository package.json has name "demo-app"
    When I run claude-doc-sync on the template
    Then the output contains "demo-app" where {{ProjectName}} was

  Scenario: A missing source renders Not Found
    Given the repository has no package.json
    When I run claude-doc-sync on the template
    Then every package.json placeholder is rendered as "Not Found"
    And the run finishes without an error

  Scenario: A malformed package.json does not crash the run
    Given the repository package.json contains invalid JSON
    When I run claude-doc-sync on the template
    Then the affected placeholders are rendered as "Not Found"
    And the exit code is 0

  Scenario: Git metadata is read from the real repository
    Given the repository has at least one commit
    When I run claude-doc-sync on the template
    Then {{LastCommitDate}} and {{LastCommitAuthor}} come from git log

  Scenario: Git metadata is Not Found outside a git repository
    Given the target path is not a git repository
    When I run claude-doc-sync on the template
    Then {{LastCommitDate}} and {{LastCommitAuthor}} are rendered as "Not Found"

  Scenario: The template file is never overwritten
    Given the output path equals the template path
    When I run claude-doc-sync
    Then the run is refused with an error
    And the template content is unchanged

  Scenario: Every placeholder occurrence is replaced
    Given a template that uses {{ProjectName}} three times
    When I run claude-doc-sync on the template
    Then all three occurrences are replaced
